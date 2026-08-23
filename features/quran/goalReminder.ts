import type { QuranGoal } from '@/types';

export const QURAN_GOAL_NOTIFICATION_KIND = 'quran-goal';

export type QuranReminderTime = { hour: number; minute: number };

function isValidTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59
  );
}

export function parseQuranReminderTime(value: string): QuranReminderTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (match === null) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return isValidTime(hour, minute) ? { hour, minute } : null;
}

export function formatQuranReminderTime(hour: number, minute: number): string {
  if (!isValidTime(hour, minute)) {
    return '';
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function quranReminderSignature(goal: QuranGoal | null): string {
  if (goal === null || goal.deletedAt !== null || !goal.reminderEnabled) {
    return 'off';
  }
  const time = formatQuranReminderTime(goal.reminderHour, goal.reminderMinute);
  return time.length === 0 ? 'off' : `${QURAN_GOAL_NOTIFICATION_KIND}@${time}`;
}
