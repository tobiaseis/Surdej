import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  caption?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** Til fx to felter side om side i en række. */
  style?: StyleProp<ViewStyle>;
}

/** Tekstfelt med label. Samler feltets udseende ét sted for alle formularer. */
export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  caption,
  multiline = false,
  keyboardType,
  maxLength,
  style,
}: TextFieldProps) => (
  <View style={[styles.container, style]}>
    <Text style={[typography.label, styles.label]}>{label}</Text>
    {caption ? <Text style={[typography.bodySmall, styles.caption]}>{caption}</Text> : null}
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSub}
      multiline={multiline}
      keyboardType={keyboardType}
      maxLength={maxLength}
      accessibilityLabel={label}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  caption: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMain,
    backgroundColor: colors.background,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
