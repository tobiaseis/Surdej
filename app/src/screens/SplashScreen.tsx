import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';

export const SplashScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={[typography.h1, { fontSize: 36, color: colors.primary }]}>Surdejsmakkeren</Text>
        <Text style={[typography.body, { marginTop: 12 }]}>Din bageplan regnet baglæns.</Text>
      </View>
      <View style={styles.footer}>
        <Button 
          title="Kom i gang" 
          onPress={() => navigation.replace('Onboarding')} 
        />
        <Text style={[typography.bodySmall, { textAlign: 'center', marginTop: 16 }]}>
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
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 24,
  }
});
