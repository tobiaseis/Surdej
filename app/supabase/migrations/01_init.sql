-- Migration: 01_init.sql
-- Formål: Opretter tabeller til Surdejsmakkeren (Recipes, Steps, Diary) og opsætter RLS (Row Level Security).

-- 1. Opret recipes tabellen
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Let',
  image_url text,
  hands_on_minutes integer NOT NULL DEFAULT 0,
  yield text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Opret recipe_steps tabellen
CREATE TABLE public.recipe_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  duration_minutes integer NOT NULL,
  requires_action boolean DEFAULT true,
  temperature_sensitive boolean DEFAULT false, -- Hævetrin der skaleres af temperatur/surdejstyrke
  video_url text, -- Kan være null
  technique jsonb, -- { summary, successSigns: [], commonMistakes: [] } – kan være null
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Opret diary_entries tabellen
CREATE TABLE public.diary_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_name text NOT NULL,
  crumb_rating integer,
  taste_rating integer,
  note text,
  image_url text,
  temp text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SLÅ RLS TIL
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR RECIPES & STEPS (Alle kan læse dem)
CREATE POLICY "Recipes are viewable by everyone" ON public.recipes
  FOR SELECT USING (true);

CREATE POLICY "Recipe steps are viewable by everyone" ON public.recipe_steps
  FOR SELECT USING (true);

-- POLICIES FOR DIARY ENTRIES (Brugere kan kun se og ændre deres egne)
CREATE POLICY "Users can view their own diary entries" ON public.diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries" ON public.diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries" ON public.diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries" ON public.diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- OPRET STORAGE BUCKET TIL DAGBOGSBILLEDER
-- Offentligt læsbar bucket, så billed-URL'er kan vises direkte i appen.
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary_images', 'diary_images', true)
ON CONFLICT (id) DO NOTHING;

-- Alle kan se billederne (offentlig URL).
CREATE POLICY "Diary images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'diary_images');

-- Kun loggede-ind brugere (inkl. anonyme sessioner) kan uploade.
CREATE POLICY "Authenticated users can upload diary images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'diary_images' AND auth.role() = 'authenticated');

-- Brugere kan slette/opdatere billeder i deres egen mappe (user_id som mappenavn).
CREATE POLICY "Users can manage their own diary images" ON storage.objects
  FOR DELETE USING (bucket_id = 'diary_images' AND owner = auth.uid());

-- BEMÆRK: Opret evt. også en "guides" bucket til teknik-videoer via Dashboard.
