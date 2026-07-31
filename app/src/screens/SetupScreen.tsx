import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../theme';
import { BottomBar, Button, Card, Screen, Segmented, SegmentedOption } from '../components';
import type { RecipeStackScreenProps } from '../navigation/types';
import {
  StarterStrength,
  getDefaultTargetEndTime,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { formatDateTime, formatShortDate, formatTime, mergeDatePart, mergeTimePart } from '../utils/dateTime';
import { useSettingsStore } from '../store/settingsStore';

const TEMP_OPTIONS: SegmentedOption<number>[] = [
  { label: 'Køligt 18°C', value: 18 },
  { label: 'Normalt 21°C', value: 21 },
  { label: 'Varmt 25°C', value: 25 },
];

const STARTER_OPTIONS: SegmentedOption<StarterStrength>[] = [
  { label: 'Meget aktiv', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Langsom', value: 'slow' },
];

const getFallbackTargetEndTime = () => {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
};

export const SetupScreen = ({ navigation, route }: RecipeStackScreenProps<'SetupOpskrift'>) => {
  const recipe = route.params?.recipe;

  const defaultRoomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const defaultStarterStrength = useSettingsStore((state) => state.defaultStarterStrength);

  const [roomTempC, setRoomTempC] = useState(defaultRoomTempC);
  const [starterStrength, setStarterStrength] = useState<StarterStrength>(defaultStarterStrength);

  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

  const [date, setDate] = useState(() => (
    recipe ? getDefaultTargetEndTime(recipe, new Date(), { roomTempC: 21, starterStrength: 'normal' }) : getFallbackTargetEndTime()
  ));

  const canCreatePlan = recipe ? isTargetEndTimeFeasible(recipe, date, new Date(), options) : false;
  const earliestTarget = recipe ? getEarliestTargetEndTime(recipe, new Date(), options) : null;

  const onChange = (_event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const openAndroidPicker = (mode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value: date,
      mode,
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        setDate((currentDate) => (
          mode === 'date'
            ? mergeDatePart(currentDate, selectedDate)
            : mergeTimePart(currentDate, selectedDate)
        ));
      },
    });
  };

  return (
    <>
      <Screen withBottomBar>
        <Text style={typography.h1}>Hvornår skal det være klar?</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Vælg hvornår du vil spise, så regner vi resten ud.
        </Text>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Vælg dato og tid</Text>
          {Platform.OS === 'android' && (
            <>
              <Button
                title={`Dato: ${formatShortDate(date)}`}
                onPress={() => openAndroidPicker('date')}
                variant="outline"
                style={{ marginTop: spacing.md }}
              />
              <Button
                title={`Tid: ${formatTime(date)}`}
                onPress={() => openAndroidPicker('time')}
                variant="outline"
                style={{ marginTop: spacing.md }}
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
              onChange={onChange}
              textColor={colors.textMain}
            />
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Rumtemperatur</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>
            Ved lavere temperatur får dejen længere hævetid.
          </Text>
          <Segmented options={TEMP_OPTIONS} selected={roomTempC} onSelect={setRoomTempC} />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Surdejens styrke</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>
            En meget aktiv surdej hæver hurtigere – en langsom tager længere tid.
          </Text>
          <Segmented options={STARTER_OPTIONS} selected={starterStrength} onSelect={setStarterStrength} />
        </Card>

        {!canCreatePlan && earliestTarget && (
          <Card style={styles.warningCard}>
            <Text style={[typography.h3, { color: colors.warning }]}>Tidspunktet er for tidligt</Text>
            <Text style={typography.bodySmall}>
              Vælg tidligst {formatDateTime(earliestTarget)}, så første trin ikke starter i fortiden.
            </Text>
          </Card>
        )}
      </Screen>

      <BottomBar>
        <Button
          title="Lav bageplan"
          disabled={!canCreatePlan}
          onPress={() => {
            if (!recipe || !canCreatePlan) return;
            navigation.navigate('PlanOversigt', {
              recipe,
              targetTime: date.toISOString(),
              roomTempC,
              starterStrength,
            });
          }}
        />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    marginBottom: spacing.lg,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
});
