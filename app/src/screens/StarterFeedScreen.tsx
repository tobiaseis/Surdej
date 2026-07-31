import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, fonts, spacing, typography } from '../theme';
import {
  BackButton,
  BottomBar,
  Button,
  Card,
  Screen,
  Segmented,
  SegmentedOption,
  Stepper,
} from '../components';
import {
  DEFAULT_FEED_RATIO,
  FEED_LIMITS,
  FEED_PRESETS,
  FeedRatio,
  calculateFeed,
  formatHourRange,
  getFeedTime,
  getPeakTimes,
  getPeakWindow,
} from '../utils/starterFeed';
import type { StarterStrength } from '../utils/scheduleCalculator';
import {
  formatShortDate,
  formatTime,
  formatWeekdayTime,
  mergeDatePart,
  mergeTimePart,
} from '../utils/dateTime';
import { useSettingsStore } from '../store/settingsStore';
import type { HomeStackScreenProps } from '../navigation/types';

/** Om brugeren regner frem fra sin surdej eller baglæns fra opskriften. */
type AmountMode = 'starter' | 'total';

const AMOUNT_MODES: SegmentedOption<AmountMode>[] = [
  { label: 'Jeg beholder', value: 'starter' },
  { label: 'Jeg skal bruge', value: 'total' },
];

/** Om surdejen skal være klar hurtigst muligt eller til et bestemt tidspunkt. */
type TimingMode = 'now' | 'target';

const TIMING_MODES: SegmentedOption<TimingMode>[] = [
  { label: 'Jeg fodrer nu', value: 'now' },
  { label: 'Klar til et tidspunkt', value: 'target' },
];

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

const PRESET_OPTIONS: SegmentedOption<string>[] = FEED_PRESETS.map((preset) => ({
  label: preset.label,
  value: preset.label,
}));

const ratioLabel = (ratio: FeedRatio) => `${ratio.starter}:${ratio.flour}:${ratio.water}`;

const getDefaultReadyTime = () => {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(7, 0, 0, 0);
  return target;
};

export const StarterFeedScreen = (_props: HomeStackScreenProps<'Fodring'>) => {
  const defaultRoomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const defaultStarterStrength = useSettingsStore((state) => state.defaultStarterStrength);

  const [ratio, setRatio] = useState<FeedRatio>(DEFAULT_FEED_RATIO);
  const [mode, setMode] = useState<AmountMode>('starter');
  const [starterGrams, setStarterGrams] = useState(50);
  const [totalGrams, setTotalGrams] = useState(200);
  const [reserveGrams, setReserveGrams] = useState(30);

  const [timing, setTiming] = useState<TimingMode>('now');
  const [readyAt, setReadyAt] = useState(getDefaultReadyTime);
  const [roomTempC, setRoomTempC] = useState(defaultRoomTempC);
  const [starterStrength, setStarterStrength] = useState<StarterStrength>(defaultStarterStrength);

  // Klokkeslættene regnes ud fra "nu", så de ikke bliver forkerte, hvis
  // skærmen bliver liggende åben mens surdejen vejes af.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

  const result = calculateFeed(
    ratio,
    mode === 'starter'
      ? { mode: 'starter', starterGrams }
      : { mode: 'total', totalGrams, reserveGrams }
  );

  const peak = getPeakWindow(ratio, options);
  const peakTimes = getPeakTimes(peak, now);
  const feedAt = getFeedTime(ratio, readyAt, options);
  const feedTimeHasPassed = feedAt.getTime() < now.getTime();

  const setPart = (key: keyof FeedRatio, value: number) =>
    setRatio((current) => ({ ...current, [key]: value }));

  const activePreset = FEED_PRESETS.find(
    (preset) => ratioLabel(preset.ratio) === ratioLabel(ratio)
  );

  const openAndroidPicker = (pickerMode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value: readyAt,
      mode: pickerMode,
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        setReadyAt((current) =>
          pickerMode === 'date'
            ? mergeDatePart(current, selectedDate)
            : mergeTimePart(current, selectedDate)
        );
      },
    });
  };

  return (
    <>
      <Screen withBottomBar="tall">
        <BackButton />
        <Text style={typography.h1}>Fodr surdejen</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Vælg forholdet, så får du at vide hvor meget mel og vand der skal i – og hvornår surdejen er
          på toppen.
        </Text>

        <Card style={styles.card}>
          <Text style={typography.h3}>Forhold</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>
            Surdej : mel : vand. Mindre surdej i forholdet betyder længere tid, men også en mildere smag.
          </Text>

          <Segmented
            options={PRESET_OPTIONS}
            selected={activePreset?.label ?? ''}
            onSelect={(label) => {
              const preset = FEED_PRESETS.find((item) => item.label === label);
              if (preset) setRatio(preset.ratio);
            }}
          />

          <Text style={[typography.bodySmall, styles.presetCaption]}>
            {activePreset ? activePreset.caption : `Dit eget forhold ${ratioLabel(ratio)}`}
          </Text>

          <View style={styles.stepperSpacing}>
            <Stepper
              label="Surdej (dele)"
              value={ratio.starter}
              onChange={(value) => setPart('starter', value)}
              min={FEED_LIMITS.part.min}
              max={FEED_LIMITS.part.max}
            />
            <Stepper
              label="Mel (dele)"
              value={ratio.flour}
              onChange={(value) => setPart('flour', value)}
              min={FEED_LIMITS.part.min}
              max={FEED_LIMITS.part.max}
            />
            <Stepper
              label="Vand (dele)"
              value={ratio.water}
              onChange={(value) => setPart('water', value)}
              min={FEED_LIMITS.part.min}
              max={FEED_LIMITS.part.max}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.md }]}>Hvor meget?</Text>
          <Segmented options={AMOUNT_MODES} selected={mode} onSelect={setMode} />

          {mode === 'starter' ? (
            <View style={styles.stepperSpacing}>
              <Stepper
                label="Surdej i glasset"
                caption="Det du starter med – resten kan smides ud eller bruges til pandekager."
                value={starterGrams}
                onChange={setStarterGrams}
                step={5}
                min={FEED_LIMITS.starterGrams.min}
                max={FEED_LIMITS.starterGrams.max}
                suffix=" g"
              />
            </View>
          ) : (
            <View style={styles.stepperSpacing}>
              <Stepper
                label="Aktiv surdej til dejen"
                caption="Det opskriften skal bruge."
                value={totalGrams}
                onChange={setTotalGrams}
                step={10}
                min={FEED_LIMITS.totalGrams.min}
                max={FEED_LIMITS.totalGrams.max}
                suffix=" g"
              />
              <Stepper
                label="Behold til næste gang"
                caption="Fodres oveni, så der er surdej tilbage i glasset."
                value={reserveGrams}
                onChange={setReserveGrams}
                step={10}
                min={FEED_LIMITS.reserveGrams.min}
                max={FEED_LIMITS.reserveGrams.max}
                suffix=" g"
              />
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={typography.bodySmall}>I glasset efter fodring</Text>
            <Text style={styles.detailValue}>{result.totalGrams} g</Text>
          </View>
          {mode === 'total' && (
            <View style={styles.detailRow}>
              <Text style={typography.bodySmall}>Til dejen</Text>
              <Text style={styles.detailValue}>{result.usableGrams} g</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={typography.bodySmall}>Surdejens hydrering</Text>
            <Text style={styles.detailValue}>{result.hydrationPct} %</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.md }]}>Hvornår er den klar?</Text>
          <Segmented options={TIMING_MODES} selected={timing} onSelect={setTiming} />

          {timing === 'now' ? (
            <View style={styles.timingBlock}>
              <Text style={typography.h2}>{formatHourRange(peak)}</Text>
              <Text style={typography.body}>
                Fodrer du nu, topper surdejen mellem kl. {formatTime(peakTimes.from)} og{' '}
                {formatTime(peakTimes.to)}.
              </Text>
            </View>
          ) : (
            <View style={styles.timingBlock}>
              {Platform.OS === 'android' && (
                <>
                  <Button
                    title={`Dato: ${formatShortDate(readyAt)}`}
                    variant="outline"
                    onPress={() => openAndroidPicker('date')}
                  />
                  <Button
                    title={`Klar kl.: ${formatTime(readyAt)}`}
                    variant="outline"
                    style={{ marginTop: spacing.md }}
                    onPress={() => openAndroidPicker('time')}
                  />
                </>
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  value={readyAt}
                  mode="datetime"
                  is24Hour
                  display="spinner"
                  onChange={(_event, selectedDate) => selectedDate && setReadyAt(selectedDate)}
                  textColor={colors.textMain}
                />
              )}

              <Text style={[typography.h2, { marginTop: spacing.lg }]}>
                Fodr {formatWeekdayTime(feedAt)}
              </Text>
              <Text style={typography.body}>
                Så er den på toppen, når du skal bruge den ({formatHourRange(peak)} efter fodring).
              </Text>
              {feedTimeHasPassed && (
                <Text style={[typography.bodySmall, { color: colors.warning, marginTop: spacing.sm }]}>
                  Det tidspunkt er passeret. Vælg et senere tidspunkt, eller brug et forhold med mere
                  surdej i.
                </Text>
              )}
            </View>
          )}

          <Text style={[typography.label, styles.subLabel]}>Rumtemperatur</Text>
          <Segmented options={TEMP_OPTIONS} selected={roomTempC} onSelect={setRoomTempC} />

          <Text style={[typography.label, styles.subLabel]}>Surdejens styrke</Text>
          <Segmented options={STARTER_OPTIONS} selected={starterStrength} onSelect={setStarterStrength} />

          <Text style={[typography.bodySmall, styles.footnote]}>
            Tiderne er et skøn. Stol på surdejen: den er klar, når den er hævet til det dobbelte og
            begynder at flade ud på toppen.
          </Text>
        </Card>
      </Screen>

      <BottomBar>
        <View style={styles.resultBar}>
          {[
            { label: 'Surdej', grams: result.starterGrams },
            { label: 'Mel', grams: result.flourGrams },
            { label: 'Vand', grams: result.waterGrams },
          ].map((item) => (
            <View key={item.label} style={styles.resultCell}>
              <Text style={styles.resultLabel}>{item.label}</Text>
              <Text style={styles.resultValue}>{item.grams} g</Text>
            </View>
          ))}
        </View>
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  presetCaption: {
    marginTop: spacing.sm,
  },
  stepperSpacing: {
    marginTop: spacing.lg,
  },
  timingBlock: {
    marginTop: spacing.lg,
  },
  subLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.textMain,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.textMain,
  },
  footnote: {
    marginTop: spacing.md,
    fontSize: 13,
  },
  resultBar: {
    flexDirection: 'row',
  },
  resultCell: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSub,
    marginBottom: 2,
  },
  resultValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.textMain,
  },
});
