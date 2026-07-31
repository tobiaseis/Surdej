import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { Card } from './Card';

export type PickedPhoto = {
  uri: string;
  /** Base64 bruges til upload – kan mangle, hvis billedet ikke kunne læses. */
  base64: string | null;
};

interface PhotoPickerProps {
  imageUri: string | null;
  onSelect: (photo: PickedPhoto) => void;
  title?: string;
  placeholder?: string;
}

/**
 * Kort med billedvalg: forhåndsvisning plus knapper til kamerarullen og
 * kameraet. Kvaliteten sættes ned, fordi billedet alligevel kun vises i en
 * lille visning – og fordi base64-uploads ellers bliver unødigt tunge.
 */
export const PhotoPicker = ({
  imageUri,
  onSelect,
  title = 'Billede',
  placeholder = 'Tilføj et foto',
}: PhotoPickerProps) => {
  const applyResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onSelect({ uri: asset.uri, base64: asset.base64 ?? null });
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

  return (
    <Card>
      <Text style={[typography.h3, { marginBottom: spacing.md }]}>{title}</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={[styles.preview, styles.previewPlaceholder]}>
          <Text style={[typography.bodySmall, { color: colors.textSub }]}>{placeholder}</Text>
        </View>
      )}
      <View style={styles.buttons}>
        <Button title="Vælg billede" variant="outline" style={styles.button} onPress={pickFromLibrary} />
        <Button title="Tag billede" variant="outline" style={styles.button} onPress={takePhoto} />
      </View>
    </Card>
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
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
