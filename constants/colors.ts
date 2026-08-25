/**
 * Yeni görsel dil: sıcak kâğıt, grafit kontur ve neşeli kırtasiye renkleri.
 * Bileşenler ham paleti değil aşağıdaki anlamsal tema jetonlarını kullanır.
 */

export const palette = {
  paper0: '#FFFDF8',
  paper50: '#FBF6EA',
  paper100: '#F3EBDD',
  shell100: '#DDD8D5',
  shell200: '#CBC5C2',
  graphite950: '#171717',
  graphite800: '#34312F',
  graphite650: '#625D59',
  graphite500: '#706A65',
  graphite300: '#B8B0AA',
  yellow100: '#FFF3B0',
  yellow400: '#F7CC18',
  yellow500: '#E7B900',
  yellow700: '#725900',
  pink100: '#FCE3EC',
  pink400: '#F58CB1',
  pink600: '#B83E69',
  blue100: '#E2F3FC',
  blue400: '#91D0F2',
  blue700: '#236887',
  green100: '#DDF4E9',
  green500: '#35A878',
  green700: '#176746',
  red100: '#FCE5E5',
  red500: '#D84B4B',
  red700: '#8E2929',
  night950: '#16181D',
  night850: '#23262D',
  night750: '#343840',
  white: '#FFFFFF',
} as const;

export type ElevationToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type ColorTheme = {
  background: string;
  appBar: string;
  onAppBar: string;
  surface: string;
  surfaceAlt: string;
  overlay: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  primaryBright: string;
  secondary: string;
  secondaryPressed: string;
  secondarySoft: string;
  onSecondary: string;
  secondaryStrong: string;
  success: string;
  successSoft: string;
  onSuccess: string;
  gardenSky: string;
  gardenGround: string;
  gardenSoil: string;
  gardenTrunk: string;
  gardenFlower: string;
  error: string;
  errorSoft: string;
  onError: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textDisabled: string;
  border: string;
  borderStrong: string;
  borderControl: string;
  focusRing: string;
  disabledBackground: string;
  disabledText: string;
  elevation: {
    none: ElevationToken;
    card: ElevationToken;
    raised: ElevationToken;
    modal: ElevationToken;
  };
};

export type ThemeName = 'light' | 'dark';

const none: ElevationToken = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

const lightElevation: ColorTheme['elevation'] = {
  none,
  card: {
    shadowColor: palette.graphite950,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: palette.graphite950,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  modal: {
    shadowColor: palette.graphite950,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
};

const darkElevation: ColorTheme['elevation'] = {
  none,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    elevation: 3,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
};

export const lightTheme: ColorTheme = {
  background: palette.paper0,
  appBar: palette.paper0,
  onAppBar: palette.graphite950,
  surface: palette.white,
  surfaceAlt: palette.shell100,
  overlay: 'rgba(23, 23, 23, 0.48)',
  primary: palette.graphite950,
  primaryPressed: palette.graphite800,
  primarySoft: palette.pink100,
  onPrimary: palette.white,
  primaryBright: palette.pink400,
  secondary: palette.yellow400,
  secondaryPressed: palette.yellow500,
  secondarySoft: palette.yellow100,
  onSecondary: palette.graphite950,
  secondaryStrong: palette.yellow700,
  success: palette.green700,
  successSoft: palette.green100,
  onSuccess: palette.white,
  gardenSky: palette.blue100,
  gardenGround: palette.green100,
  gardenSoil: '#C98D5B',
  gardenTrunk: '#6B3F24',
  gardenFlower: palette.pink400,
  error: palette.red700,
  errorSoft: palette.red100,
  onError: palette.white,
  textPrimary: palette.graphite950,
  textSecondary: palette.graphite650,
  textMuted: palette.graphite500,
  textInverse: palette.paper0,
  textDisabled: palette.graphite300,
  border: palette.paper100,
  borderStrong: palette.shell200,
  borderControl: palette.graphite500,
  focusRing: palette.graphite950,
  disabledBackground: palette.shell100,
  disabledText: palette.graphite500,
  elevation: lightElevation,
};

export const darkTheme: ColorTheme = {
  background: palette.night950,
  appBar: palette.night950,
  onAppBar: palette.paper0,
  surface: palette.night850,
  surfaceAlt: palette.night750,
  overlay: 'rgba(0, 0, 0, 0.68)',
  primary: palette.yellow400,
  primaryPressed: palette.yellow500,
  primarySoft: '#493E20',
  onPrimary: palette.graphite950,
  primaryBright: palette.pink400,
  secondary: palette.yellow400,
  secondaryPressed: palette.yellow500,
  secondarySoft: '#493E20',
  onSecondary: palette.graphite950,
  secondaryStrong: palette.yellow400,
  success: '#65C99A',
  successSoft: '#173E30',
  onSuccess: palette.graphite950,
  gardenSky: '#173447',
  gardenGround: '#173E30',
  gardenSoil: '#6B3F24',
  gardenTrunk: '#C98D5B',
  gardenFlower: palette.pink400,
  error: '#F27A7A',
  errorSoft: '#4A2424',
  onError: palette.graphite950,
  textPrimary: palette.paper0,
  textSecondary: '#D6CEC5',
  textMuted: '#A79F98',
  textInverse: palette.graphite950,
  textDisabled: '#716B66',
  border: palette.night750,
  borderStrong: '#4A4E56',
  borderControl: '#7B8089',
  focusRing: palette.yellow400,
  disabledBackground: palette.night750,
  disabledText: '#777B82',
  elevation: darkElevation,
};

export const themes: Record<ThemeName, ColorTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

export function getTheme(name: ThemeName = 'light'): ColorTheme {
  return themes[name];
}
