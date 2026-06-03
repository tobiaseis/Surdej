import { decode } from 'base64-arraybuffer';
import { supabase } from '../utils/supabase';

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

export const fetchDiaryEntries = async (): Promise<DiaryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.log('Kunne ikke hente dagbog fra Supabase.', error?.message);
      return [];
    }

    return data.map(mapDbEntry);
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved hentning af dagbog.', err);
    return [];
  }
};

/**
 * Uploader et billede (som base64 fra expo-image-picker) til Supabase Storage
 * og returnerer den offentlige URL. Returnerer null ved fejl.
 */
export const uploadDiaryImage = async (base64: string, ext = 'jpg'): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const folder = user?.id ?? 'anon';
    const path = `${folder}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const { error } = await supabase.storage
      .from(DIARY_IMAGE_BUCKET)
      .upload(path, decode(base64), { contentType, upsert: false });

    if (error) {
      console.warn('Kunne ikke uploade billede:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(DIARY_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved billed-upload.', err);
    return null;
  }
};

/**
 * Bygger en simpel tekst-eksport af alle dagbogsindlæg, som kan deles.
 */
export const buildDiaryExport = (entries: DiaryEntry[]): string => {
  if (entries.length === 0) return 'Min surdejs-dagbog\n\n(Ingen bagninger gemt endnu.)';

  const lines = entries.map((entry) => {
    const date = (() => {
      try {
        return new Date(entry.createdAt).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return entry.createdAt;
      }
    })();

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
