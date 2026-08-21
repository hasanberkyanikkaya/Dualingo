/**
 * Kıble yönü matematiği — saf. React yok, `expo-*` yok, `Date.now()` yok.
 *
 * Bu dosyanın saf olması testlerin var olma sebebi: "İstanbul'dan kıble
 * güneydoğudadır" ya da "kadran 359°'den 1°'ye giderken tam tur atmaz" gibi
 * kuralları cihazı elde çevirmeden sınamanın başka yolu yok.
 * (`prayerParse`/`prayerApi`, `dayLog`/`activityDb`, `audioKey`/`audio`
 * ayrımının bu modüldeki karşılığı; yerel yarısı `location.ts`.)
 */

/** Coğrafi nokta. Derece cinsinden, WGS84. */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Kâbe'nin koordinatı.
 *
 * ⚠️ Bu bir DİNİ İÇERİK değil, coğrafi bir sabittir — bu yüzden kodda
 * durabiliyor. Ekranda kıble hakkında hiçbir fıkhi ifade kullanılmaz;
 * bu dosya yalnızca iki nokta arasındaki açıyı hesaplar.
 */
export const KAABA: Coordinates = { latitude: 21.4225, longitude: 39.8262 };

/**
 * Hizalanma toleransı (derece).
 *
 * ⚠️ Bir DOĞRULUK İDDİASI DEĞİL, arayüz eşiğidir: telefon pusulası bu
 * büyüklükte hata yapabiliyor ve daha dar bir eşik göstergeyi elde titrer
 * hâle getirirdi. Ekran "hizalandı" derken "tam olarak burasıdır" demiyor.
 */
export const ALIGN_TOLERANCE = 5;

/**
 * React durumuna yazma eşiği (derece).
 *
 * Yön verisi saniyede onlarca kez geliyor; hepsini duruma yazmak ekrandaki her
 * metni o hızda yeniden çizerdi. Kadranın dönüşü paylaşılan değerden gidiyor,
 * duruma yalnızca bu adımı geçen değişimler yazılıyor (`useQibla`'nın
 * "iki kanal" kararının saf yarısı).
 */
export const EMIT_STEP = 1;

const DEG = Math.PI / 180;

function toRadians(degrees: number): number {
  return degrees * DEG;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Açıyı `[0, 360)` aralığına çeker. Negatif girdi de doğru çalışır. */
export function normalizeDegrees(value: number): number {
  if (!isFiniteNumber(value)) {
    return 0;
  }

  // ⚠️ İki kez modulo: JS'te `-10 % 360` **-10**'dur, 350 değil.
  return ((value % 360) + 360) % 360;
}

/**
 * `from`dan `to`ya giden EN KISA yön farkı, `[-180, 180)`.
 *
 * Pozitif değer saat yönünü gösterir. Kadranın dönüşü ve "ne kadar çevir"
 * okuması bunun üzerine kurulu.
 */
export function signedDelta(from: number, to: number): number {
  const difference = normalizeDegrees(to) - normalizeDegrees(from);
  const wrapped = ((difference % 360) + 540) % 360;
  return wrapped - 180;
}

/**
 * 360/0 dikişini açan biriktirici — bu modülün en kolay gözden kaçan parçası.
 *
 * ⚠️ Ham yön değeri doğrudan paylaşılan değere yazılırsa kadran 359°'den 1°'ye
 * geçerken **tam tur geri** sıçrar. Görünen hata devasa, sebebi tek satır.
 * Çözüm ham açıyı değil, biriken açıyı taşımak: `önceki + enKısaFark`.
 *
 * Sonuç `[0, 360)` içinde DEĞİLDİR ve olmamalıdır — kullanıcı sağa doğru
 * dönmeye devam ettikçe değer büyümeye devam eder. Bu bir kusur değil,
 * sürekliliğin ta kendisi.
 */
export function unwrapRotation(previous: number, next: number): number {
  if (!isFiniteNumber(previous)) {
    return normalizeDegrees(next);
  }

  if (!isFiniteNumber(next)) {
    return previous;
  }

  return previous + signedDelta(previous, next);
}

/**
 * Verilen noktadan Kâbe'ye bakan başlangıç azimutu (derece, gerçek kuzeyden
 * saat yönünde), ya da hesaplanamıyorsa `null`.
 *
 * ⚠️ **Düz (düzlem) trigonometri KULLANILMAZ.** Kıble bir büyük daire (great
 * circle) yönüdür; düzlem hesabı Türkiye enleminde birkaç derece sapma verir ve
 * o sapma tam da bu ekranın tek işini bozan şeydir.
 *
 * ⚠️ Sonuç GERÇEK kuzeye göredir, manyetik kuzeye göre değil. Bu, yön
 * kaynağının `expo-location.watchHeadingAsync`in `trueHeading` alanı olmasının
 * sebebi: ham manyetometre manyetik kuzeyi verir ve ikisi Türkiye'de ~5–6°
 * ayrışır. İkisini karıştırmak sistematik ve sessiz bir hatadır.
 *
 * ⚠️ Bozuk ya da tanımsız girdide sessizce `null` — `ProgressBar`ın "bozuk
 * girdi sessizce boş çubuk" disiplini. Ekran boş durumu dürüstçe gösterir,
 * uydurma bir açı göstermez.
 */
export function qiblaBearing(from: Coordinates): number | null {
  if (!isFiniteNumber(from.latitude) || !isFiniteNumber(from.longitude)) {
    return null;
  }

  if (Math.abs(from.latitude) > 90 || Math.abs(from.longitude) > 180) {
    return null;
  }

  const phi1 = toRadians(from.latitude);
  const phi2 = toRadians(KAABA.latitude);
  const deltaLambda = toRadians(KAABA.longitude - from.longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  // ⚠️ Kâbe'nin kendisi ve tam karşı ayak noktası: yön TANIMSIZ. `atan2(0, 0)`
  // sessizce 0 döndürür, yani "kuzey" — uydurma bir cevap. Boş durum doğrusu.
  if (Math.abs(y) < Number.EPSILON && Math.abs(x) < Number.EPSILON) {
    return null;
  }

  return normalizeDegrees(Math.atan2(y, x) / DEG);
}

/** Kâbe işareti işaretçiye yeterince yakın mı. `delta` işaretli fark. */
export function isAligned(delta: number): boolean {
  return isFiniteNumber(delta) && Math.abs(delta) <= ALIGN_TOLERANCE;
}

/** Pusula kalibrasyonunun üç kovası. ⚠️ `enum` değil union (Node tip soyucusu). */
export type HeadingQuality = 'unknown' | 'low' | 'ok';

/**
 * `expo-location`in `accuracy` alanını üç kovaya indirir.
 *
 * Ölçek `0–3` (3 yüksek … 0 güvenilmez) ve Expo iki platformu bu ölçeğe
 * normalize ettiğini belgeliyor. `<= 1` kalibrasyon uyarısını açar.
 *
 * ⚠️ `null` → `'unknown'` → uyarı YOK. Henüz ölçüm gelmemişken bir kare
 * "pusulan bozuk" demek yanlış alarmdır (`notifications.tsx`in
 * `permission === null` iken hiçbir şey çizmeme kararının aynısı).
 *
 * ⚠️ Bu eşik cihazda DOĞRULANMALI. Varsayım tutmazsa değişecek yer burası,
 * tek satır — bu yüzden kova mantığı bileşende değil bu saf dosyada.
 */
export function headingQuality(accuracy: number | null): HeadingQuality {
  if (accuracy === null || !isFiniteNumber(accuracy)) {
    return 'unknown';
  }

  return accuracy <= 1 ? 'low' : 'ok';
}

/**
 * React durumuna yazılmaya değer bir değişim mi.
 *
 * İlk değer her zaman yazılır (`previous === null`). Sonrasında yalnızca
 * `EMIT_STEP` derecelik eşiği geçen değişimler.
 */
export function shouldEmit(previous: number | null, next: number): boolean {
  if (!isFiniteNumber(next)) {
    return false;
  }

  if (previous === null || !isFiniteNumber(previous)) {
    return true;
  }

  return Math.abs(signedDelta(previous, next)) >= EMIT_STEP;
}
