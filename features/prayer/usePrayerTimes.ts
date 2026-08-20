import { useEffect } from 'react';
import { AppState } from 'react-native';

import { usePrayerStore } from '@/features/prayer/store';
import { toLocalIsoDate } from '@/features/progress/streak';

/**
 * Namaz ekranının store'a tek bağlantı noktası.
 *
 * Kanca olması `useLevelProgress` (2.1) ile aynı gerekçeye dayanıyor: bugün
 * store'u okuyor, yarın bir şey değişirse çağrı yerleri değişmesin.
 *
 * ⚠️ İki yan etkiyi de burada topluyor ve bu bilinçli: ikisi de "ekran açık"
 * durumuna bağlı ve bileşene dağıtılsalar biri unutulduğunda ortaya çıkan hata
 * (bayat vakit gösterme) sessiz olurdu.
 */
export function usePrayerTimes() {
  const district = usePrayerStore((state) => state.district);
  const today = usePrayerStore((state) => state.today);
  const tomorrow = usePrayerStore((state) => state.tomorrow);
  const next = usePrayerStore((state) => state.next);
  const markedToday = usePrayerStore((state) => state.markedToday);
  const notice = usePrayerStore((state) => state.notice);
  const loading = usePrayerStore((state) => state.loading);
  const refresh = usePrayerStore((state) => state.refresh);
  const recompute = usePrayerStore((state) => state.recompute);
  const toggleMark = usePrayerStore((state) => state.toggleMark);

  // Sekme açıldığında yenileme KARARI sorulur — istek atılacağı garanti değil.
  // `decideRefresh` iki döngü kırıcısıyla otomatik yolu oturumda bir kezle
  // sınırlıyor.
  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  // ⚠️ Arka plandan dönüş. Uygulama gece boyunca açık kaldıysa ekran hâlâ dünün
  // tablosunu gösteriyor olurdu; `setInterval` arka planda güvenilmez olduğu
  // için geri sayımın kendi tikine de güvenilemez.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') {
        return;
      }

      const currentDate = usePrayerStore.getState().loadedDate;
      const dayChanged = currentDate !== null && currentDate !== toLocalIsoDate(Date.now());

      // ⚠️ `recompute` bugünün ÇİZELGESİNİ de yeniden okuyor. Gün dönmüşse
      // dünün işaretleri bugünün tablosunda kalırdı; kullanıcı kılmadığı
      // namazları işaretli görürdü — bu modülün en kötü hata sınıfı.
      recompute();

      // Gün döndüyse pencerede bir gün daha eksildi; yenileme kararını yeniden
      // sor. Aynı gün içinde dönüşlerde ağa çıkmaya gerek yok.
      if (dayChanged) {
        void refresh(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [recompute, refresh]);

  return {
    district,
    today,
    tomorrow,
    next,
    markedToday,
    notice,
    loading,
    refresh,
    recompute,
    toggleMark,
  };
}
