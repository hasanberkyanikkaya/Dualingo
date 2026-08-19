import type { AudioRef } from '@/types';

export type QuestionAudio = {
  /** Ses gerçekten çalınabilir mi. Bugün her zaman `false`. */
  available: boolean;
  isPlaying: boolean;
  play: () => void;
};

/**
 * Sorunun seslendirmesine erişim — "dikiş yeri".
 *
 * Bugün ses altyapısı **yok**: `expo-audio` bağımlılıkta duruyor ama indirme,
 * önbellekleme ve çalma Faz 2.5'in işi. `/content` bilerek ses anahtarı taşıyor
 * ama dosya taşımıyor; bu, mimari kural 7'nin ("ses dosyaları pakete gömülmez,
 * uzaktan indirilip cihazda önbelleğe alınır") hazır bekleyen test vakası.
 *
 * Bu yüzden kanca bugün sabit `available: false` döndürüyor ve soru bileşeni
 * yazılı yedeğiyle çalışıyor.
 *
 * ⚠️ Bileşenler `answeredWithFallback`'i **sabit yazmıyor**, buradan okuyor.
 * Faz 2.5'te bu dosyanın gövdesi dolduğunda çağrı yerleri değişmeyecek.
 * `useLevelProgress`'in (Faz 2.1) aynı kalıbı.
 */
export function useQuestionAudio(audio: AudioRef | undefined): QuestionAudio {
  // `audio` bugün okunmuyor ama imza 2.5 için doğru duruyor: o gün anahtardan
  // uzak adres kurulup indirme buradan başlatılacak.
  void audio;

  return {
    available: false,
    isPlaying: false,
    play: () => {},
  };
}
