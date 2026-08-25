type UnknownRecord = Record<string, unknown>;

export type SyncedLearningAttempt = {
  levelId: string;
  stars: number;
  accuracy: number;
  xpEarned: number;
  completedAt: number;
};

export type ProgressEventBaseline = {
  xpTotal: number;
  attemptCounts: Readonly<Record<string, number>>;
};

const EMPTY_PROGRESS_STORAGE = JSON.stringify({
  version: 3,
  state: {
    xpTotal: 0,
    levels: {},
    placement: null,
    dailyGoal: null,
    updatedAt: 0,
    deletedAt: null,
  },
});

export function emptyProgressStorageJson(): string {
  return EMPTY_PROGRESS_STORAGE;
}

function objectValue(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mergeLevel(left: UnknownRecord, right: UnknownRecord): UnknownRecord {
  const leftCompleted = left.status === 'completed';
  const rightCompleted = right.status === 'completed';
  const completedAtValues = [left.completedAt, right.completedAt]
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  return {
    ...(finiteNumber(left.updatedAt) >= finiteNumber(right.updatedAt) ? right : left),
    ...(finiteNumber(left.updatedAt) >= finiteNumber(right.updatedAt) ? left : right),
    status: leftCompleted || rightCompleted ? 'completed' : (finiteNumber(left.updatedAt) >= finiteNumber(right.updatedAt) ? left.status : right.status),
    stars: Math.max(finiteNumber(left.stars), finiteNumber(right.stars)),
    bestAccuracy: Math.max(finiteNumber(left.bestAccuracy), finiteNumber(right.bestAccuracy)),
    attemptCount: Math.max(finiteNumber(left.attemptCount), finiteNumber(right.attemptCount)),
    lastAttemptAt: Math.max(finiteNumber(left.lastAttemptAt), finiteNumber(right.lastAttemptAt)) || undefined,
    completedAt: completedAtValues.length === 0 ? undefined : Math.min(...completedAtValues),
    updatedAt: Math.max(finiteNumber(left.updatedAt), finiteNumber(right.updatedAt)),
    deletedAt: null,
  };
}

function mergeLevels(left: unknown, right: unknown): UnknownRecord {
  const leftLevels = objectValue(left) ?? {};
  const rightLevels = objectValue(right) ?? {};
  const result: UnknownRecord = { ...leftLevels };
  for (const [levelId, value] of Object.entries(rightLevels)) {
    const rightLevel = objectValue(value);
    const leftLevel = objectValue(result[levelId]);
    result[levelId] = rightLevel === null
      ? result[levelId]
      : leftLevel === null
        ? rightLevel
        : mergeLevel(leftLevel, rightLevel);
  }
  return result;
}

export function mergeProgressStorageJson(localJson: string | null, remoteJson: string): string {
  try {
    const remoteEnvelope = objectValue(JSON.parse(remoteJson));
    if (remoteEnvelope === null) return localJson ?? remoteJson;
    if (localJson === null) return remoteJson;
    const localEnvelope = objectValue(JSON.parse(localJson));
    const localState = objectValue(localEnvelope?.state);
    const remoteState = objectValue(remoteEnvelope.state);
    if (localEnvelope === null || localState === null || remoteState === null) return remoteJson;

    const localUpdated = finiteNumber(localState.updatedAt);
    const remoteUpdated = finiteNumber(remoteState.updatedAt);
    const newer = localUpdated >= remoteUpdated ? localState : remoteState;
    const mergedState: UnknownRecord = {
      ...newer,
      xpTotal: Math.max(finiteNumber(localState.xpTotal), finiteNumber(remoteState.xpTotal)),
      levels: mergeLevels(localState.levels, remoteState.levels),
      updatedAt: Math.max(localUpdated, remoteUpdated),
      deletedAt: null,
    };
    return JSON.stringify({
      ...(finiteNumber(localEnvelope.version) >= finiteNumber(remoteEnvelope.version)
        ? remoteEnvelope
        : localEnvelope),
      ...(finiteNumber(localEnvelope.version) >= finiteNumber(remoteEnvelope.version)
        ? localEnvelope
        : remoteEnvelope),
      state: mergedState,
      version: Math.max(finiteNumber(localEnvelope.version), finiteNumber(remoteEnvelope.version)),
    });
  } catch {
    return localJson ?? remoteJson;
  }
}

export function applyAttemptToProgressStorageJson(
  storageJson: string,
  attempt: SyncedLearningAttempt,
): string {
  try {
    const envelope = objectValue(JSON.parse(storageJson));
    const state = objectValue(envelope?.state);
    if (envelope === null || state === null) return storageJson;
    const levels = objectValue(state.levels) ?? {};
    const previous = objectValue(levels[attempt.levelId]);
    const completedAt = previous === null
      ? attempt.completedAt
      : Math.min(finiteNumber(previous.completedAt, attempt.completedAt), attempt.completedAt);
    const nextLevel: UnknownRecord = {
      ...(previous ?? {}),
      levelId: attempt.levelId,
      status: 'completed',
      stars: Math.max(finiteNumber(previous?.stars), attempt.stars),
      bestAccuracy: Math.max(finiteNumber(previous?.bestAccuracy), attempt.accuracy),
      attemptCount: finiteNumber(previous?.attemptCount) + 1,
      lastAttemptAt: attempt.completedAt,
      completedAt,
      updatedAt: attempt.completedAt,
      deletedAt: null,
    };
    return JSON.stringify({
      ...envelope,
      state: {
        ...state,
        xpTotal: finiteNumber(state.xpTotal) + Math.max(0, attempt.xpEarned),
        levels: { ...levels, [attempt.levelId]: nextLevel },
        updatedAt: Math.max(finiteNumber(state.updatedAt), attempt.completedAt),
        deletedAt: null,
      },
    });
  } catch {
    return storageJson;
  }
}

/**
 * Son snapshot eşzamanlı cihazlardan birinin olayını içermese bile bütün
 * benzersiz ders denemelerinden monoton alt sınırı yeniden kurar.
 */
export function reconcileProgressStorageJson(
  storageJson: string,
  attempts: readonly SyncedLearningAttempt[],
  baseline: ProgressEventBaseline = { xpTotal: 0, attemptCounts: {} },
): string {
  try {
    const envelope = objectValue(JSON.parse(storageJson));
    const initialState = objectValue(envelope?.state);
    if (envelope === null || initialState === null) return storageJson;

    const grouped = new Map<string, SyncedLearningAttempt[]>();
    for (const attempt of attempts) {
      const list = grouped.get(attempt.levelId) ?? [];
      list.push(attempt);
      grouped.set(attempt.levelId, list);
    }

    const levels = { ...(objectValue(initialState.levels) ?? {}) };
    for (const [levelId, levelAttempts] of grouped) {
      const previous = objectValue(levels[levelId]);
      const completedAt = Math.min(...levelAttempts.map((attempt) => attempt.completedAt));
      const lastAttemptAt = Math.max(...levelAttempts.map((attempt) => attempt.completedAt));
      levels[levelId] = {
        ...(previous ?? {}),
        levelId,
        status: 'completed',
        stars: Math.max(
          finiteNumber(previous?.stars),
          ...levelAttempts.map((attempt) => Math.max(0, Math.min(3, attempt.stars))),
        ),
        bestAccuracy: Math.max(
          finiteNumber(previous?.bestAccuracy),
          ...levelAttempts.map((attempt) => Math.max(0, Math.min(1, attempt.accuracy))),
        ),
        attemptCount: Math.max(
          finiteNumber(previous?.attemptCount),
          Math.max(0, finiteNumber(baseline.attemptCounts[levelId])) + levelAttempts.length,
        ),
        completedAt: Math.min(finiteNumber(previous?.completedAt, completedAt), completedAt),
        lastAttemptAt: Math.max(finiteNumber(previous?.lastAttemptAt), lastAttemptAt),
        updatedAt: Math.max(finiteNumber(previous?.updatedAt), lastAttemptAt),
        deletedAt: null,
      };
    }

    const attemptXp = attempts.reduce(
      (total, attempt) => total + Math.max(0, attempt.xpEarned),
      0,
    );
    const latestAttempt = attempts.reduce(
      (latest, attempt) => Math.max(latest, attempt.completedAt),
      0,
    );
    return JSON.stringify({
      ...envelope,
      state: {
        ...initialState,
        xpTotal: Math.max(
          finiteNumber(initialState.xpTotal),
          Math.max(0, baseline.xpTotal) + attemptXp,
        ),
        levels,
        updatedAt: Math.max(finiteNumber(initialState.updatedAt), latestAttempt),
        deletedAt: null,
      },
    });
  } catch {
    return storageJson;
  }
}
