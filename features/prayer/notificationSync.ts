import {
  applySchedule,
  cancelPrayerNotifications,
  getPermission,
} from '@/features/prayer/notifications';
import { readPrayerTimesRange, readSelectedDistrict } from '@/features/prayer/prayerDb';
import { readNotificationPrefs } from '@/features/prayer/prayerNotificationDb';
import { SCHEDULE_HORIZON_DAYS, planNotifications, planSignature } from '@/features/prayer/prayerNotify';
import { addDays, toLocalIsoDate } from '@/features/progress/streak';

/**
 * Bildirimlerin diskle eşitlendiği TEK KAPI.
 *
 * Üç girdi (izin, seçili ilçe, tercihler) ve bir çıktı (işletim sistemine
 * kurulmuş kayıtlar). Çağıranların hiçbiri bu üçünü ayrı ayrı bilmiyor; hepsi
 * yalnızca "bir şey değişmiş olabilir" diyor.
 *
 * ⚠️ **Bu dosya `store.ts`e DOKUNMUYOR ve store da buna dokunmuyor.**
 * Zamanlama bir yaşam döngüsü işi; store'a konsaydı `set` updater'ının iki kez
 * çalışması tuzağı (React 19 + `reactCompiler`, projede beş kez ısırdı) bir kez
 * daha sınanmış olurdu. Çağrı yerleri: `app/_layout.tsx` (açılış + ön plan),
 * `usePrayerTimes` (ilçe/gün değişimi) ve ayar ekranı.
 *
 * Test **yazılamaz** (yerel modül); sınanabilir olan her kural
 * `prayerNotify.ts`te.
 */

/**
 * En son kurulan planın parmak izi.
 *
 * ⚠️ Store alanı DEĞİL, modül değişkeni — bir arayüz durumu değil, bir
 * zamanlama politikası girdisi (`store.attemptedThisSession`in aynı gerekçesi).
 * Ön plana her gelişte 60 kaydı iptal edip yeniden kurmak pil ve gecikme
 * maliyeti; imza değişmediyse hiçbir yerel çağrı yapılmıyor.
 *
 * ⚠️ **Süreç ömürlü ve öyle kalmalı.** Soğuk açılışta imza boştur ve plan her
 * zaman yeniden kurulur — bu doğru davranış: aradan tetiklenmiş bildirimler
 * olabilir ve işletim sistemindeki liste bizim hatırladığımızdan kısadır.
 */
let lastSignature: string | null = null;

/** Aynı anda iki eşitleme koşmasın — ön plana dönüş ile ekran açılışı çakışabilir. */
let syncInFlight: Promise<void> | null = null;

async function run(): Promise<void> {
  // ⚠️ İzin ÖNCE sorulmalı ve verilmemişse kayıtlar TEMİZLENMELİ: kullanıcı
  // izni sistem ayarlarından kapatmış olabilir ve eskiden kurulmuş kayıtlar
  // orada yetim kalırdı. İzin durumunun bizde bir kopyası yok, tam da bu yüzden.
  const permission = await getPermission();
  if (permission !== 'granted') {
    lastSignature = null;
    await cancelPrayerNotifications();
    return;
  }

  const district = readSelectedDistrict();
  if (district === null) {
    lastSignature = null;
    await cancelPrayerNotifications();
    return;
  }

  const now = Date.now();
  const todayIso = toLocalIsoDate(now);
  const horizon = addDays(todayIso, SCHEDULE_HORIZON_DAYS);

  const rows =
    horizon === null ? [] : readPrayerTimesRange(district.districtId, todayIso, horizon);

  const planned = planNotifications(rows, readNotificationPrefs(), now);
  const signature = planSignature(planned);

  // ⚠️ Boş plan da kurulur (yani her şey iptal edilir): kullanıcı son vakti de
  // kapattıysa eskiden kurulmuş kayıtların gitmesi gerekir.
  if (signature === lastSignature) {
    return;
  }

  await applySchedule(planned);
  lastSignature = signature;
}

/**
 * Bildirimleri diskteki gerçeğe göre yeniden kurar.
 *
 * Hiçbir zaman fırlatmaz ve çağıran sonucu beklemek zorunda değil —
 * `void syncPrayerNotifications()` olağan kullanım.
 */
export function syncPrayerNotifications(): Promise<void> {
  if (syncInFlight !== null) {
    return syncInFlight;
  }

  const task = run()
    .catch((error: unknown) => {
      if (__DEV__) {
        console.warn('[prayer/notificationSync] Eşitleme başarısız.', error);
      }
    })
    .finally(() => {
      syncInFlight = null;
    });

  syncInFlight = task;
  return task;
}

/**
 * İmzayı düşürür — bir sonraki eşitleme planı KOŞULSUZ yeniden kurar.
 *
 * Ayar ekranının kullandığı kaçış kapağı: tercih değişimi planı değiştirmemiş
 * olabilir (ör. kapalı bir vaktin gecikmesi düzenlendi) ama kullanıcı bir şey
 * yaptığında sonucun diske yansıdığından emin olmak isteriz.
 */
export function invalidateNotificationPlan(): void {
  lastSignature = null;
}
