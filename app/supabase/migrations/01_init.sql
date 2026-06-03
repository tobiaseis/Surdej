-- Migration: 01_init.sql
-- Formål: Opretter tabeller til Surdejsmakkeren (Recipes, Steps, Diary) og opsætter RLS (Row Level Security).

-- 1. Opret recipes tabellen
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  total_hours integer NOT NULL,
  difficulty text NOT NULL,
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
  video_url text, -- Kan være null
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Opret diary_entries tabellen
CREATE TABLE public.diary_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_name text NOT NULL,
  rating integer,
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

-- OPRET STORAGE BUCKETS (Dette kan også gøres via Dashboard)
-- Bemærk: Bucket SQL fungerer kun, hvis supabase storage api er slået til. 
-- Det anbefales at oprette buckets "guides" og "diary_images" manuelt via Supabase Dashboard.
