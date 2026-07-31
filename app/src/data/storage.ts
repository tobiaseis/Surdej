import { decode } from 'base64-arraybuffer';
import { supabase } from '../utils/supabase';

/**
 * Uploader et billede (som base64 fra expo-image-picker) til en Supabase
 * Storage-bucket og returnerer den offentlige URL. Returnerer null ved fejl,
 * så kaldstedet selv kan bestemme, om resten skal gemmes uden billede.
 *
 * Billederne lægges i en mappe pr. bruger, så storage-policyen kan afgøre,
 * hvem der må slette dem igen.
 */
export const uploadImage = async (
  bucket: string,
  base64: string,
  ext = 'jpg'
): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const folder = user?.id ?? 'anon';
    const path = `${folder}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), { contentType, upsert: false });

    if (error) {
      console.warn('Kunne ikke uploade billede:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Netværks- eller Supabase-fejl ved billed-upload.', err);
    return null;
  }
};
