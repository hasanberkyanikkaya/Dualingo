import type { OrderingRacePuzzle, OrderingRaceSession, Timestamp } from '@/types';
import { shuffleSeeded } from '@/lib/shuffle';

export const ORDERING_RACE_DURATION_MS = 60_000;
export const ORDERING_RACE_POINTS_PER_CORRECT = 100;

export function shuffleOrderingRaceItems(
  puzzle: OrderingRacePuzzle,
  seed: string,
): OrderingRacePuzzle['items'][number][] {
  const shuffled = shuffleSeeded(puzzle.items, seed);
  const alreadyCorrect = shuffled.every(
    (item, index) => item.id === puzzle.correctOrder[index],
  );
  if (alreadyCorrect && shuffled.length > 1) {
    shuffled.push(shuffled.shift() as OrderingRacePuzzle['items'][number]);
  }
  return shuffled;
}

export function createOrderingRaceSession(): OrderingRaceSession {
  return {
    status: 'ready',
    startedAt: null,
    deadlineAt: null,
    puzzleIndex: 0,
    placedIds: [],
    score: 0,
    correctCount: 0,
    attemptCount: 0,
    lastResult: null,
    finishReason: null,
  };
}

function validNow(now: Timestamp): boolean {
  return Number.isFinite(now) && now >= 0;
}

export function startOrderingRace(
  puzzleCount: number,
  now: Timestamp,
): OrderingRaceSession {
  if (!Number.isInteger(puzzleCount) || puzzleCount <= 0 || !validNow(now)) {
    return {
      ...createOrderingRaceSession(),
      status: 'finished',
      finishReason: 'completed',
    };
  }

  return {
    ...createOrderingRaceSession(),
    status: 'playing',
    startedAt: now,
    deadlineAt: now + ORDERING_RACE_DURATION_MS,
  };
}

export function advanceOrderingRaceTime(
  session: OrderingRaceSession,
  now: Timestamp,
): OrderingRaceSession {
  if (
    session.status !== 'playing' ||
    session.deadlineAt === null ||
    !validNow(now) ||
    now < session.deadlineAt
  ) {
    return session;
  }

  return {
    ...session,
    status: 'finished',
    placedIds: [],
    lastResult: null,
    finishReason: 'time',
  };
}

export function remainingOrderingRaceSeconds(
  session: OrderingRaceSession,
  now: Timestamp,
): number {
  if (session.status === 'ready') {
    return ORDERING_RACE_DURATION_MS / 1000;
  }
  if (session.status !== 'playing' || session.deadlineAt === null || !validNow(now)) {
    return 0;
  }
  return Math.max(0, Math.ceil((session.deadlineAt - now) / 1000));
}

export function toggleOrderingRaceItem(
  session: OrderingRaceSession,
  itemId: string,
  allowedIds: readonly string[],
  now: Timestamp,
): OrderingRaceSession {
  const active = advanceOrderingRaceTime(session, now);
  if (
    active.status !== 'playing' ||
    itemId.length === 0 ||
    !allowedIds.includes(itemId)
  ) {
    return active;
  }

  const placedIds = active.placedIds.includes(itemId)
    ? active.placedIds.filter((id) => id !== itemId)
    : [...active.placedIds, itemId];

  return { ...active, placedIds, lastResult: null };
}

function isCorrectOrder(
  placedIds: readonly string[],
  correctOrder: readonly string[],
): boolean {
  return (
    placedIds.length === correctOrder.length &&
    placedIds.every((id, index) => id === correctOrder[index])
  );
}

export function submitOrderingRaceAnswer(
  session: OrderingRaceSession,
  puzzle: OrderingRacePuzzle,
  puzzleCount: number,
  now: Timestamp,
): OrderingRaceSession {
  const active = advanceOrderingRaceTime(session, now);
  if (
    active.status !== 'playing' ||
    active.placedIds.length !== puzzle.items.length ||
    puzzle.items.length < 2
  ) {
    return active;
  }

  const attemptCount = active.attemptCount + 1;
  if (!isCorrectOrder(active.placedIds, puzzle.correctOrder)) {
    return { ...active, attemptCount, lastResult: 'incorrect' };
  }

  const score = active.score + ORDERING_RACE_POINTS_PER_CORRECT;
  const correctCount = active.correctCount + 1;
  const completedDeck = active.puzzleIndex + 1 >= puzzleCount;

  return {
    ...active,
    status: completedDeck ? 'finished' : 'playing',
    puzzleIndex: completedDeck ? active.puzzleIndex : active.puzzleIndex + 1,
    placedIds: [],
    score,
    correctCount,
    attemptCount,
    lastResult: 'correct',
    finishReason: completedDeck ? 'completed' : null,
  };
}
