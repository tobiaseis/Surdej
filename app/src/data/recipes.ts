import { supabase } from '../utils/supabase';

export type RecipeStep = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  requiresAction: boolean;
  videoUrl?: string; // Nu klar til at modtage URL fra Supabase
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  steps: RecipeStep[];
};

// Vores fallback data (hvis Supabase endnu ikke er sat op eller der er netværksfejl)
export const standardRecipes: Recipe[] = [
  {
    id: 'boller-1',
    name: 'Koldhævede Surdejsboller',
    description: 'Klassiske saftige surdejsboller med sprød skorpe.',
    steps: [
      { id: 'step-1', title: 'Fodr surdej', description: 'Gør din surdej klar. Bland 50g surdej, 50g vand, 50g mel.', durationMinutes: 240, requiresAction: true },
      { id: 'step-2', title: 'Autolyse', description: 'Bland vand og mel sammen i en skål.', durationMinutes: 60, requiresAction: true },
      { id: 'step-3', title: 'Tilsæt surdej & salt', description: 'Ælt surdejen og saltet ind i dejen.', durationMinutes: 30, requiresAction: true },
      { id: 'step-4', title: 'Stræk og fold 1', description: 'Stræk dejen op og fold den over sig selv.', durationMinutes: 30, requiresAction: true, videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
      { id: 'step-5', title: 'Stræk og fold 2', description: 'Endnu et stræk og fold for at bygge gluten.', durationMinutes: 30, requiresAction: true },
      { id: 'step-6', title: 'Stræk og fold 3', description: 'Sidste fold. Herefter skal den bare hæve.', durationMinutes: 180, requiresAction: true },
      { id: 'step-7', title: 'I køleskabet', description: 'Sæt skålen i køleskabet natten over.', durationMinutes: 720, requiresAction: true },
      { id: 'step-8', title: 'Tænd ovnen', description: 'Sæt bagepladen ind og tænd på 250 grader.', durationMinutes: 45, requiresAction: true },
      { id: 'step-9', title: 'Bagning', description: 'Skær boller ud, sæt i ovnen ved 220 grader.', durationMinutes: 20, requiresAction: true },
      { id: 'step-10', title: 'Køl af', description: 'Lad bollerne køle af på en rist.', durationMinutes: 30, requiresAction: false },
    ],
  }
];

export const fetchRecipes = async (): Promise<Recipe[]> => {
  try {
    // 1. Hent alle opskrifter
    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError || !recipesData || recipesData.length === 0) {
      console.log('Supabase recipes not found or error. Falling back to local standardRecipes.');
      return standardRecipes;
    }

    // 2. Hent alle trin
    const { data: stepsData, error: stepsError } = await supabase
      .from('recipe_steps')
      .select('*')
      .order('step_order', { ascending: true });

    if (stepsError || !stepsData) {
      console.log('Supabase recipe_steps not found. Falling back to local standardRecipes.');
      return standardRecipes;
    }

    // 3. Map data sammen
    const mappedRecipes: Recipe[] = recipesData.map((r: any) => {
      const stepsForRecipe = stepsData
        .filter((s: any) => s.recipe_id === r.id)
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          durationMinutes: s.duration_minutes,
          requiresAction: s.requires_action,
          videoUrl: s.video_url,
        }));

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        steps: stepsForRecipe,
      };
    });

    return mappedRecipes;
  } catch (err) {
    console.error('Network or Supabase error. Falling back to local standardRecipes.', err);
    return standardRecipes;
  }
};
