/**
 * Kur'an modülünün bağımsız görsel kimliği.
 *
 * Bu jetonlar genel Aksolotl temasından bilinçli olarak türetilmez. Okuyucu,
 * referanstaki gece laciverti / turkuaz atmosferi ve sıcak kitap kâğıdını
 * kullanır. Bileşenler bu dosyadaki anlamsal adları okur; ham renk yazmaz.
 */
export const quranTheme = {
  backgroundTop: '#082534',
  backgroundBottom: '#03131E',
  backgroundGlow: '#0E5861',
  pattern: '#8DD8D4',

  text: '#F4FBFA',
  textMuted: '#ACC4C7',
  accent: '#53C9C1',
  onAccent: '#04211F',
  accentSoft: 'rgba(83, 201, 193, 0.16)',
  warning: '#E6C774',
  danger: '#FFB4AB',

  glass: 'rgba(12, 48, 61, 0.72)',
  glassStrong: 'rgba(8, 38, 51, 0.94)',
  glassPressed: 'rgba(25, 82, 91, 0.88)',
  glassBorder: 'rgba(172, 224, 222, 0.34)',
  overlay: 'rgba(1, 10, 16, 0.74)',

  bookCover: '#125B57',
  bookCoverDark: '#083D3A',
  bookGold: '#C9AA62',
  bookShadow: '#01080D',
  paper: '#FFF9E9',
  paperEdge: '#E4D8B8',
  paperRule: '#D8C99F',
  ink: '#182823',
  translationInk: '#485B54',
  footnoteInk: '#63736D',
} as const;
