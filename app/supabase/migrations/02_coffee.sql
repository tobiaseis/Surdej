-- Migration: 02_coffee.sql
-- Formål: Kaffedagbog – en bryg pr. række med dosering, løbetid, kværnindstilling,
-- bedømmelse (1-10), note og billede. Samme RLS-mønster som diary_entries.

CREATE TABLE public.coffee_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  beans text,                                            -- Fx "Ethiopia Guji, La Cabra"
  dose_grams numeric(5,1),                               -- Gram kaffe
  brew_seconds integer CHECK (brew_seconds >= 0),        -- Løbetid i sekunder
  grind_size text,                                       -- Kværnens indstilling, fx "18 klik"
  rating integer CHECK (rating BETWEEN 1 AND 10),
  note text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Listen hentes altid som "mine bryg, nyeste først".
CREATE INDEX coffee_entries_user_created_idx
  ON public.coffee_entries (user_id, created_at DESC);

ALTER TABLE public.coffee_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coffee entries" ON public.coffee_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coffee entries" ON public.coffee_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coffee entries" ON public.coffee_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coffee entries" ON public.coffee_entries
  FOR DELETE USING (auth.uid() = user_id);

-- BILLEDER
-- Egen bucket, så kaffebilleder kan ryddes op uafhængigt af bagebillederne.
INSERT INTO storage.buckets (id, name, public)
VALUES ('coffee_images', 'coffee_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Coffee images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'coffee_images');

CREATE POLICY "Authenticated users can upload coffee images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'coffee_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own coffee images" ON storage.objects
  FOR DELETE USING (bucket_id = 'coffee_images' AND owner = auth.uid());
