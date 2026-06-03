import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { fetchDiaryEntries, DiaryEntry } from '../data/diary';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long' });
  } catch {
    return iso;
  }
};

const formatRating = (crumb: number | null, taste: number | null) => {
  const parts: string[] = [];
  if (crumb) parts.push(`Krumme ${crumb}/5`);
  if (taste) parts.push(`Smag ${taste}/5`);
  return parts.join(' · ');
};

export const DiaryScreen = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const data = await fetchDiaryEntries();
        if (active) {
          setEntries(data);
          setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Dagbog</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Dine tidligere bagninger og noter.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <Card>
            <Text style={[typography.h3, { marginBottom: 8 }]}>Ingen bagninger endnu</Text>
            <Text style={typography.bodySmall}>
              Når du har gennemført en bageplan, kan du gemme resultatet her og sammenligne dine forsøg over tid.
            </Text>
          </Card>
        ) : (
          entries.map((entry) => {
            const ratingText = formatRating(entry.crumbRating, entry.tasteRating);
            return (
              <Card key={entry.id} style={styles.entryCard}>
                {entry.imageUrl ? (
                  <Image source={{ uri: entry.imageUrl }} style={styles.entryImage} resizeMode="cover" />
                ) : null}
                <View style={styles.cardHeader}>
                  <Text style={typography.h3}>{entry.recipeName}</Text>
                  <StatusBadge label={formatDate(entry.createdAt)} status="info" />
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
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  entryCard: {
    marginBottom: 16,
  },
  entryImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSub,
    marginHorizontal: 8,
  },
});
