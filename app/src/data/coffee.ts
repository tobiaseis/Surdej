import { supabase } from '../utils/supabase';
import { uploadImage } from './storage';

const COFFEE_IMAGE_BUCKET = 'coffee_images';

/** Skalaen i appen går fra 1 til 10. */
export const COFFEE_RATING_MAX = 10;

export type CoffeeEntry = {
  id: string;
  createdAt: string;
  beans: string | null;
  /** Gram kaffe. */
  doseGrams: number | null;
  /** Løbetid i sekunder. */
  brewSeconds: number | null;
  /** Kværnens indstilling – fri tekst, fordi kværne tæller vidt forskelligt. */
  grindSize: string | null;
  rating: number | null;
  note: string | null;
  imageUrl: string | null;
};

export type NewCoffeeEntry = {
  beans?: string;
  doseGrams?: number;
  brewSeconds?: number;
  grindSize?: string;
  rating?: number;
  note?: string;
  imageUrl?: string;
};

/**
 * En tom kaffedagbog og en mislykket hentning ser ens ud på skærmen, hvis vi
 * kun returnerer en liste. `failed` gør det muligt at vise den rigtige besked.
 */
export type CoffeeLoadResult = {
  entries: CoffeeEntry[];
  failed: boolean;
};

const mapDbEntry = (row: any): CoffeeEntry => ({
  id: row.id,
  createdAt: row.created_at,
  beans: row.beans ?? null,
  // numeric kommer hjem som streng fra PostgREST.
  doseGrams: row.dose_grams === null || row.dose_grams === undefined ? null : Number(row.dose_grams),
  brewSeconds: row.brew_seconds ?? null,
  grindSize: row.grind_size ?? null,
  rating: row.rating ?? null,
  note: row.note ?? null,
  imageUrl: row.image_url ?? null,
});

export const fetchCoffeeEntries = async (): Promise<CoffeeLoadResult> => {
  try {
    const { data, error } = await supabase
      .from('coffee_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.log('Kunne ikke hente kaffedagbogen fra Supabase.', error?.message);
      return { entries: [], failed: true };
    }

    return { entries: data.map(mapDbEntry), failed: false };
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved hentning af kaffedagbog.', err);
    return { entries: [], failed: true };
  }
};

/** Uploader et kaffebillede og returnerer den offentlige URL – null ved fejl. */
export const uploadCoffeeImage = (base64: string, ext = 'jpg') =>
  uploadImage(COFFEE_IMAGE_BUCKET, base64, ext);

export const saveCoffeeEntry = async (entry: NewCoffeeEntry): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Ingen bruger-session – kan ikke gemme kaffebryg.');
      return false;
    }

    const { error } = await supabase.from('coffee_entries').insert({
      user_id: user.id,
      beans: entry.beans ?? null,
      dose_grams: entry.doseGrams ?? null,
      brew_seconds: entry.brewSeconds ?? null,
      grind_size: entry.grindSize ?? null,
      rating: entry.rating ?? null,
      note: entry.note ?? null,
      image_url: entry.imageUrl ?? null,
    });

    if (error) {
      console.warn('Kunne ikke gemme kaffebryg:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved gemning af kaffebryg.', err);
    return false;
  }
};
