import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';
import { Button, Card, Screen } from '../components';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useBakeStore } from '../store/bakeStore';

const ADJUST_MINUTES = 20;

const sosIssues = [
  {
    id: '1',
    title: 'Min dej er for klistret',
    causes: ['For høj hydrering', 'For lidt glutenudvikling', 'Dejen er for varm', 'For kort hviletid'],
    solutions: [
      'Vent 20 minutter',
      'Lav et ekstra sæt foldninger',
      'Brug våde hænder i stedet for mere mel',
      'Sæt dejen køligere, hvis den flyder ud'
    ]
  },
  {
    id: '2',
    title: 'Min surdej hæver ikke',
    causes: ['For koldt', 'For gammelt mel', 'For meget vand i forhold til mel'],
    solutions: [
      'Sæt den et lunere sted (fx oven på køleskabet)',
      'Brug fuldkornsmel eller rugmel ved næste fodring',
      'Fodr den med en smule mindre vand'
    ]
  },
  {
    id: '3',
    title: 'Brødet bliver fladt',
    causes: ['Overhævet', 'For svag glutenstruktur', 'Snittet var for dybt'],
    solutions: [
      'Bag det alligevel - det smager sikkert fint!',
      'Næste gang: Sæt dejen på køl lidt tidligere',
      'Fold dejen en ekstra gang under bulk-hævning'
    ]
  }
];

type Feedback = { issueId: string; message: string; tone: 'success' | 'warning' };

export const SosScreen = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Feedback bindes til det kort, den kom fra, så beskeden ikke dukker op
  // igen under et andet problem.
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { activeBake, delayBake } = useBakeStore();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setFeedback(null);
  };

  const handleAdjustPlan = (issueId: string) => {
    if (!activeBake) {
      setFeedback({
        issueId,
        message: 'Du har ingen aktiv bagning at justere lige nu.',
        tone: 'warning',
      });
      return;
    }
    delayBake(ADJUST_MINUTES);
    setFeedback({
      issueId,
      message: `Vi har givet dejen ${ADJUST_MINUTES} minutter mere. Resten af planen er rykket.`,
      tone: 'success',
    });
  };

  return (
    <Screen>
      <Text style={typography.h1}>Hvad driller?</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>Få hurtig hjælp til de mest almindelige problemer.</Text>

      {sosIssues.map((issue) => {
        const isExpanded = expandedId === issue.id;

        return (
          <TouchableOpacity
            key={issue.id}
            onPress={() => toggleExpand(issue.id)}
            activeOpacity={0.94}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
          >
            <Card style={styles.issueCard}>
              <View style={styles.cardHeader}>
                <Text style={typography.h3}>{issue.title}</Text>
                {isExpanded ? <ChevronUp color={colors.textMain} size={20} /> : <ChevronDown color={colors.textMain} size={20} />}
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <Text style={[typography.bodySmall, styles.sectionLabel]}>Mulige årsager:</Text>
                  {issue.causes.map((cause, idx) => (
                    <Text key={idx} style={[typography.bodySmall, styles.listItem]}>• {cause}</Text>
                  ))}

                  <Text style={[typography.bodySmall, styles.sectionLabel, { marginTop: spacing.lg }]}>Hvad du kan gøre nu:</Text>
                  {issue.solutions.map((solution, idx) => (
                    <Text key={idx} style={[typography.bodySmall, styles.listItem]}>{idx + 1}. {solution}</Text>
                  ))}

                  <Button
                    title="Tilpas min aktuelle plan"
                    variant="outline"
                    style={{ marginTop: spacing.lg }}
                    onPress={() => handleAdjustPlan(issue.id)}
                  />
                  {feedback?.issueId === issue.id && (
                    <Text style={[typography.bodySmall, { marginTop: spacing.md, color: colors[feedback.tone] }]}>
                      {feedback.message}
                    </Text>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  issueCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold,
    marginBottom: spacing.sm,
  },
  listItem: {
    marginBottom: spacing.xs,
  },
});
