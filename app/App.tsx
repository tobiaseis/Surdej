import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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

  return (
    <>
      <MainNavigator />
      <StatusBar style="dark" />
    </>
  );
}
