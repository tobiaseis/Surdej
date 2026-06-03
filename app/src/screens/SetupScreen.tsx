import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Recipe } from '../data/recipes';
import {
  getDefaultTargetEndTime,
  getEarliestTargetEndTime,
  isTargetEndTimeFeasible,
} from '../utils/scheduleCalculator';
import { mergeDatePart, mergeTimePart } from '../utils/dateTime';

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

  const [date, setDate] = useState(() => (
    recipe ? getDefaultTargetEndTime(recipe) : getFallbackTargetEndTime()
  ));
  const canCreatePlan = recipe ? isTargetEndTimeFeasible(recipe, date) : false;
  const earliestTarget = recipe ? getEarliestTargetEndTime(recipe) : null;

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
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              textColor={colors.textMain}
            />
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={typography.h3}>Rumtemperatur</Text>
          <Text style={typography.bodySmall}>
            Ved lavere temperatur får dejen længere hævetid.
          </Text>
          <Button
            title="Normalt 21°C"
            onPress={() => {}}
            variant="outline"
            style={{ marginTop: 12 }}
          />
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
            navigation.navigate('PlanOversigt', { recipe, targetTime: date.toISOString() });
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
    padding: 24,
    paddingBottom: 100,
  },
  infoCard: {
    marginBottom: 16,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: colors.warning,
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
