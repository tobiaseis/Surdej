import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '../theme';
import { Button, Card, Screen, StatusBadge } from '../components';
import { fetchDiaryEntries, DiaryEntry } from '../data/diary';
import { formatDurationMinutes, formatIsoDate } from '../utils/dateTime';
import { DiaryRecipe, formatBakeConditions } from '../utils/diaryRecipe';

const formatRating = (crumb: number | null, taste: number | null) => {
  const parts: string[] = [];
  if (crumb) parts.push(`Krumme ${crumb}/5`);
  if (taste) parts.push(`Smag ${taste}/5`);
  return parts.join(' · ');
};

/**
 * Hele opskriften som den blev bagt. Foldet sammen som standard, så listen
 * stadig kan skimmes – det er først når hun vil bage den igen, at trinnene
 * er interessante.
 */
const SavedRecipe = ({ recipe }: { recipe: DiaryRecipe }) => {
  const conditions = formatBakeConditions(recipe);

  return (
    <View style={styles.recipeBlock}>
      {(recipe.yield || conditions) && (
        <Text style={[typography.bodySmall, styles.recipeMeta]}>
          {[recipe.yield, conditions].filter(Boolean).join(' · ')}
        </Text>
      )}

      {recipe.ingredients.length > 0 && (
        <>
          <Text style={[typography.label, styles.recipeHeading]}>Ingredienser</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={typography.bodySmall}>
              • {ingredient}
            </Text>
          ))}
        </>
      )}

      {recipe.tools.length > 0 && (
        <>
          <Text style={[typography.label, styles.recipeHeading]}>Du skal bruge</Text>
          <Text style={typography.bodySmall}>{recipe.tools.join(', ')}</Text>
        </>
      )}

      {recipe.steps.length > 0 && (
        <>
          <Text style={[typography.label, styles.recipeHeading]}>Fremgangsmåde</Text>
          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <Text style={typography.bodySmall}>
                {index + 1}. {step.title} · {formatDurationMinutes(step.durationMinutes)}
              </Text>
              {step.description ? (
                <Text style={[typography.bodySmall, styles.stepDescription]}>{step.description}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

export const DiaryScreen = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    const result = await fetchDiaryEntries();
    if (!isActive()) return;
    setEntries(result.entries);
    setFailed(result.failed);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load(() => active);
      return () => {
        active = false;
      };
    }, [load])
  );

  return (
    <Screen>
      <Text style={typography.h1}>Dagbog</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>Dine tidligere bagninger og noter.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : failed ? (
        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.sm, color: colors.warning }]}>
            Kunne ikke hente dagbogen
          </Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
            Tjek din internetforbindelse. Dine gemte bagninger er der stadig – de kunne bare ikke hentes lige nu.
          </Text>
          <Button title="Prøv igen" variant="outline" onPress={() => load()} />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Ingen bagninger endnu</Text>
          <Text style={typography.bodySmall}>
            Når du har gennemført en bageplan, kan du gemme resultatet her og sammenligne dine forsøg over tid.
          </Text>
        </Card>
      ) : (
        entries.map((entry) => {
          const ratingText = formatRating(entry.crumbRating, entry.tasteRating);
          const isExpanded = expandedId === entry.id;
          return (
            <Card key={entry.id} style={styles.entryCard}>
              {entry.imageUrl ? (
                <Image source={{ uri: entry.imageUrl }} style={styles.entryImage} resizeMode="cover" />
              ) : null}
              <View style={styles.cardHeader}>
                <Text style={typography.h3}>{entry.recipeName}</Text>
                <StatusBadge label={formatIsoDate(entry.createdAt)} tone="neutral" />
              </View>

              {(entry.temp || ratingText) && (
                <View style={styles.metaRow}>
                  {entry.temp ? <Text style={typography.bodySmall}>{entry.temp}</Text> : null}
                  {entry.temp && ratingText ? <View style={styles.dot} /> : null}
                  {ratingText ? <Text style={typography.bodySmall}>{ratingText}</Text> : null}
                </View>
              )}

              {entry.note ? (
                <Text style={[typography.body, { fontStyle: 'italic', color: colors.textSub }]}>"{entry.note}"</Text>
              ) : null}

              {entry.recipe ? (
                <>
                  {isExpanded && <SavedRecipe recipe={entry.recipe} />}
                  <Button
                    title={isExpanded ? 'Skjul opskrift' : 'Vis opskrift'}
                    variant="outline"
                    style={{ marginTop: spacing.lg }}
                    onPress={() => setExpandedId(isExpanded ? null : entry.id)}
                  />
                </>
              ) : (
                <Text style={[typography.bodySmall, styles.noRecipe]}>
                  Opskriften blev ikke gemt med dette indlæg.
                </Text>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  entryCard: {
    marginBottom: spacing.lg,
  },
  entryImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSub,
    marginHorizontal: spacing.sm,
  },
  recipeBlock: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recipeMeta: {
    marginBottom: spacing.sm,
  },
  recipeHeading: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.textMain,
  },
  stepRow: {
    marginBottom: spacing.sm,
  },
  stepDescription: {
    marginLeft: spacing.md,
  },
  noRecipe: {
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
