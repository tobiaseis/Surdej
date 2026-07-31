import { ViewStyle } from 'react-native';
import { colors } from './colors';

/** Blød skygge til hævede flader. `elevation` dækker Android. */
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
};
