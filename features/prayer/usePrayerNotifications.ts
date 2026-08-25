import { useCallback, useEffect, useState } from 'react';

import { getPermission, requestPermission } from '@/features/prayer/notifications';
import { TRACKABLE_PRAYERS } from '@/features/prayer/prayerDay';
import {
  invalidateNotificationPlan,
  syncPrayerNotifications,
} from '@/features/prayer/notificationSync';
import {
  readNotificationPrefs,
  setAllNotificationPrefs,
  setNotificationPref,
} from '@/features/prayer/prayerNotificationDb';
import { resolvePref } from '@/features/prayer/prayerNotify';

import type { NotificationPermission } from '@/features/prayer/notifications';
import type { PrayerName, PrayerNotificationOffset, PrayerNotificationPrefMap } from '@/types';

/**
 * Bildirim ayar ekranının store'a ve diske tek bağlantı noktası.
 *
 * ⚠️ **Zustand store'a alan EKLENMEDİ.** Namaz store'u uygulama ömrü boyunca
 * yaşıyor; bildirim tercihleri ise yalnızca bu ekran açıkken okunuyor ve
 * ekranla birlikte ölüyor. `usePrayerChart`in aralık durumunu store'a
 * koymama kararının (4.3) aynısı.
 *
 * ⚠️ Tercihler diskten SENKRON okunuyor (ilk `useState` değeri): anahtarlar ilk
 * karede doğru konumda çizilmeli, bir kare "hepsi açık" görünüp sonra yerine
 * oturmamalı (2.4 depolama kararı).
 */
export function usePrayerNotifications() {
  const [prefs, setPrefs] = useState<PrayerNotificationPrefMap>(() => readNotificationPrefs());
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  /**
   * ⚠️ **İzin ekran açılırken İSTENİYOR, bir anahtar açılınca değil.**
   * Kullanıcı kararı "beş vakit açık gelsin"di; izin ilk dokunuşa bırakılsaydı
   * ekran beş anahtarı açık gösterip hiçbir şey kurmaz, kullanıcı da bunu
   * göremezdi. İzin zaten verilmişse sistem istemi çıkmaz.
   */
  useEffect(() => {
    let alive = true;

    void (async () => {
      const current = await getPermission();
      const resolved = current === 'denied' ? await requestPermission() : current;

      if (!alive) {
        return;
      }

      setPermission(resolved);
      void syncPrayerNotifications();
    })();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * Bir vaktin tercihini yazar ve planı yeniden kurar.
   *
   * ⚠️ Diske yazma `setPrefs` güncelleyicisinin DIŞINDA: React 19 +
   * `reactCompiler` güncelleyiciyi iki kez çalıştırıyor (projede altıncı kez).
   * Burada iki kez yazmak idempotent olurdu ama kural kuraldır.
   */
  const write = useCallback(
    (prayer: PrayerName, enabled: boolean, offsetMinutes: PrayerNotificationOffset) => {
      const now = Date.now();
      setNotificationPref(prayer, enabled, offsetMinutes, now);

      setPrefs((current) => ({
        ...current,
        [prayer]: { prayer, enabled, offsetMinutes, updatedAt: now, deletedAt: null },
      }));

      // Kullanıcı bir şey yaptıysa sonucun diske yansıdığından emin olmak
      // isteriz; plan değişmemiş olsa bile imza düşürülüyor.
      invalidateNotificationPlan();
      void syncPrayerNotifications();
    },
    [],
  );

  const toggle = useCallback(
    (prayer: PrayerName) => {
      const current = resolvePref(prefs, prayer);
      write(prayer, !current.enabled, current.offsetMinutes);
    },
    [prefs, write],
  );

  const setOffset = useCallback(
    (prayer: PrayerName, offsetMinutes: PrayerNotificationOffset) => {
      const current = resolvePref(prefs, prayer);
      write(prayer, current.enabled, offsetMinutes);
    },
    [prefs, write],
  );

  const setAll = useCallback((enabled: boolean) => {
    const now = Date.now();
    setAllNotificationPrefs(TRACKABLE_PRAYERS, enabled, 0, now);

    const next: PrayerNotificationPrefMap = {};
    for (const prayer of TRACKABLE_PRAYERS) {
      next[prayer] = {
        prayer,
        enabled,
        offsetMinutes: 0,
        updatedAt: now,
        deletedAt: null,
      };
    }
    setPrefs(next);
    invalidateNotificationPlan();
    void syncPrayerNotifications();
  }, []);

  /** İzin ekranı arka planda değişmiş olabilir (kullanıcı ayarlara gidip döndü). */
  const refreshPermission = useCallback(() => {
    void (async () => {
      setPermission(await getPermission());
      void syncPrayerNotifications();
    })();
  }, []);

  return { prefs, permission, toggle, setOffset, setAll, refreshPermission };
}
