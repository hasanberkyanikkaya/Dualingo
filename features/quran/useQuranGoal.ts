import { useCallback, useEffect, useState } from 'react';

import { findQuranVerse, getQuranManifest, getQuranPageIndex } from '@/features/quran/contentLoader';
import { readActiveQuranGoal, saveActiveQuranGoal, softDeleteActiveQuranGoal } from '@/features/quran/goalDb';
import {
  buildQuranGoalProgress,
  validateQuranGoalInput,
  type QuranGoalValidationIssue,
} from '@/features/quran/goalEngine';
import {
  invalidateQuranGoalNotification,
  syncQuranGoalNotification,
} from '@/features/quran/goalNotificationSync';
import {
  getQuranGoalNotificationPermission,
  requestQuranGoalNotificationPermission,
} from '@/features/quran/goalNotifications';
import { readQuranEventsBetween } from '@/features/quran/quranDb';
import { toLocalIsoDate } from '@/features/progress/streak';

import type { NotificationPermission } from '@/features/prayer/notifications';
import type { QuranGoal, QuranGoalInput, QuranGoalProgress, QuranGoalRead } from '@/types';

type QuranGoalSnapshot = {
  today: string;
  goal: QuranGoal | null;
  progress: QuranGoalProgress | null;
};

function loadSnapshot(now: number = Date.now()): QuranGoalSnapshot {
  const today = toLocalIsoDate(now);
  const goal = readActiveQuranGoal();
  if (goal === null) {
    return { today, goal: null, progress: null };
  }

  const events = readQuranEventsBetween(goal.startDate, today);
  const reads: QuranGoalRead[] = [];
  for (const event of events) {
    const verse = findQuranVerse(event.verseKey);
    if (verse !== null) {
      reads.push({
        date: event.date,
        verseKey: event.verseKey,
        pageNumber: verse.pageNumber,
        juzNumber: verse.juzNumber,
        deletedAt: event.deletedAt,
      });
    }
  }

  const pageIndex = getQuranPageIndex();
  return {
    today,
    goal,
    progress: buildQuranGoalProgress(
      goal,
      reads,
      pageIndex.pages.length,
      pageIndex.verseCountsByJuz,
      today,
    ),
  };
}

export function useQuranGoal() {
  const [snapshot, setSnapshot] = useState(loadSnapshot);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(loadSnapshot());
  }, []);

  const refreshPermission = useCallback(async () => {
    setPermission(await getQuranGoalNotificationPermission());
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  const saveGoal = useCallback(async (input: QuranGoalInput) => {
    const today = toLocalIsoDate(Date.now());
    const issues = validateQuranGoalInput(input, today);
    if (issues.length > 0) {
      return { saved: false, issues };
    }

    const saved = saveActiveQuranGoal(
      { ...input, contentRevision: getQuranManifest().contentRevision },
      Date.now(),
    );
    if (saved === null) {
      return { saved: false, issues: [] as QuranGoalValidationIssue[] };
    }

    if (saved.reminderEnabled) {
      setPermission(await requestQuranGoalNotificationPermission());
    }
    invalidateQuranGoalNotification();
    await syncQuranGoalNotification();
    setSnapshot(loadSnapshot());
    return { saved: true, issues: [] as QuranGoalValidationIssue[] };
  }, []);

  const removeGoal = useCallback(async () => {
    softDeleteActiveQuranGoal(Date.now());
    invalidateQuranGoalNotification();
    await syncQuranGoalNotification();
    setSnapshot(loadSnapshot());
  }, []);

  return {
    ...snapshot,
    permission,
    refresh,
    refreshPermission,
    saveGoal,
    removeGoal,
  };
}
