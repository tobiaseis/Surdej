-- Migration: 04_diary_recipe.sql
-- Formål: Gemme hele opskriften i dagbogsindlægget.
--
-- Indlægget gemte kun opskriftens navn. Opskrifter kan blive rettet eller
-- slettet, og en bagning kører med sine egne tider (justeret efter temperatur
-- og surdejens styrke) – så et navn er ikke nok til at bage det samme igen.
-- Derfor fryses ingredienser, værktøj, trin og forholdene ned som en kopi.
--
-- jsonb frem for nye tabeller: kopien skal aldrig ændres eller søges i, kun
-- læses tilbage sammen med indlægget.
--
-- Eksempel:
-- {
--   "name": "Koldhævede Surdejsboller",
--   "yield": "12 boller",
--   "ingredients": ["500 g hvedemel", "375 g vand"],
--   "tools": ["Skål"],
--   "steps": [{ "title": "Autolyse", "description": "...", "durationMinutes": 60 }],
--   "roomTempC": 21,
--   "starterStrength": "normal"
-- }
--
-- Sikker at køre flere gange. Eksisterende indlæg får NULL og vises som før.

ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS recipe jsonb;
