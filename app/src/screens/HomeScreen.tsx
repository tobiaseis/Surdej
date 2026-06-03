import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Settings } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useBakeStore } from '../store/bakeStore';

const SettingsGear = () => {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.headerBar}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Indstillinger')}
        style={styles.settingsButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.94}
        accessibilityLabel="Indstillinger"
      >
        <Settings color={colors.textSub} size={24} />
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen = () => {
  const { activeBake, cancelBake } = useBakeStore();
  const navigation = useNavigation<any>();

  // Hvis brugeren har en aktiv bagning:
  if (activeBake) {
    // Find det første 'active' trin, eller det næste 'pending' trin
    const nextStep = activeBake.steps.find((s) => s.status === 'active') || activeBake.steps.find((s) => s.status === 'pending');

    // Bagningen er færdig, når der ikke er flere trin tilbage at udføre.
    if (!nextStep) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container}>
            <SettingsGear />
            <Text style={typography.h1}>{activeBake.recipe.name} er færdig 🎉</Text>
            <Card>
              <Text style={[typography.body, { marginBottom: 16 }]}>
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
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <SettingsGear />
          <Text style={typography.h1}>{activeBake.recipe.name}</Text>
          <Card>
            <Text style={typography.bodySmall}>Næste trin</Text>
            <Text style={typography.h2}>{nextStep.title}</Text>
            <Text style={typography.h3}>Start kl. {nextStep.scheduledAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            <View style={{ height: 16 }} />
            <Button
              title="Gå til tidslinje"
              onPress={() => navigation.navigate('AktivBagning')}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Hvis brugeren ikke har en aktiv bagning:
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <SettingsGear />
        <Text style={typography.h1}>Godmorgen</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Klar til at bage?</Text>

        <Card>
          <Text style={typography.h2}>Planlæg en bagning</Text>
          <Text style={[typography.body, { marginBottom: 16 }]}>Vælg hvad du vil bage, og hvornår det skal være klar.</Text>
          <Button title="Start ny bageplan" onPress={() => navigation.navigate('Opskrifter')} />
        </Card>

        <Text style={[typography.h3, { marginTop: 24, marginBottom: 12 }]}>Populære opskrifter</Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Opskrifter')} activeOpacity={0.94}>
          <Card style={styles.miniCard}>
            <Text style={typography.h3}>Surdejsboller</Text>
            <Text style={typography.bodySmall}>Total tid: 20-24 timer</Text>
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Opskrifter')} activeOpacity={0.94}>
          <Card style={styles.miniCard}>
            <Text style={typography.h3}>Grydebrød</Text>
            <Text style={typography.bodySmall}>Total tid: 18-26 timer</Text>
          </Card>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  miniCard: {
    padding: 16,
    marginBottom: 12,
  },
});
