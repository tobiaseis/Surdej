import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';

interface RatingScaleProps {
  label: string;
  /** 0 betyder "ikke bedømt endnu". */
  value: number;
  onChange: (value: number) => void;
  max?: number;
  caption?: string;
}

/**
 * Bedømmelsesskala hvor alle trin op til det valgte fyldes ud. Bruges både
 * til 1-5 (bagning) og 1-10 (kaffe) – ved de lange skalaer bliver felterne
 * lavere, så de kan være på én række.
 */
export const RatingScale = ({ label, value, onChange, max = 5, caption }: RatingScaleProps) => {
  const compact = max > 5;

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      {caption ? <Text style={[typography.bodySmall, styles.caption]}>{caption}</Text> : null}

      <View style={[styles.row, compact && styles.rowCompact]}>
        {Array.from({ length: max }, (_, index) => index + 1).map((step) => {
          const isActive = step <= value;
          return (
            <TouchableOpacity
              key={step}
              style={[
                styles.cell,
                compact ? styles.cellCompact : styles.cellSquare,
                isActive && styles.cellActive,
              ]}
              onPress={() => onChange(step)}
              activeOpacity={0.94}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${step} af ${max}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[styles.text, compact && styles.textCompact, isActive && styles.textActive]}
              >
                {step}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMain,
    marginBottom: spacing.sm,
  },
  caption: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowCompact: {
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSquare: {
    aspectRatio: 1,
  },
  cellCompact: {
    height: 44,
  },
  cellActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.textSub,
  },
  textCompact: {
    fontSize: 13,
  },
  textActive: {
    color: colors.onPrimary,
  },
});
