import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { lookupCoordinates, watchHeading } from '@/features/prayer/location';
import {
  headingQuality,
  isAligned,
  normalizeDegrees,
  qiblaBearing,
  shouldEmit,
  signedDelta,
  unwrapRotation,
} from '@/features/prayer/qibla';
import strings from '@/constants/strings';

import type { HeadingUnsubscribe } from '@/features/prayer/location';
import type { HeadingQuality } from '@/features/prayer/qibla';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Kıble ekranının durumu. ⚠️ `enum` DEĞİL union (Node tip soyucusu; `tests/setup.ts`).
 *
 * `denied` ile `unavailable` ayrı çünkü kullanıcıya söylenecek şey farklı:
 * biri "izin vermedin", diğeri "veremedim" (`LocationLookup`ün aynı ayrımı).
 */
export type QiblaStatus = 'locating' | 'ready' | 'denied' | 'unavailable';

export type QiblaState = {
  status: QiblaStatus;
  /** Kıble azimutu (derece, gerçek kuzeyden). Koordinat gelince bir kez sabitlenir. */
  bearing: number | null;
  /** Kadranın biriken açısı — YÜKSEK FREKANS, yalnızca `QiblaDial` okur. */
  rotation: SharedValue<number>;
  /** Kâbe ile telefonun burnu arasındaki işaretli fark, 1° adımlı. */
  delta: number | null;
  aligned: boolean;
  quality: HeadingQuality;
  retry: () => void;
};

/**
 * Kıble ekranının konuma, pusulaya ve saf matematiğe tek bağlantı noktası.
 *
 * ⚠️ **Zustand store'a alan EKLENMEDİ.** Namaz store'u uygulama ömrü boyunca
 * yaşıyor; kıble durumu ise yalnızca bu ekran açıkken anlamlı ve ekranla
 * birlikte ölmeli — kapatıldıktan sonra bellekte duran bir yön değeri hiçbir
 * işe yaramaz, üstelik ilk karede bayat gösterirdi. `usePrayerChart`in (4.3)
 * aralık durumunu ve `usePrayerNotifications`ın (4.4) tercihleri store'a
 * koymama kararının aynısı.
 *
 * ⚠️ **İKİ KANAL — bu dosyanın en önemli kararı.** Yön verisi saniyede onlarca
 * kez geliyor. Hepsini React durumuna yazmak ekrandaki her metni, kalibrasyon
 * kartını ve kıble saati panelini o hızda yeniden çizerdi.
 *
 *  | Kanal          | Taşıdığı        | Nasıl                                     |
 *  |----------------|-----------------|-------------------------------------------|
 *  | yüksek frekans | kadranın açısı  | `useSharedValue`, geri çağrımda DOĞRUDAN  |
 *  |                |                 | yazılıyor. Sıfır React yeniden çizimi.    |
 *  | düşük frekans  | delta/hizalanma | `setState`, yalnızca `shouldEmit` geçince |
 *
 * 4.1'in **"geri sayım yalnızca `CountdownLabel`de tik atar"** kararının bu
 * modüldeki karşılığı: hızlı değişen değer mümkün olan en küçük yüzeye
 * hapsediliyor.
 *
 * ⚠️ **Ekran okuyucuya sürekli değer OKUTULMUYOR.** `delta` bir
 * `accessibilityLabel`e bağlansaydı ekran okuyucu saniyede birkaç kez farklı
 * bir açı anons eder ve ekran kullanılamaz hâle gelirdi. Anons yalnızca
 * hizalanma DEĞİŞTİĞİNDE ve bir kez yapılıyor (3.3'ün `useCountUp` ve 4.1'in
 * `prayerRemaining` kararlarının üçüncü uygulaması).
 *
 * Test yazılamaz (yerel modül); karar mantığının tamamı `qibla.ts`te ve testli.
 */
export function useQibla(): QiblaState {
  const [status, setStatus] = useState<QiblaStatus>('locating');
  const [bearing, setBearing] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [quality, setQuality] = useState<HeadingQuality>('unknown');
  const [attempt, setAttempt] = useState(0);

  const rotation = useSharedValue(0);

  /*
   * ⚠️ Üç `ref` ve üçü de durum DEĞİL: geri çağrımın içinde okunuyorlar ve
   * değişmeleri yeniden çizim gerektirmiyor. Durum olsalardı `handleHeading`
   * her ölçümde yeniden kurulur, abonelik de onunla birlikte kopardı.
   */
  const bearingRef = useRef<number | null>(null);
  const emittedRef = useRef<number | null>(null);
  const alignedRef = useRef(false);

  const handleHeading = useCallback(
    (degrees: number, accuracy: number | null) => {
      // Yüksek frekans kanalı: ham açı değil, BİRİKEN açı yazılıyor — yoksa
      // kadran 359°→1° geçişinde tam tur geri sıçrardı (`unwrapRotation`).
      rotation.value = unwrapRotation(rotation.value, normalizeDegrees(degrees));

      const currentBearing = bearingRef.current;
      if (currentBearing === null) {
        return;
      }

      // Düşük frekans kanalı: eşiği geçmeyen değişim duruma HİÇ yazılmıyor.
      if (!shouldEmit(emittedRef.current, degrees)) {
        return;
      }
      emittedRef.current = degrees;

      const nextDelta = signedDelta(degrees, currentBearing);
      setDelta(nextDelta);
      setQuality(headingQuality(accuracy));

      const nextAligned = isAligned(nextDelta);
      if (nextAligned !== alignedRef.current) {
        alignedRef.current = nextAligned;
        if (nextAligned) {
          // ⚠️ Tek seferlik anons. Sürekli okunsaydı ekran okuyucu kullanıcısı
          // için bu ekran hiç kullanılamazdı.
          AccessibilityInfo.announceForAccessibility(strings.a11y.qiblaAligned);
        }
      }
    },
    [rotation],
  );

  useEffect(() => {
    let alive = true;
    let stop: HeadingUnsubscribe | null = null;

    setStatus('locating');
    setDelta(null);
    setQuality('unknown');
    emittedRef.current = null;
    alignedRef.current = false;

    void (async () => {
      const lookup = await lookupCoordinates();
      if (!alive) {
        return;
      }

      if (lookup.kind !== 'ok') {
        setStatus(lookup.kind === 'denied' ? 'denied' : 'unavailable');
        return;
      }

      const resolved = qiblaBearing(lookup.coordinates);
      if (resolved === null) {
        // Kâbe'nin kendisi ya da bozuk koordinat. Uydurma bir açı göstermektense
        // dürüst boş durum (4.0'ın kararı).
        setStatus('unavailable');
        return;
      }

      bearingRef.current = resolved;
      setBearing(resolved);
      setStatus('ready');

      const unsubscribe = await watchHeading(handleHeading);

      // ⚠️ Abonelik kurulurken ekran kapanmış olabilir; o durumda hemen kapat.
      // Yoksa pusula ekrandan çıkıldıktan sonra pil yakmaya devam eder.
      if (!alive) {
        unsubscribe();
        return;
      }

      stop = unsubscribe;
    })();

    return () => {
      alive = false;
      if (stop !== null) {
        stop();
      }
    };
  }, [attempt, handleHeading]);

  /**
   * Yeniden dene — izin ekranından dönen ya da konumu açan kullanıcı için.
   * Sayacı artırmak yukarıdaki etkinin tamamını (izin → koordinat → abonelik)
   * baştan çalıştırıyor; ayrı bir kod yolu yok.
   */
  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    status,
    bearing,
    rotation,
    delta,
    aligned: delta !== null && isAligned(delta),
    quality,
    retry,
  };
}
