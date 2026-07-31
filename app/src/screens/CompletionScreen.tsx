import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { Button, Card, Screen } from '../components';
import { useBakeStore } from '../store/bakeStore';
import { saveDiaryEntry, uploadDiaryImage } from '../data/diary';
import type { HomeStackScreenProps } from '../navigation/types';

type RatingRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const RatingRow = ({ label, value, onChange }: RatingRowProps) => (
  <View style={styles.ratingRow}>
    <Text style={[typography.bodySmall, styles.fieldLabel]}>{label}</Text>
    <View style={styles.ratingButtons}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = n <= value;
        return (
          <TouchableOpacity
            key={n}
            style={[styles.ratingButton, isActive && styles.ratingButtonActive]}
            onPress={() => onChange(n)}
            activeOpacity={0.94}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${n} af 5`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.ratingText, isActive && styles.ratingTextActive]}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export const CompletionScreen = ({ navigation }: HomeStackScreenProps<'Færdig'>) => {
  const { activeBake, cancelBake } = useBakeStore();

  const recipeName = activeBake?.recipe.name ?? 'Din bagning';
  const defaultTemp = activeBake ? `${activeBake.options.roomTempC}°C` : '';

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

  const applyResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageBase64(asset.base64 ?? null);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Adgang nægtet', 'Giv adgang til dine billeder for at tilføje et foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
    });
    applyResult(result);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Adgang nægtet', 'Giv adgang til kameraet for at tage et foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
    });
    applyResult(result);
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
      </Text>

      <Card>
        <Text style={[typography.h3, { marginBottom: spacing.md }]}>Billede</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]}>
            <Text style={[typography.bodySmall, { color: colors.textSub }]}>Tilføj et foto af dit bagværk</Text>
          </View>
        )}
        <View style={styles.imageButtons}>
          <Button title="Vælg billede" variant="outline" style={styles.imageButton} onPress={pickFromLibrary} />
          <Button title="Tag billede" variant="outline" style={styles.imageButton} onPress={takePhoto} />
        </View>
      </Card>

      <Card>
        <Text style={[typography.h3, { marginBottom: spacing.lg }]}>Hvordan blev resultatet?</Text>

        <RatingRow label="Krumme" value={crumb} onChange={setCrumb} />
        <RatingRow label="Smag" value={taste} onChange={setTaste} />

        <Text style={[typography.bodySmall, styles.fieldLabel, { marginTop: spacing.sm }]}>Rumtemperatur</Text>
        <TextInput
          style={styles.input}
          value={temp}
          onChangeText={setTemp}
          placeholder="fx 21°C"
          placeholderTextColor={colors.textSub}
        />

        <Text style={[typography.bodySmall, styles.fieldLabel, { marginTop: spacing.lg }]}>Noter</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Dejen var lidt for våd, men bollerne blev luftige..."
          placeholderTextColor={colors.textSub}
          multiline
        />
      </Card>

      <Button title="Gem i dagbog" loading={saving} onPress={handleSave} />
      <Button
        title="Spring over"
        variant="outline"
        style={{ marginTop: spacing.md, borderWidth: 0 }}
        onPress={() => finish('Hjem')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageButton: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    marginBottom: spacing.lg,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  ratingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.textSub,
  },
  ratingTextActive: {
    color: colors.onPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMain,
    backgroundColor: colors.background,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
