import type { Recipe } from '../data/recipes';

export type RecipeMetaItem = {
  label: string;
  status: 'completed' | 'info';
};

export const getRecipeTotalHours = (recipe: Recipe) => {
  const totalMinutes = recipe.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  return Math.round(totalMinutes / 60);
};

export const getRecipeMetaItems = (recipe: Recipe): RecipeMetaItem[] => [
  { label: `${getRecipeTotalHours(recipe)} timer`, status: 'info' },
  { label: recipe.difficulty, status: 'completed' },
  { label: `Aktiv ${recipe.handsOnMinutes} min`, status: 'info' },
];
