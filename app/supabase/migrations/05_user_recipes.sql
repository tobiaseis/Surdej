-- Migration: 05_user_recipes.sql
-- Formål: Egne opskrifter. Finder man en opskrift på nettet med en anden
-- melblanding, skal den kunne skrives ind i appen og planlægges som de andre.
--
-- Egen tabel frem for at lægge dem i `recipes`: de færdige opskrifter er
-- fælles og læses af alle, mens disse hører til én bruger. Det holder RLS
-- simpel – hele tabellen er "kun ejeren" – og fjerner risikoen for, at en
-- privat opskrift bliver synlig, fordi en policy på fællestabellen bliver
-- skrevet forkert.
--
-- Trinnene ligger som jsonb frem for i recipe_steps: en opskrift redigeres
-- som ét hele (trin tilføjes, slettes og flyttes), og det er én opdatering i
-- stedet for at slette og genindsætte rækker i den rigtige rækkefølge.
--
-- steps: [{ "title": "Autolyse", "description": "...", "durationMinutes": 60,
--           "temperatureSensitive": true }]

CREATE TABLE IF NOT EXISTS public.user_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Let',
  hands_on_minutes integer NOT NULL DEFAULT 0,
  yield text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

-- Kun ejeren – egne opskrifter deles ikke med andre brugere.
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.user_recipes;
CREATE POLICY "Users can view their own recipes" ON public.user_recipes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recipes" ON public.user_recipes;
CREATE POLICY "Users can insert their own recipes" ON public.user_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipes" ON public.user_recipes;
CREATE POLICY "Users can update their own recipes" ON public.user_recipes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.user_recipes;
CREATE POLICY "Users can delete their own recipes" ON public.user_recipes
  FOR DELETE USING (auth.uid() = user_id);
