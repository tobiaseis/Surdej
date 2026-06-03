import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useBakeStore } from '../store/bakeStore';

export const HomeScreen = () => {
  const { activeBake } = useBakeStore();
  const navigation = useNavigation<any>();

  // Hvis brugeren har en aktiv bagning:
  if (activeBake) {
    // Find det første 'active' trin, eller det næste 'pending' trin
    const nextStep = activeBake.steps.find((s) => s.status === 'active') || activeBake.steps.find((s) => s.status === 'pending');
    
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={typography.h1}>{activeBake.recipe.name}</Text>
          <Card>
            <Text style={typography.bodySmall}>Næste trin</Text>
            <Text style={typography.h2}>{nextStep ? nextStep.title : 'Færdig!'}</Text>
            {nextStep && (
              <Text style={typography.h3}>Start kl. {nextStep.scheduledAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            )}
            <View style={{ height: 16 }} />
            <Button 
              title={nextStep ? 'Gå til tidslinje' : 'Se resultat'} 
              onPress={() => {
                if (nextStep) {
                  navigation.navigate('AktivBagning');
                }
              }} 
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
        <Text style={typography.h1}>Godmorgen</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Klar til at bage?</Text>

        <Card>
          <Text style={typography.h2}>Planlæg en bagning</Text>
          <Text style={[typography.body, { marginBottom: 16 }]}>Vælg hvad du vil bage, og hvornår det skal være klar.</Text>
          <Button title="Start ny bageplan" onPress={() => navigation.navigate('Opskrifter')} />
        </Card>

        <Text style={[typography.h3, { marginTop: 24, marginBottom: 12 }]}>Populære opskrifter</Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Opskrifter')}>
          <Card style={styles.miniCard}>
            <Text style={typography.h3}>Surdejsboller</Text>
            <Text style={typography.bodySmall}>Total tid: 20-24 timer</Text>
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Opskrifter')}>
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
    padding: 24,
  },
  miniCard: {
    padding: 16,
    marginBottom: 12,
  },
});
