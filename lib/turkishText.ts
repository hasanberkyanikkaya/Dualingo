/**
 * Türkçe metin yardımcıları — saf. React yok, tema yok, arayüz yok.
 *
 * `normalizeTr` başlangıçta `features/learning/answerEngine.ts` içinde yaşıyordu
 * (Oturum 2.3). Faz 4.1'de namaz modülü de ona ihtiyaç duydu: Diyanet ilçe
 * listesi BÜYÜK HARF (`"ISPARTA"`), cihazın ters coğrafi kodlaması Başlık Biçimi
 * (`"Isparta"`) döndürüyor.
 *
 * ⚠️ Namaz tarafının `answerEngine`den import etmesi cevap motorunun TAMAMINI
 * (`strings`, `fillBlankLayout`, `questionValidation`) namaz paketine sokardı —
 * özellikler arası ters bağımlılık. Bu yüzden fonksiyon buraya taşındı;
 * `answerEngine` onu yeniden dışa aktarıyor ve o dosyanın çağrı yerleri
 * değişmedi.
 */

/**
 * Türkçe duyarlı küçültme.
 *
 * ⚠️ **`toLocaleLowerCase('tr')` tek başına yetmiyor.** Hermes'in tam ICU
 * içermeyen Android derlemesinde yerel sessizce köke düşebiliyor ve orada
 * `'I' → 'i'` oluyor, `'ı'` değil. Sonuç: kullanıcı doğru yazar, uygulama
 * yanlış işaretler — üstelik hata gözden geçirmede görünmez.
 *
 * Bu yüzden iki sorunlu büyük harf ÖNCE elle eşleniyor; sonrası hangi ICU
 * olursa olsun aynı çıkıyor.
 *
 * Aksan **soyulmuyor**: `Blank.correctAnswers` zaten "eş değerli yazımlar"
 * için çoklu; varyant kararı içerik yazarının, motorun değil.
 */
export function normalizeTr(value: string): string {
  return value
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr')
    .replace(/\s+/g, ' ')
    .trim();
}
