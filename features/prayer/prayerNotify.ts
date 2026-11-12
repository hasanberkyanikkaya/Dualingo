/**
 * Bildirim planı — saf. `Date.now()` YOK; şimdi her zaman argüman.
 *
 * Bu dosya "hangi bildirim, ne zaman" sorusunun TAMAMINI cevaplıyor.
 * `notifications.ts` yalnızca burada üretilen listeyi işletim sistemine
 * kuruyor ve içinde tek bir karar dalı yok. `audioKey`/`audio` (2.5),
 * `dayLog`/`activityDb` (3.1), `districtMatch`/`location` (4.1) ayrımının
 * dördüncü uygulaması — ve gerekçesi hep aynı: yerel modüle dokunan hiçbir şey
 * Node test koşucusunda yüklenemez, dolayısıyla sınanmak isteyen her kural
 * yerel modülden uzak durmalı.
 */

import { TRACKABLE_PRAYERS } from '@/features/prayer/prayerDay';
import { localEpochFor } from '@/features/prayer/prayerSchedule';

import type {
  IsoDate,
  PlannedNotification,
  PrayerName,
  PrayerNotificationOffset,
  PrayerNotificationPrefMap,
  PrayerTimes,
  Timestamp,
} from '@/types';

/**
 * Ekranda gösterilen gecikme seçenekleri, sırasıyla.
 *
 * ⚠️ `as const` YOK ve bu bilinçli: dizi `readonly PrayerNotificationOffset[]`
 * olarak duruyor, tekil değerlerine daralmıyor. (3.1'in `STREAK_RULES`
 * kararının aynı gerekçesi.)
 */
export const NOTIFICATION_OFFSETS: readonly PrayerNotificationOffset[] = [0, 5, 10, 15, 30];

/**
 * Bizim kurduğumuz bildirimleri başkalarınınkinden ayıran etiket.
 *
 * ⚠️ İptal bu etikete göre yapılıyor, toptan DEĞİL. Faz 3'ün seri
 * hatırlatıcısı ya da başka bir tüketici geldiği gün
 * `cancelAllScheduledNotificationsAsync` onların kayıtlarını da sessizce
 * silerdi.
 */
export const NOTIFICATION_KIND = 'prayer-time';

/**
 * Aynı anda bekleyebilecek en fazla bildirim.
 *
 * ⚠️ **Bu kozmetik bir sayı DEĞİL, iOS'un sert sınırı.** iOS uygulama başına en
 * fazla **64** bekleyen yerel bildirim tutar ve fazlasını SESSİZCE atar —
 * hata yok, günlük yok, sadece tetiklenmeyen bildirimler. Beş vakit × 12 gün =
 * 60; kalan dört kayıt ileride başka bir tüketici (ör. seri hatırlatıcısı)
 * gelirse diye pay olarak bırakıldı.
 *
 * Sınırın sonucu mimari: zamanlama "bir kez kur ve unut" olamaz, **her ön plana
 * gelişte yeniden kurulan kayan bir pencere** olmak zorunda
 * (`notificationSync.ts`).
 */
export const MAX_SCHEDULED = 60;

/**
 * Diskten kaç günlük vakit okunacağı.
 *
 * `MAX_SCHEDULED`ten daha cömert, bilerek: bazı vakitler kapalı olabilir ve o
 * zaman aynı 60 kayıt daha uzak bir tarihe kadar uzanır. Kesme kararını sayı
 * (`MAX_SCHEDULED`) veriyor, bu sabit yalnızca okuma sınırı.
 *
 * ⚠️ Önbellek penceresi ~1 ay (4.0 ölçümü) ama pencere BUGÜNDEN BAŞLAMIYOR;
 * elde 15 günden az veri olması olağan bir durumdur, hata değil.
 */
export const SCHEDULE_HORIZON_DAYS = 15;

const MINUTE_MS = 60_000;

/**
 * Diskten (ya da başka bir yerden) gelen gecikmeyi bilinen kümeye daraltır.
 *
 * Tanınmayan her değer `0` — yani "vakit başında". Ekranın hiçbir seçeneği
 * seçili gösteremediği bir hâle düşmemesi için tek savunma bu.
 * (`prayerLogDb.toStatus`in aynı disiplini.)
 */
export function normalizeOffset(value: unknown): PrayerNotificationOffset {
  for (const offset of NOTIFICATION_OFFSETS) {
    if (value === offset) {
      return offset;
    }
  }

  return 0;
}

/**
 * Bir vaktin geçerli tercihi.
 *
 * ⚠️ **Eksik kayıt = AÇIK.** Kullanıcı kararı "beş vakit açık gelsin"di ve
 * varsayılan burada yaşıyor, tabloda değil (`lib/database.ts` `MIGRATIONS[6]`).
 *
 * ⚠️ Yumuşak silinmiş kayıt da varsayılana düşüyor — `deletedAt !== null` kaydı
 * "hiç yok" saymak projede tek kural (`levelStatus.ts`ten beri).
 */
export function resolvePref(
  prefs: PrayerNotificationPrefMap,
  prayer: PrayerName,
): { enabled: boolean; offsetMinutes: PrayerNotificationOffset } {
  const pref = prefs[prayer];

  if (pref === undefined || pref.deletedAt !== null) {
    return { enabled: true, offsetMinutes: 0 };
  }

  return { enabled: pref.enabled, offsetMinutes: normalizeOffset(pref.offsetMinutes) };
}

/**
 * Bütün vakitlerde kullanılacak tek gecikme ayarı.
 *
 * Eski sürüm her vakit için ayrı gecikme sakladığından yükseltmede en son
 * değiştirilen yaşayan tercih korunur. Yeni yazmalar aynı değeri bütün satırlara
 * yaydığı için bu seçim yalnız geriye dönük uyumluluk sırasında önem taşır.
 */
export function resolveNotificationOffset(
  prefs: PrayerNotificationPrefMap,
): PrayerNotificationOffset {
  let latestOffset: PrayerNotificationOffset = 0;
  let latestUpdatedAt = Number.NEGATIVE_INFINITY;

  for (const prayer of TRACKABLE_PRAYERS) {
    const pref = prefs[prayer];
    if (pref === undefined || pref.deletedAt !== null || pref.updatedAt <= latestUpdatedAt) {
      continue;
    }

    latestOffset = normalizeOffset(pref.offsetMinutes);
    latestUpdatedAt = pref.updatedAt;
  }

  return latestOffset;
}

/**
 * Bir bildirimin kimliği.
 *
 * `(gün, vakit)` çifti bir bildirimi tek başına belirliyor — gecikme kimliğe
 * GİRMİYOR ve girmemeli: kullanıcı gecikmeyi değiştirdiğinde aynı bildirimin
 * saati değişir, yeni bir bildirim doğmaz.
 */
export function notificationKey(prayer: PrayerName, date: IsoDate): string {
  return `${NOTIFICATION_KIND}:${date}:${prayer}`;
}

/**
 * Kurulacak bildirimlerin tamamı, zaman sırasıyla.
 *
 * ⚠️ Güneş HİÇ plana girmez: `TRACKABLE_PRAYERS` üzerinden dönülüyor ve Güneş
 * bir namaz vakti değil (`prayerDay.ts`). Beş vakit dışında bir şey
 * hatırlatmak, kullanıcının ibadet takvimine bizim bir şey eklememiz olurdu.
 *
 * ⚠️ **Gecikme epoch'a dakika EKLENEREK uygulanıyor ve bu doğru.**
 * `prayerSchedule.localEpochFor`in yasakladığı şey `günEpoch + dakika` ile
 * DUVAR SAATİ kurmaktı; burada duvar saati zaten çözülmüş durumda ve kalan iş
 * "o andan X dakika sonra" — o da gerçek süredir, saat dilimi geçişinden
 * etkilenmez.
 *
 * ⚠️ Süzgeç **katı `>`** (`findNextPrayer`in aynı disiplini): tam o dakikada
 * kurulacak bir bildirim ya anında düşer ya da işletim sistemi tarafından
 * geçmiş sayılıp atılır.
 *
 * ⚠️ Kesme EN GEÇ olanlardan yapılıyor (önce sıralanıp sonra `slice`).
 * Yakındaki bildirimler feda edilseydi kullanıcı bugünü kaçırıp gelecek
 * haftayı alırdı.
 */
export function planNotifications(
  rows: readonly PrayerTimes[],
  prefs: PrayerNotificationPrefMap,
  now: Timestamp,
  limit: number = MAX_SCHEDULED,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const offsetMinutes = resolveNotificationOffset(prefs);

  for (const row of rows) {
    for (const prayer of TRACKABLE_PRAYERS) {
      const { enabled } = resolvePref(prefs, prayer);
      if (!enabled) {
        continue;
      }

      const base = localEpochFor(row.date, row[prayer]);
      if (base === null) {
        continue;
      }

      const at = base + offsetMinutes * MINUTE_MS;
      if (at <= now) {
        continue;
      }

      planned.push({ key: notificationKey(prayer, row.date), prayer, date: row.date, at });
    }
  }

  planned.sort((a, b) => a.at - b.at);

  return limit <= 0 ? [] : planned.slice(0, limit);
}

/**
 * Planın parmak izi — aynı plan iki kez kurulmasın diye.
 *
 * `notificationSync` bunu modül düzeyinde saklıyor. Süreç ömürlü olması
 * bilinçli: soğuk açılışta imza boştur ve plan her zaman yeniden kurulur, çünkü
 * aradan tetiklenmiş bildirimler olabilir.
 */
export function planSignature(planned: readonly PlannedNotification[]): string {
  return planned.map((item) => `${item.key}@${item.at}`).join('|');
}
