import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

import { AUDIO_TIMEOUT_MS, ensureAudioMode, getCachedUri, resolveAudio } from './audio';

import type { AudioRef } from '@/types';

export type QuestionAudio = {
  /** Ses gerçekten çalınabilir mi — cihazda çalınmaya hazır bir dosya var mı. */
  available: boolean;
  isPlaying: boolean;
  play: () => void;
};

/**
 * Sorunun seslendirmesine erişim — anahtardan çalınabilir sese.
 *
 * Karar mantığı burada değil: adres kurma `audioKey.ts`'te, indirme ve önbellek
 * `audio.ts`'te. Bu kanca yalnızca ikisini React'in yaşam döngüsüne bağlar.
 *
 * ⚠️ **Kanca hiçbir koşulda fırlatmaz.** Anahtar yok, anahtar bozuk,
 * `audioBaseUrl` boş, ağ yok, 404, bozuk dosya — hepsinin karşılığı
 * `available: false`. Soru bileşeni o zaman oynat butonunu çizmez ve yazılı
 * yedeğine düşer; ders akışı, ders uzunluğu ve XP değişmez.
 *
 * ⚠️ **Çağrı yerleri Faz 2.2'den beri değişmedi.** `useLevelProgress`'in
 * (Faz 2.1) ve `useCompleteLevel`'in (Faz 2.4) aynı kalıbı: gövde dolduruldu,
 * imza durdu.
 */
export function useQuestionAudio(audio: AudioRef | undefined): QuestionAudio {
  const key = audio?.key;

  /**
   * İlk değer **senkron** okunuyor: `File.exists` bir özellik, söz değil.
   * Daha önce indirilmiş bir ses ilk karede oynat butonuyla açılır; kullanıcı
   * aynı soruya ikinci kez geldiğinde yedek metnin bir kare parlamasını görmez.
   */
  const [uri, setUri] = useState<string | null>(() =>
    key === undefined ? null : getCachedUri(key),
  );

  useEffect(() => {
    if (key === undefined) {
      setUri(null);
      return;
    }

    const cached = getCachedUri(key);

    if (cached !== null) {
      setUri(cached);
      return;
    }

    setUri(null);

    let cancelled = false;

    /**
     * ⚠️ **Zaman aşımı burada, `audio.ts`'te DEĞİL.** Bırakma kararı arayüze
     * ait: 3 saniyeden fazla bekleyen kullanıcı için ses artık bir süs değil,
     * engeldir. İndirme arka planda sürer ve tamamlanırsa önbelleğe düşer;
     * soru bir daha açıldığında ilk karede hazır olur.
     */
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), AUDIO_TIMEOUT_MS);
    });

    void Promise.race([resolveAudio(key), timeout]).then((resolved) => {
      if (!cancelled) {
        setUri(resolved);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  /**
   * Kaynak değişince `useAudioPlayer` yeni bir oynatıcı kurar (kendi içinde
   * kaynağa anahtarlı). `null` geçerken de sorun çıkmaz: kaynaksız oynatıcı
   * meşru bir durum ve bileşen sökülünce kendiliğinden serbest bırakılır.
   */
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const play = useCallback(() => {
    if (uri === null) {
      return;
    }

    /**
     * ⚠️ Ses oykurumu **her çalmadan önce** isteniyor, kanca kurulurken değil:
     * `ensureAudioMode` kendi içinde tek seferlik. Kurulum anında çağırmak,
     * kullanıcı hiç ses çalmayacak olsa bile iOS ses oturumunu açardı.
     */
    void ensureAudioMode().then(() => {
      try {
        // Baştan çal: bitmiş ya da yarıda bırakılmış kayıt tekrar dinlenebilmeli.
        if (player.currentTime > 0) {
          void player.seekTo(0).catch(() => {
            // Konumlanamadıysa bulunduğu yerden çalsın; sessiz kalmaktan iyidir.
          });
        }

        player.play();
      } catch {
        // Oynatıcı serbest bırakılmışsa (bileşen sökülürken) sessizce geç.
      }
    });
  }, [player, uri]);

  return {
    available: uri !== null,
    isPlaying: status.playing,
    play,
  };
}
