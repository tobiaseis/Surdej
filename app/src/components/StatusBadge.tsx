import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, typography } from '../theme';

/**
 * Badges er rent visuelle. Tidligere hed varianterne efter tilstande
 * ('completed', 'delayed'), hvilket førte til at fx sværhedsgraden "Svær"
 * blev vist i grøn "udført"-farve.
 */
export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'warning';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

const BACKGROUNDS: Record<BadgeTone, string> = {
  neutral: colors.border,
  accent: colors.secondary,
  positive: colors.success,
  warning: colors.warning,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => (
  <View style={[styles.badge, { backgroundColor: BACKGROUNDS[tone] }]}>
    <Text style={[styles.badgeText, { color: tone === 'neutral' ? colors.textMain : colors.onPrimary }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeText: {
    ...typography.bodySmall,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
  },
});
