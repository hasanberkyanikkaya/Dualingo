import type { ContentEnvelope } from './learning';

export type OrderingRaceItem = {
  id: string;
  text: string;
};

export type OrderingRacePuzzle = {
  id: string;
  prompt: string;
  items: readonly OrderingRaceItem[];
  correctOrder: readonly string[];
};

export type OrderingRaceContent = {
  id: 'ordering-race';
  title: string;
  description: string;
  puzzles: readonly OrderingRacePuzzle[];
};

export type OrderingRaceContentFile = ContentEnvelope<OrderingRaceContent>;

export type OrderingRaceStatus = 'ready' | 'playing' | 'finished';
export type OrderingRaceFinishReason = 'time' | 'completed' | null;
export type OrderingRaceAnswerResult = 'correct' | 'incorrect' | null;

/** Tek bir 60 saniyelik koşunun saf, kalıcı olmayan durumu. */
export type OrderingRaceSession = {
  status: OrderingRaceStatus;
  startedAt: number | null;
  deadlineAt: number | null;
  puzzleIndex: number;
  placedIds: readonly string[];
  score: number;
  correctCount: number;
  attemptCount: number;
  lastResult: OrderingRaceAnswerResult;
  finishReason: OrderingRaceFinishReason;
};
