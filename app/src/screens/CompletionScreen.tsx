import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useBakeStore } from '../store/bakeStore';
import { saveDiaryEntry, uploadDiaryImage } from '../data/diary';

type RatingRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const RatingRow = ({ label, value, onChange }: RatingRowProps) => (
  <View style={styles.ratingRow}>
    <Text style={[typography.bodySmall, { fontWeight: '600', marginBottom: 8 }]}>{label}</Text>
    <View style={styles.ratingButtons}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = n <= value;
        return (
          <TouchableOpacity
            key={n}
            style={[styles.ratingButton, isActive && styles.ratingButtonActive]}
            onPress={() => onChange(n)}
            activeOpacity={0.94}
          >
            <Text style={[styles.ratingText, isActive && styles.ratingTextActive]}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export const CompletionScreen = () => {
  const navigation = useNavigation<any>();
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

  const handleSave = async () => {
    setSaving(true);

    let imageUrl: string | undefined;
    if (imageBase64) {
      const uploaded = await uploadDiaryImage(imageBase64);
      imageUrl = uploaded ?? undefined;
    }

    await saveDiaryEntry({
      recipeName,
      temp: temp || undefined,
      crumbRating: crumb || undefined,
      tasteRating: taste || undefined,
      note: note || undefined,
      imageUrl,
    });
    setSaving(false);
    finish('Dagbog');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>{recipeName} er færdig 🎉</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>
          Godt klaret! Gem resultatet, så du kan sammenligne næste gang.
        </Text>

        <Card>
          <Text style={[typography.h3, { marginBottom: 12 }]}>Billede</Text>
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
          <Text style={[typography.h3, { marginBottom: 16 }]}>Hvordan blev resultatet?</Text>

          <RatingRow label="Krumme" value={crumb} onChange={setCrumb} />
          <RatingRow label="Smag" value={taste} onChange={setTaste} />

          <Text style={[typography.bodySmall, { fontWeight: '600', marginTop: 8, marginBottom: 8 }]}>Rumtemperatur</Text>
          <TextInput
            style={styles.input}
            value={temp}
            onChangeText={setTemp}
            placeholder="fx 21°C"
            placeholderTextColor={colors.textSub}
          />

          <Text style={[typography.bodySmall, { fontWeight: '600', marginTop: 16, marginBottom: 8 }]}>Noter</Text>
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
          style={{ marginTop: 12, borderWidth: 0 }}
          onPress={() => finish('Hjem')}
        />
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  ratingRow: {
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSub,
  },
  ratingTextActive: {
    color: '#FFF',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textMain,
    backgroundColor: colors.background,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
