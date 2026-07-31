import { supabase } from '../utils/supabase';
import type { Difficulty, Recipe, RecipeStep } from './recipes';

/**
 * Brugerens egne opskrifter. De ligger i `user_recipes` og hentes kun for den
 * bruger, der er logget ind – til forskel fra `recipes`, som er de færdige
 * opskrifter, appen kommer med.
 */

export type UserRecipeFields = {
  name: string;
  description: string;
  difficulty: Difficulty;
  yield: string;
  handsOnMinutes: number;
  ingredients: string[];
  tools: string[];
  steps: RecipeStep[];
};

const DIFFICULTIES: Difficulty[] = ['Let', 'Medium', 'Svær'];

const asDifficulty = (value: unknown): Difficulty =>
  DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Let';

/** Trinnene ligger som jsonb, så de valideres på vej ind i appen. */
const mapSteps = (value: unknown, recipeId: string): RecipeStep[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((step): step is Record<string, unknown> => !!step && typeof step === 'object')
    .map((step, index) => ({
      id: typeof step.id === 'string' && step.id ? step.id : `${recipeId}-step-${index + 1}`,
      title: typeof step.title === 'string' ? step.title : '',
      description: typeof step.description === 'string' ? step.description : '',
      durationMinutes:
        typeof step.durationMinutes === 'number' && Number.isFinite(step.durationMinutes)
          ? Math.max(1, Math.round(step.durationMinutes))
          : 30,
      temperatureSensitive: step.temperatureSensitive === true,
    }))
    .filter((step) => step.title.length > 0);
};

const mapDbUserRecipe = (row: any): Recipe => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  difficulty: asDifficulty(row.difficulty),
  imageUrl: row.image_url ?? undefined,
  handsOnMinutes: row.hands_on_minutes ?? 0,
  yield: row.yield ?? '',
  ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
  tools: Array.isArray(row.tools) ? row.tools : [],
  steps: mapSteps(row.steps, row.id),
  isCustom: true,
});

const toRow = (fields: UserRecipeFields) => ({
  name: fields.name,
  description: fields.description,
  difficulty: fields.difficulty,
  hands_on_minutes: fields.handsOnMinutes,
  yield: fields.yield,
  ingredients: fields.ingredients,
  tools: fields.tools,
  steps: fields.steps,
});

export const fetchUserRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.log('Kunne ikke hente egne opskrifter.', error?.message);
      return [];
    }

    return data.map(mapDbUserRecipe);
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved hentning af egne opskrifter.', err);
    return [];
  }
};

/** Gemmer en ny opskrift og returnerer den, som den blev gemt – null ved fejl. */
export const createUserRecipe = async (fields: UserRecipeFields): Promise<Recipe | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Ingen bruger-session – kan ikke gemme opskrift.');
      return null;
    }

    const { data, error } = await supabase
      .from('user_recipes')
      .insert({ user_id: user.id, ...toRow(fields) })
      .select()
      .single();

    if (error || !data) {
      console.warn('Kunne ikke gemme opskrift:', error?.message);
      return null;
    }

    return mapDbUserRecipe(data);
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved gemning af opskrift.', err);
    return null;
  }
};

export const updateUserRecipe = async (id: string, fields: UserRecipeFields): Promise<Recipe | null> => {
  try {
    const { data, error } = await supabase
      .from('user_recipes')
      .update({ ...toRow(fields), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('Kunne ikke opdatere opskrift:', error?.message);
      return null;
    }

    return mapDbUserRecipe(data);
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved opdatering af opskrift.', err);
    return null;
  }
};

export const deleteUserRecipe = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('user_recipes').delete().eq('id', id);

    if (error) {
      console.warn('Kunne ikke slette opskrift:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved sletning af opskrift.', err);
    return false;
  }
};
