import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, layout, spacing, typography } from '../theme';
import {
  BackButton,
  BottomBar,
  Button,
  Card,
  Screen,
  StepHeader,
  Timeline,
} from '../components';
import {
  calculateSchedule,
  getDefaultTargetEndTime,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { formatFeedAmounts, getEndTimeFromFeed, withFeedStep } from '../utils/bakePlan';
import { formatRatio } from '../utils/starterFeed';
import { useBakeStore } from '../store/bakeStore';
import { requestNotificationPermission } from '../utils/notifications';
import {
  formatDateTime,
  formatShortDate,
  formatTime,
  formatWeekdayTime,
  mergeDatePart,
  mergeTimePart,
} from '../utils/dateTime';
import type { HomeStackScreenProps } from '../navigation/types';

/**
 * Bageflowets sidste trin. Fodringen ligger fast fra trin 1, så her mangler
 * kun tidspunktet – og det kan gribes an fra begge ender:
 *
 * - Fodrer hun nu, regnes planen forlæns, og skærmen svarer på "hvornår er det færdigt?".
 * - Fodrer hun senere, vælger hun hvornår det skal være klar, og skærmen
 *   svarer på "hvornår skal jeg fodre?".
 */
export const GoBakeScreen = ({ navigation, route }: HomeStackScreenProps<'GaaIGang'>) => {
  const { recipe, flow } = route.params;
  const { startBake } = useBakeStore();

  const options = useMemo(
    () => ({ roomTempC: flow.roomTempC, starterStrength: flow.starterStrength }),
    [flow.roomTempC, flow.starterStrength]
  );

  const planRecipe = useMemo(() => withFeedStep(recipe, flow.feed), [recipe, flow.feed]);
  const feedsNow = !!flow.fedAt;

  // "Nu" flytter sig, mens skærmen er åben. Både den forlæns plan og
  // vurderingen af, om et valgt tidspunkt kan nås, skal følge med.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const [date, setDate] = useState(() => getDefaultTargetEndTime(planRecipe, new Date(), options));

  // Fodrer hun nu, er sluttidspunktet ikke et valg – det falder ud af planen.
  const targetEndTime = useMemo(
    () => (feedsNow ? getEndTimeFromFeed(recipe, flow.feed, now, options) : date),
    [feedsNow, recipe, flow.feed, now, date, options]
  );

  // En plan, der regnes forlæns fra fodringen, kan altid nås.
  const canCreatePlan = feedsNow || isTargetEndTimeFeasible(planRecipe, targetEndTime, now, options);

  const plan = useMemo(
    () => (canCreatePlan ? calculateSchedule(planRecipe, targetEndTime, options) : null),
    [canCreatePlan, planRecipe, targetEndTime, options]
  );

  const [permissionVisible, setPermissionVisible] = useState(false);

  const openAndroidPicker = (mode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value: date,
      mode,
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        setDate((current) =>
          mode === 'date' ? mergeDatePart(current, selectedDate) : mergeTimePart(current, selectedDate)
        );
      },
    });
  };

  const activateBake = () => {
    // Fodrer hun nu, låses tidspunktet først her – ikke da trin 1 blev
    // forladt – så første trin i planen starter, når knappen trykkes.
    const endTime = feedsNow ? getEndTimeFromFeed(recipe, flow.feed, new Date(), options) : date;

    startBake(planRecipe, endTime, options);
    navigation.navigate('HomeMain');
  };

  return (
    <>
      <Screen withBottomBar>
        <BackButton />
        <StepHeader step={4} />

        <Text style={typography.h1}>{recipe.name}</Text>
        <Text style={[typography.body, styles.intro]}>
          {feedsNow
            ? 'Du fodrer nu, så planen løber herfra.'
            : 'Vælg hvornår du vil spise, så siger vi hvornår du skal fodre.'}
        </Text>

        {!feedsNow && (
          <Card style={styles.card}>
            <Text style={typography.h3}>Hvornår skal det være klar?</Text>

            {Platform.OS === 'android' && (
              <>
                <Button
                  title={`Dato: ${formatShortDate(date)}`}
                  variant="outline"
                  style={{ marginTop: spacing.md }}
                  onPress={() => openAndroidPicker('date')}
                />
                <Button
                  title={`Tid: ${formatTime(date)}`}
                  variant="outline"
                  style={{ marginTop: spacing.md }}
                  onPress={() => openAndroidPicker('time')}
                />
              </>
            )}

            {Platform.OS === 'ios' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="datetime"
                is24Hour
                display="spinner"
                onChange={(_event, selectedDate) => selectedDate && setDate(selectedDate)}
                textColor={colors.textMain}
              />
            )}
          </Card>
        )}

        {plan ? (
          <>
            <Card style={styles.highlightCard}>
              <Text style={typography.label}>
                {feedsNow ? 'Fodr surdejen nu' : 'Sådan starter du'}
              </Text>
              <Text style={typography.h2}>
                {feedsNow
                  ? `Færdig ${formatWeekdayTime(targetEndTime)}`
                  : `Fodr ${formatWeekdayTime(plan.steps[0].scheduledAt)}`}
              </Text>
              <Text style={typography.body}>
                {formatFeedAmounts(flow.feed)} ({formatRatio(flow.feed.ratio)}).
              </Text>
            </Card>

            <Text style={[typography.h3, styles.timelineTitle]}>Hele planen</Text>
            <Timeline steps={plan.steps} />
          </>
        ) : (
          <Card style={styles.warningCard}>
            <Text style={[typography.h3, { color: colors.warning }]}>Tidspunktet er for tidligt</Text>
            <Text style={typography.bodySmall}>
              Med din fodring skal der bruges mere tid. Vælg tidligst{' '}
              {formatDateTime(getEarliestTargetEndTime(planRecipe, now, options))}.
            </Text>
          </Card>
        )}
      </Screen>

      <BottomBar>
        <Button
          title="Start bageplan"
          disabled={!plan}
          onPress={() => setPermissionVisible(true)}
        />
      </BottomBar>

      <Modal
        visible={permissionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPermissionVisible(false)}
      >
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
  intro: {
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  highlightCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
  timelineTitle: {
    marginBottom: spacing.lg,
  },
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
