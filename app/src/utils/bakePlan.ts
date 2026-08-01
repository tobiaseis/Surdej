import type { Recipe, RecipeStep } from '../data/recipes';
import {
  DEFAULT_SCHEDULE_OPTIONS,
  ScheduleOptions,
  getRecipeDurationMinutes,
} from './scheduleCalculator';
import { FeedBasis, FeedRatio, calculateFeed, formatRatio, getPeakWindow } from './starterFeed';

/**
 * Broen mellem fodringen og bageplanen. Fodringen er ikke et værktøj ved siden
 * af planen – den er planens første trin. Skærmen "Fodr surdej" regner
 * mængderne og toppetiden ud fra brugerens eget forhold, og her bliver de til
 * det trin, resten af opskriften lægges i forlængelse af.
 */

/** Fodringen som den blev valgt. Kun tal og tekst, så den kan ligge i navigation-params. */
export type FeedPlan = {
  ratio: FeedRatio;
  starterGrams: number;
  flourGrams: number;
  waterGrams: number;
  /**
   * Timer fra fodring til surdejen topper. Tallet kommer fra `getPeakWindow`,
   * som allerede har skaleret efter rumtemperatur og surdejens styrke.
   */
  peakHours: number;
};

export const FEED_STEP_ID = 'fodring';

/**
 * Opskrifternes eget fodringstrin, som bliver skiftet ud med brugerens egen
 * fodring. Flaget sættes på opskriften; titlen er kun en redning for de
 * opskrifter i Supabase, der blev skrevet ind, før flaget fandtes.
 */
export const isStarterFeedStep = (step: RecipeStep): boolean =>
  step.isStarterFeed ?? /\bfodr/i.test(step.title);

export const createFeedPlan = (
  ratio: FeedRatio,
  basis: FeedBasis,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): FeedPlan => {
  const amounts = calculateFeed(ratio, basis);

  return {
    ratio,
    starterGrams: amounts.starterGrams,
    flourGrams: amounts.flourGrams,
    waterGrams: amounts.waterGrams,
    peakHours: getPeakWindow(ratio, options).hours,
  };
};

/** "50 g surdej + 100 g mel + 100 g vand" – det der skal på vægten. */
export const formatFeedAmounts = (feed: FeedPlan): string =>
  `${feed.starterGrams} g surdej + ${feed.flourGrams} g mel + ${feed.waterGrams} g vand`;

export const buildFeedStep = (feed: FeedPlan): RecipeStep => ({
  id: FEED_STEP_ID,
  title: 'Fodr surdej',
  description: `${formatFeedAmounts(feed)} (${formatRatio(feed.ratio)}). Den skal stå, til den er hævet til det dobbelte og begynder at flade ud på toppen.`,
  // Rundet til nærmeste 5 minutter som de øvrige trin i planen.
  durationMinutes: Math.max(5, Math.round((feed.peakHours * 60) / 5) * 5),
  /**
   * `peakHours` er allerede justeret for temperatur og surdejens styrke.
   * Uden dette flag ville bageplanen skalere trinnet én gang til.
   */
  temperatureSensitive: false,
  isStarterFeed: true,
});

/**
 * Opskriften som bageplanen skal regne på: opskriftens eget fodringstrin
 * erstattet af brugerens egen fodring. Kun et fodringstrin i toppen skiftes
 * ud – står der et længere nede, er det en anden slags fodring, som
 * opskriften selv bestemmer over.
 */
export const withFeedStep = (recipe: Recipe, feed: FeedPlan): Recipe => {
  const rest = [...recipe.steps];
  while (rest.length > 0 && isStarterFeedStep(rest[0])) rest.shift();

  return { ...recipe, steps: [buildFeedStep(feed), ...rest] };
};

/**
 * Hvornår bagværket er færdigt, hvis der fodres på et bestemt tidspunkt.
 * Bruges når brugeren fodrer nu, og planen derfor regnes forlæns.
 */
export const getEndTimeFromFeed = (
  recipe: Recipe,
  feed: FeedPlan,
  fedAt: Date,
  options: ScheduleOptions = DEFAULT_SCHEDULE_OPTIONS
): Date =>
  new Date(
    fedAt.getTime() + getRecipeDurationMinutes(withFeedStep(recipe, feed), options) * 60 * 1000
  );
