import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, layout, radius, spacing, typography } from '../theme';

interface RatingScaleProps {
  label: string;
  /** 0 betyder "ikke bedømt endnu". */
  value: number;
  onChange: (value: number) => void;
  max?: number;
  caption?: string;
}

/** Flest trin pr. række. Derover brydes skalaen, så felterne kan nås. */
const MAX_PER_ROW = 5;

const chunk = (steps: number[], size: number) =>
  steps.reduce<number[][]>((rows, step, index) => {
    if (index % size === 0) rows.push([]);
    rows[rows.length - 1].push(step);
    return rows;
  }, []);

/**
 * Bedømmelsesskala hvor alle trin op til det valgte fyldes ud. Bruges både
 * til 1-5 (bagning) og 1-10 (kaffe). Lange skalaer brydes over flere rækker
 * i stedet for at presses sammen: ti felter på én række gav omkring 25pt pr.
 * felt, altså under det halve af den mindste anbefalede trykflade.
 */
export const RatingScale = ({ label, value, onChange, max = 5, caption }: RatingScaleProps) => {
  const steps = Array.from({ length: max }, (_, index) => index + 1);
  const rows = chunk(steps, MAX_PER_ROW);

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      {caption ? <Text style={[typography.bodySmall, styles.caption]}>{caption}</Text> : null}

      <View style={styles.rows}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((step) => {
              const isActive = step <= value;
              return (
                <TouchableOpacity
                  key={step}
                  style={[styles.cell, isActive && styles.cellActive]}
                  onPress={() => onChange(step)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${step} af ${max}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.text, isActive && styles.textActive]}>{step}</Text>
                </TouchableOpacity>
              );
            })}
            {/* Holder en delvist fyldt sidste række lige så bred som de øvrige. */}
            {Array.from({ length: MAX_PER_ROW - row.length }, (_, index) => (
              <View key={`filler-${index}`} style={styles.filler} />
            ))}
          </View>
        ))}
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
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    height: layout.minTouchTarget + spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filler: {
    flex: 1,
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
  textActive: {
    color: colors.onPrimary,
  },
});
