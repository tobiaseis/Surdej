import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { BottomBar, Button, Card, Screen } from '../components';
import { getRecipeTotalHours } from '../utils/recipeMeta';
import { useSettingsStore } from '../store/settingsStore';
import type { RecipeStackScreenProps } from '../navigation/types';

export const RecipeDetailScreen = ({ navigation, route }: RecipeStackScreenProps<'OpskriftDetaljer'>) => {
  const recipe = route.params?.recipe;

  const roomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const starterStrength = useSettingsStore((state) => state.defaultStarterStrength);

  if (!recipe) {
    return (
      <Screen scroll={false}>
        <Text style={typography.h2}>Opskrift ikke fundet.</Text>
      </Screen>
    );
  }

  const totalHours = getRecipeTotalHours(recipe, { roomTempC, starterStrength });

  return (
    <>
      <Screen withBottomBar>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={[typography.bodySmall, { color: colors.textSub }]}>Billede tilføjes</Text>
          </View>
        )}

        <Text style={typography.h1}>{recipe.name}</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>{recipe.description}</Text>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Information</Text>
          <Text style={typography.bodySmall}>Total tid: {totalHours} timer</Text>
          <Text style={typography.bodySmall}>Aktiv tid: ~{recipe.handsOnMinutes} min</Text>
          <Text style={typography.bodySmall}>Antal: {recipe.yield}</Text>
          <Text style={typography.bodySmall}>Sværhedsgrad: {recipe.difficulty}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Ingredienser</Text>
          {recipe.ingredients.map((ingredient, idx) => (
            <Text key={idx} style={typography.bodySmall}>• {ingredient}</Text>
          ))}
          <Button
            title="Tilpas mængder"
            variant="outline"
            style={{ marginTop: spacing.lg }}
            onPress={() => navigation.navigate('Beregner', { recipe })}
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Du skal bruge</Text>
          {recipe.tools.map((tool, idx) => (
            <Text key={idx} style={typography.bodySmall}>• {tool}</Text>
          ))}
        </Card>
      </Screen>

      <BottomBar>
        <Button title="Planlæg denne opskrift" onPress={() => navigation.navigate('SetupOpskrift', { recipe })} />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.xl,
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
});
