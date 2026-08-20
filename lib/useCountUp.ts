import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { countUpValue } from '@/lib/countUp';

type CountUpOptions = {
  /** Sayma süresi (ms). */
  duration: number;
  /** Saymaya başlamadan önce beklenen süre (ms) — sahne sıralaması için. */
  delay?: number;
  /** `false` ise sayaç hiç kurulmaz, değer doğrudan hedeftir. */
  enabled?: boolean;
};

/**
 * Bir sayıyı 0'dan hedefe saydıran kanca.
 *
 * ⚠️ **Reanimated paylaşılan değeriyle YAZILMADI ve bu bilinçli.** Paylaşılan
 * bir değer JS iş parçacığına ancak `useAnimatedProps` +
 * `Animated.createAnimatedComponent(TextInput)` hilesiyle metin olarak
 * yansıtılabiliyor; bu, gösterilecek sayıyı bir GİRDİ alanına koymak demek —
 * erişilebilirlik ağacında yanlış rol, tipografi jetonlarını uygulamayan bir
 * bileşen ve klavye riski. Sayan tek bir satır için ödenecek bedel değil.
 * Sayaç ~700 ms boyunca kare başına bir `setState` yapıyor; o sırada ekranda
 * başka hiçbir şey değişmediği için maliyeti görünmüyor.
 *
 * `enabled` false ya da kullanıcı "hareketi azalt" diyorsa hiç döngü kurulmaz,
 * değer doğrudan hedeftir (`motion.ts` doktrini: kesme JS tarafında yapılır).
 */
export function useCountUp(target: number, options: CountUpOptions): number {
  const { duration, delay = 0, enabled = true } = options;

  const reduceMotion = useReducedMotion();
  const skip = !enabled || reduceMotion;

  const [value, setValue] = useState(() => (skip ? target : 0));

  useEffect(() => {
    if (skip) {
      setValue(target);
      return;
    }

    // ⚠️ Başlangıç anı etkinin İÇİNDE okunuyor: hedef ya da süre değişirse
    // sayaç baştan başlar, kaldığı yerden değil. Ders sonu ekranında hedef hiç
    // değişmiyor ama kancayı o varsayıma bağlamak gereksiz bir tuzak olurdu.
    const startedAt = Date.now();
    let frame = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - startedAt - delay;
      // Gecikme boyunca sayaç 0'da bekler; `countUpValue` negatif süreyi zaten
      // 0 olarak karşılıyor, burada ayrıca dallanmaya gerek yok.
      setValue(countUpValue(target, elapsed, duration));

      if (elapsed < duration) {
        frame = requestAnimationFrame(tick);
      }
    });

    // StrictMode etkiyi iki kez kurup ilkini temizliyor; iptal edilen döngü iz
    // bırakmıyor çünkü tek yazdığı yer bu bileşenin kendi durumu.
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay, skip]);

  return value;
}
