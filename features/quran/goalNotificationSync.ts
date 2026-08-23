import { readActiveQuranGoal } from '@/features/quran/goalDb';
import {
  applyQuranGoalNotification,
  cancelQuranGoalNotification,
  getQuranGoalNotificationPermission,
} from '@/features/quran/goalNotifications';
import { quranReminderSignature } from '@/features/quran/goalReminder';

let lastSignature: string | null = null;
let syncInFlight: Promise<void> | null = null;

async function run(): Promise<void> {
  const goal = readActiveQuranGoal();
  const signature = quranReminderSignature(goal);
  const permission = await getQuranGoalNotificationPermission();

  if (signature === 'off' || goal === null || permission !== 'granted') {
    lastSignature = null;
    await cancelQuranGoalNotification();
    return;
  }

  if (signature === lastSignature) {
    return;
  }

  await applyQuranGoalNotification(goal);
  lastSignature = signature;
}

export function syncQuranGoalNotification(): Promise<void> {
  if (syncInFlight !== null) {
    return syncInFlight;
  }

  const task = run()
    .catch((error: unknown) => {
      if (__DEV__) {
        console.warn('[quran/goalNotificationSync] Eşitleme başarısız.', error);
      }
    })
    .finally(() => {
      syncInFlight = null;
    });
  syncInFlight = task;
  return task;
}

export function invalidateQuranGoalNotification(): void {
  lastSignature = null;
}
