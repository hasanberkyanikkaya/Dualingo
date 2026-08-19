/**
 * Tohumlu karıştırma.
 *
 * ⚠️ Neden `Math.random()` DEĞİL: `app.json`'da `reactCompiler: true` açık.
 * Derleyicinin belleklemesi ve React'in StrictMode'daki çift çizimi, çizimin
 * SAF olduğunu varsayıyor. Rastgele karıştırma her çizimde farklı sonuç verir;
 * şıklar gözün önünde yer değiştirir. Tohum soru kimliğinden geldiği için aynı
 * soru her zaman aynı düzeni alıyor ve çizim saf kalıyor.
 *
 * ⚠️ Neden gerekli: örnek içerikte doğru cevap sistematik olarak ilk sırada —
 * `choices` taşıyan beş boşluğun beşinde de. Sıralama sorularının birinde
 * `correctOrder` kimlik permutasyonu. Yani doğru cevap gerçekten dizi
 * konumunun fonksiyonu; bunu bozmak sunumun işi.
 */

/** 32 bitlik dizge özeti — tohumu sayıya çevirir (FNV-1a). */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — küçük, hızlı, bağımlılıksız sözde rastgele üreteç. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Diziyi tohuma göre karıştırır. Aynı tohum + aynı dizi → her zaman aynı sonuç.
 *
 * ⚠️ **Her zaman kopya üzerinde** (`[...items]`). İçe aktarılan JSON'u yerinde
 * karıştırmak kalıcı bozulma bırakır: Metro modülü önbelleğe alıyor, sonraki
 * okuyan karışmış diziyi görüyor. (`contentLoader`'daki `sort` kararının aynısı.)
 */
export function shuffleSeeded<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  if (result.length < 2) {
    return result;
  }

  const random = createRandom(hashSeed(seed));

  // Fisher-Yates
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  // Karıştırma sonucu girdiyle birebir aynı çıkabilir (3 öğede 1/6 olasılık).
  // O zaman karıştırma hiç yapılmamış gibi görünür ve tekrarlanamayan bir hata
  // ihbarına dönüşür. Bir kaydırmak her zaman farklı bir dizi veriyor.
  const unchanged = result.every((item, index) => item === items[index]);
  if (unchanged) {
    result.push(result.shift() as T);
  }

  return result;
}
