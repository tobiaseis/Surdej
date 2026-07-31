import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, radius, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  /**
   * `ghost` er en knap uden ramme til sekundære valg ("Fortryd", "Spring over").
   * `danger` er en rammeknap, hvor både ramme og tekst advarer.
   */
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Partial<Record<ButtonVariant, string>> = {
  primary: colors.primary,
  secondary: colors.secondary,
};

const TEXT_COLORS: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.onPrimary,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.warning,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const background = disabled ? colors.border : BACKGROUNDS[variant] ?? 'transparent';
  const textColor = disabled ? colors.textSub : TEXT_COLORS[variant];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: background },
        variant === 'outline' && styles.outline,
        variant === 'danger' && styles.danger,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        // Én linje med nedskalering frem for ombrydning, så to knapper ved
        // siden af hinanden beholder samme højde på smalle skærme.
        <Text
          style={[typography.button, { color: textColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    // Beskeden sidepadding, så knapper med `flex: 1` side om side stadig har
    // plads til deres tekst. Fuldbredde-knapper påvirkes ikke.
    paddingHorizontal: spacing.md,
    minHeight: layout.minTouchTarget,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
});
