import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

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

export const SosScreen = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Hvad driller?</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Få hurtig hjælp til de mest almindelige problemer.</Text>

        {sosIssues.map((issue) => {
          const isExpanded = expandedId === issue.id;
          
          return (
            <TouchableOpacity key={issue.id} onPress={() => toggleExpand(issue.id)} activeOpacity={0.8}>
              <Card style={styles.issueCard}>
                <View style={styles.cardHeader}>
                  <Text style={typography.h3}>{issue.title}</Text>
                  {isExpanded ? <ChevronUp color={colors.textMain} size={20} /> : <ChevronDown color={colors.textMain} size={20} />}
                </View>
                
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={[typography.bodySmall, { fontWeight: '600', marginBottom: 8 }]}>Mulige årsager:</Text>
                    {issue.causes.map((cause, idx) => (
                      <Text key={idx} style={[typography.bodySmall, { marginBottom: 4 }]}>• {cause}</Text>
                    ))}
                    
                    <Text style={[typography.bodySmall, { fontWeight: '600', marginTop: 16, marginBottom: 8 }]}>Hvad du kan gøre nu:</Text>
                    {issue.solutions.map((solution, idx) => (
                      <Text key={idx} style={[typography.bodySmall, { marginBottom: 4 }]}>{idx + 1}. {solution}</Text>
                    ))}

                    <Button 
                      title="Tilpas min aktuelle plan" 
                      variant="outline" 
                      style={{ marginTop: 16 }}
                      onPress={() => {
                        // TODO: Implementer dynamisk justering via bakeStore
                      }}
                    />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}
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
  issueCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
