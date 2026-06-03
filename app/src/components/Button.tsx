import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const getBackground = () => {
    if (disabled) return colors.border;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.secondary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.textSub;
    if (variant === 'outline') return colors.primary;
    return '#FFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackground() },
        variant === 'outline' && styles.outline,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[typography.button, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
