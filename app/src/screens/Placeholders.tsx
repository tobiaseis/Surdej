import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

const createPlaceholder = (name: string) => {
  return () => (
    <View style={styles.container}>
      <Text style={typography.h2}>{name}</Text>
    </View>
  );
};

export const HomeScreen = createPlaceholder('Hjem');
export const RecipeListScreen = createPlaceholder('Opskrifter');
export const DiaryScreen = createPlaceholder('Dagbog');
export const SosScreen = createPlaceholder('SOS / Hjælp');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
