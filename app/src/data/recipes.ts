import { supabase } from '../utils/supabase';
// Kun typerne går den anden vej (import type), så der er ingen kreds ved kørsel.
import { fetchUserRecipes } from './userRecipes';

export type Difficulty = 'Let' | 'Medium' | 'Svær';

export type TechniqueGuide = {
  summary: string;
  successSigns: string[];
  commonMistakes: string[];
};

export type RecipeStep = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  /**
   * Hævetrin der påvirkes af rumtemperatur og surdejens styrke.
   * Kun disse trin skaleres når brugeren vælger en anden temperatur/styrke.
   */
  temperatureSensitive?: boolean;
  videoUrl?: string; // Klar til at modtage URL fra Supabase
  technique?: TechniqueGuide; // Valgfri teknik-guide til trinnet
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  imageUrl?: string;
  handsOnMinutes: number;
  yield: string; // fx "12 boller"
  ingredients: string[];
  tools: string[];
  steps: RecipeStep[];
  /** Brugerens egen opskrift – kun de kan redigeres og slettes. */
  isCustom?: boolean;
};

const straekOgFoldTechnique: TechniqueGuide = {
  summary:
    'Løft dejen fra én side, stræk den forsigtigt op, og fold den ind over midten. Drej skålen og gentag 4 gange.',
  successSigns: ['Dejen bliver mere elastisk', 'Overfladen bliver glattere', 'Dejen holder bedre form'],
  commonMistakes: ['Du river dejen over', 'Du bruger for meget mel', 'Du folder for hårdt'],
};

// Lokale fallback-opskrifter (bruges hvis Supabase ikke er sat op endnu eller ved netværksfejl).
// Erstat disse med rigtige opskrifter (samt videoer og billeder) via Supabase.
export const standardRecipes: Recipe[] = [
  {
    id: 'boller-1',
    name: 'Koldhævede Surdejsboller',
    description: 'Luftige boller med koldhævning og sprød skorpe.',
    difficulty: 'Let',
    handsOnMinutes: 35,
    yield: '12 boller',
    ingredients: ['500 g hvedemel', '375 g vand', '100 g aktiv surdej', '10 g salt'],
    tools: ['Skål', 'Dejskraber', 'Bagepapir', 'Ovnplade'],
    steps: [
      { id: 'step-1', title: 'Fodr surdej', description: 'Gør din surdej klar. Bland 50g surdej, 50g vand, 50g mel.', durationMinutes: 240, temperatureSensitive: true },
      { id: 'step-2', title: 'Autolyse', description: 'Bland vand og mel sammen i en skål.', durationMinutes: 60, temperatureSensitive: true },
      { id: 'step-3', title: 'Tilsæt surdej & salt', description: 'Ælt surdejen og saltet ind i dejen.', durationMinutes: 30 },
      { id: 'step-4', title: 'Stræk og fold 1', description: 'Stræk dejen op og fold den over sig selv.', durationMinutes: 30, technique: straekOgFoldTechnique, videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
      { id: 'step-5', title: 'Stræk og fold 2', description: 'Endnu et stræk og fold for at bygge gluten.', durationMinutes: 30, technique: straekOgFoldTechnique },
      { id: 'step-6', title: 'Stræk og fold 3', description: 'Sidste fold. Herefter skal den bare hæve.', durationMinutes: 180, temperatureSensitive: true, technique: straekOgFoldTechnique },
      { id: 'step-7', title: 'I køleskabet', description: 'Sæt skålen i køleskabet natten over.', durationMinutes: 720 },
      { id: 'step-8', title: 'Tænd ovnen', description: 'Sæt bagepladen ind og tænd på 250 grader.', durationMinutes: 45 },
      { id: 'step-9', title: 'Bagning', description: 'Skær boller ud, sæt i ovnen ved 220 grader.', durationMinutes: 20 },
      { id: 'step-10', title: 'Køl af', description: 'Lad bollerne køle af på en rist.', durationMinutes: 30 },
    ],
  },
  {
    id: 'grydebrod-1',
    name: 'Grydebrød',
    description: 'Sprød skorpe og åben krumme bagt i støbejernsgryde.',
    difficulty: 'Medium',
    handsOnMinutes: 45,
    yield: '1 brød',
    ingredients: ['450 g hvedemel', '50 g fuldkornsmel', '375 g vand', '100 g aktiv surdej', '10 g salt'],
    tools: ['Skål', 'Dejskraber', 'Hævekurv', 'Støbejernsgryde med låg'],
    steps: [
      { id: 'gb-step-1', title: 'Fodr surdej', description: 'Bland 50g surdej, 50g vand, 50g mel og lad den blive aktiv.', durationMinutes: 300, temperatureSensitive: true },
      { id: 'gb-step-2', title: 'Autolyse', description: 'Bland vand og mel og lad det hvile.', durationMinutes: 60, temperatureSensitive: true },
      { id: 'gb-step-3', title: 'Tilsæt surdej & salt', description: 'Ælt surdej og salt ind i dejen.', durationMinutes: 30 },
      { id: 'gb-step-4', title: 'Stræk og fold 1', description: 'Stræk dejen op og fold den over sig selv.', durationMinutes: 45, technique: straekOgFoldTechnique },
      { id: 'gb-step-5', title: 'Stræk og fold 2', description: 'Endnu et sæt foldninger.', durationMinutes: 45, technique: straekOgFoldTechnique },
      { id: 'gb-step-6', title: 'Bulk-hævning', description: 'Lad dejen hæve til den er luftig.', durationMinutes: 240, temperatureSensitive: true },
      { id: 'gb-step-7', title: 'Form og i hævekurv', description: 'Form et stramt brød og læg det i hævekurven.', durationMinutes: 30 },
      { id: 'gb-step-8', title: 'I køleskabet', description: 'Koldhæv natten over i køleskabet.', durationMinutes: 720 },
      { id: 'gb-step-9', title: 'Forvarm gryde', description: 'Sæt gryden i ovnen og varm op til 250 grader.', durationMinutes: 45 },
      { id: 'gb-step-10', title: 'Bagning', description: 'Snit brødet og bag med låg, derefter uden.', durationMinutes: 45 },
      { id: 'gb-step-11', title: 'Køl af', description: 'Lad brødet køle helt af før det skæres.', durationMinutes: 60 },
    ],
  },
  {
    id: 'focaccia-1',
    name: 'Focaccia',
    description: 'Blød, luftig focaccia med olivenolie og flagesalt.',
    difficulty: 'Let',
    handsOnMinutes: 30,
    yield: '1 plade',
    ingredients: ['500 g hvedemel', '400 g vand', '100 g aktiv surdej', '12 g salt', 'Olivenolie', 'Flagesalt'],
    tools: ['Skål', 'Dejskraber', 'Bradepande', 'Bagepapir'],
    steps: [
      { id: 'fc-step-1', title: 'Fodr surdej', description: 'Gør surdejen aktiv.', durationMinutes: 240, temperatureSensitive: true },
      { id: 'fc-step-2', title: 'Bland dej', description: 'Bland mel, vand, surdej og salt til en våd dej.', durationMinutes: 30 },
      { id: 'fc-step-3', title: 'Stræk og fold 1', description: 'Våde hænder: stræk og fold dejen i skålen.', durationMinutes: 45, technique: straekOgFoldTechnique },
      { id: 'fc-step-4', title: 'Stræk og fold 2', description: 'Endnu et sæt foldninger.', durationMinutes: 45, technique: straekOgFoldTechnique },
      { id: 'fc-step-5', title: 'Bulk-hævning', description: 'Lad dejen hæve til dobbelt størrelse.', durationMinutes: 180, temperatureSensitive: true },
      { id: 'fc-step-6', title: 'I bradepande', description: 'Hæld dejen i en oliesmurt bradepande.', durationMinutes: 90, temperatureSensitive: true },
      { id: 'fc-step-7', title: 'Forvarm ovn', description: 'Tænd ovnen på 230 grader.', durationMinutes: 30 },
      { id: 'fc-step-8', title: 'Prik og bag', description: 'Prik dejen, dryp med olie og flagesalt, og bag.', durationMinutes: 25 },
      { id: 'fc-step-9', title: 'Køl af', description: 'Lad focacciaen køle lidt af før servering.', durationMinutes: 20 },
    ],
  },
];

const mapDbRecipe = (r: any, stepsData: any[]): Recipe => {
  const stepsForRecipe = stepsData
    .filter((s: any) => s.recipe_id === r.id)
    .map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      durationMinutes: s.duration_minutes,
      temperatureSensitive: s.temperature_sensitive ?? false,
      videoUrl: s.video_url ?? undefined,
      technique: s.technique ?? undefined,
    }));

  return {
    id: r.id,
    name: r.name,
    description: r.description,
    difficulty: (r.difficulty as Difficulty) ?? 'Let',
    imageUrl: r.image_url ?? undefined,
    handsOnMinutes: r.hands_on_minutes ?? 0,
    yield: r.yield ?? '',
    ingredients: r.ingredients ?? [],
    tools: r.tools ?? [],
    steps: stepsForRecipe,
  };
};

/** De færdige opskrifter appen kommer med – uden brugerens egne. */
const fetchStandardRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data: recipesData, error: recipesError } = await supabase.from('recipes').select('*');

    if (recipesError || !recipesData || recipesData.length === 0) {
      console.log('Supabase recipes not found or error. Falling back to local standardRecipes.');
      return standardRecipes;
    }

    const { data: stepsData, error: stepsError } = await supabase
      .from('recipe_steps')
      .select('*')
      .order('step_order', { ascending: true });

    if (stepsError || !stepsData) {
      console.log('Supabase recipe_steps not found. Falling back to local standardRecipes.');
      return standardRecipes;
    }

    return recipesData.map((r: any) => mapDbRecipe(r, stepsData));
  } catch (err) {
    console.error('Network or Supabase error. Falling back to local standardRecipes.', err);
    return standardRecipes;
  }
};

/**
 * Alle opskrifter, brugeren kan vælge imellem. Egne opskrifter ligger øverst –
 * det er dem, der bliver ledt efter, når man selv har skrevet dem ind.
 */
export const fetchRecipes = async (): Promise<Recipe[]> => {
  const [standard, custom] = await Promise.all([fetchStandardRecipes(), fetchUserRecipes()]);
  return [...custom, ...standard];
};
