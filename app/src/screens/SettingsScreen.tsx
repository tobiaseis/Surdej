import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Share, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button, Card, Screen, Segmented, SegmentedOption } from '../components';
import { useSettingsStore } from '../store/settingsStore';
import { useBakeStore } from '../store/bakeStore';
import { StarterStrength } from '../utils/scheduleCalculator';
import { buildDiaryExport, fetchDiaryEntries } from '../data/diary';
import type { HomeStackScreenProps } from '../navigation/types';

const TEMP_OPTIONS: SegmentedOption<number>[] = [
  { label: '18°C', value: 18 },
  { label: '21°C', value: 21 },
  { label: '25°C', value: 25 },
];

const STARTER_OPTIONS: SegmentedOption<StarterStrength>[] = [
  { label: 'Meget aktiv', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Langsom', value: 'slow' },
];

export const SettingsScreen = ({ navigation }: HomeStackScreenProps<'Indstillinger'>) => {
  const {
    defaultRoomTempC,
    defaultStarterStrength,
    notificationsEnabled,
    setDefaultRoomTempC,
    setDefaultStarterStrength,
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
    const { entries, failed } = await fetchDiaryEntries();
    setExporting(false);

    // Uden dette ville en netværksfejl dele en tom dagbog, som om der
    // ikke var nogen bagninger.
    if (failed) {
      Alert.alert(
        'Kunne ikke hente dagbogen',
        'Tjek din internetforbindelse, og prøv igen. Så er vi sikre på, at alle dine bagninger kommer med.'
      );
      return;
    }

    try {
      await Share.share({ message: buildDiaryExport(entries) });
    } catch {
      // Brugeren afbrød delingen – ingen handling nødvendig.
    }
  };

  return (
    <Screen>
      <Text style={typography.h1}>Indstillinger</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>
        Standardvalg bruges, når du laver en ny bageplan.
      </Text>

      <Card style={styles.card}>
        <Text style={typography.h3}>Standard rumtemperatur</Text>
        <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>Bruges som udgangspunkt på nye planer.</Text>
        <Segmented options={TEMP_OPTIONS} selected={defaultRoomTempC} onSelect={setDefaultRoomTempC} />
      </Card>

      <Card style={styles.card}>
        <Text style={typography.h3}>Surdejens typiske styrke</Text>
        <View style={{ height: spacing.md }} />
        <Segmented options={STARTER_OPTIONS} selected={defaultStarterStrength} onSelect={setDefaultStarterStrength} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={typography.h3}>Notifikationer</Text>
            <Text style={typography.bodySmall}>Påmindelser og live-timer under bagning.</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.border, true: colors.secondary }}
            thumbColor={notificationsEnabled ? colors.primary : colors.onPrimary}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={typography.h3}>Eksportér dagbog</Text>
        <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>Del dine bagninger som tekst.</Text>
        <Button title="Eksportér" variant="outline" loading={exporting} onPress={handleExport} />
      </Card>

      <View style={{ height: spacing.xl }} />
      <Button title="Tilbage" variant="outline" style={{ borderWidth: 0 }} onPress={() => navigation.goBack()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
