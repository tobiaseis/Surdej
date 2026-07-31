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
  /**
   * Frihøjde under indholdet, når skærmen har en fastgjort bundbjælke med
   * én knap: bjælkens egen højde (24 + 52 + 24) plus lidt luft.
   */
  bottomBarClearance: 120,
  /** Samme, men til bjælker med to linjer – resultattal eller en hjælpetekst. */
  bottomBarClearanceTall: 150,
  /**
   * Tekstlinjer bliver ulæseligt lange på tablets, hvor indholdet ellers
   * ville strække sig over hele bredden. Appen understøtter iPad.
   */
  maxContentWidth: 560,
  /** Mindste trykflade. 44pt er Apples HIG; Android anbefaler 48dp. */
  minTouchTarget: 44,
} as const;
