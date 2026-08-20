import { useEffect, useRef, useState } from 'react';

import type { Timestamp } from '@/types';

/**
 * Hedef ana kalan süre, saniyede bir güncellenir.
 *
 * ⚠️ **Yalnızca yaprak bileşende çağrılmalı** (`CountdownLabel`). Karta ya da
 * ekrana konsaydı saniyede bir kez tüm tablo yeniden çizilirdi. 3.3'ün
 * "kancalar `.map` içinde çağrılamaz, her yıldız kendi bileşenine taşındı"
 * kararının aynı sınıftan devamı.
 *
 * ⚠️ Kalan her tikte `Date.now()`dan YENİDEN hesaplanıyor, bir sayaçtan
 * düşülmüyor: `setInterval` arka planda ve kısıtlama altında kayar, düşme
 * yöntemi o kaymayı biriktirir ve geri sayım gerçek saatten ayrışır.
 */
export function useCountdown(target: Timestamp | null, onElapsed?: () => void): number {
  const [remaining, setRemaining] = useState<number>(() =>
    target === null ? 0 : Math.max(0, target - Date.now()),
  );

  // ⚠️ `onElapsed` ref'te tutuluyor: çağrı yerinde her çizimde yeni bir
  // fonksiyon üretilirse aşağıdaki `useEffect` her çizimde intervali kurup
  // yıkardı ve geri sayım hiç ilerlemezdi.
  const handler = useRef(onElapsed);
  handler.current = onElapsed;

  useEffect(() => {
    if (target === null) {
      setRemaining(0);
      return;
    }

    // ⚠️ Hedef başına TEK atış. `onElapsed` store'u güncelliyor, o da yeni bir
    // `target` doğuruyor; koruma olmadan aradaki bir kare ikinci bir çağrı
    // yapabilirdi.
    let fired = false;

    const tick = () => {
      const left = Math.max(0, target - Date.now());
      setRemaining(left);

      if (left === 0 && !fired) {
        fired = true;
        handler.current?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [target]);

  return remaining;
}

/**
 * Kalan milisaniyeyi saat/dakika/saniyeye böler — saf.
 *
 * ⚠️ `floor` kullanılıyor: `round` son saniyeyi bitmeden bitmiş gösterirdi
 * (3.3'ün `countUpValue` kararının aynısı).
 */
export function splitRemaining(remaining: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safe = Number.isFinite(remaining) && remaining > 0 ? remaining : 0;
  const total = Math.floor(safe / 1000);

  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
