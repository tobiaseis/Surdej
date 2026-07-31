export const colors = {
  background: '#FFF8EF',
  primary: '#8B5E34',
  secondary: '#D9A066',
  textMain: '#2F2924',
  textSub: '#7A6B5D',
  success: '#4F7A5A',
  /**
   * Mørkere end den oprindelige #C46A3A, så den både består WCAG AA som
   * tekstfarve på baggrunden (5,1:1) og bag hvid tekst i et badge (5,4:1).
   */
  warning: '#A9522A',
  card: '#FFFFFF',
  border: '#EADCCB',

  /** Tekst og ikoner oven på primary/secondary/success-flader. */
  onPrimary: '#FFFFFF',
  /** Dæmpet grøn baggrund til kvitteringer, fx "Godt klaret". */
  successSurface: '#EAF2EC',
  /** Mørkt underlag bag video, så letterboxing ikke lyser. */
  videoBackground: '#000000',
  shadow: '#000000',
  /** Halvgennemsigtigt lag bag modaler. */
  overlay: 'rgba(0, 0, 0, 0.4)',
  /** Ripple/press-farve afledt af primary. */
  pressHighlight: 'rgba(139, 94, 52, 0.08)',
} as const;
