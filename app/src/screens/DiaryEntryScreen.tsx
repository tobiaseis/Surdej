import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { spacing, typography } from '../theme';
import {
  BackButton,
  BottomBar,
  Button,
  Card,
  PhotoPicker,
  RatingScale,
  Screen,
  TextField,
} from '../components';
import { deleteDiaryEntry, updateDiaryEntry, uploadDiaryImage } from '../data/diary';
import { formatDurationMinutes, formatIsoDate, formatLongDate } from '../utils/dateTime';
import { formatBakeConditions } from '../utils/diaryRecipe';
import type { DiaryStackScreenProps } from '../navigation/types';

export const DiaryEntryScreen = ({ navigation, route }: DiaryStackScreenProps<'DagbogIndlaeg'>) => {
  const entry = route.params.entry;

  const [crumb, setCrumb] = useState(entry.crumbRating ?? 0);
  const [taste, setTaste] = useState(entry.tasteRating ?? 0);
  const [note, setNote] = useState(entry.note ?? '');
  const [temp, setTemp] = useState(entry.temp ?? '');
  const [imageUri, setImageUri] = useState<string | null>(entry.imageUrl);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const recipe = entry.recipe;
  const conditions = recipe ? formatBakeConditions(recipe) : null;

  const persist = async (imageUrl?: string | null) => {
    setSaving(true);
    const saved = await updateDiaryEntry(entry.id, {
      temp: temp.trim() || undefined,
      crumbRating: crumb || undefined,
      tasteRating: taste || undefined,
      note: note.trim() || undefined,
      imageUrl,
    });
    setSaving(false);

    if (!saved) {
      Alert.alert(
        'Kunne ikke gemme',
        'Ændringerne blev ikke gemt. Tjek din internetforbindelse, og prøv igen.'
      );
      return;
    }

    navigation.goBack();
  };

  const handleSave = async () => {
    // Intet nyt billede valgt: lad billedfeltet være, medmindre det er fjernet.
    if (!imageBase64) {
      await persist(imageUri === null && entry.imageUrl ? null : undefined);
      return;
    }

    setSaving(true);
    const uploaded = await uploadDiaryImage(imageBase64);
    setSaving(false);

    if (uploaded) {
      await persist(uploaded);
      return;
    }

    Alert.alert('Billedet kunne ikke uploades', 'Vil du gemme resten af ændringerne uden det nye billede?', [
      { text: 'Fortryd', style: 'cancel' },
      {
        text: 'Gem uden billede',
        onPress: () => {
          void persist();
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert('Slet indlægget?', `"${entry.recipeName}" bliver slettet fra dagbogen. Det kan ikke fortrydes.`, [
      { text: 'Fortryd', style: 'cancel' },
      {
        text: 'Slet',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const deleted = await deleteDiaryEntry(entry.id);
          setDeleting(false);

          if (!deleted) {
            Alert.alert(
              'Kunne ikke slette',
              'Indlægget blev ikke slettet. Tjek din internetforbindelse, og prøv igen.'
            );
            return;
          }

          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <>
      <Screen withBottomBar>
        <BackButton />
        <Text style={typography.h1}>{entry.recipeName}</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Bagt {formatIsoDate(entry.createdAt, formatLongDate)}.
        </Text>

        <PhotoPicker
          imageUri={imageUri}
          placeholder="Tilføj et foto af dit bagværk"
          onSelect={(photo) => {
            setImageUri(photo.uri);
            setImageBase64(photo.base64);
          }}
        />

        {imageUri && (
          <Button
            title="Fjern billede"
            variant="ghost"
            style={{ marginBottom: spacing.lg }}
            onPress={() => {
              setImageUri(null);
              setImageBase64(null);
            }}
          />
        )}

        <Card style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.lg }]}>Hvordan blev resultatet?</Text>

          <RatingScale label="Krumme" value={crumb} onChange={setCrumb} />
          <RatingScale label="Smag" value={taste} onChange={setTaste} />

          <TextField label="Rumtemperatur" value={temp} onChangeText={setTemp} placeholder="fx 21°C" />

          <TextField
            label="Noter"
            value={note}
            onChangeText={setNote}
            placeholder="Dejen var lidt for våd, men bollerne blev luftige..."
            multiline
          />
        </Card>

        {recipe ? (
          <Card style={styles.card}>
            <Text style={typography.h3}>Opskriften du bagte efter</Text>
            <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>
              {[recipe.yield, conditions].filter(Boolean).join(' · ') ||
                'Gemt sammen med indlægget.'}
            </Text>

            {recipe.ingredients.map((ingredient, index) => (
              <Text key={index} style={typography.bodySmall}>
                • {ingredient}
              </Text>
            ))}

            {recipe.steps.length > 0 && (
              <View style={styles.stepBlock}>
                {recipe.steps.map((step, index) => (
                  <Text key={index} style={typography.bodySmall}>
                    {index + 1}. {step.title} · {formatDurationMinutes(step.durationMinutes)}
                  </Text>
                ))}
              </View>
            )}

            <Text style={[typography.bodySmall, styles.footnote]}>
              Opskriften er et øjebliksbillede af den bagning og kan ikke laves om.
            </Text>
          </Card>
        ) : null}

        <Button title="Slet indlæg" variant="danger" loading={deleting} onPress={confirmDelete} />
        <Button
          title="Fortryd"
          variant="ghost"
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.goBack()}
        />
      </Screen>

      <BottomBar>
        <Button title="Gem ændringer" loading={saving} onPress={handleSave} />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  stepBlock: {
    marginTop: spacing.md,
  },
  footnote: {
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
