import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';
import { formatTime } from '../utils/dateTime';
import type { ScheduledStep } from '../utils/scheduleCalculator';

interface TimelineProps {
  steps: ScheduledStep[];
  /**
   * Marker udførte og igangværende trin. Slås fra i forhåndsvisningen af en
   * plan, hvor ingen trin er begyndt endnu, så alle prikker vises ens.
   */
  showStatus?: boolean;
}

/** Lodret tidslinje over bageplanens trin med klokkeslæt til venstre. */
export const Timeline = ({ steps, showStatus = false }: TimelineProps) => (
  <View style={styles.timeline}>
    {steps.map((step, index) => {
      const isLast = index === steps.length - 1;
      const isCompleted = showStatus && step.status === 'completed';
      const isActive = showStatus && step.status === 'active';

      return (
        <View key={step.id} style={styles.row}>
          <View style={styles.left}>
            <Text style={[styles.time, isCompleted && styles.timeCompleted]}>
              {formatTime(step.scheduledAt)}
            </Text>
          </View>

          <View style={styles.center}>
            <View
              style={[
                styles.dot,
                !showStatus && styles.dotUpcoming,
                isCompleted && styles.dotCompleted,
                isActive && styles.dotActive,
              ]}
            />
            {!isLast && <View style={[styles.line, isCompleted && styles.lineCompleted]} />}
          </View>

          <View style={styles.right}>
            <Text style={[typography.h3, isCompleted && styles.titleCompleted]}>{step.title}</Text>
            <Text style={typography.bodySmall}>{step.description}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  timeline: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  left: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: spacing.md,
    paddingTop: 2,
  },
  time: {
    ...typography.bodySmall,
    fontFamily: fonts.sansSemiBold,
    color: colors.textMain,
  },
  timeCompleted: {
    color: colors.success,
  },
  center: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginTop: 6,
    zIndex: 1,
  },
  dotUpcoming: {
    backgroundColor: colors.primary,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: -6,
    marginBottom: -6,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  right: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleCompleted: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
});
