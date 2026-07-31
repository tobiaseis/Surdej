import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts, layout, spacing } from '../theme';

/**
 * Synlig vej tilbage øverst på skærme, der er lagt oven på en anden.
 * Navigatorerne kører uden header, og systemets egen tilbage-gestus er
 * hverken synlig eller tilgængelig på Android, hvor navigationsbjælken er
 * skjult. Placeres øverst, så den kan nås uden at scrolle til bunden.
 */
export const BackButton = ({ label = 'Tilbage' }: { label?: string }) => {
  const navigation = useNavigation();

  if (!navigation.canGoBack()) return null;

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <ChevronLeft color={colors.primary} size={22} />
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
    paddingRight: spacing.md,
    /** Optisk kantjustering: ikonet har selv luft i venstre side. */
    marginLeft: -spacing.xs,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.primary,
  },
});
