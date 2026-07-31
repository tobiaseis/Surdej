import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { formatDecimal } from '../utils/formatNumber';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Hvor meget ét tryk ændrer værdien. */
  step?: number;
  min?: number;
  max?: number;
  /** Vises efter tallet, fx "%" eller " g". */
  suffix?: string;
  /** Antal decimaler i visningen – fx 1 til saltprocenter. */
  decimals?: number;
  caption?: string;
}

/**
 * Plus/minus-vælger til tal. Bruges frem for et tastatur-felt, fordi
 * værdierne justeres i små spring, og fordi den ikke kan ende i en tom
 * eller ugyldig tilstand.
 */
export const Stepper = ({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  suffix = '',
  decimals = 0,
  caption,
}: StepperProps) => {
  // Afrunding efter hvert spring, så 0.1-trin ikke ender som 2.0000000000000004.
  const shift = (direction: 1 | -1) => {
    const next = Number((value + direction * step).toFixed(decimals));
    onChange(Math.min(max, Math.max(min, next)));
  };

  const renderButton = (direction: 1 | -1, disabled: boolean) => {
    const Icon = direction === 1 ? Plus : Minus;
    return (
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => shift(direction)}
        disabled={disabled}
        activeOpacity={0.94}
        accessibilityRole="button"
        accessibilityLabel={`${direction === 1 ? 'Forøg' : 'Sænk'} ${label}`}
      >
        <Icon color={disabled ? colors.textSub : colors.primary} size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      {caption ? <Text style={[typography.bodySmall, styles.caption]}>{caption}</Text> : null}

      <View style={styles.row}>
        {renderButton(-1, value <= min)}
        <Text style={styles.value} accessibilityLabel={`${label}: ${value}${suffix}`}>
          {formatDecimal(value, decimals)}
          {suffix}
        </Text>
        {renderButton(1, value >= max)}
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
  },
  caption: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  value: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansSemiBold,
    fontSize: 20,
    color: colors.textMain,
  },
});
