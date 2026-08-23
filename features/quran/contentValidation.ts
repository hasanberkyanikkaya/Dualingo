import type {
  QuranCatalog,
  QuranContentManifest,
  QuranPageIndex,
  QuranPageSpan,
  QuranSurahContent,
  QuranVerse,
} from '@/types';

export type QuranContentIssue = {
  severity: 'error' | 'warning';
  where: string;
  message: string;
};

function issue(
  severity: QuranContentIssue['severity'],
  where: string,
  message: string,
): QuranContentIssue {
  return { severity, where, message };
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function validateVerse(verse: QuranVerse, expectedNumber: number, expectedOrder: number): QuranContentIssue[] {
  const where = `sure-${verse.surahId} › ${verse.key}`;
  const found: QuranContentIssue[] = [];

  if (verse.key !== `${verse.surahId}:${verse.numberInSurah}`) {
    found.push(issue('error', where, 'ayet anahtarı sure ve ayet numarasıyla uyuşmuyor.'));
  }
  if (verse.numberInSurah !== expectedNumber) {
    found.push(issue('error', where, `ayet sırası kesintili; beklenen ${expectedNumber}.`));
  }
  if (verse.globalOrder !== expectedOrder) {
    found.push(issue('error', where, `global sıra kesintili; beklenen ${expectedOrder}.`));
  }
  if (!isPositiveInteger(verse.pageNumber) || !isPositiveInteger(verse.juzNumber)) {
    found.push(issue('error', where, 'sayfa ve cüz numarası pozitif tam sayı olmalı.'));
  }
  if (verse.arabicText.length === 0 || verse.translationText.length === 0) {
    found.push(issue('error', where, 'Arapça metin veya meal boş.'));
  }

  return found;
}

export function validateQuranManifest(manifest: QuranContentManifest): QuranContentIssue[] {
  const found: QuranContentIssue[] = [];
  const sourceKinds = new Set(manifest.sources.map((source) => source.kind));
  const sourceIds = new Set(manifest.sources.map((source) => source.id));

  if (manifest.schemaVersion !== 1 || manifest.contentRevision.trim().length === 0) {
    found.push(issue('error', 'manifest', 'şema sürümü veya içerik revizyonu geçersiz.'));
  }
  if (!isPositiveInteger(manifest.surahCount) || !isPositiveInteger(manifest.verseCount)) {
    found.push(issue('error', 'manifest', 'sure ve ayet toplamları pozitif tam sayı olmalı.'));
  }
  if (
    manifest.sources.length < 3 ||
    sourceIds.size !== manifest.sources.length ||
    !sourceKinds.has('arabic') ||
    !sourceKinds.has('translation') ||
    !sourceKinds.has('metadata') ||
    manifest.sources.some((source) => !/^[a-f0-9]{64}$/u.test(source.contentSha256))
  ) {
    found.push(issue('error', 'manifest', 'kaynak listesi veya SHA-256 kayıtları eksik.'));
  }
  if (manifest.publicationStatus === 'expert_approved' !== manifest.expertApproved) {
    found.push(issue('error', 'manifest', 'yayın durumu ile uzman onayı birbiriyle çelişiyor.'));
  }
  if (manifest.publicationStatus === 'development_only' && manifest.releaseBlockedReasons.length === 0) {
    found.push(issue('error', 'manifest', 'geliştirme içeriğinin yayın engelleri listelenmemiş.'));
  }
  if (manifest.publicationStatus === 'development_only' || !manifest.expertApproved) {
    found.push(issue('warning', 'manifest', 'Kur’an içeriği geliştirme verisi; yayın için onaylı değil.'));
  }

  return found;
}

export function validateQuranSurah(content: QuranSurahContent): QuranContentIssue[] {
  const { surah, verses } = content;
  const found: QuranContentIssue[] = [];

  if (content.schemaVersion !== 1) {
    found.push(issue('error', `sure-${surah.id}`, 'sure dosyasının şema sürümü geçersiz.'));
  }
  if (!isPositiveInteger(surah.id) || surah.nameArabic.length === 0) {
    found.push(issue('error', `sure-${surah.id}`, 'sure kimliği veya kaynak adı geçersiz.'));
  }
  if (surah.verseCount !== verses.length || verses.length === 0) {
    found.push(issue('error', `sure-${surah.id}`, 'bildirilen ayet sayısı dosyayla uyuşmuyor.'));
  }

  verses.forEach((verse, index) => {
    if (verse.surahId !== surah.id) {
      found.push(issue('error', `sure-${surah.id} › ${verse.key}`, 'ayet yanlış sure kimliği taşıyor.'));
    }
    found.push(...validateVerse(verse, index + 1, surah.firstGlobalOrder + index));
  });

  return found;
}

function pageSpans(verses: readonly QuranVerse[]): QuranPageSpan[] {
  return [...new Set(verses.map((verse) => verse.surahId))].map((surahId) => {
    const inSurah = verses.filter((verse) => verse.surahId === surahId);
    return {
      surahId,
      firstVerseNumber: inSurah[0].numberInSurah,
      lastVerseNumber: inSurah[inSurah.length - 1].numberInSurah,
    };
  });
}

export function validateQuranPageIndex(
  manifest: QuranContentManifest,
  pageIndex: QuranPageIndex,
  surahs: readonly QuranSurahContent[],
): QuranContentIssue[] {
  const found: QuranContentIssue[] = [];
  const allVerses = surahs.flatMap((content) => content.verses);
  const pageNumbers = [...new Set(allVerses.map((verse) => verse.pageNumber))].sort(
    (left, right) => left - right,
  );
  const expectedVerseCountsByJuz = Array.from({ length: 30 }, (_, index) =>
    allVerses.filter((verse) => verse.juzNumber === index + 1).length,
  );

  if (pageIndex.schemaVersion !== 1 || pageIndex.contentRevision !== manifest.contentRevision) {
    found.push(issue('error', 'page-index', 'sayfa indeksi ile manifest revizyonları uyuşmuyor.'));
  }
  if (pageIndex.pages.length !== pageNumbers.length) {
    found.push(issue('error', 'page-index', 'sayfa indeksindeki toplam sayfa sayısı yanlış.'));
  }
  if (JSON.stringify(pageIndex.verseCountsByJuz) !== JSON.stringify(expectedVerseCountsByJuz)) {
    found.push(issue('error', 'page-index', 'cüz ayet toplamları külliyatla uyuşmuyor.'));
  }

  pageNumbers.forEach((pageNumber, index) => {
    const entry = pageIndex.pages[index];
    const verses = allVerses.filter((verse) => verse.pageNumber === pageNumber);
    const expectedJuz = [...new Set(verses.map((verse) => verse.juzNumber))];
    const expectedSpans = pageSpans(verses);

    if (
      entry?.pageNumber !== pageNumber ||
      JSON.stringify(entry.juzNumbers) !== JSON.stringify(expectedJuz) ||
      JSON.stringify(entry.spans) !== JSON.stringify(expectedSpans)
    ) {
      found.push(issue('error', `sayfa-${pageNumber}`, 'sayfa indeksi ayet külliyatıyla uyuşmuyor.'));
    }
  });

  return found;
}

export function validateQuranCorpus(
  manifest: QuranContentManifest,
  catalog: QuranCatalog,
  pageIndex: QuranPageIndex,
  surahs: readonly QuranSurahContent[],
): QuranContentIssue[] {
  const found = [...validateQuranManifest(manifest)];
  const ids = surahs.map((content) => content.surah.id);
  let expectedGlobalOrder = 1;

  if (catalog.schemaVersion !== 1 || catalog.contentRevision !== manifest.contentRevision) {
    found.push(issue('error', 'catalog', 'katalog ve manifest revizyonları uyuşmuyor.'));
  }
  if (new Set(ids).size !== ids.length || ids.length !== manifest.surahCount) {
    found.push(issue('error', 'catalog', 'sure kimlikleri yineleniyor veya manifest toplamı yanlış.'));
  }
  if (catalog.surahs.length !== surahs.length) {
    found.push(issue('error', 'catalog', 'katalogdaki sure sayısı dosya sayısıyla uyuşmuyor.'));
  }

  for (const [index, content] of surahs.entries()) {
    if (content.surah.id !== index + 1) {
      found.push(issue('error', `sure-${content.surah.id}`, `sure sırası kesintili; beklenen ${index + 1}.`));
    }
    if (content.surah.firstGlobalOrder !== expectedGlobalOrder) {
      found.push(
        issue('error', `sure-${content.surah.id}`, `ilk global sıra ${expectedGlobalOrder} olmalı.`),
      );
    }
    found.push(...validateQuranSurah(content));
    const catalogEntry = catalog.surahs[index];
    if (
      catalogEntry?.id !== content.surah.id ||
      catalogEntry.verseCount !== content.surah.verseCount ||
      catalogEntry.firstGlobalOrder !== content.surah.firstGlobalOrder
    ) {
      found.push(issue('error', `sure-${content.surah.id}`, 'katalog kaydı sure dosyasıyla uyuşmuyor.'));
    }
    expectedGlobalOrder += content.verses.length;
  }

  const verseCount = surahs.reduce((total, content) => total + content.verses.length, 0);
  if (verseCount !== manifest.verseCount) {
    found.push(issue('error', 'manifest', `ayet toplamı ${verseCount}; manifest ${manifest.verseCount} diyor.`));
  }

  found.push(...validateQuranPageIndex(manifest, pageIndex, surahs));

  return found;
}

export function countQuranIssues(issues: readonly QuranContentIssue[]): {
  errors: number;
  warnings: number;
} {
  return {
    errors: issues.filter((item) => item.severity === 'error').length,
    warnings: issues.filter((item) => item.severity === 'warning').length,
  };
}
