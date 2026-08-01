import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography } from '../theme';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import type { Recipe } from '../data/recipes';
import { getRecipeMetaItems } from '../utils/recipeMeta';
import type { ScheduleOptions } from '../utils/scheduleCalculator';

interface RecipeCardProps {
  recipe: Recipe;
  options?: ScheduleOptions;
  /**
   * Ekstra linje nederst – i bageflowet fx hvornår bagværket er færdigt med
   * den fodring, brugeren lige har valgt.
   */
  footnote?: string;
  onPress: () => void;
}

/**
 * Opskriften som den ser ud i en liste. Bruges både i biblioteket og i
 * bageflowets trin 2, så de to lister ikke skrider fra hinanden.
 */
export const RecipeCard = ({ recipe, options, footnote, onPress }: RecipeCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[typography.h2, styles.title]}>{recipe.name}</Text>
        {recipe.isCustom && <StatusBadge label="Din egen" tone="accent" />}
      </View>
      <Text style={[typography.body, styles.description]}>{recipe.description}</Text>

      <View style={styles.badges}>
        {getRecipeMetaItems(recipe, options).map((item) => (
          <StatusBadge key={item.label} label={item.label} tone={item.tone} />
        ))}
      </View>

      {footnote && <Text style={[typography.bodySmall, styles.footnote]}>{footnote}</Text>}
    </Card>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  /**
   * Text har flexShrink: 0 som standard i React Native. Uden dette skubber
   * et langt opskriftsnavn "Din egen"-badget ud over kortets kant.
   */
  title: {
    flex: 1,
  },
  description: {
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footnote: {
    marginTop: spacing.md,
  },
});
