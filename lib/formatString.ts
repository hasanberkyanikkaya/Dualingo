/**
 * Metin yer tutucusu doldurma.
 *
 * `strings.ts` içindeki değişkenli metinler `{ad}` biçiminde yer tutucu taşır
 * (`'İlerleme: {current} / {total}'`). Bu yardımcı onları değerleriyle
 * değiştirir. i18n kütüphanesi kurulmadığı için yerine koyma işi burada.
 */

/** Yer tutucu adı → değer eşlemesi. */
export type FormatValues = Record<string, string | number>;

/** `{ad}` kalıbı — ad yalnızca harf, rakam ve alt çizgi taşır. */
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Şablondaki `{ad}` yer tutucularını `values` içindeki karşılıklarıyla
 * değiştirir.
 *
 * Karşılığı olmayan yer tutucu OLDUĞU GİBİ bırakılır — silinmez. Ekranda
 * `{total}` görmek, sessizce boşluk görmekten daha hızlı fark edilir; eksik
 * değer geliştirme sırasında göze batsın diye böyle.
 */
export function formatString(template: string, values: FormatValues): string {
  return template.replace(PLACEHOLDER_PATTERN, (placeholder, key: string) => {
    const value = values[key];

    return value === undefined ? placeholder : String(value);
  });
}
