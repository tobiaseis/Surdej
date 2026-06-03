import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Recipe } from '../data/recipes';

export const RecipeDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe | undefined;

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={typography.h2}>Opskrift ikke fundet.</Text>
      </SafeAreaView>
    );
  }

  const totalMinutes = recipe.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>{recipe.name}</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>{recipe.description}</Text>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Information</Text>
          <Text style={typography.bodySmall}>Total tid: {totalHours} timer</Text>
          <Text style={typography.bodySmall}>Aktiv tid: ~35 min</Text>
          <Text style={typography.bodySmall}>Sværhedsgrad: Let</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Ingredienser</Text>
          <Text style={typography.bodySmall}>• 500 g hvedemel</Text>
          <Text style={typography.bodySmall}>• 375 g vand</Text>
          <Text style={typography.bodySmall}>• 100 g aktiv surdej</Text>
          <Text style={typography.bodySmall}>• 10 g salt</Text>
        </Card>

      </ScrollView>
      <View style={styles.bottomBar}>
        <Button 
          title="Planlæg denne opskrift" 
          onPress={() => navigation.navigate('SetupOpskrift', { recipe })} 
        />
      </View>
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
    paddingBottom: 100, // Make room for bottom bar
  },
  infoCard: {
    marginBottom: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
