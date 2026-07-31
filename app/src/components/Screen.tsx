import React from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  /**
   * Sæt til false for korte skærme (fx fejltilstande), der ikke skal kunne
   * scrolle. Indholdet får så et almindeligt View med samme padding.
   */
  scroll?: boolean;
  /**
   * Giver ekstra frihøjde i bunden, så en fastgjort <BottomBar> ikke dækker
   * det sidste indhold.
   */
  withBottomBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Fælles skærmramme: sikker margen, baggrundsfarve og standard-padding.
 * Erstatter den `safeArea`/`container`-styleblok, hver skærm havde sin egen af.
 */
export const Screen = ({ children, scroll = true, withBottomBar = false, contentStyle }: ScreenProps) => {
  const padding = [styles.content, withBottomBar && styles.contentWithBottomBar, contentStyle];

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView contentContainerStyle={padding}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  /** Uden scroll fylder indholdet skærmen, så fx footer kan ligge i bunden. */
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
  },
  contentWithBottomBar: {
    paddingBottom: layout.bottomBarClearance,
  },
});
