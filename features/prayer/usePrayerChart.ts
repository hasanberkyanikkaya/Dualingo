import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  buildMonth,
  buildWeek,
  monthRange,
  nextStatus,
  weekRange,
  addMonths,
} from '@/features/prayer/prayerChart';
import { readPrayerLogRange } from '@/features/prayer/prayerLogDb';
import { usePrayerStore } from '@/features/prayer/store';
import { addDays, toLocalIsoDate } from '@/features/progress/streak';

import type { ChartCell } from '@/features/prayer/prayerChart';
import type { IsoDate, PrayerMarkMap, PrayerName } from '@/types';

/** Görünüm kipi — hafta ya da ay. */
export type ChartMode = 'week' | 'month';

/**
 * Çizelge ekranının tek bağlantı noktası.
 *
 * ⚠️ **Aralık okuması store'da DEĞİL, burada.** Store bugünü tutuyor ve
 * uygulama ömrü boyunca yaşıyor; kullanıcının gezindiği hafta ya da ay ise
 * ekranla birlikte doğup ölen bir arayüz durumu. Store'a konsaydı ekran
 * kapandıktan sonra da bellekte durur ve ikinci bir bayatlama kaynağı olurdu.
 *
 * ⚠️ **Yazma yolu yine STORE'DAN geçiyor** (`setMark`). Buradan doğrudan
 * `setPrayerMark` çağrılsaydı bugüne yapılan bir düzenleme günlük tabloyu
 * güncellemez, kullanıcı iki ekranda iki farklı doğru görürdü.
 */
export function usePrayerChart() {
  const setMark = usePrayerStore((state) => state.setMark);

  // ⚠️ "Bugün" bir kez, kancanın ilk çiziminde donuyor ve `useFocusEffect`te
  // tazeleniyor. Her çizimde `Date.now()` okumak, gece yarısını geçen bir
  // ekranda hücrelerin sessizce düzenlenemez hâle gelmesi demekti — ama her
  // karede yeniden okumak da gereksiz. Odak kazanımı doğru uyanma anı.
  const [today, setToday] = useState<IsoDate>(() => toLocalIsoDate(Date.now()));
  const [mode, setMode] = useState<ChartMode>('week');
  const [anchor, setAnchor] = useState<IsoDate>(today);
  const [marksByDate, setMarksByDate] = useState<Record<IsoDate, PrayerMarkMap>>({});
  /** Ay görünümünde açılan düzenleme panelinin günü. */
  const [selectedDate, setSelectedDate] = useState<IsoDate | null>(null);

  const range = mode === 'week' ? weekRange(anchor) : monthRange(anchor);

  const reload = useCallback((from: IsoDate, to: IsoDate) => {
    setMarksByDate(readPrayerLogRange(from, to));
  }, []);

  // ⚠️ Ekrana her dönüşte yeniden okunuyor: kullanıcı günlük tabloda bir vakti
  // işaretleyip çizelgeye dönebilir ve o işaret burada da görünmeli. Aynı
  // etki gün dönümünü de yakalıyor.
  useFocusEffect(
    useCallback(() => {
      setToday(toLocalIsoDate(Date.now()));

      if (range !== null) {
        reload(range.from, range.to);
      }
      // `range` bir nesne ve her çizimde yeniden kuruluyor; bağımlılık olarak
      // sınırlarının kendisi veriliyor.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, range?.from, range?.to]),
  );

  const cells: ChartCell[] =
    range === null
      ? []
      : mode === 'week'
        ? buildWeek(anchor, marksByDate, today)
        : buildMonth(anchor, marksByDate, today);

  /**
   * Bir hücrenin bir vaktini bir sonraki duruma çevirir.
   *
   * Yazdıktan SONRA aralık yeniden okunuyor: doğruluk kaynağı disk, ekrandaki
   * nesne onun yansıması. İyimser güncelleme yapılsaydı yazma başarısız
   * olduğunda (veritabanı açılamamışsa `setPrayerMark` sessizce çıkıyor) ekran
   * olmayan bir işareti gösterirdi.
   */
  const cycle = useCallback(
    (date: IsoDate, prayer: PrayerName) => {
      const current = marksByDate[date]?.[prayer] ?? 'kilinmadi';
      setMark(date, prayer, nextStatus(current));

      if (range !== null) {
        reload(range.from, range.to);
      }
    },
    [marksByDate, range, reload, setMark],
  );

  /** Bir önceki / bir sonraki dönem. Hafta 7 gün, ay bir ay kayar. */
  const shift = useCallback(
    (delta: number) => {
      const moved = mode === 'week' ? addDays(anchor, delta * 7) : addMonths(anchor, delta);
      if (moved === null) {
        return;
      }

      setAnchor(moved);
      // Dönem değişince açık panel anlamını yitiriyor — kapanıyor.
      setSelectedDate(null);
    },
    [anchor, mode],
  );

  const goToToday = useCallback(() => {
    setAnchor(today);
    setSelectedDate(null);
  }, [today]);

  const changeMode = useCallback((next: ChartMode) => {
    setMode(next);
    setSelectedDate(null);
  }, []);

  return {
    mode,
    changeMode,
    anchor,
    today,
    cells,
    selectedDate,
    setSelectedDate,
    cycle,
    shift,
    goToToday,
  };
}
