import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useFonts } from 'expo-font';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from './src/navigation/MainNavigator';
import { supabase } from './src/utils/supabase';
import { colors, fontAssets } from './src/theme';

export default function App() {
  // Ved fejl renderer vi alligevel – så falder appen tilbage til systemfonten
  // i stedet for at blive stående på en tom skærm.
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('Anonymous sign-in failed, checking fallback...', error.message);
        }
      }
    };

    initAuth();
  }, []);

  if (!fontsLoaded && !fontError) {
    return <View style={styles.boot} />;
  }

  return (
    <SafeAreaProvider>
      {/* Navigationslinjen sættes deklarativt her og som standard via
          expo-navigation-bar-pluginet i app.json. */}
      <NavigationBar hidden style="light" />
      <MainNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
