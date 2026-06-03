import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Recipe } from '../data/recipes';
import {
  ScheduleOptions,
  StarterStrength,
  calculateSchedule,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { useBakeStore } from '../store/bakeStore';
import { requestNotificationPermission } from '../utils/notifications';

export const PlanOverviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { startBake } = useBakeStore();

  const recipe = route.params?.recipe as Recipe | undefined;
  const targetTimeIso = route.params?.targetTime;
  const options: ScheduleOptions = {
    roomTempC: route.params?.roomTempC ?? 21,
    starterStrength: (route.params?.starterStrength as StarterStrength) ?? 'normal',
  };

  const targetTime = targetTimeIso ? new Date(targetTimeIso) : null;
  const canCreatePlan = recipe && targetTime ? isTargetEndTimeFeasible(recipe, targetTime, new Date(), options) : false;
  const earliestTarget = recipe ? getEarliestTargetEndTime(recipe, new Date(), options) : null;

  const [permissionVisible, setPermissionVisible] = useState(false);

  const calculatedPlan = useMemo(() => {
    if (!recipe || !targetTimeIso) return null;
    if (!canCreatePlan || !targetTime) return null;
    return calculateSchedule(recipe, targetTime, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreatePlan, recipe, targetTimeIso, options.roomTempC, options.starterStrength]);

  if (!recipe || !targetTimeIso) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={typography.h2}>Kunne ikke beregne plan.</Text>
        </View>
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
              Vælg tidligst {earliestTarget.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const activateBake = () => {
    startBake(recipe, new Date(targetTimeIso), options);
    navigation.navigate('Hjem');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Din bageplan er klar</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>
          {recipe.name} er planlagt til {new Date(targetTimeIso).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.
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
        <Button title="Start bageplan" onPress={() => setPermissionVisible(true)} />
      </View>

      <Modal visible={permissionVisible} transparent animationType="fade" onRequestClose={() => setPermissionVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text style={typography.h2}>Vil du have påmindelser?</Text>
            <Text style={[typography.body, { marginBottom: 20 }]}>
              Vi giver besked, når det er tid til at fodre, folde, hæve og bage.
            </Text>
            <Button
              title="Ja, mind mig om det"
              onPress={async () => {
                await requestNotificationPermission();
                setPermissionVisible(false);
                activateBake();
              }}
            />
            <Button
              title="Ikke nu"
              variant="outline"
              style={{ marginTop: 12, borderWidth: 0 }}
              onPress={() => {
                setPermissionVisible(false);
                activateBake();
              }}
            />
          </Card>
        </View>
      </Modal>
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
    paddingBottom: 100,
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    marginBottom: 0,
  },
});
