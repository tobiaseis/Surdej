import { supabase } from '../utils/supabase';
import { uploadImage } from './storage';
import { formatIsoDate, formatLongDate } from '../utils/dateTime';

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
};

export type NewDiaryEntry = {
  recipeName: string;
  temp?: string;
  crumbRating?: number;
  tasteRating?: number;
  note?: string;
  imageUrl?: string;
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
    ]
      .filter(Boolean)
      .join('\n');
  });

  return ['Min surdejs-dagbog', '', ...lines].join('\n');
};

export const saveDiaryEntry = async (entry: NewDiaryEntry): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Ingen bruger-session – kan ikke gemme dagbogsindlæg.');
      return false;
    }

    const { error } = await supabase.from('diary_entries').insert({
      user_id: user.id,
      recipe_name: entry.recipeName,
      temp: entry.temp ?? null,
      crumb_rating: entry.crumbRating ?? null,
      taste_rating: entry.tasteRating ?? null,
      note: entry.note ?? null,
      image_url: entry.imageUrl ?? null,
    });

    if (error) {
      console.warn('Kunne ikke gemme dagbogsindlæg:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved gemning af dagbog.', err);
    return false;
  }
};
