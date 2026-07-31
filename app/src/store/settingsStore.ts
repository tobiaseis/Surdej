import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StarterStrength } from '../utils/scheduleCalculator';

interface SettingsState {
  defaultRoomTempC: number;
  defaultStarterStrength: StarterStrength;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  setDefaultRoomTempC: (value: number) => void;
  setDefaultStarterStrength: (value: StarterStrength) => void;
  setNotificationsEnabled: (value: boolean) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRoomTempC: 21,
      defaultStarterStrength: 'normal',
      notificationsEnabled: true,
      hasOnboarded: false,
      setDefaultRoomTempC: (value) => set({ defaultRoomTempC: value }),
      setDefaultStarterStrength: (value) => set({ defaultStarterStrength: value }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'surdejsmakkeren-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Følger med i om indstillingerne er læst ind fra AsyncStorage endnu.
 * Navigationen må først vælge startskærm, når vi kender `hasOnboarded` –
 * ellers ville onboarding blinke forbi ved hver app-start.
 */
export const useSettingsHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useSettingsStore.persist.onFinishHydration(() => setHydrated(true));

    // Hydreringen kan nå at blive færdig, inden denne effekt kører.
    if (useSettingsStore.persist.hasHydrated()) setHydrated(true);

    return unsubscribe;
  }, []);

  return hydrated;
};
