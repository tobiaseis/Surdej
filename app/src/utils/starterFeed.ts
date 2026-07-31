import {
  DEFAULT_SCHEDULE_OPTIONS,
  ScheduleOptions,
  getStarterFactor,
  getTemperatureFactor,
} from './scheduleCalculator';

/**
 * Fodring af surdejen. Forholdet skrives som surdej : mel : vand – fx 1:1:1
 * ("lige dele") eller 1:5:5, hvor 5 g mel og 5 g vand kommer på hvert gram
 * surdej. Rækkefølgen er den samme overalt i appen, så tallene kan læses
 * direkte fra skærmen og ned i vægten.
 */

export type FeedRatio = {
  starter: number;
  flour: number;
  water: number;
};

export type FeedPreset = {
  label: string;
  caption: string;
  ratio: FeedRatio;
};

/** De tre forhold, de fleste opskrifter bruger. Alt andet sættes manuelt. */
export const FEED_PRESETS: FeedPreset[] = [
  { label: '1:1:1', caption: 'Lige dele – klar samme dag', ratio: { starter: 1, flour: 1, water: 1 } },
  { label: '1:2:2', caption: 'Standard – klar til aften', ratio: { starter: 1, flour: 2, water: 2 } },
  { label: '1:5:5', caption: 'Lille skvæt surdej – natten over', ratio: { starter: 1, flour: 5, water: 5 } },
];

export const DEFAULT_FEED_RATIO: FeedRatio = FEED_PRESETS[1].ratio;

/** Grænser for indtastning, så et forhold ikke kan blive umuligt. */
export const FEED_LIMITS = {
  part: { min: 1, max: 10 },
  starterGrams: { min: 5, max: 500 },
  totalGrams: { min: 20, max: 2000 },
  reserveGrams: { min: 0, max: 200 },
} as const;

/**
 * Enten "jeg har så meget surdej" (fremad) eller "jeg skal bruge så meget
 * aktiv surdej til opskriften" (baglæns).
 */
export type FeedBasis =
  | { mode: 'starter'; starterGrams: number }
  | {
      mode: 'total';
      totalGrams: number;
      /** Surdej der skal blive tilbage i glasset til næste gang. */
      reserveGrams?: number;
    };

export type FeedResult = {
  /** Surdej fra glasset – resten smides ud eller bruges til pandekager. */
  starterGrams: number;
  flourGrams: number;
  waterGrams: number;
  /** Alt sammen: det du har i glasset efter fodring. */
  totalGrams: number;
  /** Det du kan bruge i dejen, når reserven er trukket fra. */
  usableGrams: number;
  /** Vand i procent af mel i den fodrede surdej. 100 = fodret 1:1. */
  hydrationPct: number;
};

const partsSum = (ratio: FeedRatio) =>
  Math.max(0, ratio.starter) + Math.max(0, ratio.flour) + Math.max(0, ratio.water);

const round = (value: number) => Math.max(0, Math.round(value));

export const calculateFeed = (ratio: FeedRatio, basis: FeedBasis): FeedResult => {
  const starterPart = Math.max(0, ratio.starter);
  const flourPart = Math.max(0, ratio.flour);
  const waterPart = Math.max(0, ratio.water);
  const sum = starterPart + flourPart + waterPart;

  // Uden surdej i forholdet er der ikke noget at fodre – vis nuller frem for
  // at dividere med 0.
  if (starterPart <= 0 || sum <= 0) {
    return {
      starterGrams: 0,
      flourGrams: 0,
      waterGrams: 0,
      totalGrams: 0,
      usableGrams: 0,
      hydrationPct: 0,
    };
  }

  const reserveGrams = basis.mode === 'total' ? Math.max(0, basis.reserveGrams ?? 0) : 0;

  // "Én del" i gram. Forfra er det surdejen, du starter med; baglæns fordeles
  // den ønskede slutmængde (plus reserven) på alle delene.
  const unitGrams =
    basis.mode === 'starter'
      ? Math.max(0, basis.starterGrams) / starterPart
      : (Math.max(0, basis.totalGrams) + reserveGrams) / sum;

  const starterGrams = round(unitGrams * starterPart);
  const flourGrams = round(unitGrams * flourPart);
  const waterGrams = round(unitGrams * waterPart);
  const totalGrams = starterGrams + flourGrams + waterGrams;

  return {
    starterGrams,
    flourGrams,
    waterGrams,
    totalGrams,
    usableGrams: Math.max(0, totalGrams - reserveGrams),
    hydrationPct: flourPart > 0 ? Math.round((waterPart / flourPart) * 100) : 0,
  };
};

/**
 * Hvor længe den fodrede surdej er om at toppe. Modellen: jo mere den bliver
 * fortyndet, jo længere tid – ca. proportionalt med hvor mange gange dens egen
 * vægt den skal æde sig igennem. Kalibreret så 1:1:1 topper på ~5 timer og
 * 1:5:5 på ~11 timer ved 21°C, hvilket er der, de gængse fodringstabeller
 * ligger. Temperatur og surdejens styrke skalerer som i bageplanen.
 */
const PEAK_HOURS_PER_DOUBLING = 3.2;
const MIN_PEAK_HOURS = 1;
/** Toppen er et vindue, ikke et klokkeslæt – surdejen står højt et stykke tid. */
const PEAK_WINDOW_SPREAD = 0.15;

export type PeakWindow = {
  /** Timer fra fodring til midten af vinduet. */
  hours: number;
  fromHours: number;
  toHours: number;
};

export const getPeakWindow = (
  ratio: FeedRatio,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): PeakWindow => {
  const starterPart = Math.max(0, ratio.starter);
  const dilution = starterPart > 0 ? partsSum(ratio) / starterPart : 1;

  const base = PEAK_HOURS_PER_DOUBLING * Math.log2(Math.max(1, dilution));
  const hours = Math.max(
    MIN_PEAK_HOURS,
    base * getTemperatureFactor(options.roomTempC) * getStarterFactor(options.starterStrength)
  );

  return {
    hours,
    fromHours: hours * (1 - PEAK_WINDOW_SPREAD),
    toHours: hours * (1 + PEAK_WINDOW_SPREAD),
  };
};

/** Tidspunktet hvor surdejen er klar, regnet fra fodringen. */
export const getPeakTimes = (window: PeakWindow, fedAt = new Date()) => ({
  from: new Date(fedAt.getTime() + window.fromHours * 60 * 60 * 1000),
  to: new Date(fedAt.getTime() + window.toHours * 60 * 60 * 1000),
});

/**
 * Hvornår fodringen skal ske, hvis surdejen skal være klar til et bestemt
 * tidspunkt – fx når bageplanen siger, dejen skal røres kl. 21.
 */
export const getFeedTime = (
  ratio: FeedRatio,
  readyAt: Date,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): Date => new Date(readyAt.getTime() - getPeakWindow(ratio, options).hours * 60 * 60 * 1000);

/** "ca. 5–7 timer" – halve timer, fordi tallet alligevel er et skøn. */
export const formatHourRange = (window: PeakWindow): string => {
  const half = (value: number) => Math.round(value * 2) / 2;
  const from = half(window.fromHours);
  const to = half(window.toHours);
  const text = (value: number) => value.toString().replace('.', ',');

  return from === to ? `ca. ${text(from)} timer` : `ca. ${text(from)}–${text(to)} timer`;
};
