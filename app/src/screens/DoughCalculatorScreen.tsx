import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme';
import { BottomBar, Button, Card, Screen, Segmented, SegmentedOption, Stepper } from '../components';
import {
  DEFAULT_RATIOS,
  DoughRatios,
  RATIO_LIMITS,
  calculateDough,
  clamp,
  parseRecipeDough,
} from '../utils/doughCalculator';
import { formatDecimal } from '../utils/formatNumber';
import type { RecipeStackScreenProps } from '../navigation/types';

/** Hvad brugeren tager udgangspunkt i, når mængden skal bestemmes. */
type AmountMode = 'flour' | 'dough' | 'pieces';

const AMOUNT_MODES: SegmentedOption<AmountMode>[] = [
  { label: 'Mel', value: 'flour' },
  { label: 'Samlet dej', value: 'dough' },
  { label: 'Emner', value: 'pieces' },
];

const FLOUR_PRESETS: SegmentedOption<number>[] = [
  { label: '250 g', value: 250 },
  { label: '500 g', value: 500 },
  { label: '1000 g', value: 1000 },
];

const HYDRATION_PRESETS: SegmentedOption<number>[] = [
  { label: 'Fast 65 %', value: 65 },
  { label: 'Klassisk 75 %', value: 75 },
  { label: 'Våd 85 %', value: 85 },
];

export const DoughCalculatorScreen = ({ navigation, route }: RecipeStackScreenProps<'Beregner'>) => {
  const recipe = route.params?.recipe;

  // Opskriftens egne forhold er kun et udgangspunkt – brugeren kan ændre alt.
  const recipeDough = useMemo(() => (recipe ? parseRecipeDough(recipe) : null), [recipe]);

  // Emner starter på opskriftens eget antal ("12 boller") med opskriftens
  // dejvægt fordelt på dem, så det første gæt passer til opskriften.
  const recipeYield = useMemo(() => {
    const count = Number(recipe?.yield.match(/^\s*(\d+)/)?.[1] ?? 0) || 1;
    if (!recipeDough) return { count, grams: 900 };

    const total = calculateDough(recipeDough.ratios, {
      mode: 'flour',
      grams: recipeDough.flourGrams,
    }).totalGrams;

    return { count, grams: clamp(Math.round(total / count / 25) * 25, 50, 1500) };
  }, [recipe, recipeDough]);

  const [ratios, setRatios] = useState<DoughRatios>(recipeDough?.ratios ?? DEFAULT_RATIOS);
  const [mode, setMode] = useState<AmountMode>('flour');
  const [flourGrams, setFlourGrams] = useState(recipeDough?.flourGrams ?? 500);
  const [doughGrams, setDoughGrams] = useState(1000);
  const [pieceCount, setPieceCount] = useState(recipeYield.count);
  const [pieceGrams, setPieceGrams] = useState(recipeYield.grams);

  const setRatio = (key: keyof DoughRatios, value: number) =>
    setRatios((current) => ({ ...current, [key]: value }));

  const basisGrams = mode === 'flour' ? flourGrams : mode === 'dough' ? doughGrams : pieceCount * pieceGrams;
  const result = calculateDough(ratios, {
    mode: mode === 'flour' ? 'flour' : 'dough',
    grams: basisGrams,
  });

  const ratiosChanged =
    !!recipeDough &&
    (recipeDough.ratios.hydrationPct !== ratios.hydrationPct ||
      recipeDough.ratios.starterPct !== ratios.starterPct ||
      recipeDough.ratios.saltPct !== ratios.saltPct);

  const showFlourBreakdown = result.flourBreakdown.length > 1;

  return (
    <>
      <Screen withBottomBar contentStyle={styles.content}>
        <Text style={typography.h1}>Dej-beregner</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          {recipeDough
            ? `Forholdene fra ${recipe?.name}. Skru på dem, og se hvor meget du skal veje af.`
            : 'Vælg dine forhold og hvor meget du vil lave – så får du gramtallene.'}
        </Text>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.md }]}>Hvor meget skal du lave?</Text>
          <Segmented options={AMOUNT_MODES} selected={mode} onSelect={setMode} />

          {mode === 'flour' && (
            <View style={styles.modeBlock}>
              <Segmented options={FLOUR_PRESETS} selected={flourGrams} onSelect={setFlourGrams} />
              <View style={styles.stepperSpacing}>
                <Stepper
                  label="Mel"
                  caption="Det mel du vejer af – surdejens eget mel kommer oveni."
                  value={flourGrams}
                  onChange={setFlourGrams}
                  step={50}
                  min={100}
                  max={3000}
                  suffix=" g"
                />
              </View>
            </View>
          )}

          {mode === 'dough' && (
            <View style={styles.modeBlock}>
              <Stepper
                label="Samlet dej"
                caption="Fx hvis din hævekurv eller gryde passer til en bestemt mængde."
                value={doughGrams}
                onChange={setDoughGrams}
                step={50}
                min={200}
                max={6000}
                suffix=" g"
              />
            </View>
          )}

          {mode === 'pieces' && (
            <View style={styles.modeBlock}>
              <Stepper label="Antal emner" value={pieceCount} onChange={setPieceCount} min={1} max={40} />
              <Stepper
                label="Vægt pr. emne"
                caption="Boller vejer typisk 100 g, et brød 700–1000 g."
                value={pieceGrams}
                onChange={setPieceGrams}
                step={25}
                min={50}
                max={1500}
                suffix=" g"
              />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Forhold</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>
            Procenterne regnes ud fra melet. Mere vand giver en mere åben krumme – og en blødere dej at
            arbejde med.
          </Text>

          <Segmented
            options={HYDRATION_PRESETS}
            selected={ratios.hydrationPct}
            onSelect={(value) => setRatio('hydrationPct', value)}
          />

          <View style={styles.stepperSpacing}>
            <Stepper
              label="Hydrering (vand)"
              value={ratios.hydrationPct}
              onChange={(value) => setRatio('hydrationPct', value)}
              min={RATIO_LIMITS.hydrationPct.min}
              max={RATIO_LIMITS.hydrationPct.max}
              suffix=" %"
            />
            <Stepper
              label="Surdej"
              caption="Mindre surdej = længere hævetid."
              value={ratios.starterPct}
              onChange={(value) => setRatio('starterPct', value)}
              min={RATIO_LIMITS.starterPct.min}
              max={RATIO_LIMITS.starterPct.max}
              suffix=" %"
            />
            <Stepper
              label="Salt"
              value={ratios.saltPct}
              onChange={(value) => setRatio('saltPct', value)}
              step={0.1}
              decimals={1}
              min={RATIO_LIMITS.saltPct.min}
              max={RATIO_LIMITS.saltPct.max}
              suffix=" %"
            />
          </View>

          {ratiosChanged && (
            <Button
              title="Tilbage til opskriftens forhold"
              variant="outline"
              onPress={() => setRatios(recipeDough.ratios)}
            />
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Sådan bliver dejen</Text>

          {showFlourBreakdown && (
            <View style={styles.detailBlock}>
              {result.flourBreakdown.map((flour) => (
                <View key={flour.name} style={styles.detailRow}>
                  <Text style={typography.bodySmall}>{flour.name}</Text>
                  <Text style={styles.detailValue}>{flour.grams} g</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={typography.bodySmall}>Samlet dej</Text>
            <Text style={styles.detailValue}>{result.totalGrams} g</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={typography.bodySmall}>Samlet hydrering</Text>
            <Text style={styles.detailValue}>{formatDecimal(result.totalHydrationPct)} %</Text>
          </View>
          {mode === 'pieces' && (
            <View style={styles.detailRow}>
              <Text style={typography.bodySmall}>Pr. emne</Text>
              <Text style={styles.detailValue}>{Math.round(result.totalGrams / pieceCount)} g</Text>
            </View>
          )}

          <Text style={[typography.bodySmall, styles.footnote]}>
            Den samlede hydrering tæller melet og vandet i surdejen med og er regnet med en surdej fodret
            1:1.
          </Text>
        </Card>

        <Button title="Tilbage" variant="outline" style={{ borderWidth: 0 }} onPress={() => navigation.goBack()} />
      </Screen>

      <BottomBar>
        <View style={styles.resultBar}>
          {[
            { label: 'Mel', grams: result.flourGrams },
            { label: 'Vand', grams: result.waterGrams },
            { label: 'Surdej', grams: result.starterGrams },
            { label: 'Salt', grams: result.saltGrams },
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
  /** Ekstra frihøjde, fordi bundbjælken her er højere end en knap. */
  content: {
    paddingBottom: 140,
  },
  card: {
    marginBottom: spacing.lg,
  },
  modeBlock: {
    marginTop: spacing.lg,
  },
  stepperSpacing: {
    marginTop: spacing.lg,
  },
  detailBlock: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
