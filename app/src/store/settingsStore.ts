import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StarterStrength } from '../utils/scheduleCalculator';

interface SettingsState {
  defaultRoomTempC: number;
  defaultStarterStrength: StarterStrength;
  defaultPortion: number;
  notificationsEnabled: boolean;
  setDefaultRoomTempC: (value: number) => void;
  setDefaultStarterStrength: (value: StarterStrength) => void;
  setDefaultPortion: (value: number) => void;
  setNotificationsEnabled: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRoomTempC: 21,
      defaultStarterStrength: 'normal',
      defaultPortion: 12,
      notificationsEnabled: true,
      setDefaultRoomTempC: (value) => set({ defaultRoomTempC: value }),
      setDefaultStarterStrength: (value) => set({ defaultStarterStrength: value }),
      setDefaultPortion: (value) => set({ defaultPortion: Math.max(1, value) }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
    }),
    {
      name: 'surdejsmakkeren-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
