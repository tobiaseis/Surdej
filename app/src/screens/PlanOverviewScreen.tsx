import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import type { Recipe } from '../data/recipes';
import { calculateSchedule, getEarliestTargetEndTime, isTargetEndTimeFeasible } from '../utils/scheduleCalculator';
import { useBakeStore } from '../store/bakeStore';

export const PlanOverviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { startBake } = useBakeStore();
  
  const recipe = route.params?.recipe as Recipe | undefined;
  const targetTimeIso = route.params?.targetTime;
  const targetTime = targetTimeIso ? new Date(targetTimeIso) : null;
  const canCreatePlan = recipe && targetTime ? isTargetEndTimeFeasible(recipe, targetTime) : false;
  const earliestTarget = recipe ? getEarliestTargetEndTime(recipe) : null;

  // Vi udregner planen asynkront eller via memo for ikke at låse UI
  const calculatedPlan = useMemo(() => {
    if (!recipe || !targetTimeIso) return null;
    if (!canCreatePlan || !targetTime) return null;
    return calculateSchedule(recipe, targetTime);
  }, [canCreatePlan, recipe, targetTime, targetTimeIso]);

  if (!recipe || !targetTimeIso) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={typography.h2}>Kunne ikke beregne plan.</Text>
      </SafeAreaView>
    );
  }

  if (!calculatedPlan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={typography.h2}>Tidspunktet er for tidligt.</Text>
          {earliestTarget && (
            <Text style={typography.body}>
              VÃ¦lg tidligst {earliestTarget.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const handleStartPlan = () => {
    startBake(recipe, new Date(targetTimeIso));
    // Naviger tilbage til Hjem (som nu vil vise den aktive bagning)
    navigation.navigate('Hjem');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Din bageplan er klar</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>
          {recipe.name} er planlagt til {new Date(targetTimeIso).toLocaleString([], { weekday: 'long', hour: '2-digit', minute:'2-digit' })}.
        </Text>

        <View style={styles.timeline}>
          {calculatedPlan.steps.map((step, index) => {
            const isLast = index === calculatedPlan.steps.length - 1;
            return (
              <View key={step.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <Text style={[typography.bodySmall, { fontWeight: '600' }]}>
                    {step.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.timelineCenter}>
                  <View style={styles.dot} />
                  {!isLast && <View style={styles.line} />}
                </View>
                <View style={styles.timelineRight}>
                  <Text style={typography.h3}>{step.title}</Text>
                  <Text style={typography.bodySmall}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <Button 
          title="Start bageplan" 
          onPress={handleStartPlan} 
        />
      </View>
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
    paddingBottom: 100, // Make room for bottom bar
  },
  timeline: {
    marginTop: 16,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 2,
  },
  timelineCenter: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 6,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: -6,
    marginBottom: -6,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 32,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
