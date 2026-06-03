import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainNavigator } from './src/navigation/MainNavigator';
import { supabase } from './src/utils/supabase';

export default function App() {
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

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const hideNavigationBar = () => {
      try {
        NavigationBar.setStyle('light');
        NavigationBar.setHidden(true);
      } catch (error) {
        console.warn('Android navigation bar could not be hidden:', error);
      }
    };

    hideNavigationBar();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hideNavigationBar();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationBar hidden style="light" />
      <MainNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
