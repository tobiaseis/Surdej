/**
 * Afstands- og radius-skala. Alle marginer, paddings og hjørner i appen
 * hentes herfra, så layoutet er konsistent og kan justeres ét sted.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 100,
} as const;

export const layout = {
  screenPaddingHorizontal: spacing.xl,
  /** Lidt mere luft i toppen end i siderne, så overskriften får plads. */
  screenPaddingTop: 28,
  screenPaddingBottom: spacing.xl,
  /** Frihøjde under indholdet, når skærmen har en fastgjort bundbjælke. */
  bottomBarClearance: 100,
} as const;
