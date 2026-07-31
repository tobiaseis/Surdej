import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import {
  BottomBar,
  Button,
  Card,
  PhotoPicker,
  RatingScale,
  Screen,
  Stepper,
  TextField,
} from '../components';
import { COFFEE_RATING_MAX, saveCoffeeEntry, uploadCoffeeImage } from '../data/coffee';
import { formatMinutesSeconds } from '../utils/dateTime';
import type { CoffeeStackScreenProps } from '../navigation/types';

const DEFAULT_DOSE_GRAMS = 18;

/** Kun cifre – og aldrig mere end feltet giver mening for. */
const sanitizeNumber = (value: string, max: number) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 2);
  if (!digits) return '';
  return String(Math.min(max, Number(digits)));
};

export const CoffeeEntryScreen = ({ navigation }: CoffeeStackScreenProps<'KaffeNy'>) => {
  const [beans, setBeans] = useState('');
  const [doseGrams, setDoseGrams] = useState(DEFAULT_DOSE_GRAMS);
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [grindSize, setGrindSize] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const brewSeconds = Number(minutes || 0) * 60 + Number(seconds || 0);

  // Gemmer og bliver på skærmen ved fejl, så noterne ikke går tabt.
  const persistEntry = async (imageUrl?: string) => {
    setSaving(true);
    const saved = await saveCoffeeEntry({
      beans: beans.trim() || undefined,
      doseGrams,
      brewSeconds: brewSeconds || undefined,
      grindSize: grindSize.trim() || undefined,
      rating,
      note: note.trim() || undefined,
      imageUrl,
    });
    setSaving(false);

    if (!saved) {
      Alert.alert(
        'Kunne ikke gemme',
        'Dit bryg blev ikke gemt. Tjek din internetforbindelse, og prøv igen.'
      );
      return;
    }

    navigation.goBack();
  };

  const handleSave = async () => {
    if (!imageBase64) {
      await persistEntry();
      return;
    }

    setSaving(true);
    const uploaded = await uploadCoffeeImage(imageBase64);
    setSaving(false);

    if (uploaded) {
      await persistEntry(uploaded);
      return;
    }

    Alert.alert('Billedet kunne ikke uploades', 'Vil du gemme resten af brygget uden billede?', [
      { text: 'Fortryd', style: 'cancel' },
      {
        text: 'Gem uden billede',
        onPress: () => {
          void persistEntry();
        },
      },
    ]);
  };

  return (
    <>
      <Screen withBottomBar contentStyle={styles.content}>
        <Text style={typography.h1}>Nyt bryg</Text>
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>
          Skriv ned hvordan du bryggede – så ved du hvad du skal ændre næste gang.
        </Text>

        <PhotoPicker
          imageUri={imageUri}
          placeholder="Tilføj et foto af koppen"
          onSelect={(photo) => {
            setImageUri(photo.uri);
            setImageBase64(photo.base64);
          }}
        />

        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.lg }]}>Sådan bryggede du</Text>

          <TextField
            label="Bønner"
            value={beans}
            onChangeText={setBeans}
            placeholder="fx Ethiopia Guji, lys ristning"
            maxLength={80}
          />

          <Stepper
            label="Kaffe"
            value={doseGrams}
            onChange={setDoseGrams}
            step={0.5}
            decimals={1}
            min={5}
            max={100}
            suffix=" g"
          />

          <Text style={[typography.label, styles.groupLabel]}>Løbetid</Text>
          <Text style={[typography.bodySmall, styles.groupCaption]}>
            Tiden fra vandet rammer kaffen, til koppen er klar
            {brewSeconds ? ` – nu ${formatMinutesSeconds(brewSeconds)}` : ''}.
          </Text>
          <View style={styles.timeRow}>
            <TextField
              style={styles.timeField}
              label="Minutter"
              value={minutes}
              onChangeText={(value) => setMinutes(sanitizeNumber(value, 59))}
              placeholder="2"
              keyboardType="number-pad"
            />
            <TextField
              style={styles.timeField}
              label="Sekunder"
              value={seconds}
              onChangeText={(value) => setSeconds(sanitizeNumber(value, 59))}
              placeholder="30"
              keyboardType="number-pad"
            />
          </View>

          <TextField
            label="Kværn"
            caption="Din kværns indstilling – fx 18 klik eller 6,5."
            value={grindSize}
            onChangeText={setGrindSize}
            placeholder="fx 18 klik"
            maxLength={40}
          />
        </Card>

        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.lg }]}>Hvordan blev den?</Text>

          <RatingScale
            label="Bedømmelse"
            caption={rating ? `${rating} ud af ${COFFEE_RATING_MAX}` : 'Tryk på et tal fra 1 til 10.'}
            value={rating}
            onChange={setRating}
            max={COFFEE_RATING_MAX}
          />

          <TextField
            label="Noter"
            value={note}
            onChangeText={setNote}
            placeholder="Syrlig og tynd – prøv finere kværn næste gang..."
            multiline
          />
        </Card>

        <Button
          title="Fortryd"
          variant="outline"
          style={{ borderWidth: 0 }}
          onPress={() => navigation.goBack()}
        />
      </Screen>

      <BottomBar>
        {rating === 0 && (
          <Text style={[typography.bodySmall, styles.hint]}>Giv en bedømmelse for at gemme brygget.</Text>
        )}
        <Button title="Gem bryg" loading={saving} disabled={rating === 0} onPress={handleSave} />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  /** Ekstra frihøjde, fordi bundbjælken også rummer en hjælpetekst. */
  content: {
    paddingBottom: 150,
  },
  groupLabel: {
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  groupCaption: {
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  hint: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
