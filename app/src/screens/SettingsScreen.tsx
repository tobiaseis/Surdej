import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useSettingsStore } from '../store/settingsStore';
import { useBakeStore } from '../store/bakeStore';
import { StarterStrength } from '../utils/scheduleCalculator';
import { buildDiaryExport, fetchDiaryEntries } from '../data/diary';

const TEMP_OPTIONS: { label: string; value: number }[] = [
  { label: '18°C', value: 18 },
  { label: '21°C', value: 21 },
  { label: '25°C', value: 25 },
];

const STARTER_OPTIONS: { label: string; value: StarterStrength }[] = [
  { label: 'Meget aktiv', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Langsom', value: 'slow' },
];

function Segmented<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const {
    defaultRoomTempC,
    defaultStarterStrength,
    defaultPortion,
    notificationsEnabled,
    setDefaultRoomTempC,
    setDefaultStarterStrength,
    setDefaultPortion,
    setNotificationsEnabled,
  } = useSettingsStore();
  const resyncNotifications = useBakeStore((state) => state.resyncNotifications);

  const [exporting, setExporting] = useState(false);

  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    // Opdater den aktive bagnings notifikationer med det samme.
    resyncNotifications();
  };

  const handleExport = async () => {
    setExporting(true);
    const entries = await fetchDiaryEntries();
    setExporting(false);
    try {
      await Share.share({ message: buildDiaryExport(entries) });
    } catch {
      // Brugeren afbrød delingen – ingen handling nødvendig.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Indstillinger</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>
          Standardvalg bruges, når du laver en ny bageplan.
        </Text>

        <Card style={styles.card}>
          <Text style={typography.h3}>Standard rumtemperatur</Text>
          <Text style={[typography.bodySmall, { marginBottom: 12 }]}>Bruges som udgangspunkt på nye planer.</Text>
          <Segmented options={TEMP_OPTIONS} selected={defaultRoomTempC} onSelect={setDefaultRoomTempC} />
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Surdejens typiske styrke</Text>
          <View style={{ height: 12 }} />
          <Segmented options={STARTER_OPTIONS} selected={defaultStarterStrength} onSelect={setDefaultStarterStrength} />
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Standard portionsstørrelse</Text>
          <Text style={[typography.bodySmall, { marginBottom: 12 }]}>Antal emner du typisk bager.</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperButton} onPress={() => setDefaultPortion(defaultPortion - 1)} activeOpacity={0.8}>
              <Text style={styles.stepperSymbol}>−</Text>
            </TouchableOpacity>
            <Text style={[typography.h3, { marginBottom: 0 }]}>{defaultPortion}</Text>
            <TouchableOpacity style={styles.stepperButton} onPress={() => setDefaultPortion(defaultPortion + 1)} activeOpacity={0.8}>
              <Text style={styles.stepperSymbol}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={typography.h3}>Notifikationer</Text>
              <Text style={typography.bodySmall}>Påmindelser og live-timer under bagning.</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={notificationsEnabled ? colors.primary : '#FFF'}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Eksportér dagbog</Text>
          <Text style={[typography.bodySmall, { marginBottom: 12 }]}>Del dine bagninger som tekst.</Text>
          <Button title="Eksportér" variant="outline" loading={exporting} onPress={handleExport} />
        </Card>

        <View style={{ height: 24 }} />
        <Button title="Tilbage" variant="outline" style={{ borderWidth: 0 }} onPress={() => navigation.goBack()} />
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
  card: {
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 160,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
});
