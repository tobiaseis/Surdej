import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';

const mockDiaryEntries = [
  {
    id: '1',
    recipeName: 'Surdejsboller',
    date: '28. maj',
    temp: '21°C',
    rating: '4/5',
    note: 'God hævning, men lidt tæt krumme.'
  },
  {
    id: '2',
    recipeName: 'Grydebrød',
    date: '14. maj',
    temp: '23°C',
    rating: '5/5',
    note: 'Perfekt ovnspring! Dejen føltes rigtig god under foldningerne.'
  }
];

export const DiaryScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Dagbog</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Dine tidligere bagninger og noter.</Text>

        {mockDiaryEntries.map((entry) => (
          <TouchableOpacity key={entry.id} activeOpacity={0.8}>
            <Card style={styles.entryCard}>
              <View style={styles.cardHeader}>
                <Text style={typography.h3}>{entry.recipeName}</Text>
                <StatusBadge label={entry.date} status="info" />
              </View>
              
              <View style={styles.metaRow}>
                <Text style={typography.bodySmall}>{entry.temp}</Text>
                <View style={styles.dot} />
                <Text style={typography.bodySmall}>Rating {entry.rating}</Text>
              </View>
              
              <Text style={[typography.body, { fontStyle: 'italic', color: colors.textSub }]}>
                "{entry.note}"
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
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
    padding: 24,
  },
  entryCard: {
    marginBottom: 16,
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
  }
});
