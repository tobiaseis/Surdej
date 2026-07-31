import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, layout } from '../theme';

/**
 * Fastgjort handlingsbjælke i bunden af en skærm. Brug sammen med
 * `<Screen withBottomBar>`, så indholdet ikke skjules bag den.
 */
export const BottomBar = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bar}>{children}</View>
);

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: layout.screenPaddingHorizontal,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
