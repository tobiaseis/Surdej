import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing, typography } from '../theme';
import { Button } from '../components';
import type { RootStackScreenProps } from '../navigation/types';

export const SplashScreen = ({ navigation }: RootStackScreenProps<'Splash'>) => {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={[typography.h1, { fontSize: 36, color: colors.primary }]}>Surdejsmakkeren</Text>
        <Text style={[typography.body, { marginTop: spacing.md }]}>Din bageplan regnet baglæns.</Text>
      </View>
      <View style={styles.footer}>
        <Button title="Kom i gang" onPress={() => navigation.replace('Onboarding')} />
        <Text style={[typography.bodySmall, { textAlign: 'center', marginTop: spacing.lg }]}>
          Få besked, når det er tid til at folde, hæve og bage.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: layout.screenPaddingHorizontal,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
