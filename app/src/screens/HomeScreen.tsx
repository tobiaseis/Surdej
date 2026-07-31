import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Settings } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';
import { Button, Card, Screen } from '../components';
import { useBakeStore } from '../store/bakeStore';
import { useSettingsStore } from '../store/settingsStore';
import { fetchRecipes, Recipe } from '../data/recipes';
import { getRecipeTotalHours } from '../utils/recipeMeta';
import { formatTime, getGreeting } from '../utils/dateTime';
import type { HomeStackScreenProps } from '../navigation/types';

const SUGGESTION_COUNT = 3;

type HomeScreenProps = HomeStackScreenProps<'HomeMain'>;

const SettingsGear = () => {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  return (
    <View style={styles.headerBar}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Indstillinger')}
        style={styles.settingsButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.94}
        accessibilityRole="button"
        accessibilityLabel="Indstillinger"
      >
        <Settings color={colors.textSub} size={24} />
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { activeBake, cancelBake } = useBakeStore();

  const roomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const starterStrength = useSettingsStore((state) => state.defaultStarterStrength);
  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Forslagene hentes fra den samme kilde som opskriftslisten, så titler og
  // tider altid stemmer overens med de opskrifter, brugeren kan vælge.
  useEffect(() => {
    let active = true;

    const loadSuggestions = async () => {
      const data = await fetchRecipes();
      if (!active) return;
      setSuggestions(data.slice(0, SUGGESTION_COUNT));
      setLoadingSuggestions(false);
    };

    loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  const openRecipe = (recipe: Recipe) => {
    navigation.navigate('Opskrifter', {
      screen: 'OpskriftDetaljer',
      params: { recipe },
    });
  };

  // Hvis brugeren har en aktiv bagning:
  if (activeBake) {
    // Find det første 'active' trin, eller det næste 'pending' trin
    const nextStep = activeBake.steps.find((s) => s.status === 'active') || activeBake.steps.find((s) => s.status === 'pending');

    // Bagningen er færdig, når der ikke er flere trin tilbage at udføre.
    if (!nextStep) {
      return (
        <Screen>
          <SettingsGear />
          <Text style={typography.h1}>{activeBake.recipe.name} er færdig 🎉</Text>
          <Card>
            <Text style={[typography.body, { marginBottom: spacing.lg }]}>
              Godt klaret! Alle trin er udført. Start en ny bageplan, når du er klar igen.
            </Text>
            <Button
              title="Start ny bagning"
              onPress={() => {
                cancelBake();
                navigation.navigate('Opskrifter');
              }}
            />
          </Card>
        </Screen>
      );
    }

    return (
      <Screen>
        <SettingsGear />
        <Text style={typography.h1}>{activeBake.recipe.name}</Text>
        <Card>
          <Text style={typography.bodySmall}>Næste trin</Text>
          <Text style={typography.h2}>{nextStep.title}</Text>
          <Text style={typography.h3}>Start kl. {formatTime(nextStep.scheduledAt)}</Text>
          <View style={{ height: spacing.lg }} />
          <Button title="Gå til tidslinje" onPress={() => navigation.navigate('AktivBagning')} />
          <Button
            title="Fodr surdejen"
            variant="outline"
            style={{ marginTop: spacing.md }}
            onPress={() => navigation.navigate('Fodring')}
          />
        </Card>
      </Screen>
    );
  }

  // Hvis brugeren ikke har en aktiv bagning:
  return (
    <Screen>
      <SettingsGear />
      <Text style={typography.h1}>{getGreeting()}</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>Klar til at bage?</Text>

      <Card>
        <Text style={typography.h2}>Planlæg en bagning</Text>
        <Text style={[typography.body, { marginBottom: spacing.lg }]}>Vælg hvad du vil bage, og hvornår det skal være klar.</Text>
        <Button title="Start ny bageplan" onPress={() => navigation.navigate('Opskrifter')} />
        <Button
          title="Beregn mel, vand og surdej"
          variant="outline"
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.navigate('Opskrifter', { screen: 'Beregner' })}
        />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={typography.h2}>Fodr surdejen</Text>
        <Text style={[typography.body, { marginBottom: spacing.lg }]}>
          Få forholdet mellem surdej, mel og vand – og hvornår den er på toppen.
        </Text>
        <Button title="Åbn fodring" variant="outline" onPress={() => navigation.navigate('Fodring')} />
      </Card>

      {(loadingSuggestions || suggestions.length > 0) && (
        <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Populære opskrifter</Text>
      )}

      {loadingSuggestions ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      ) : (
        suggestions.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            onPress={() => openRecipe(recipe)}
            activeOpacity={0.94}
            accessibilityRole="button"
          >
            <Card style={styles.miniCard}>
              <Text style={typography.h3}>{recipe.name}</Text>
              <Text style={typography.bodySmall}>
                Total tid: {getRecipeTotalHours(recipe, options)} timer
              </Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  miniCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
