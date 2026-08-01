import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';
import {
  BackButton,
  BottomBar,
  Button,
  Card,
  Screen,
  Segmented,
  SegmentedOption,
  StepHeader,
  Stepper,
} from '../components';
import {
  DEFAULT_FEED_RATIO,
  FEED_LIMITS,
  FEED_PRESETS,
  FeedRatio,
  calculateFeed,
  formatHourRange,
  formatRatio,
  getPeakTimes,
  getPeakWindow,
} from '../utils/starterFeed';
import { createFeedPlan } from '../utils/bakePlan';
import type { StarterStrength } from '../utils/scheduleCalculator';
import { formatTime } from '../utils/dateTime';
import { useSettingsStore } from '../store/settingsStore';
import type { BakeFlow, HomeStackScreenProps } from '../navigation/types';

/** Om brugeren regner frem fra sin surdej eller baglæns fra opskriften. */
type AmountMode = 'starter' | 'total';

const AMOUNT_MODES: SegmentedOption<AmountMode>[] = [
  { label: 'Jeg beholder', value: 'starter' },
  { label: 'Jeg skal bruge', value: 'total' },
];

/**
 * Hvad bageplanen hænges op på. Fodrer hun nu, regnes planen forlæns herfra.
 * Fodrer hun senere, vælger hun sluttidspunktet i sidste trin, og planen
 * regnes baglæns – så fortæller den, hvornår der skal fodres.
 */
type TimingMode = 'now' | 'later';

const TIMING_MODES: SegmentedOption<TimingMode>[] = [
  { label: 'Jeg fodrer nu', value: 'now' },
  { label: 'Jeg fodrer senere', value: 'later' },
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

/**
 * Bageflowets første trin. Fodringen er ikke et opslagsværktøj ved siden af
 * planen – det er trinnet, resten af planen bygger videre på, og forholdet
 * her bestemmer både mængderne og hvor længe surdejen er om at toppe.
 */
export const StarterFeedScreen = ({ navigation, route }: HomeStackScreenProps<'Fodring'>) => {
  // Kommer man fra en opskrift i biblioteket, er valget allerede truffet, og
  // flowets trin 2 og 3 springes over.
  const preselectedRecipe = route.params?.recipe;

  const defaultRoomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const defaultStarterStrength = useSettingsStore((state) => state.defaultStarterStrength);

  const [ratio, setRatio] = useState<FeedRatio>(DEFAULT_FEED_RATIO);
  const [mode, setMode] = useState<AmountMode>('starter');
  const [starterGrams, setStarterGrams] = useState(50);
  const [totalGrams, setTotalGrams] = useState(200);
  const [reserveGrams, setReserveGrams] = useState(30);

  const [timing, setTiming] = useState<TimingMode>('now');
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

  const basis = useMemo(
    () =>
      mode === 'starter'
        ? ({ mode: 'starter', starterGrams } as const)
        : ({ mode: 'total', totalGrams, reserveGrams } as const),
    [mode, starterGrams, totalGrams, reserveGrams]
  );

  const result = calculateFeed(ratio, basis);
  const peak = getPeakWindow(ratio, options);
  const peakTimes = getPeakTimes(peak, now);

  const setPart = (key: keyof FeedRatio, value: number) =>
    setRatio((current) => ({ ...current, [key]: value }));

  const activePreset = FEED_PRESETS.find((preset) => formatRatio(preset.ratio) === formatRatio(ratio));

  const goToNextStep = () => {
    const flow: BakeFlow = {
      feed: createFeedPlan(ratio, basis, options),
      roomTempC,
      starterStrength,
      // Fodrer hun nu, låses tidspunktet først når planen startes – indtil da
      // er "nu" et bevægeligt mål. Her markeres kun, at planen skal regnes
      // forlæns fra fodringen.
      fedAt: timing === 'now' ? new Date().toISOString() : undefined,
    };

    if (preselectedRecipe) {
      navigation.navigate('GaaIGang', { recipe: preselectedRecipe, flow });
      return;
    }

    navigation.navigate('VaelgOpskrift', { flow });
  };

  return (
    <>
      <Screen withBottomBar="tall">
        <BackButton />
        <StepHeader step={1} />

        <Text style={typography.h1}>Fodr surdejen</Text>
        <Text style={[typography.body, styles.intro]}>
          Vælg forholdet, så får du at vide hvor meget mel og vand der skal i. Resten af bageplanen
          lægges i forlængelse af fodringen.
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
            {activePreset ? activePreset.caption : `Dit eget forhold ${formatRatio(ratio)}`}
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
          <Text style={typography.h3}>I køkkenet</Text>
          <Text style={typography.bodySmall}>
            Gælder både surdejen og hævetrinnene i bageplanen.
          </Text>

          <Text style={[typography.label, styles.subLabel]}>Rumtemperatur</Text>
          <Segmented options={TEMP_OPTIONS} selected={roomTempC} onSelect={setRoomTempC} />

          <Text style={[typography.label, styles.subLabel]}>Surdejens styrke</Text>
          <Segmented options={STARTER_OPTIONS} selected={starterStrength} onSelect={setStarterStrength} />
        </Card>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.md }]}>Hvornår fodrer du?</Text>
          <Segmented options={TIMING_MODES} selected={timing} onSelect={setTiming} />

          <View style={styles.timingBlock}>
            <Text style={typography.h2}>{formatHourRange(peak)}</Text>
            {timing === 'now' ? (
              <Text style={typography.body}>
                Fodrer du nu, topper surdejen mellem kl. {formatTime(peakTimes.from)} og{' '}
                {formatTime(peakTimes.to)}. Resten af planen regnes derfra.
              </Text>
            ) : (
              <Text style={typography.body}>
                Så længe er surdejen om at toppe. Vælg opskrift og sluttidspunkt i de næste trin, så
                siger vi, hvornår du skal fodre.
              </Text>
            )}
          </View>

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
        <Button
          title={preselectedRecipe ? 'Videre til bageplanen' : 'Videre – vælg opskrift'}
          style={{ marginTop: spacing.md }}
          onPress={goToNextStep}
        />
      </BottomBar>
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
