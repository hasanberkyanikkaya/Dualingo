/**
 * Kur'an modülü — pakete gömülü içerik ve SQLite ilerleme tipleri.
 *
 * Gerçek metin bu dosyada yaşamaz. Arapça metin ve meal yalnız kaynak
 * manifestiyle birlikte `/content/quran` altındaki üretilmiş JSON'dan gelir.
 */

import type { IsoDate, Timestamp } from './progress';

export type QuranVerseKey = string;
export type QuranSourceKind = 'arabic' | 'translation' | 'metadata';
export type QuranPublicationStatus = 'development_only' | 'expert_approved';

export type QuranContentSource = {
  id: string;
  kind: QuranSourceKind;
  title: string;
  version: string;
  sourceUrl: string;
  termsUrl: string;
  licenseId: string;
  attribution: string;
  contentSha256: string;
};

export type QuranContentManifest = {
  schemaVersion: 1;
  contentRevision: string;
  retrievedAt: string;
  publicationStatus: QuranPublicationStatus;
  expertApproved: boolean;
  releaseBlockedReasons: readonly string[];
  surahCount: number;
  verseCount: number;
  sources: readonly QuranContentSource[];
};

export type QuranSurahSummary = {
  id: number;
  nameArabic: string;
  /** Kullanıcı tarafından sağlanan Türkçe sure adı; yayın için uzman onayı bekler. */
  nameTurkish: string;
  verseCount: number;
  firstGlobalOrder: number;
};

export type QuranVerse = {
  key: QuranVerseKey;
  surahId: number;
  numberInSurah: number;
  globalOrder: number;
  /** Seçili mushaf düzeninin sayfa ve cüz konumu; Tanzil metadata 1.0. */
  pageNumber: number;
  juzNumber: number;
  arabicText: string;
  translationText: string;
  /** Kaynağın `[[...]]` biçiminde taşıdığı notlar, içerik değiştirilmeden ayrılır. */
  translationFootnotes: readonly string[];
};

export type QuranSurahContent = {
  schemaVersion: 1;
  surah: QuranSurahSummary;
  verses: readonly QuranVerse[];
};

export type QuranCatalog = {
  schemaVersion: 1;
  contentRevision: string;
  surahs: readonly QuranSurahSummary[];
};

export type QuranPageSpan = {
  surahId: number;
  firstVerseNumber: number;
  lastVerseNumber: number;
};

/** Bir mushaf sayfasını, gereken sure dosyalarını tembel yükleyecek kadar tarif eder. */
export type QuranPageIndexEntry = {
  pageNumber: number;
  juzNumbers: readonly number[];
  spans: readonly QuranPageSpan[];
};

export type QuranPageIndex = {
  schemaVersion: 1;
  contentRevision: string;
  /** 1–30 sırasındaki toplam ayet sayıları; hedef ızgarasının paydasıdır. */
  verseCountsByJuz: readonly number[];
  pages: readonly QuranPageIndexEntry[];
};

export type QuranPage = {
  pageNumber: number;
  juzNumbers: readonly number[];
  verses: readonly QuranVerse[];
};

export type QuranReaderFontSize = 'small' | 'medium' | 'large';
export type QuranReaderMode = 'mushaf' | 'surah';

export type QuranReadingPosition = {
  positionId: 'last_read';
  verseKey: QuranVerseKey;
  contentRevision: string;
  savedAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

/** Bir ayetin belirli bir yerel günde en az bir kez okunduğunu temsil eder. */
export type QuranReadEvent = {
  date: IsoDate;
  verseKey: QuranVerseKey;
  firstReadAt: Timestamp;
  lastReadAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

export type QuranReadingDaySummary = {
  date: IsoDate;
  uniqueVerseCount: number;
  firstReadAt: Timestamp;
  lastReadAt: Timestamp;
};

export type QuranGoalType = 'daily_pages' | 'monthly_juz' | 'finish_by_date';

/** Cihazda aynı anda yalnızca bir yaşayan Kur’an hedefi bulunur. */
export type QuranGoal = {
  goalId: string;
  type: QuranGoalType;
  targetValue: number;
  targetDate: IsoDate | null;
  startDate: IsoDate;
  contentRevision: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
};

export type QuranGoalInput = Pick<
  QuranGoal,
  | 'type'
  | 'targetValue'
  | 'targetDate'
  | 'startDate'
  | 'contentRevision'
  | 'reminderEnabled'
  | 'reminderHour'
  | 'reminderMinute'
>;

/** Saf hedef motoruna verilen, içerik metni taşımayan okuma konumu. */
export type QuranGoalRead = {
  date: IsoDate;
  verseKey: QuranVerseKey;
  pageNumber: number;
  juzNumber: number;
  deletedAt: Timestamp | null;
};

export type QuranJuzProgress = {
  juzNumber: number;
  readVerseCount: number;
  totalVerseCount: number;
  ratio: number;
};

export type QuranGoalStatus = 'active' | 'complete' | 'overdue';

export type QuranGoalProgress = {
  status: QuranGoalStatus;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  completedPages: number;
  targetPages: number;
  remainingPages: number;
  ratio: number;
  percent: number;
  overallCompletedPages: number;
  dailyAveragePages: number;
  estimatedCompletionDate: IsoDate | null;
  juzProgress: readonly QuranJuzProgress[];
};
