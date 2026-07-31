import { TextStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';
import { spacing } from './spacing';

export const typography = {
  h1: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textMain,
    marginBottom: spacing.sm,
  } as TextStyle,
  h2: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    color: colors.textMain,
    marginBottom: spacing.sm,
  } as TextStyle,
  h3: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    color: colors.textMain,
    marginBottom: spacing.xs,
  } as TextStyle,
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMain,
    lineHeight: 24,
  } as TextStyle,
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSub,
    lineHeight: 20,
  } as TextStyle,
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.onPrimary,
  } as TextStyle,
  /** Fremhævet brødtekst – fx feltlabels og sektionsoverskrifter i kort. */
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textSub,
    lineHeight: 20,
  } as TextStyle,
};
