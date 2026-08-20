import { create } from 'zustand';

import { decideRefresh } from '@/features/prayer/prayerCache';
import {
  markSynced,
  readLatestCachedDate,
  readPrayerTimes,
  readSelectedDistrict,
  savePrayerTimes,
  selectDistrict as writeSelectedDistrict,
} from '@/features/prayer/prayerDb';
import { fetchTimetable } from '@/features/prayer/prayerApi';
import { latestDate, parseTimetable } from '@/features/prayer/prayerParse';
import { findNextPrayer, nextDay } from '@/features/prayer/prayerSchedule';
import { toLocalIsoDate } from '@/features/progress/streak';

import type {
  IsoDate,
  NextPrayer,
  PrayerCity,
  PrayerDistrict,
  PrayerTimes,
  SelectedDistrict,
  Timestamp,
} from '@/types';

/**
 * Namaz modülü durumu.
 *
 * ⚠️ **`persist` KULLANILMIYOR** ve bu `features/progress/store.ts`ten bilinçli
 * bir ayrılış. Kalıcı olması gereken iki şey (seçili ilçe, indirilmiş vakitler)
 * SQLite'ta; MMKV Expo Go'da kapalı ve oraya yazılsaydı kullanıcı her soğuk
 * açılışta ilçesini yeniden seçerdi. Buradaki alanların hepsi ya SQLite'tan
 * okunmuş bir yansıma ya da türetilmiş (`next`) — hiçbiri doğruluk kaynağı değil.
 *
 * ⚠️ `Date.now()` bu dosyada ve `useCountdown`ta yaşıyor, başka hiçbir yerde.
 * Dört saf modül zamanı argüman alıyor; testlerin var olma sebebi bu.
 */

/** Ekranın kullanıcıya söyleyeceği son ağ olayı. Veri varsa çoğu zaman gizlenir. */
export type PrayerNotice = 'none' | 'upstream' | 'offline' | 'invalidDistrict';

type PrayerState = {
  district: SelectedDistrict | null;
  /** Yüklü olan gün — gece yarısı geçişini yakalamak için saklanıyor. */
  loadedDate: IsoDate | null;
  today: PrayerTimes | null;
  tomorrow: PrayerTimes | null;
  next: NextPrayer | null;
  notice: PrayerNotice;
  /** Ağ isteği sürüyor — yalnızca "Yenile" düğmesinin göstergesi için. */
  loading: boolean;

  selectDistrict: (city: PrayerCity, district: PrayerDistrict) => void;
  /** Diskten yeniden okur ve sıradaki vakti hesaplar. Ağa çıkmaz. */
  recompute: () => void;
  refresh: (userInitiated: boolean) => Promise<void>;
};

/**
 * Bu uygulama oturumunda çekim denendi mi.
 *
 * ⚠️ Store alanı DEĞİL, modül değişkeni: bir arayüz durumu değil, bir yenileme
 * politikası girdisi. Store'a konsaydı her değişimi gereksiz bir yeniden çizim
 * doğururdu. `decideRefresh`in birinci döngü kırıcısı buna dayanıyor.
 */
let attemptedThisSession = false;

/** Aynı anda iki çekim başlamasın — "Yenile"ye hızlı iki basış tek istek olsun. */
let refreshInFlight: Promise<void> | null = null;

/** Diskten bugün/yarın satırlarını okuyup türetilmiş alanları kurar. */
function loadFromDisk(district: SelectedDistrict | null, now: Timestamp) {
  if (district === null) {
    return { loadedDate: null, today: null, tomorrow: null, next: null };
  }

  const todayIso = toLocalIsoDate(now);
  const tomorrowIso = nextDay(todayIso);

  const today = readPrayerTimes(district.districtId, todayIso);
  const tomorrow = tomorrowIso === null ? null : readPrayerTimes(district.districtId, tomorrowIso);

  return {
    loadedDate: todayIso,
    today,
    tomorrow,
    next: findNextPrayer(today, tomorrow, now),
  };
}

export const usePrayerStore = create<PrayerState>()((set, get) => ({
  district: null,
  loadedDate: null,
  today: null,
  tomorrow: null,
  next: null,
  notice: 'none',
  loading: false,

  selectDistrict: (city, district) => {
    const now = Date.now();
    const existing = get().district;

    const record: SelectedDistrict = {
      districtId: district.districtId,
      districtName: district.name,
      cityId: city.cityId,
      cityName: city.name,
      selectedAt: now,
      // Aynı ilçe yeniden seçildiyse önbellek hâlâ geçerli; sıfırlamak
      // gereksiz bir istek doğururdu.
      lastSyncAt: existing?.districtId === district.districtId ? existing.lastSyncAt : null,
    };

    // ⚠️ DB yazması `set` updater'ının DIŞINDA: React 19 + `reactCompiler`
    // updater'ı iki kez çalıştırıyor (2.4 ve 3.1'de aynı tuzağa iki kez
    // düşülmüştü). Burada iki kez yazmak zararsız olurdu ama kural kuraldır ve
    // bir sonraki eklemede zararsız olmayabilir.
    writeSelectedDistrict(record, now);

    // İlçe değiştiyse bu oturumda çekim hakkı yeniden açılır: yeni ilçenin
    // verisi hiç yok ve "bu oturumda denedik" onun için geçerli değil.
    if (existing?.districtId !== district.districtId) {
      attemptedThisSession = false;
    }

    set({ district: record, notice: 'none', ...loadFromDisk(record, now) });
  },

  recompute: () => {
    const now = Date.now();
    set({ ...loadFromDisk(get().district, now) });
  },

  refresh: async (userInitiated) => {
    if (refreshInFlight !== null) {
      return refreshInFlight;
    }

    const now = Date.now();
    const district = get().district;
    const todayIso = toLocalIsoDate(now);

    const decision = decideRefresh({
      districtId: district?.districtId ?? null,
      latestCachedDate: district === null ? null : readLatestCachedDate(district.districtId),
      hasTodayRow: get().today !== null,
      todayIso,
      lastSyncAt: district?.lastSyncAt ?? null,
      attemptedThisSession,
      userInitiated,
      now,
    });

    if (decision === 'skip' || district === null) {
      return;
    }

    attemptedThisSession = true;
    set({ loading: true });

    const task = (async () => {
      const outcome = await fetchTimetable(district.districtId);
      const finishedAt = Date.now();

      if (outcome.kind !== 'ok') {
        set({
          loading: false,
          // ⚠️ Uyarı ancak ekran BOŞSA bir şey ifade eder; dolu bir ekranda
          // "sunucuya ulaşılamadı" demek kullanıcıyı boşuna telaşlandırır.
          // Görünürlük kararı ekranda, ama durumu burada tutuyoruz.
          notice: outcome.kind === 'invalid' ? 'invalidDistrict' : outcome.kind,
        });
        return;
      }

      const rows = parseTimetable(outcome.data, district.districtId, finishedAt);
      savePrayerTimes(rows);

      // ⚠️ Pencere İLERLESİN İLERLEMESİN işaretleniyor. Mirror'ın önbelleği
      // bayatsa aynı eski pencere döner; bu satır olmasa `decideRefresh`in
      // soğuma maddesi hiç tetiklenmez ve yenileme bir döngüye girerdi.
      markSynced(district.districtId, finishedAt);

      const refreshed: SelectedDistrict = { ...district, lastSyncAt: finishedAt };

      // ⚠️ Pencere tamamen geçmişte kalmış olabilir — bugünün satırı yine
      // gelmeyebilir. Bu bir HATA DEĞİL, boş durumdur (4.0 §8): `notice`
      // sıfırlanıyor, çünkü istek başarılı oldu.
      if (__DEV__ && latestDate(rows) !== null && rows.length > 0) {
        console.log(`[prayer] ${rows.length} gün yazıldı, son tarih ${latestDate(rows)}`);
      }

      set({
        district: refreshed,
        loading: false,
        notice: 'none',
        ...loadFromDisk(refreshed, finishedAt),
      });
    })().finally(() => {
      refreshInFlight = null;
    });

    refreshInFlight = task;
    return task;
  },
}));

/**
 * Açılışta diskten hidrasyon.
 *
 * ⚠️ Modül gövdesinde ve SENKRON — `progress/store.ts:353-360`in namaz
 * karşılığı. Depolama senkron olduğu için namaz sekmesi ilk karede doğru
 * veriyle açılıyor ve "yükleniyor" durumu için bir kare bile harcanmıyor.
 *
 * ⚠️ Burada AĞA ÇIKILMIYOR. Uygulamanın her açılışında bir istek atmak
 * kullanıcının namaz sekmesine hiç girmediği günlerde de mirror'ı yorardı;
 * çekim kararı sekme monte olduğunda veriliyor.
 */
function hydrate(): void {
  const district = readSelectedDistrict();
  if (district === null) {
    return;
  }

  usePrayerStore.setState({ district, ...loadFromDisk(district, Date.now()) });
}

hydrate();
