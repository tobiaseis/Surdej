import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Card } from './Card';
import type { Recipe } from '../data/recipes';
import { getRecipeTotalHours } from '../utils/recipeMeta';
import type { ScheduleOptions } from '../utils/scheduleCalculator';

interface RecipeSummaryProps {
  recipe: Recipe;
  options?: ScheduleOptions;
}

/**
 * Selve opskriften: billede, tider, ingredienser og grej. Både biblioteket og
 * bageflowets trin 3 viser den samme opskrift – kun handlingen nedenunder er
 * forskellig, og den ejer skærmene selv.
 */
export const RecipeSummary = ({ recipe, options }: RecipeSummaryProps) => (
  <>
    {recipe.imageUrl ? (
      <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
    ) : (
      <View style={[styles.heroImage, styles.heroPlaceholder]}>
        {/* textSub gav kun 3,8:1 på den sandfarvede flade. */}
        <Text style={[typography.bodySmall, { color: colors.textMain }]}>Billede tilføjes</Text>
      </View>
    )}

    <Text style={typography.h1}>{recipe.name}</Text>
    <Text style={[typography.body, styles.description]}>{recipe.description}</Text>

    <Card style={styles.card}>
      <Text style={[typography.h3, styles.cardTitle]}>Information</Text>
      <Text style={typography.bodySmall}>
        Total tid: {getRecipeTotalHours(recipe, options)} timer
      </Text>
      <Text style={typography.bodySmall}>Aktiv tid: ~{recipe.handsOnMinutes} min</Text>
      <Text style={typography.bodySmall}>Antal: {recipe.yield}</Text>
      <Text style={typography.bodySmall}>Sværhedsgrad: {recipe.difficulty}</Text>
    </Card>

    <Card style={styles.card}>
      <Text style={[typography.h3, styles.cardTitle]}>Ingredienser</Text>
      {recipe.ingredients.map((ingredient, idx) => (
        <Text key={idx} style={typography.bodySmall}>• {ingredient}</Text>
      ))}
    </Card>

    <Card style={styles.card}>
      <Text style={[typography.h3, styles.cardTitle]}>Du skal bruge</Text>
      {recipe.tools.map((tool, idx) => (
        <Text key={idx} style={typography.bodySmall}>• {tool}</Text>
      ))}
    </Card>
  </>
);

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
  description: {
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.sm,
  },
});
