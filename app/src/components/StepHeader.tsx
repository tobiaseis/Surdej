import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';

/**
 * Bageflowets fire trin. Rækkefølgen er selve flowet, så listen ligger her og
 * ikke spredt ud over skærmene.
 */
export const FLOW_STEPS = ['Fodr surdej', 'Vis opskrifter', 'Vælg opskrift', 'Gå i gang'] as const;

export type FlowStep = 1 | 2 | 3 | 4;

interface StepHeaderProps {
  step: FlowStep;
  /**
   * Titel på trinnet. Standard er navnet fra `FLOW_STEPS` – sæt den kun, når
   * skærmen dækker et trin under et andet navn.
   */
  title?: string;
}

/**
 * Viser hvor i bageplanen man er. Uden den ligner flowets fire skærme fire
 * løsrevne sider, og det er ikke tydeligt, at fodringen er begyndelsen på en
 * plan frem for et opslagsværktøj.
 */
export const StepHeader = ({ step, title }: StepHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.bars}>
      {FLOW_STEPS.map((label, index) => (
        <View key={label} style={[styles.bar, index < step && styles.barDone]} />
      ))}
    </View>
    <Text style={styles.label}>
      Trin {step} af {FLOW_STEPS.length} · {title ?? FLOW_STEPS[step - 1]}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  bars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  barDone: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.label,
    fontFamily: fonts.sansSemiBold,
    marginTop: spacing.sm,
  },
});
