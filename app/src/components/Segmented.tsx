import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

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
            activeOpacity={0.94}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
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
    paddingVertical: spacing.md,
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
