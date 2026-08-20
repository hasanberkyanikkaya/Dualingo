/**
 * Önbellek bayatlığı ve yenileme KARARI — saf. Tek satır ağ kodu yok.
 *
 * Bu dosya var çünkü "ne zaman ağa çıkılır" sorusu namaz modülünün en kolay
 * yanlış yapılan yeri: 4.0 servisin ilçe başına ÖNBELLEKLİ olduğunu ölçtü,
 * yani yenileme isteği her zaman ileri gitmiyor. Karar mantığı store'un içine
 * gömülseydi "bayat pencere → yeniden dene → yine bayat pencere" döngüsü
 * yalnızca elle, cihazda ve şansa bağlı olarak yakalanırdı.
 */

import { dayDifference, isValidIsoDate } from '@/features/progress/streak';

import type { DistrictId, IsoDate, Timestamp } from '@/types';

/**
 * Önbellekte kalan gün bu sayının altına düşerse yenilenir.
 *
 * Yedi gün, pencerenin ~1 ay olmasına göre bilerek CÖMERT: mirror birkaç gün
 * `502` dönse bile kullanıcı bunu hiç görmeden atlatır.
 */
export const REFRESH_THRESHOLD_DAYS = 7;

/** Başarılı bir çekimden sonra otomatik yenilemenin beklediği en kısa süre. */
export const MIN_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Önbellek bayat mı.
 *
 * ⚠️ Ölçüt **kalan GÜN sayısı**, kayıt sayısı DEĞİL. 4.0'da aynı ilçe 15 dakika
 * arayla 34 ve 32 kayıt döndürdü; kayıt sayısına bakan bir eşik o iki ölçümde
 * farklı karar verirdi.
 *
 * `latest === null` (hiç veri yok) ve biçimi bozuk tarih de bayat sayılır —
 * ikisinde de yapılacak şey aynı: çek.
 */
export function isStale(
  latestCachedDate: IsoDate | null,
  todayIso: IsoDate,
  thresholdDays: number = REFRESH_THRESHOLD_DAYS,
): boolean {
  if (latestCachedDate === null || !isValidIsoDate(latestCachedDate) || !isValidIsoDate(todayIso)) {
    return true;
  }

  const remaining = dayDifference(todayIso, latestCachedDate);
  if (remaining === null) {
    return true;
  }

  return remaining < thresholdDays;
}

export type RefreshDecision = 'skip' | 'fetch';

export type RefreshInput = {
  districtId: DistrictId | null;
  /** Diskteki pencerenin en son günü. */
  latestCachedDate: IsoDate | null;
  /** Bugünün satırı diskte var mı — pencere ilerideyken bile yokluğu mümkün. */
  hasTodayRow: boolean;
  todayIso: IsoDate;
  lastSyncAt: Timestamp | null;
  /** Bu uygulama oturumunda daha önce çekim DENENDİ mi (başarılı olsun olmasın). */
  attemptedThisSession: boolean;
  /** Kullanıcı "Yenile"ye bastı mı. */
  userInitiated: boolean;
  now: Timestamp;
};

/**
 * Ağa çıkılsın mı.
 *
 * Sıra önemli; her madde bir öncekini varsayıyor:
 *
 * 1. İlçe yoksa çekilecek bir şey yok.
 * 2. **Kullanıcı istediyse her zaman çekilir.** İnsan hızıyla sınırlı olduğu
 *    için ayrıca kısıtlamaya gerek yok; uçuştaki istek `prayerApi` tarafında
 *    zaten tekilleştiriliyor. Kullanıcının "yenile"si bir şey yapmıyormuş gibi
 *    görünmemeli.
 * 3. ⚠️ **DÖNGÜ KIRICI #1** — bu oturumda bir kez denendiyse otomatik yol
 *    kapanır. 4.0'ın bulgusu şu: mirror'ın önbelleği bayatsa yenileme AYNI eski
 *    pencereyi döndürür, `isStale` `true` kalır ve koşul yeniden sağlanır.
 *    Bu madde olmadan sekmeye her girişte yeni bir istek atılırdı.
 * 4. Pencere ileride ve bugünün satırı elde → yapılacak bir şey yok.
 * 5. ⚠️ **DÖNGÜ KIRICI #2** — oturumlar arası soğuma. Uygulamayı üst üste
 *    kapatıp açan kullanıcı `attemptedThisSession`i sıfırlar; altı saatlik
 *    pencere o yolu da kapatıyor.
 *
 * ⚠️ 4. ve 5. maddede `hasTodayRow` şartı bilerek var: bugünün satırı yoksa
 * ekran boş demektir ve boş bir ekranda "zaten yakın zamanda denedik" doğru
 * gerekçe değil — oturumda bir kez daha denenir (3. madde yine de sınırlıyor).
 */
export function decideRefresh(input: RefreshInput): RefreshDecision {
  if (input.districtId === null) {
    return 'skip';
  }

  if (input.userInitiated) {
    return 'fetch';
  }

  if (input.attemptedThisSession) {
    return 'skip';
  }

  if (!isStale(input.latestCachedDate, input.todayIso) && input.hasTodayRow) {
    return 'skip';
  }

  if (
    input.lastSyncAt !== null &&
    input.hasTodayRow &&
    input.now - input.lastSyncAt < MIN_REFRESH_INTERVAL_MS
  ) {
    return 'skip';
  }

  return 'fetch';
}
