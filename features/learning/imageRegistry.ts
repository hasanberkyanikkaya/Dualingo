/**
 * İçerik görselleri: anahtar → pakete gömülü dosya.
 *
 * ⚠️ **Metro değişken yollu `require` yapamaz.** `require(image.key)` çalışmaz;
 * yol derleme anında sabit olmak zorunda. Bu, `contentLoader.ts`'i statik
 * `UNIT_MODULES` kaydına zorlayan duvarın aynısı ve mimari kural 1'e (içerik
 * koda gömülmez) bilinçli ikinci istisna. Kaçış yolu Faz 2.5'teki uzaktan içerik.
 *
 * **Anahtar sözleşmesi:** anahtar `assets/content/` altına GÖRELİ yoldur.
 * `ornek/placeholder-01.png` → `assets/content/ornek/placeholder-01.png`.
 * Görsel eklemek = dosyayı koy + aşağıya bir satır yaz.
 *
 * ⚠️ **Kayıt şu an BOŞ ve boş olmak zorunda.** Var olmayan bir dosya için
 * `require` yazmak çalışma anında `null` değil, **Metro derleme hatası** verir.
 * `/content` bugün 14 görsel anahtarı taşıyor ama karşılığında hiç dosya yok
 * (bilinçli — bkz. CLAUDE.md "Ses dosyaları kasten yok"). Dosyalar gelene kadar
 * `ImageTile` `alt` metnini gösteriyor.
 */

/* eslint-disable @typescript-eslint/no-empty-object-type */
const IMAGE_MODULES: Record<string, number> = {
  // Örnek:
  // 'ornek/placeholder-01.png': require('@/assets/content/ornek/placeholder-01.png'),
};

/**
 * Aynı eksik anahtar için tek uyarı.
 *
 * `contentLoader`'ın uyarısı dedupe etmiyor çünkü o önbellek arkasında bir kez
 * çalışıyor. Burası bileşen çiziminden çağrılıyor: dört kutulu bir soru, ekranda
 * başka bir şey her değiştiğinde dört uyarı daha basardı.
 */
const warnedKeys = new Set<string>();

/**
 * Anahtarı pakete gömülü görsele çevirir. Bulamazsa `null` döner — **fırlatmaz**.
 * Çağıran yer görselsiz çalışmak zorunda (ProgressBar'ın "bozuk girdi sessizce
 * çalışır" doktrini).
 *
 * Dönüş tipi `number`: Expo'nun tip bildiriminde `*.png` modülleri sayıdır ve
 * `expo-image`'ın `source`'u bunu kabul eder. Faz 2.5'te uzak görseller için
 * `{ uri }`'ye genişletmek bilinçli ve görünür bir değişiklik olacak.
 */
export function resolveImage(key: string): number | null {
  const asset = IMAGE_MODULES[key];

  if (asset === undefined) {
    if (__DEV__ && !warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(
        `[imageRegistry] "${key}" kayıtta yok — görsel yerine açıklama metni gösterilecek.`,
      );
    }
    return null;
  }

  return asset;
}
