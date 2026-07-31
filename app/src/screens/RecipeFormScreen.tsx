import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';
import { BottomBar, Button, Card, Screen, Segmented, SegmentedOption, Stepper, TextField } from '../components';
import {
  DIFFICULTIES,
  RecipeDraft,
  RecipeStepDraft,
  STEP_LIMITS,
  createEmptyDraft,
  createEmptyStep,
  draftFromRecipe,
  draftToRecipeFields,
  moveStep,
  validateDraft,
  withTrailingBlank,
} from '../utils/recipeDraft';
import { createUserRecipe, updateUserRecipe } from '../data/userRecipes';
import { formatDurationMinutes } from '../utils/dateTime';
import type { Difficulty } from '../data/recipes';
import type { RecipeStackScreenProps } from '../navigation/types';

const DIFFICULTY_OPTIONS: SegmentedOption<Difficulty>[] = DIFFICULTIES.map((value) => ({
  label: value,
  value,
}));

const STEP_KIND_OPTIONS: SegmentedOption<string>[] = [
  { label: 'Almindeligt trin', value: 'plain' },
  { label: 'Hævetrin', value: 'rise' },
];

/** Én linje i ingrediens- eller udstyrslisten, med sin egen slet-knap. */
const LineRow = ({
  label,
  value,
  placeholder,
  onChange,
  onRemove,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}) => (
  <View style={styles.lineRow}>
    <TextField
      style={styles.lineField}
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
    />
    <TouchableOpacity
      style={styles.lineRemove}
      onPress={onRemove}
      activeOpacity={0.94}
      accessibilityRole="button"
      accessibilityLabel={`Fjern ${label.toLowerCase()}`}
    >
      <Trash2 color={colors.textSub} size={20} />
    </TouchableOpacity>
  </View>
);

export const RecipeFormScreen = ({ navigation, route }: RecipeStackScreenProps<'OpskriftFormular'>) => {
  const existing = route.params?.recipe;

  const [draft, setDraft] = useState<RecipeDraft>(() =>
    existing ? draftFromRecipe(existing) : createEmptyDraft()
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const setLine = (key: 'ingredients' | 'tools', index: number, value: string) =>
    setDraft((current) => {
      const lines = [...current[key]];
      lines[index] = value;
      return { ...current, [key]: withTrailingBlank(lines) };
    });

  const removeLine = (key: 'ingredients' | 'tools', index: number) =>
    setDraft((current) => ({
      ...current,
      [key]: withTrailingBlank(current[key].filter((_, i) => i !== index)),
    }));

  const setStep = (index: number, changes: Partial<RecipeStepDraft>) =>
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step, i) => (i === index ? { ...step, ...changes } : step)),
    }));

  const removeStep = (index: number) =>
    setDraft((current) => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }));

  const shiftStep = (index: number, direction: -1 | 1) =>
    setDraft((current) => ({ ...current, steps: moveStep(current.steps, index, direction) }));

  const handleSave = async () => {
    const problems = validateDraft(draft);
    setErrors(problems);
    if (problems.length > 0) return;

    const fields = draftToRecipeFields(draft);

    setSaving(true);
    const saved = existing ? await updateUserRecipe(existing.id, fields) : await createUserRecipe(fields);
    setSaving(false);

    if (!saved) {
      Alert.alert(
        'Kunne ikke gemme',
        'Opskriften blev ikke gemt. Tjek din internetforbindelse, og prøv igen.'
      );
      return;
    }

    // Tilbage til listen frem for detaljerne – de ville vise den gamle udgave.
    navigation.navigate('OpskriftListe');
  };

  const totalMinutes = draft.steps.reduce((sum, step) => sum + Math.max(0, step.durationMinutes), 0);

  return (
    <>
      <Screen withBottomBar contentStyle={styles.content}>
        <Text style={typography.h1}>{existing ? 'Rediger opskrift' : 'Ny opskrift'}</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Skriv opskriften ind, som den står. Trinnene og deres tider er dem, bageplanen regner
          baglæns ud fra.
        </Text>

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.lg }]}>Om opskriften</Text>

          <TextField
            label="Navn"
            value={draft.name}
            onChangeText={(value) => setField('name', value)}
            placeholder="fx Grovboller med durum"
            maxLength={80}
          />
          <TextField
            label="Kort beskrivelse"
            value={draft.description}
            onChangeText={(value) => setField('description', value)}
            placeholder="Hvad er det for et brød?"
            maxLength={160}
          />
          <TextField
            label="Antal"
            value={draft.yield}
            onChangeText={(value) => setField('yield', value)}
            placeholder="fx 12 boller eller 1 brød"
            maxLength={40}
          />

          <Text style={[typography.label, styles.groupLabel]}>Sværhedsgrad</Text>
          <Segmented
            options={DIFFICULTY_OPTIONS}
            selected={draft.difficulty}
            onSelect={(value) => setField('difficulty', value)}
          />

          <View style={styles.stepperSpacing}>
            <Stepper
              label="Aktiv tid"
              caption="Den tid du selv står med hænderne i dejen."
              value={draft.handsOnMinutes}
              onChange={(value) => setField('handsOnMinutes', value)}
              step={5}
              min={0}
              max={480}
              suffix=" min"
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Ingredienser</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
            Skriv mængden først – fx "400 g hvedemel". Så kan dej-beregneren regne opskriften op og
            ned, også når der er flere slags mel i.
          </Text>

          {draft.ingredients.map((ingredient, index) => (
            <LineRow
              key={`ingredient-${index}`}
              label={`Ingrediens ${index + 1}`}
              value={ingredient}
              placeholder={index === 0 ? '400 g hvedemel' : '100 g fuldkornsmel'}
              onChange={(value) => setLine('ingredients', index, value)}
              onRemove={() => removeLine('ingredients', index)}
            />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Du skal bruge</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
            Skål, hævekurv, gryde – det du skal have fundet frem.
          </Text>

          {draft.tools.map((tool, index) => (
            <LineRow
              key={`tool-${index}`}
              label={`Udstyr ${index + 1}`}
              value={tool}
              placeholder="fx Støbejernsgryde"
              onChange={(value) => setLine('tools', index, value)}
              onRemove={() => removeLine('tools', index)}
            />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={typography.h3}>Fremgangsmåde</Text>
          <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
            Trinnene kommer i den rækkefølge, de står her. Marker hævetrin – kun de bliver længere i et
            koldt køkken.
            {totalMinutes > 0 ? ` Samlet tid: ${formatDurationMinutes(totalMinutes)}.` : ''}
          </Text>

          {draft.steps.map((step, index) => (
            <View key={step.key} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={typography.label}>Trin {index + 1}</Text>
                <View style={styles.stepActions}>
                  <TouchableOpacity
                    onPress={() => shiftStep(index, -1)}
                    disabled={index === 0}
                    style={styles.iconButton}
                    activeOpacity={0.94}
                    accessibilityRole="button"
                    accessibilityLabel={`Flyt trin ${index + 1} op`}
                  >
                    <ChevronUp color={index === 0 ? colors.border : colors.textSub} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => shiftStep(index, 1)}
                    disabled={index === draft.steps.length - 1}
                    style={styles.iconButton}
                    activeOpacity={0.94}
                    accessibilityRole="button"
                    accessibilityLabel={`Flyt trin ${index + 1} ned`}
                  >
                    <ChevronDown
                      color={index === draft.steps.length - 1 ? colors.border : colors.textSub}
                      size={20}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeStep(index)}
                    style={styles.iconButton}
                    activeOpacity={0.94}
                    accessibilityRole="button"
                    accessibilityLabel={`Slet trin ${index + 1}`}
                  >
                    <Trash2 color={colors.textSub} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              <TextField
                label="Hvad skal der ske?"
                value={step.title}
                onChangeText={(value) => setStep(index, { title: value })}
                placeholder="fx Stræk og fold"
                maxLength={60}
              />
              <TextField
                label="Beskrivelse"
                value={step.description}
                onChangeText={(value) => setStep(index, { description: value })}
                placeholder="Sådan gør du..."
                multiline
              />

              <Stepper
                label="Varighed"
                caption="Tiden til næste trin starter."
                value={step.durationMinutes}
                onChange={(value) => setStep(index, { durationMinutes: value })}
                step={5}
                min={STEP_LIMITS.min}
                max={STEP_LIMITS.max}
                suffix=" min"
              />

              <Segmented
                options={STEP_KIND_OPTIONS}
                selected={step.temperatureSensitive ? 'rise' : 'plain'}
                onSelect={(value) => setStep(index, { temperatureSensitive: value === 'rise' })}
              />
            </View>
          ))}

          <Button
            title="Tilføj trin"
            variant="outline"
            style={{ marginTop: spacing.md }}
            onPress={() => setDraft((current) => ({ ...current, steps: [...current.steps, createEmptyStep()] }))}
          />
        </Card>

        {errors.length > 0 && (
          <Card style={styles.errorCard}>
            <Text style={[typography.h3, { color: colors.warning }]}>Der mangler lidt endnu</Text>
            {errors.map((error) => (
              <Text key={error} style={typography.bodySmall}>
                • {error}
              </Text>
            ))}
          </Card>
        )}

        <Button
          title="Fortryd"
          variant="outline"
          style={{ borderWidth: 0 }}
          onPress={() => navigation.goBack()}
        />
      </Screen>

      <BottomBar>
        <Button
          title={existing ? 'Gem ændringer' : 'Gem opskrift'}
          loading={saving}
          onPress={handleSave}
        />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  card: {
    marginBottom: spacing.lg,
  },
  groupLabel: {
    color: colors.textMain,
    marginBottom: spacing.sm,
  },
  stepperSpacing: {
    marginTop: spacing.lg,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  lineField: {
    flex: 1,
  },
  /** Løftes ned på højde med selve feltet, forbi feltets label. */
  lineRemove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  stepCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
});
