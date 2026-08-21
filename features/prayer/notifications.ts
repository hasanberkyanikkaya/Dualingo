import strings from '@/constants/strings';
import { NOTIFICATION_KIND } from '@/features/prayer/prayerNotify';
import { PRAYER_LABELS } from '@/features/prayer/prayerLabels';
import { formatString } from '@/lib/formatString';

import type { PlannedNotification } from '@/types';

/**
 * `expo-notifications` sarmalayıcısı — yerel modüle dokunan TEK dosya.
 *
 * ⚠️ **Burada KARAR MANTIĞI yok.** Hangi bildirim ne zaman kurulacak sorusunun
 * tamamı `prayerNotify.ts`te ve orası saf; bu dosya yalnızca gelen listeyi
 * işletim sistemine yazıyor. `location.ts` disiplini birebir uygulanıyor:
 * **tembel `require`, hiçbir yol fırlatmaz, birleşik tip döner.**
 * `tests/notifications.test.ts` **yazılamaz** (yerel modül).
 *
 * ⚠️ **PUSH JETONU HİÇ ALINMIYOR.** `getExpoPushTokenAsync` bu projede
 * çağrılmaz ve çağrılmamalı — gerekçe kozmetik değil:
 * `Planlamalar/Magaza/VERI_GUVENLIGI_FORMU.md` "cihaz jetonu = KİMLİK" diyor ve
 * jeton alındığı gün Apple'ın "Data Not Collected" beyanı ile Play veri
 * güvenliği formu yeniden doldurulmak zorunda kalır. Yalnızca YEREL
 * zamanlanmış bildirim kullanıldığı sürece iki belge de değişmiyor.
 *
 * ⚠️ **Expo Go'da görünen şey DOĞRULAMA DEĞİLDİR.** SDK 53'ten beri Expo Go'da
 * Android uzak bildirim kaldırıldı; yerel zamanlanmış bildirim kısmen çalışıyor
 * ve Expo uyarı basıyor. Vakit doğruluğu ve arka planda tetiklenme yalnız dev
 * build'de sınanabilir (CLAUDE.md → Dev Build Borcu, B maddesi).
 */

/**
 * İzin durumu.
 *
 * `denied` ile `unavailable` ayrı çünkü kullanıcıya söylenecek şey farklı:
 * biri "izin vermedin" (ayarlardan açılabilir), diğeri "soramadım"
 * (`location.ts`in aynı ayrımı).
 */
export type NotificationPermission = 'granted' | 'denied' | 'unavailable';

/** Android bildirim kanalı. Kanalsız bildirim sessiz ve düşük öncelikli çıkar. */
const CHANNEL_ID = 'prayer-times';

type NotificationsModule = typeof import('expo-notifications');

function load(): NotificationsModule | null {
  try {
    // ⚠️ Tembel `require` — `location.ts` ve `lib/database.ts`in gerekçesi:
    // yerel modül import ANINDA da fırlatabilir, yalnızca çağrı anında değil.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/notifications] Modül yüklenemedi — hatırlatma kurulmayacak.', error);
    }
    return null;
  }
}

/** İzni SORMADAN okur. */
export async function getPermission(): Promise<NotificationPermission> {
  const Notifications = load();
  if (Notifications === null) {
    return 'unavailable';
  }

  try {
    const result = await Notifications.getPermissionsAsync();
    return result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** İzni SORAR. Zaten verilmişse sistem istemi çıkmaz. */
export async function requestPermission(): Promise<NotificationPermission> {
  const Notifications = load();
  if (Notifications === null) {
    return 'unavailable';
  }

  try {
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * Uygulama açılışında bir kez: ön plan davranışı + Android kanalı.
 *
 * ⚠️ Kanal Android'de **bildirimden ÖNCE** var olmalı; sonradan kurulan kanal
 * o ana kadar zamanlanmış bildirimleri kurtarmıyor.
 *
 * ⚠️ Ön plan davranışı açıkça yazılıyor: varsayılan olarak uygulama açıkken
 * gelen bildirim GÖSTERİLMEZ. Kullanıcı namaz sekmesine bakarken vakit girdiyse
 * bildirimin sessizce yutulması, "çalışmıyor" gibi görünen bir doğru davranış
 * olurdu.
 */
export async function prepareNotifications(): Promise<void> {
  const Notifications = load();
  if (Notifications === null) {
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: strings.prayer.notificationsTitle,
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/notifications] Hazırlık başarısız.', error);
    }
  }
}

/**
 * Bizim kurduğumuz bildirimleri iptal eder.
 *
 * ⚠️ **`cancelAllScheduledNotificationsAsync()` KULLANILMAZ.** Bugün tek
 * tüketici namaz modülü ama Faz 3'ün seri hatırlatıcısı ya da başka bir özellik
 * geldiği gün toptan iptal onların kayıtlarını da SESSİZCE silerdi — hata yok,
 * günlük yok, sadece bir daha hiç gelmeyen bildirimler. Süzgeç
 * `content.data.kind` üzerinden.
 */
export async function cancelPrayerNotifications(): Promise<void> {
  const Notifications = load();
  if (Notifications === null) {
    return;
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const request of scheduled) {
      const data = request.content.data as { kind?: unknown } | null;
      if (data?.kind === NOTIFICATION_KIND) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/notifications] İptal başarısız.', error);
    }
  }
}

/**
 * Planı işletim sistemine kurar — önce eskileri iptal ederek.
 *
 * ⚠️ **Tetikleyici `DATE`, tekrarlayan DEĞİL.** `CALENDAR`/`DAILY` tetikleyici
 * "her gün 12:58" demek olurdu; vakit her gün kayıyor ve bir hafta sonra
 * bildirim yanlış saatte çıkardı. Her kayıt tek bir ana çivileniyor, pencere
 * kaydıkça yeniden kuruluyor (`notificationSync.ts`).
 *
 * ⚠️ İptal ile kurma arasındaki boşluk kabul edilmiş bir bedel: iki adım atomik
 * değil ve arada uygulama öldürülürse hatırlatmalar bir sonraki açılışa kadar
 * kurulmaz. Alternatifi (fark alıp yalnız değişenlere dokunmak) her kaydın
 * `at`ini karşılaştırmayı gerektirirdi; `notificationSync` zaten imzayla aynı
 * planı ikinci kez kurmayı engelliyor.
 */
export async function applySchedule(planned: readonly PlannedNotification[]): Promise<void> {
  const Notifications = load();
  if (Notifications === null) {
    return;
  }

  await cancelPrayerNotifications();

  try {
    for (const item of planned) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: formatString(strings.prayer.notificationTitle, {
            vakit: PRAYER_LABELS[item.prayer],
          }),
          body: strings.prayer.notificationBody,
          data: { kind: NOTIFICATION_KIND, key: item.key, prayer: item.prayer, date: item.date },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.at,
          channelId: CHANNEL_ID,
        },
      });
    }

    if (__DEV__) {
      const last = planned[planned.length - 1];
      console.log(
        `[prayer/notifications] ${planned.length} hatırlatma kuruldu` +
          (last === undefined ? '' : `, son tarih ${last.date}`),
      );
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[prayer/notifications] Zamanlama başarısız.', error);
    }
  }
}
