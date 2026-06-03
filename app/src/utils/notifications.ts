import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import type { ScheduledStep } from './scheduleCalculator';

const TIMER_NOTIFICATION_ID = 'bake-timer';
const TIMER_CHANNEL_ID = 'bake-timers';
const STEP_CHANNEL_ID = 'bake-steps';
const STEP_NOTIFICATION_PREFIX = 'bake-step-';

let foregroundServiceRegistered = false;

export const registerLiveTimerForegroundService = () => {
  if (foregroundServiceRegistered) return;

  foregroundServiceRegistered = true;
  notifee.registerForegroundService(() => {
    return new Promise(() => {
      // The promise intentionally stays unresolved while the foreground timer is active.
    });
  });
};

/**
 * Beder om notifikationstilladelse. Returnerer true hvis brugeren har givet lov.
 * Kaldes når brugeren starter sin første bageplan, så tilladelsen føles relevant.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('Kunne ikke anmode om notifikationstilladelse:', error);
    return false;
  }
};

/**
 * Shows an ongoing Android foreground-service notification with a native
 * chronometer that counts down even when the app UI is not visible.
 */
export const startLiveTimer = async (title: string, targetTime: Date) => {
  try {
    const channelId = await notifee.createChannel({
      id: TIMER_CHANNEL_ID,
      name: 'Surdejsmakkeren Timers',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: TIMER_NOTIFICATION_ID,
      title: `Næste: ${title}`,
      body: `Tæller ned til ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      android: {
        channelId,
        asForegroundService: true,
        ongoing: true,
        pressAction: {
          id: 'default',
        },
        showChronometer: true,
        chronometerDirection: 'down',
        timestamp: targetTime.getTime(),
      },
    });
  } catch (error) {
    console.warn('Kunne ikke starte live timer notifikation:', error);
  }
};

export const cancelLiveTimer = async () => {
  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification(TIMER_NOTIFICATION_ID);
  } catch (error) {
    console.warn('Kunne ikke fjerne live timer notifikation:', error);
  }
};

/**
 * Planlægger en notifikation for hvert kommende trin, så brugeren får besked
 * præcis når det er tid til fx at folde, hæve eller bage. Eksisterende
 * trin-notifikationer ryddes først, så planen altid er synkroniseret.
 */
export const scheduleStepNotifications = async (steps: ScheduledStep[]) => {
  try {
    // Ryd tidligere planlagte trin-notifikationer.
    const existing = await notifee.getTriggerNotificationIds();
    const stepIds = existing.filter((id) => id.startsWith(STEP_NOTIFICATION_PREFIX));
    if (stepIds.length > 0) {
      await notifee.cancelTriggerNotifications(stepIds);
    }

    const channelId = await notifee.createChannel({
      id: STEP_CHANNEL_ID,
      name: 'Surdejsmakkeren Trin',
      importance: AndroidImportance.HIGH,
    });

    const now = Date.now();

    await Promise.all(
      steps
        .filter((step) => step.status !== 'completed' && step.scheduledAt.getTime() > now)
        .map((step) => {
          const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: step.scheduledAt.getTime(),
          };

          return notifee.createTriggerNotification(
            {
              id: `${STEP_NOTIFICATION_PREFIX}${step.id}`,
              title: `Tid til: ${step.title}`,
              body: step.description || 'Åbn appen for at se næste trin.',
              android: {
                channelId,
                pressAction: { id: 'default' },
              },
            },
            trigger
          );
        })
    );
  } catch (error) {
    console.warn('Kunne ikke planlægge trin-notifikationer:', error);
  }
};

export const cancelStepNotifications = async () => {
  try {
    const existing = await notifee.getTriggerNotificationIds();
    const stepIds = existing.filter((id) => id.startsWith(STEP_NOTIFICATION_PREFIX));
    if (stepIds.length > 0) {
      await notifee.cancelTriggerNotifications(stepIds);
    }
  } catch (error) {
    console.warn('Kunne ikke fjerne trin-notifikationer:', error);
  }
};
