import { useEffect, useRef, useState } from 'react';

/** Hedef ana kalan süreyi gerçek saate göre izler; interval kaymasını biriktirmez. */
export function useGameCountdown(target: number, onElapsed: () => void): number {
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  const elapsedHandler = useRef(onElapsed);
  elapsedHandler.current = onElapsed;

  useEffect(() => {
    let fired = false;

    const tick = () => {
      const next = Math.max(0, target - Date.now());
      setRemaining(next);
      if (next === 0 && !fired) {
        fired = true;
        elapsedHandler.current();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return remaining;
}
