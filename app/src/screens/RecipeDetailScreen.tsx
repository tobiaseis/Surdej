import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
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
        <View style={styles.container}>
          <Text style={typography.h2}>Opskrift ikke fundet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMinutes = recipe.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={[typography.bodySmall, { color: colors.textSub }]}>Billede tilføjes</Text>
          </View>
        )}

        <Text style={typography.h1}>{recipe.name}</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>{recipe.description}</Text>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: 8 }]}>Information</Text>
          <Text style={typography.bodySmall}>Total tid: {totalHours} timer</Text>
          <Text style={typography.bodySmall}>Aktiv tid: ~{recipe.handsOnMinutes} min</Text>
          <Text style={typography.bodySmall}>Antal: {recipe.yield}</Text>
          <Text style={typography.bodySmall}>Sværhedsgrad: {recipe.difficulty}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: 8 }]}>Ingredienser</Text>
          {recipe.ingredients.map((ingredient, idx) => (
            <Text key={idx} style={typography.bodySmall}>• {ingredient}</Text>
          ))}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[typography.h3, { marginBottom: 8 }]}>Du skal bruge</Text>
          {recipe.tools.map((tool, idx) => (
            <Text key={idx} style={typography.bodySmall}>• {tool}</Text>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Planlæg denne opskrift" onPress={() => navigation.navigate('SetupOpskrift', { recipe })} />
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
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
