import { palette } from '@/constants/colors';

/** Kur'an yüzeylerinin yeni sıcak kâğıt diline uyarlanmış anlamsal renkleri. */
export const quranTheme = {
  backgroundTop: palette.paper0,
  backgroundBottom: palette.paper50,
  backgroundGlow: palette.yellow100,
  pattern: '#D9D0C3',

  text: palette.graphite950,
  textMuted: palette.graphite650,
  accent: palette.yellow400,
  onAccent: palette.graphite950,
  accentSoft: 'rgba(247, 204, 24, 0.2)',
  warning: palette.pink600,
  danger: palette.red700,

  glass: 'rgba(255, 255, 255, 0.84)',
  glassStrong: 'rgba(255, 253, 248, 0.96)',
  glassPressed: 'rgba(255, 243, 176, 0.92)',
  glassBorder: 'rgba(23, 23, 23, 0.28)',
  overlay: 'rgba(23, 23, 23, 0.56)',

  bookCover: palette.graphite800,
  bookCoverDark: palette.graphite950,
  bookGold: palette.yellow400,
  bookShadow: '#090909',
  paper: palette.paper0,
  paperEdge: '#E4D8B8',
  paperRule: '#D8C99F',
  ink: palette.graphite950,
  translationInk: palette.graphite650,
  footnoteInk: palette.graphite500,
} as const;
