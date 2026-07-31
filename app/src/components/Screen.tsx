import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
   * det sidste indhold. Brug 'tall' når bjælken rummer to linjer.
   */
  withBottomBar?: boolean | 'tall';
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Fælles skærmramme: sikker margen, baggrundsfarve og standard-padding.
 * Erstatter den `safeArea`/`container`-styleblok, hver skærm havde sin egen af.
 */
export const Screen = ({ children, scroll = true, withBottomBar = false, contentStyle }: ScreenProps) => {
  const padding = [
    styles.content,
    withBottomBar === true && styles.contentWithBottomBar,
    withBottomBar === 'tall' && styles.contentWithTallBottomBar,
    contentStyle,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/*
        Uden denne dækker tastaturet notefelterne nederst i formularerne.
        Android klarer det selv via windowSoftInputMode=adjustResize.
      */}
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={padding}
            // Uden 'handled' bruges det første tryk på en knap på at lukke
            // tastaturet, og brugeren skal trykke to gange for at gemme.
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, padding]}>{children}</View>
        )}
      </KeyboardAvoidingView>
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
    // Holder linjelængden læsbar på tablets i stedet for at strække teksten
    // over hele bredden. Uden effekt på telefoner.
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  contentWithBottomBar: {
    paddingBottom: layout.bottomBarClearance,
  },
  contentWithTallBottomBar: {
    paddingBottom: layout.bottomBarClearanceTall,
  },
});
