import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 8,
  } as TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 8,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
    marginBottom: 4,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textMain,
    lineHeight: 24,
  } as TextStyle,
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSub,
    lineHeight: 20,
  } as TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  } as TextStyle,
};
