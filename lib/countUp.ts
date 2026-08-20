/**
 * Sayan sayaç için saf ara değer hesabı.
 *
 * React ve Reanimated bilmiyor: girdisi geçen süre, çıktısı o an gösterilecek
 * tam sayı. Saf olduğu için Node test koşucusunda olduğu gibi çalışıyor —
 * "ekranda NaN göründü" sınıfı bir hata elle sınamayı beklemeden yakalanır.
 */

/**
 * `elapsed` anında gösterilecek değer.
 *
 * Yumuşatma `1-(1-t)²` (ease-out): sayı hızlı başlar, hedefe yaslanarak biter.
 * `motion.ts`'in `Easing.out` ailesiyle aynı his — orada süre, burada sayı.
 *
 * ⚠️ **Bozuk girdi sessizce HEDEFİ verir**, ara bir değer değil: `NaN`,
 * `Infinity`, `duration <= 0`, negatif `target`. `ProgressBar`'ın "bozuk girdi
 * sessizce boş çubuk" disiplininin bu ekrandaki karşılığı — ama tersi yönde,
 * çünkü burada güvenli hâl BOŞ değil TAM: kullanıcı kazandığı XP'yi eksik
 * görmemeli. Ekranda `NaN XP` yazması kabul edilemez.
 */
export function countUpValue(target: number, elapsed: number, duration: number): number {
  if (!Number.isFinite(target) || target <= 0) {
    return Number.isFinite(target) ? target : 0;
  }
  if (!Number.isFinite(elapsed) || !Number.isFinite(duration) || duration <= 0) {
    return target;
  }
  if (elapsed <= 0) {
    return 0;
  }
  if (elapsed >= duration) {
    return target;
  }

  const t = elapsed / duration;
  const eased = 1 - (1 - t) * (1 - t);

  // ⚠️ `round` değil `floor`: `round` son karede hedefe ulaşmadan hedefi
  // yazardı ve sayaç bitmeden bitmiş görünürdü. Aşağıdaki `min` yalnızca
  // kayan nokta artığına karşı.
  return Math.min(target, Math.floor(eased * target));
}
