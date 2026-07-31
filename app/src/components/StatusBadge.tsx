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

/**
 * Tekstfarven vælges pr. tone, ikke efter et enkelt undtagelsestilfælde.
 * Hvid på den lyse `secondary` gav kun 2,3:1 og faldt igennem WCAG AA –
 * mørk tekst på samme flade giver 6,3:1.
 */
const FOREGROUNDS: Record<BadgeTone, string> = {
  neutral: colors.textMain,
  accent: colors.textMain,
  positive: colors.onPrimary,
  warning: colors.onPrimary,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => (
  <View style={[styles.badge, { backgroundColor: BACKGROUNDS[tone] }]}>
    <Text style={[styles.badgeText, { color: FOREGROUNDS[tone] }]}>{label}</Text>
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
