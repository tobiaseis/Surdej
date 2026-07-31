import { supabase } from '../utils/supabase';
import { uploadImage } from './storage';
import { formatIsoDate, formatLongDate } from '../utils/dateTime';
import { DiaryRecipe, formatDiaryRecipeLines, parseDiaryRecipe } from '../utils/diaryRecipe';

const DIARY_IMAGE_BUCKET = 'diary_images';

export type DiaryEntry = {
  id: string;
  recipeName: string;
  createdAt: string;
  temp: string | null;
  crumbRating: number | null;
  tasteRating: number | null;
  note: string | null;
  imageUrl: string | null;
  /** Hele opskriften som den blev bagt. Null på indlæg gemt før den blev gemt med. */
  recipe: DiaryRecipe | null;
};

export type NewDiaryEntry = {
  recipeName: string;
  temp?: string;
  crumbRating?: number;
  tasteRating?: number;
  note?: string;
  imageUrl?: string;
  recipe?: DiaryRecipe;
};

const mapDbEntry = (row: any): DiaryEntry => ({
  id: row.id,
  recipeName: row.recipe_name,
  createdAt: row.created_at,
  temp: row.temp ?? null,
  crumbRating: row.crumb_rating ?? null,
  tasteRating: row.taste_rating ?? null,
  note: row.note ?? null,
  imageUrl: row.image_url ?? null,
  recipe: parseDiaryRecipe(row.recipe),
});

/**
 * En tom dagbog og en mislykket hentning ser ens ud på skærmen, hvis vi kun
 * returnerer en liste. `failed` gør det muligt at vise den rigtige besked.
 */
export type DiaryLoadResult = {
  entries: DiaryEntry[];
  failed: boolean;
};

export const fetchDiaryEntries = async (): Promise<DiaryLoadResult> => {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.log('Kunne ikke hente dagbog fra Supabase.', error?.message);
      return { entries: [], failed: true };
    }

    return { entries: data.map(mapDbEntry), failed: false };
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved hentning af dagbog.', err);
    return { entries: [], failed: true };
  }
};

/** Uploader et bagebillede og returnerer den offentlige URL – null ved fejl. */
export const uploadDiaryImage = (base64: string, ext = 'jpg') =>
  uploadImage(DIARY_IMAGE_BUCKET, base64, ext);

/**
 * Bygger en simpel tekst-eksport af alle dagbogsindlæg, som kan deles.
 */
export const buildDiaryExport = (entries: DiaryEntry[]): string => {
  if (entries.length === 0) return 'Min surdejs-dagbog\n\n(Ingen bagninger gemt endnu.)';

  const lines = entries.map((entry) => {
    const date = formatIsoDate(entry.createdAt, formatLongDate);

    const ratings: string[] = [];
    if (entry.crumbRating) ratings.push(`Krumme ${entry.crumbRating}/5`);
    if (entry.tasteRating) ratings.push(`Smag ${entry.tasteRating}/5`);

    return [
      `• ${entry.recipeName} (${date})`,
      entry.temp ? `  Temperatur: ${entry.temp}` : null,
      ratings.length ? `  ${ratings.join(' · ')}` : null,
      entry.note ? `  Note: ${entry.note}` : null,
      ...(entry.recipe ? formatDiaryRecipeLines(entry.recipe) : []),
    ]
      .filter(Boolean)
      .join('\n');
  });

  return ['Min surdejs-dagbog', '', ...lines].join('\n');
};

/** Felterne på et indlæg, der kan rettes bagefter. Opskriften ligger fast. */
export type DiaryEntryEdit = {
  temp?: string;
  crumbRating?: number;
  tasteRating?: number;
  note?: string;
  /** Undlad feltet for at beholde det nuværende billede. */
  imageUrl?: string | null;
};

export const updateDiaryEntry = async (id: string, changes: DiaryEntryEdit): Promise<boolean> => {
  try {
    const row: Record<string, unknown> = {
      temp: changes.temp ?? null,
      crumb_rating: changes.crumbRating ?? null,
      taste_rating: changes.tasteRating ?? null,
      note: changes.note ?? null,
    };

    // Et billede, der ikke er rørt, må ikke blive slettet af en opdatering.
    if (changes.imageUrl !== undefined) row.image_url = changes.imageUrl;

    const { error } = await supabase.from('diary_entries').update(row).eq('id', id);

    if (error) {
      console.warn('Kunne ikke opdatere dagbogsindlæg:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved opdatering af dagbog.', err);
    return false;
  }
};

export const deleteDiaryEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('diary_entries').delete().eq('id', id);

    if (error) {
      console.warn('Kunne ikke slette dagbogsindlæg:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved sletning af dagbog.', err);
    return false;
  }
};

/**
 * PostgREST svarer PGRST204, når en kolonne ikke findes i skemaet – fx fordi
 * migrationen, der tilføjer den, ikke er kørt i det Supabase-projekt endnu.
 */
const isMissingRecipeColumn = (error: { code?: string; message?: string }): boolean =>
  error.code === 'PGRST204' && (error.message ?? '').includes('recipe');

export const saveDiaryEntry = async (entry: NewDiaryEntry): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Ingen bruger-session – kan ikke gemme dagbogsindlæg.');
      return false;
    }

    const row = {
      user_id: user.id,
      recipe_name: entry.recipeName,
      temp: entry.temp ?? null,
      crumb_rating: entry.crumbRating ?? null,
      taste_rating: entry.tasteRating ?? null,
      note: entry.note ?? null,
      image_url: entry.imageUrl ?? null,
      recipe: entry.recipe ?? null,
    };

    const { error } = await supabase.from('diary_entries').insert(row);

    if (!error) return true;

    // Er migration 04 ikke kørt endnu, findes recipe-kolonnen ikke. Så er det
    // vigtigere at redde indlægget end opskriften – hun har lige bagt.
    if (isMissingRecipeColumn(error)) {
      const { recipe, ...withoutRecipe } = row;
      const retry = await supabase.from('diary_entries').insert(withoutRecipe);

      if (!retry.error) {
        console.warn('Gemt uden opskrift – kør migration 04_diary_recipe.sql i Supabase.');
        return true;
      }

      console.warn('Kunne ikke gemme dagbogsindlæg:', retry.error.message);
      return false;
    }

    console.warn('Kunne ikke gemme dagbogsindlæg:', error.message);
    return false;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved gemning af dagbog.', err);
    return false;
  }
};
