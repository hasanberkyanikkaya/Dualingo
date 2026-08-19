import { warnContent } from '@/features/learning/questionValidation';

import type { Blank } from '@/types';

/**
 * Boşluk doldurma cümlesinin çözümlemesi — saf hesap, React yok, tema yok.
 * Emsal: `pathLayout.ts`.
 *
 * ⚠️ **Segmentler KELİME KELİME parçalanıyor** ve sebebi yerleşim:
 * cümle `flexDirection: 'row'` + `flexWrap` ile diziliyor, çünkü satır içinde
 * `<View>` (boşluk yuvası) barındırması gerekiyor. `flexWrap` çocuk sınırında
 * sarıyor; bir segmentin tamamı tek `<Text>` çocuk olsaydı uzun bir Türkçe
 * cümle kırılamaz bir blok olur ve taşardı. Her çocuk tek kelime olunca
 * kelime düzeyinde sarma yapısal olarak doğru çıkıyor.
 *
 * (Denenmeyip elenen yol: `<Text>` içine `<View>` gömmek. Android'de açık ölçü
 * istiyor, sarmalayıcının `lineHeight`'ını düşürüyor ve taban hizası güvenilmez.)
 */

export type SentenceToken =
  | { kind: 'word'; key: string; text: string }
  | { kind: 'blank'; key: string; blankId: string; index: number };

export type FillBlankSentence = {
  tokens: SentenceToken[];
  /** Gerçekten ÇİZİLEN boşlukların kimlikleri — bkz. aşağıdaki uyarı */
  renderedBlankIds: string[];
};

/**
 * Cümleyi kelimelere ve boşluk yuvalarına ayırır.
 *
 * `segments.length === blanks.length + 1` kuralı tipte ifade edilemiyor
 * (Oturum 0.4 notu), doğrulaması burada. Kural bozulursa **çökmez**: sığan
 * kadar boşluk serpiştirilir, kalan segmentler düz metin olarak çizilir ve
 * `__DEV__` altında uyarılır.
 *
 * ⚠️ `renderedBlankIds` yük taşıyor: "Kontrol et"in etkinliği ham
 * `question.blanks`'ten değil BUNDAN türetilmeli. Ham diziden türetilirse
 * bozuk bir soru ya tamam görünürken hiç gönderilemez, ya da eksik cevapla
 * gönderilebilir hâle gelir.
 */
export function buildSentence(
  segments: readonly string[],
  blanks: readonly Blank[],
  context: string,
): FillBlankSentence {
  // ⚠️ `Array.isArray` salt okunur diziyi `any[]`'e daraltıyor; dönüş tipi
  // açıkça yazılmazsa aşağıdaki `word` parametreleri `any` oluyor.
  const safeSegments: readonly string[] = Array.isArray(segments) ? segments : [];
  const safeBlanks: readonly Blank[] = Array.isArray(blanks) ? blanks : [];

  if (safeSegments.length !== safeBlanks.length + 1) {
    warnContent(
      context,
      `segments (${safeSegments.length}) ile blanks (${safeBlanks.length}) uyuşmuyor; beklenen segments = blanks + 1.`,
    );
  }

  const blankCount = Math.min(Math.max(safeSegments.length - 1, 0), safeBlanks.length);

  const tokens: SentenceToken[] = [];
  const renderedBlankIds: string[] = [];

  safeSegments.forEach((segment, segmentIndex) => {
    // Boşluklara göre bölüp boşları atıyoruz: aradaki mesafeyi artık gerçek
    // boşluk karakterleri değil `columnGap` veriyor.
    segment
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .forEach((word, wordIndex) => {
        tokens.push({ kind: 'word', key: `s${segmentIndex}w${wordIndex}`, text: word });
      });

    if (segmentIndex < blankCount) {
      const blank = safeBlanks[segmentIndex];
      tokens.push({
        kind: 'blank',
        key: `b${segmentIndex}`,
        blankId: blank.id,
        index: segmentIndex + 1,
      });
      renderedBlankIds.push(blank.id);
    }
  });

  return { tokens, renderedBlankIds };
}

/**
 * Kip soru başına seçilir, boşluk başına değil: herhangi bir boşlukta `choices`
 * varsa tüm soru kelime havuzu kipinde çalışır.
 *
 * Örnek içerikteki sekiz soruda hiç karışık yok (denetlendi). Karışık bir soru
 * gelirse tek cümlede hem çip yuvası hem yazı alanı olurdu — kimsenin istemediği
 * bir arayüz ve iki kat kod.
 */
export function usesWordBank(blanks: readonly Blank[], context: string): boolean {
  const withChoices = blanks.filter((blank) => (blank.choices?.length ?? 0) > 0).length;

  if (withChoices > 0 && withChoices < blanks.length) {
    warnContent(
      context,
      `boşlukların bir kısmında choices var, bir kısmında yok; soru kelime havuzu kipinde çalışacak.`,
    );
  }

  return withChoices > 0;
}
