import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

/**
 * Fontnavne. I React Native kombineres `fontFamily` og `fontWeight` ikke for
 * indlæste fonte – hver vægt er sin egen familie. Brug derfor disse navne i
 * stedet for `fontWeight`, ellers laver Android en syntetisk (grim) fed variant.
 */
export const fonts = {
  /** Fraunces – varm display-serif til overskrifter. */
  display: 'Fraunces_700Bold',
  displaySemiBold: 'Fraunces_600SemiBold',
  /** Inter – neutral sans til brødtekst, knapper og labels. */
  sans: 'Inter_400Regular',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

/**
 * Sendes til `useFonts`. Nøglerne skal matche navnene i `fonts` ovenfor.
 * Importeres per vægt, så kun de fire filer havner i bundlet.
 */
export const fontAssets = {
  Fraunces_700Bold,
  Fraunces_600SemiBold,
  Inter_400Regular,
  Inter_600SemiBold,
};
