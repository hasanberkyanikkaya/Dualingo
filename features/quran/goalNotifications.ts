import strings from '@/constants/strings';
import { QURAN_GOAL_NOTIFICATION_KIND } from '@/features/quran/goalReminder';

import type { NotificationPermission } from '@/features/prayer/notifications';
import type { QuranGoal } from '@/types';

const CHANNEL_ID = 'quran-goals';

type NotificationsModule = typeof import('expo-notifications');

function load(): NotificationsModule | null {
  try {
    // Expo Go/dev build ayrımı uygulama açılışını kırmasın diye yerel modül tembel yüklenir.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch (error) {
    if (__DEV__) {
      console.warn('[quran/goalNotifications] Modül yüklenemedi.', error);
    }
    return null;
  }
}

export async function getQuranGoalNotificationPermission(): Promise<NotificationPermission> {
  const Notifications = load();
  if (Notifications === null) {
    return 'unavailable';
  }

  try {
    const result = await Notifications.getPermissionsAsync();
    return result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function requestQuranGoalNotificationPermission(): Promise<NotificationPermission> {
  const Notifications = load();
  if (Notifications === null) {
    return 'unavailable';
  }

  try {
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function cancelQuranGoalNotification(): Promise<void> {
  const Notifications = load();
  if (Notifications === null) {
    return;
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      const data = request.content.data as { kind?: unknown } | null;
      if (data?.kind === QURAN_GOAL_NOTIFICATION_KIND) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[quran/goalNotifications] İptal başarısız.', error);
    }
  }
}

export async function applyQuranGoalNotification(goal: QuranGoal): Promise<void> {
  const Notifications = load();
  if (Notifications === null) {
    return;
  }

  await cancelQuranGoalNotification();

  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: strings.quran.goalReminder,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: strings.quran.goalNotificationTitle,
        body: strings.quran.goalNotificationBody,
        data: { kind: QURAN_GOAL_NOTIFICATION_KIND, goalId: goal.goalId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: goal.reminderHour,
        minute: goal.reminderMinute,
        channelId: CHANNEL_ID,
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[quran/goalNotifications] Zamanlama başarısız.', error);
    }
  }
}
