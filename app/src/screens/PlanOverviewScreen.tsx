import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { colors, layout, spacing, typography } from '../theme';
import { BackButton, BottomBar, Button, Card, Screen, Timeline } from '../components';
import {
  ScheduleOptions,
  calculateSchedule,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { useBakeStore } from '../store/bakeStore';
import { requestNotificationPermission } from '../utils/notifications';
import { formatDateTime, formatWeekdayTime } from '../utils/dateTime';
import type { RecipeStackScreenProps } from '../navigation/types';

export const PlanOverviewScreen = ({ navigation, route }: RecipeStackScreenProps<'PlanOversigt'>) => {
  const { startBake } = useBakeStore();

  const { recipe, targetTime: targetTimeIso, roomTempC, starterStrength } = route.params;
  const options = useMemo<ScheduleOptions>(
    () => ({ roomTempC, starterStrength }),
    [roomTempC, starterStrength]
  );

  const targetTime = targetTimeIso ? new Date(targetTimeIso) : null;
  const canCreatePlan = recipe && targetTime ? isTargetEndTimeFeasible(recipe, targetTime, new Date(), options) : false;
  const earliestTarget = recipe ? getEarliestTargetEndTime(recipe, new Date(), options) : null;

  const [permissionVisible, setPermissionVisible] = useState(false);

  const calculatedPlan = useMemo(() => {
    if (!recipe || !targetTimeIso || !canCreatePlan) return null;
    return calculateSchedule(recipe, new Date(targetTimeIso), options);
  }, [canCreatePlan, recipe, targetTimeIso, options]);

  if (!recipe || !targetTimeIso) {
    return (
      <Screen scroll={false}>
        <BackButton />
        <Text style={typography.h2}>Kunne ikke beregne plan.</Text>
      </Screen>
    );
  }

  if (!calculatedPlan) {
    return (
      <Screen scroll={false}>
        <BackButton />
        <Text style={typography.h2}>Tidspunktet er for tidligt.</Text>
        {earliestTarget && (
          <Text style={typography.body}>Vælg tidligst {formatDateTime(earliestTarget)}.</Text>
        )}
      </Screen>
    );
  }

  const activateBake = () => {
    startBake(recipe, new Date(targetTimeIso), options);
    navigation.navigate('Hjem');
  };

  return (
    <>
      <Screen withBottomBar>
        <BackButton />
        <Text style={typography.h1}>Din bageplan er klar</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          {recipe.name} er planlagt til {formatWeekdayTime(new Date(targetTimeIso))}.
        </Text>

        <Timeline steps={calculatedPlan.steps} />
      </Screen>

      <BottomBar>
        <Button title="Start bageplan" onPress={() => setPermissionVisible(true)} />
      </BottomBar>

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
              variant="ghost"
              style={{ marginTop: spacing.md }}
              onPress={() => {
                setPermissionVisible(false);
                activateBake();
              }}
            />
          </Card>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: layout.screenPaddingHorizontal,
  },
  modalCard: {
    marginBottom: 0,
  },
});
