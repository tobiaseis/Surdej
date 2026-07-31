import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, layout, radius, spacing } from '../theme';

export type SegmentedOption<T> = {
  label: string;
  value: T;
};

interface SegmentedProps<T> {
  options: SegmentedOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Vandret valgknap-række til gensidigt udelukkende valg. */
export function Segmented<T extends string | number>({ options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {/*
              Længere labels ("Klassisk 75 %", "Normalt 21°C") brød til to
              linjer og gjorde hele rækken høj og skæv. Skaler i stedet ned.
            */}
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textSub,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.onPrimary,
  },
});
