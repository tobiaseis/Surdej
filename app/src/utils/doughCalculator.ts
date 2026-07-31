import type { Recipe } from '../data/recipes';

/**
 * Bagerprocenter regnes ud fra det mel, du vejer af – ikke det samlede mel
 * inklusive surdejens. Det er den måde opskrifterne i appen er skrevet på
 * ("500 g mel, 375 g vand, 100 g surdej"), så tallene kan læses direkte
 * begge veje. Den "rigtige" samlede hydrering vises som et afledt tal.
 */

export type FlourShare = {
  name: string;
  /** Andel af det samlede mel, 0–1. Alle andele summer til 1. */
  share: number;
};

export type DoughRatios = {
  /** Vand i procent af melet. */
  hydrationPct: number;
  /** Surdej i procent af melet. */
  starterPct: number;
  /** Salt i procent af melet. */
  saltPct: number;
  /** Surdejens egen hydrering. 100 = fodret 1:1 (lige dele mel og vand). */
  starterHydrationPct?: number;
  /** Melblanding fra opskriften, fx 90 % hvedemel og 10 % fuldkorn. */
  flourMix?: FlourShare[];
};

/**
 * Hvad brugeren tager udgangspunkt i: melet der skal vejes af, eller den
 * samlede mængde dej der skal komme ud af det.
 */
export type DoughBasis = {
  mode: 'flour' | 'dough';
  grams: number;
};

export type DoughAmount = {
  name: string;
  grams: number;
};

export type DoughResult = {
  flourGrams: number;
  waterGrams: number;
  starterGrams: number;
  saltGrams: number;
  /** Summen af de afrundede mængder – det brugeren rent faktisk vejer af. */
  totalGrams: number;
  /** Hydrering når melet og vandet i surdejen regnes med. */
  totalHydrationPct: number;
  /** Melet fordelt på opskriftens meltyper. Én post, hvis der kun er ét mel. */
  flourBreakdown: DoughAmount[];
};

export const DEFAULT_RATIOS: DoughRatios = {
  hydrationPct: 75,
  starterPct: 20,
  saltPct: 2,
};

export const DEFAULT_STARTER_HYDRATION_PCT = 100;

/** Grænser for indtastning, så en tastefejl ikke giver en umulig dej. */
export const RATIO_LIMITS = {
  hydrationPct: { min: 50, max: 100 },
  starterPct: { min: 5, max: 50 },
  saltPct: { min: 0, max: 4 },
} as const;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FALLBACK_FLOUR_NAME = 'Mel';

/**
 * Fordeler en samlet mængde på flere andele, så de afrundede tal summer til
 * præcis `total`. Resten fra afrundingen lægges på de poster, der blev rundet
 * mest ned (største-rest-metoden).
 */
const splitByShares = (total: number, mix: FlourShare[]): DoughAmount[] => {
  const exact = mix.map((flour) => total * flour.share);
  const rounded = exact.map((grams) => Math.floor(grams));
  let remainder = total - rounded.reduce((sum, grams) => sum + grams, 0);

  const order = exact
    .map((grams, index) => ({ index, rest: grams - Math.floor(grams) }))
    .sort((a, b) => b.rest - a.rest);

  for (const { index } of order) {
    if (remainder <= 0) break;
    rounded[index] += 1;
    remainder -= 1;
  }

  return mix.map((flour, index) => ({ name: flour.name, grams: rounded[index] }));
};

export const calculateDough = (ratios: DoughRatios, basis: DoughBasis): DoughResult => {
  const hydration = Math.max(0, ratios.hydrationPct) / 100;
  const starterShare = Math.max(0, ratios.starterPct) / 100;
  const saltShare = Math.max(0, ratios.saltPct) / 100;
  const starterHydration =
    Math.max(0, ratios.starterHydrationPct ?? DEFAULT_STARTER_HYDRATION_PCT) / 100;

  const grams = Number.isFinite(basis.grams) ? Math.max(0, basis.grams) : 0;

  // Samlet dej = mel + vand + surdej + salt = mel · (1 + hydrering + surdej + salt)
  const exactFlour =
    basis.mode === 'flour' ? grams : grams / (1 + hydration + starterShare + saltShare);

  const flourGrams = Math.round(exactFlour);
  const waterGrams = Math.round(exactFlour * hydration);
  const starterGrams = Math.round(exactFlour * starterShare);
  const saltGrams = Math.round(exactFlour * saltShare);

  // Surdejen er selv mel og vand, og tæller med i den samlede hydrering.
  const starterFlour = starterGrams / (1 + starterHydration);
  const starterWater = starterGrams - starterFlour;
  const totalFlour = flourGrams + starterFlour;
  const totalHydrationPct =
    totalFlour > 0 ? ((waterGrams + starterWater) / totalFlour) * 100 : 0;

  const mix = ratios.flourMix?.length
    ? ratios.flourMix
    : [{ name: FALLBACK_FLOUR_NAME, share: 1 }];

  return {
    flourGrams,
    waterGrams,
    starterGrams,
    saltGrams,
    totalGrams: flourGrams + waterGrams + starterGrams + saltGrams,
    totalHydrationPct: Math.round(totalHydrationPct * 10) / 10,
    flourBreakdown: splitByShares(flourGrams, mix),
  };
};

/** "500 g hvedemel" → 500. Ignorerer linjer uden en vægt, fx "Olivenolie". */
const parseGrams = (line: string): number | null => {
  const match = line.match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i);
  if (!match) return null;

  const value = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;

  return match[2].toLowerCase() === 'kg' ? value * 1000 : value;
};

/** "500 g hvedemel" → "Hvedemel". */
const parseIngredientName = (line: string): string => {
  const name = line.replace(/^\s*\d+(?:[.,]\d+)?\s*(kg|g)\b\s*/i, '').trim();
  if (!name) return FALLBACK_FLOUR_NAME;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

type IngredientKind = 'starter' | 'water' | 'salt' | 'flour' | null;

// Surdej tjekkes før mel, så "surdej af hvedemel" ikke tælles som mel.
const classifyIngredient = (line: string): IngredientKind => {
  const text = line.toLowerCase();
  if (/surdej|levain|starter/.test(text)) return 'starter';
  if (/vand|water/.test(text)) return 'water';
  if (/salt/.test(text)) return 'salt';
  if (/mel|flour|semulje/.test(text)) return 'flour';
  return null;
};

export type ParsedRecipeDough = {
  ratios: DoughRatios;
  /** Melmængden i opskriften – bruges som udgangspunkt i beregneren. */
  flourGrams: number;
};

/**
 * Læser forholdene ud af en opskrifts ingrediensliste, så beregneren kan
 * starte med opskriftens egne tal. Returnerer null, hvis listen ikke kan
 * læses (fx en opskrift uden vægt på ingredienserne).
 */
export const parseRecipeDough = (recipe: Recipe): ParsedRecipeDough | null => {
  const flours: { name: string; grams: number }[] = [];
  let flourGrams = 0;
  let waterGrams = 0;
  let starterGrams = 0;
  let saltGrams = 0;

  for (const line of recipe.ingredients) {
    const grams = parseGrams(line);
    if (grams === null || grams <= 0) continue;

    switch (classifyIngredient(line)) {
      case 'starter':
        starterGrams += grams;
        break;
      case 'water':
        waterGrams += grams;
        break;
      case 'salt':
        saltGrams += grams;
        break;
      case 'flour':
        flours.push({ name: parseIngredientName(line), grams });
        flourGrams += grams;
        break;
      default:
        break;
    }
  }

  if (flourGrams <= 0 || (waterGrams <= 0 && starterGrams <= 0)) return null;

  const round1 = (value: number) => Math.round(value * 10) / 10;

  return {
    flourGrams: Math.round(flourGrams),
    ratios: {
      hydrationPct: Math.round((waterGrams / flourGrams) * 100),
      starterPct: Math.round((starterGrams / flourGrams) * 100),
      saltPct: round1((saltGrams / flourGrams) * 100),
      flourMix: flours.map((flour) => ({ name: flour.name, share: flour.grams / flourGrams })),
    },
  };
};
