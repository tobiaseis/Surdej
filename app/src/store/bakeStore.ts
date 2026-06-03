import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Recipe } from '../data/recipes';
import {
  ActiveBake,
  DEFAULT_SCHEDULE_OPTIONS,
  ScheduleOptions,
  adjustScheduleForDelay,
  calculateSchedule,
  delayBakeByMinutes,
  getLiveTimerStep,
} from '../utils/scheduleCalculator';
import {
  cancelLiveTimer,
  cancelStepNotifications,
  scheduleStepNotifications,
  startLiveTimer,
} from '../utils/notifications';
import { useSettingsStore } from './settingsStore';

interface BakeState {
  activeBake: ActiveBake | null;
  startBake: (recipe: Recipe, targetEndTime: Date, options?: ScheduleOptions) => void;
  completeStep: (stepIndex: number) => void;
  skipStep: (stepIndex: number) => void;
  delayBake: (minutes: number) => void;
  cancelBake: () => void;
  resyncNotifications: () => void;
}

const persistedDateFields = new Set(['targetEndTime', 'scheduledAt', 'completedAt']);

const revivePersistedDates = (key: string, value: unknown) => {
  if (persistedDateFields.has(key) && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

const syncNotificationsForBake = (bake: ActiveBake | null) => {
  const liveStep = bake ? getLiveTimerStep(bake.steps) : undefined;
  const notificationsEnabled = useSettingsStore.getState().notificationsEnabled;

  if (bake && liveStep && notificationsEnabled) {
    void startLiveTimer(liveStep.title, liveStep.scheduledAt);
    void scheduleStepNotifications(bake.steps);
  } else {
    void cancelLiveTimer();
    void cancelStepNotifications();
  }
};

// Markerer et trin som færdigt og aktiverer det næste. `shiftSchedule` styrer om de
// resterende trin skal rykkes efter den faktiske færdiggørelsestid (forsinkelse).
const advanceFromStep = (bake: ActiveBake, stepIndex: number, now: Date, shiftSchedule: boolean): ActiveBake => {
  const base = shiftSchedule ? adjustScheduleForDelay(bake, stepIndex, now) : bake;

  const steps = base.steps.map((step, index) => {
    if (index === stepIndex) {
      return { ...step, status: 'completed' as const, completedAt: now };
    }
    if (index === stepIndex + 1) {
      return { ...step, status: 'active' as const, completedAt: null };
    }
    return step;
  });

  return { ...base, steps };
};

export const useBakeStore = create<BakeState>()(
  persist(
    (set) => ({
      activeBake: null,

      startBake: (recipe, targetEndTime, options = DEFAULT_SCHEDULE_OPTIONS) => {
        const newBake = calculateSchedule(recipe, targetEndTime, options);
        syncNotificationsForBake(newBake);
        set({ activeBake: newBake });
      },

      completeStep: (stepIndex) => {
        set((state) => {
          if (!state.activeBake) return state;
          if (stepIndex < 0 || stepIndex >= state.activeBake.steps.length) return state;

          const updatedBake = advanceFromStep(state.activeBake, stepIndex, new Date(), true);
          syncNotificationsForBake(updatedBake);
          return { activeBake: updatedBake };
        });
      },

      skipStep: (stepIndex) => {
        set((state) => {
          if (!state.activeBake) return state;
          if (stepIndex < 0 || stepIndex >= state.activeBake.steps.length) return state;

          // Spring over: marker trinnet udført uden at rykke den resterende plan.
          const updatedBake = advanceFromStep(state.activeBake, stepIndex, new Date(), false);
          syncNotificationsForBake(updatedBake);
          return { activeBake: updatedBake };
        });
      },

      delayBake: (minutes) => {
        set((state) => {
          if (!state.activeBake) return state;
          const updatedBake = delayBakeByMinutes(state.activeBake, minutes);
          syncNotificationsForBake(updatedBake);
          return { activeBake: updatedBake };
        });
      },

      cancelBake: () => {
        syncNotificationsForBake(null);
        set({ activeBake: null });
      },

      // Kaldes når notifikations-indstillingen ændres, så den aktive bagning
      // enten får planlagt eller fjernet sine notifikationer.
      resyncNotifications: () => {
        set((state) => {
          syncNotificationsForBake(state.activeBake);
          return state;
        });
      },
    }),
    {
      name: 'surdejsmakkeren-active-bake',
      storage: createJSONStorage(() => AsyncStorage, {
        reviver: revivePersistedDates,
      }),
      partialize: (state) => ({ activeBake: state.activeBake }),
      onRehydrateStorage: () => (state) => {
        syncNotificationsForBake(state?.activeBake ?? null);
      },
    }
  )
);
