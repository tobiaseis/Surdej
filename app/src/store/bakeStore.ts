import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Recipe } from '../data/recipes';
import {
  ActiveBake,
  adjustScheduleForDelay,
  calculateSchedule,
  getLiveTimerStep,
} from '../utils/scheduleCalculator';
import { cancelLiveTimer, startLiveTimer } from '../utils/notifications';

interface BakeState {
  activeBake: ActiveBake | null;
  startBake: (recipe: Recipe, targetEndTime: Date) => void;
  completeStep: (stepIndex: number) => void;
  cancelBake: () => void;
}

const persistedDateFields = new Set(['targetEndTime', 'scheduledAt', 'completedAt']);

const revivePersistedDates = (key: string, value: unknown) => {
  if (persistedDateFields.has(key) && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

const syncLiveTimerForBake = (bake: ActiveBake | null) => {
  const liveStep = bake ? getLiveTimerStep(bake.steps) : undefined;

  if (liveStep) {
    void startLiveTimer(liveStep.title, liveStep.scheduledAt);
  } else {
    void cancelLiveTimer();
  }
};

export const useBakeStore = create<BakeState>()(
  persist(
    (set) => ({
      activeBake: null,

      startBake: (recipe, targetEndTime) => {
        const newBake = calculateSchedule(recipe, targetEndTime);
        syncLiveTimerForBake(newBake);
        set({ activeBake: newBake });
      },

      completeStep: (stepIndex) => {
        set((state) => {
          if (!state.activeBake) return state;
          if (stepIndex < 0 || stepIndex >= state.activeBake.steps.length) return state;

          const now = new Date();
          const delayedBake = adjustScheduleForDelay(state.activeBake, stepIndex, now);
          const steps = delayedBake.steps.map((step, index) => {
            if (index === stepIndex) {
              return {
                ...step,
                status: 'completed' as const,
                completedAt: now,
              };
            }

            if (index === stepIndex + 1) {
              return {
                ...step,
                status: 'active' as const,
                completedAt: null,
              };
            }

            return step;
          });

          const updatedBake = { ...delayedBake, steps };
          syncLiveTimerForBake(updatedBake);
          return { activeBake: updatedBake };
        });
      },

      cancelBake: () => {
        void cancelLiveTimer();
        set({ activeBake: null });
      },
    }),
    {
      name: 'surdejsmakkeren-active-bake',
      storage: createJSONStorage(() => AsyncStorage, {
        reviver: revivePersistedDates,
      }),
      partialize: (state) => ({ activeBake: state.activeBake }),
      onRehydrateStorage: () => (state) => {
        syncLiveTimerForBake(state?.activeBake ?? null);
      },
    }
  )
);
