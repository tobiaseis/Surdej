import React, { useMemo, useState } from 'react';
import { Text, Alert } from 'react-native';
import { spacing, typography } from '../theme';
import { Button, Card, PhotoPicker, RatingScale, Screen, TextField } from '../components';
import { useBakeStore } from '../store/bakeStore';
import { saveDiaryEntry, uploadDiaryImage } from '../data/diary';
import { buildDiaryRecipe } from '../utils/diaryRecipe';
import type { HomeStackScreenProps } from '../navigation/types';

export const CompletionScreen = ({ navigation }: HomeStackScreenProps<'Færdig'>) => {
  const { activeBake, cancelBake } = useBakeStore();

  const recipeName = activeBake?.recipe.name ?? 'Din bagning';
  const defaultTemp = activeBake ? `${activeBake.options.roomTempC}°C` : '';

  // Opskriften fryses ned, som den blev bagt – med de tider planen endte med.
  const recipeSnapshot = useMemo(
    () => (activeBake ? buildDiaryRecipe(activeBake) : undefined),
    [activeBake]
  );

  const [crumb, setCrumb] = useState(0);
  const [taste, setTaste] = useState(0);
  const [note, setNote] = useState('');
  const [temp, setTemp] = useState(defaultTemp);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = (target: 'Dagbog' | 'Hjem') => {
    cancelBake();
    // Nulstil Hjem-stakken, så færdig-skærmen ikke bliver liggende bagved.
    navigation.navigate('HomeMain');
    if (target === 'Dagbog') {
      navigation.navigate('MainTabs', { screen: 'Dagbog' });
    }
  };

  // Gemmer indlægget og bliver på skærmen, hvis det fejler, så brugeren
  // ikke mister sine noter og kan prøve igen.
  const persistEntry = async (imageUrl?: string) => {
    setSaving(true);
    const saved = await saveDiaryEntry({
      recipeName,
      temp: temp || undefined,
      crumbRating: crumb || undefined,
      tasteRating: taste || undefined,
      note: note || undefined,
      imageUrl,
      recipe: recipeSnapshot,
    });
    setSaving(false);

    if (!saved) {
      Alert.alert(
        'Kunne ikke gemme',
        'Dit indlæg blev ikke gemt. Tjek din internetforbindelse, og prøv igen.'
      );
      return;
    }

    finish('Dagbog');
  };

  const handleSave = async () => {
    if (!imageBase64) {
      await persistEntry();
      return;
    }

    setSaving(true);
    const uploaded = await uploadDiaryImage(imageBase64);
    setSaving(false);

    if (uploaded) {
      await persistEntry(uploaded);
      return;
    }

    Alert.alert(
      'Billedet kunne ikke uploades',
      'Vil du gemme resten af indlægget uden billede?',
      [
        { text: 'Fortryd', style: 'cancel' },
        { text: 'Gem uden billede', onPress: () => { void persistEntry(); } },
      ]
    );
  };

  return (
    <Screen>
      <Text style={typography.h1}>{recipeName} er færdig 🎉</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>
        Godt klaret! Gem resultatet, så du kan sammenligne næste gang.
        {recipeSnapshot ? ' Hele opskriften gemmes med – ingredienser, trin og tider.' : ''}
      </Text>

      <PhotoPicker
        imageUri={imageUri}
        placeholder="Tilføj et foto af dit bagværk"
        onSelect={(photo) => {
          setImageUri(photo.uri);
          setImageBase64(photo.base64);
        }}
      />

      <Card>
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

      <Button title="Gem i dagbog" loading={saving} onPress={handleSave} />
      <Button
        title="Spring over"
        variant="ghost"
        style={{ marginTop: spacing.md }}
        onPress={() => finish('Hjem')}
      />
    </Screen>
  );
};
