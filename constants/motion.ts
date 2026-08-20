/**
 * Hareket (animasyon) sabitleri.
 *
 * Bu dosya Button'ın içinden çıktı: süre ve yumuşatma değerleri orada yerel
 * duruyordu, ikinci tüketici (ProgressBar) gelince buraya taşındı. Kural:
 * ikinci kullanımda soyutla, birincide değil.
 *
 * Bileşenler süreyi doğrudan yazmaz (`duration: 300`), buradan hazır bir
 * yapılandırma seçer — böylece uygulamanın her yerinde aynı hareket dili olur.
 *
 * ⚠️ Buradaki hiçbir yapılandırma "hareketi azalt" ayarını KENDİ BAŞINA
 * dinlemez. Kesme işini bileşen `useReducedMotion()` ile JS tarafında yapar;
 * Reanimated'ın `ReduceMotion` seçeneği animasyonu kaldırırken değeri anında
 * sıçratıyor ve bu, animasyonun kendisinden daha rahatsız edici oluyor.
 */

import { Easing, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Süre tabanlı hareket yapılandırmaları.
 *
 * Hepsi `withTiming` içindir; yay (`withSpring`) bilinçli olarak kullanılmıyor.
 * Yay hedefin altına sarkıyor ve hızlı tekrarlanan etkileşimde (çift dokunuş,
 * arka arkaya doğru cevap) oturmaya vakit bulamıyor.
 *
 * Yumuşatmalar `Easing.out` ailesinden: hareket hızlı başlar, yavaş biter.
 * Parmağın bıraktığı yerde duruyormuş hissi veren şey bu.
 */
export const timing = {
  /** Basma anı — parmağa yapışık hissettirecek kadar kısa */
  pressIn: { duration: 90, easing: Easing.out(Easing.quad) },
  /** Bırakma — basmadan biraz uzun, geri dönüş yumuşasın diye */
  pressOut: { duration: 140, easing: Easing.out(Easing.quad) },
  /**
   * İlerleme çubuğunun dolması.
   *
   * Basma geri bildiriminden belirgin biçimde uzun: bu bir tepki değil, bir
   * ilerleme anlatısı — göz çubuğun BÜYÜDÜĞÜNÜ görmeli, büyümüş bulmamalı.
   * `cubic` sonu `quad`dan daha yumuşak kapatır, dolgu hedefe yaslanır.
   */
  progress: { duration: 320, easing: Easing.out(Easing.cubic) },
  /**
   * Kutlama öğesinin belirmesi (ders sonu maskotu, yıldızlar).
   *
   * ⚠️ **`Easing.back` bilinçli bir sapmadır.** Yukarıdaki doktrin yayı
   * reddediyor çünkü "hızlı tekrarlanan etkileşimde oturmaya vakit bulamıyor" —
   * gerekçe basma geri bildirimine ait. Kutlama tekrarlanan bir etkileşim
   * DEĞİL: ders başına en fazla bir kez oynayan bir sahne, üstelik oynadığı
   * anda ekranda başka hiçbir hareket yok. Hafif taşma burada gürültü değil,
   * "bir şey kazandın" duygusunu taşıyan şeyin kendisi.
   * Bir sonraki oturum bunu doktrin ihlali sanıp silmesin.
   */
  celebrate: { duration: 260, easing: Easing.out(Easing.back(1.5)) },
} as const satisfies Record<string, WithTimingConfig>;

export type TimingToken = keyof typeof timing;

/**
 * Sahne sıralaması — birden çok öğenin arka arkaya belirdiği anların zamanlaması.
 *
 * ⚠️ Bunlar `withTiming` YAPILANDIRMASI DEĞİL, düz milisaniyelerdir: bir kısmı
 * `withDelay`'e, bir kısmı React zamanlayıcısına gidiyor. `timing`den ayrı
 * durmalarının sebebi bu — `satisfies Record<string, WithTimingConfig>` onları
 * kabul etmez ve etmemeli.
 *
 * Ölçü: yıldızlar 0/160/320'de başlar, sonuncusu ~580'de oturur; XP sayacı
 * 520'de devralır. Kasıtlı olarak biraz bindiriyorlar — tam sıra beklemek
 * ekranı yavaş hissettiriyor.
 */
export const sequence = {
  /** Ders sonu yıldızları arasındaki gecikme. */
  starStagger: 160,
  /** XP sayacının başlama gecikmesi. */
  xpStart: 520,
  /** XP sayacının sayma süresi. */
  xpDuration: 700,
} as const satisfies Record<string, number>;

export type SequenceToken = keyof typeof sequence;
