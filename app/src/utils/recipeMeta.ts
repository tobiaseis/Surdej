import type { Difficulty, Recipe } from '../data/recipes';
import type { BadgeTone } from '../components/StatusBadge';
import {
  DEFAULT_SCHEDULE_OPTIONS,
  ScheduleOptions,
  getRecipeDurationMinutes,
} from './scheduleCalculator';

export type RecipeMetaItem = {
  label: string;
  tone: BadgeTone;
};

/** Sværhedsgraden farves efter hvor krævende den er – ikke som en tilstand. */
const DIFFICULTY_TONES: Record<Difficulty, BadgeTone> = {
  Let: 'positive',
  Medium: 'accent',
  Svær: 'warning',
};

/**
 * Samlet varighed for en opskrift under de valgte forhold. Bruger samme
 * justering som bageplanen, så det viste timetal matcher den plan brugeren får.
 */
export const getRecipeTotalHours = (
  recipe: Recipe,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
) => Math.round(getRecipeDurationMinutes(recipe, options) / 60);

export const getRecipeMetaItems = (
  recipe: Recipe,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): RecipeMetaItem[] => [
  { label: `${getRecipeTotalHours(recipe, options)} timer`, tone: 'neutral' },
  { label: recipe.difficulty, tone: DIFFICULTY_TONES[recipe.difficulty] ?? 'neutral' },
  { label: `Aktiv ${recipe.handsOnMinutes} min`, tone: 'neutral' },
];
