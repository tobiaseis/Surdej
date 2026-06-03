import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Recipe } from '../data/recipes';
import {
  StarterStrength,
  getDefaultTargetEndTime,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { mergeDatePart, mergeTimePart } from '../utils/dateTime';
import { useSettingsStore } from '../store/settingsStore';

const TEMP_OPTIONS: { label: string; value: number }[] = [
  { label: 'Køligt 18°C', value: 18 },
  { label: 'Normalt 21°C', value: 21 },
  { label: 'Varmt 25°C', value: 25 },
];

const STARTER_OPTIONS: { label: string; value: StarterStrength }[] = [
  { label: 'Meget aktiv', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Langsom', value: 'slow' },
];

type SegmentedProps<T> = {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
};

function Segmented<T extends string | number>({ options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.94}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getFallbackTargetEndTime = () => {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
};

export const SetupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe | undefined;

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Hvornår skal det være klar?</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>
          Vælg hvornår du vil spise, så regner vi resten ud.
        </Text>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Vælg dato og tid</Text>
          {Platform.OS === 'android' && (
            <>
              <Button
                title={`Dato: ${date.toLocaleDateString([], { dateStyle: 'medium' })}`}
                onPress={() => openAndroidPicker('date')}
                variant="outline"
                style={{ marginTop: 12 }}
              />
              <Button
                title={`Tid: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                onPress={() => openAndroidPicker('time')}
                variant="outline"
                style={{ marginTop: 12 }}
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
          <Text style={[typography.bodySmall, { marginBottom: 12 }]}>
            Ved lavere temperatur får dejen længere hævetid.
          </Text>
          <Segmented options={TEMP_OPTIONS} selected={roomTempC} onSelect={setRoomTempC} />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Surdejens styrke</Text>
          <Text style={[typography.bodySmall, { marginBottom: 12 }]}>
            En meget aktiv surdej hæver hurtigere – en langsom tager længere tid.
          </Text>
          <Segmented options={STARTER_OPTIONS} selected={starterStrength} onSelect={setStarterStrength} />
        </Card>

        {!canCreatePlan && earliestTarget && (
          <Card style={styles.warningCard}>
            <Text style={[typography.h3, { color: colors.warning }]}>Tidspunktet er for tidligt</Text>
            <Text style={typography.bodySmall}>
              Vælg tidligst {earliestTarget.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}, så første trin ikke starter i fortiden.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 100,
  },
  infoCard: {
    marginBottom: 16,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#FFF',
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
});
