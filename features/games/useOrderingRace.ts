import { useCallback, useState } from 'react';

import { getOrderingRaceContent } from '@/features/games/contentLoader';
import {
  advanceOrderingRaceTime,
  createOrderingRaceSession,
  startOrderingRace,
  submitOrderingRaceAnswer,
  toggleOrderingRaceItem,
} from '@/features/games/orderingRaceEngine';

const content = getOrderingRaceContent();

export function useOrderingRace() {
  const [session, setSession] = useState(createOrderingRaceSession);

  const start = useCallback(() => {
    setSession(startOrderingRace(content.puzzles.length, Date.now()));
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setSession((current) => {
      const puzzle = content.puzzles[current.puzzleIndex];
      if (puzzle === undefined) {
        return current;
      }
      return toggleOrderingRaceItem(
        current,
        itemId,
        puzzle.items.map((item) => item.id),
        Date.now(),
      );
    });
  }, []);

  const submit = useCallback(() => {
    setSession((current) => {
      const puzzle = content.puzzles[current.puzzleIndex];
      return puzzle === undefined
        ? current
        : submitOrderingRaceAnswer(current, puzzle, content.puzzles.length, Date.now());
    });
  }, []);

  const expire = useCallback(() => {
    setSession((current) => advanceOrderingRaceTime(current, Date.now()));
  }, []);

  return {
    content,
    session,
    currentPuzzle: content.puzzles[session.puzzleIndex] ?? null,
    start,
    toggleItem,
    submit,
    expire,
  };
}
