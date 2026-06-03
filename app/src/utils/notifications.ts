import notifee, { AndroidImportance } from '@notifee/react-native';

const TIMER_NOTIFICATION_ID = 'bake-timer';
const TIMER_CHANNEL_ID = 'bake-timers';

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
 * Shows an ongoing Android foreground-service notification with a native
 * chronometer that counts down even when the app UI is not visible.
 */
export const startLiveTimer = async (title: string, targetTime: Date) => {
  try {
    await notifee.requestPermission();

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
