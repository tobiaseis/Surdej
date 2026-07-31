import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '../theme';
import { BottomBar, Button, Card, Screen, StatusBadge } from '../components';
import type { BadgeTone } from '../components/StatusBadge';
import { COFFEE_RATING_MAX, CoffeeEntry, fetchCoffeeEntries } from '../data/coffee';
import { formatIsoDate, formatMinutesSeconds } from '../utils/dateTime';
import { formatDecimal } from '../utils/formatNumber';
import type { CoffeeStackScreenProps } from '../navigation/types';

/** En god kop skal kunne ses på afstand i listen. */
const ratingTone = (rating: number): BadgeTone => {
  if (rating >= 8) return 'positive';
  if (rating >= 5) return 'accent';
  return 'warning';
};

/** "18 g · 2:30 · 18 klik" – kun de felter der er udfyldt. */
const formatBrewMeta = (entry: CoffeeEntry) =>
  [
    entry.doseGrams !== null ? `${formatDecimal(entry.doseGrams)} g` : null,
    entry.brewSeconds ? formatMinutesSeconds(entry.brewSeconds) : null,
    entry.grindSize ? `Kværn ${entry.grindSize}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

export const CoffeeScreen = ({ navigation }: CoffeeStackScreenProps<'KaffeListe'>) => {
  const [entries, setEntries] = useState<CoffeeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    const result = await fetchCoffeeEntries();
    if (!isActive()) return;
    setEntries(result.entries);
    setFailed(result.failed);
    setLoading(false);
  }, []);

  // Listen hentes igen, når skærmen kommer i fokus, så et nyt bryg er med.
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
    <>
      <Screen withBottomBar>
        <Text style={typography.h1}>Kaffe</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Dine bryg med dosering, løbetid og kværn – så du kan ramme den gode kop igen.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : failed ? (
          <Card>
            <Text style={[typography.h3, { marginBottom: spacing.sm, color: colors.warning }]}>
              Kunne ikke hente kaffedagbogen
            </Text>
            <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
              Tjek din internetforbindelse. Dine gemte bryg er der stadig – de kunne bare ikke hentes lige nu.
            </Text>
            <Button title="Prøv igen" variant="outline" onPress={() => load()} />
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Ingen bryg endnu</Text>
            <Text style={typography.bodySmall}>
              Gem dit første bryg, så kan du se hvilken dosering, løbetid og kværnindstilling der gav den
              bedste kop.
            </Text>
          </Card>
        ) : (
          entries.map((entry) => {
            const meta = formatBrewMeta(entry);
            return (
              <Card key={entry.id} style={styles.entryCard}>
                {entry.imageUrl ? (
                  <Image source={{ uri: entry.imageUrl }} style={styles.entryImage} resizeMode="cover" />
                ) : null}

                <View style={styles.cardHeader}>
                  <View style={styles.headerText}>
                    <Text style={typography.h3}>{entry.beans || 'Bryg'}</Text>
                    <Text style={typography.bodySmall}>{formatIsoDate(entry.createdAt)}</Text>
                  </View>
                  {entry.rating ? (
                    <StatusBadge
                      label={`${entry.rating}/${COFFEE_RATING_MAX}`}
                      tone={ratingTone(entry.rating)}
                    />
                  ) : null}
                </View>

                {meta ? <Text style={[typography.bodySmall, styles.meta]}>{meta}</Text> : null}

                {entry.note ? (
                  <Text style={[typography.body, { fontStyle: 'italic', color: colors.textSub }]}>
                    "{entry.note}"
                  </Text>
                ) : null}
              </Card>
            );
          })
        )}
      </Screen>

      <BottomBar>
        <Button title="Tilføj bryg" onPress={() => navigation.navigate('KaffeNy')} />
      </BottomBar>
    </>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  meta: {
    marginBottom: spacing.md,
    color: colors.textMain,
  },
});
