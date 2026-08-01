-- Migration: 02_starter_feed_step.sql
-- Formål: Marker opskriftens fodringstrin, så bageplanen kan skifte det ud med
-- brugerens egen fodring (hendes forhold, hendes mængder, hendes toppetid).
--
-- Kolonnen er nullable med vilje: NULL betyder "ikke taget stilling", og appen
-- falder da tilbage på at genkende trinnet på titlen ("Fodr surdej").

ALTER TABLE public.recipe_steps
  ADD COLUMN IF NOT EXISTS is_starter_feed boolean;

COMMENT ON COLUMN public.recipe_steps.is_starter_feed IS
  'Sæt true på opskriftens fodringstrin. Bageplanen erstatter trinnet med brugerens egen fodring.';

-- Marker de fodringstrin, der allerede ligger i basen.
UPDATE public.recipe_steps
SET is_starter_feed = true
WHERE is_starter_feed IS NULL
  AND title ILIKE 'fodr%';
