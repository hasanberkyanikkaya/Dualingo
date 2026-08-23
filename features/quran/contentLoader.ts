import catalogJson from '@/content/quran/catalog.json';
import manifestJson from '@/content/quran/manifest.json';
import pageIndexJson from '@/content/quran/page-index.json';
import { QURAN_SURAH_LOADERS } from '@/features/quran/contentRegistry.generated';
import { validateQuranManifest, validateQuranSurah } from '@/features/quran/contentValidation';

import type {
  QuranCatalog,
  QuranContentManifest,
  QuranPage,
  QuranPageIndex,
  QuranSurahContent,
  QuranVerse,
  QuranVerseKey,
} from '@/types';

const manifest = manifestJson as QuranContentManifest;
const catalog = catalogJson as QuranCatalog;
const pageIndex = pageIndexJson as QuranPageIndex;

if (__DEV__) {
  for (const found of validateQuranManifest(manifest)) {
    console[found.severity === 'error' ? 'error' : 'warn'](
      `[quran/content] ${found.where}: ${found.message}`,
    );
  }
}

export function getQuranManifest(): QuranContentManifest {
  return manifest;
}

export function getQuranCatalog(): QuranCatalog {
  return catalog;
}

export function getQuranPageIndex(): QuranPageIndex {
  return pageIndex;
}

/** Yalnız istenen sure JSON'unu değerlendirir; tüm külliyatı belleğe almaz. */
export function loadQuranSurah(surahId: number): QuranSurahContent | null {
  const loader = QURAN_SURAH_LOADERS[surahId];
  if (loader === undefined) {
    return null;
  }

  const content = loader();
  if (__DEV__) {
    for (const found of validateQuranSurah(content)) {
      console[found.severity === 'error' ? 'error' : 'warn'](
        `[quran/content] ${found.where}: ${found.message}`,
      );
    }
  }
  return content;
}

export function findQuranVerse(key: QuranVerseKey): QuranVerse | null {
  const match = /^(\d+):(\d+)$/.exec(key);
  if (match === null) {
    return null;
  }

  const content = loadQuranSurah(Number(match[1]));
  return content?.verses.find((verse) => verse.numberInSurah === Number(match[2])) ?? null;
}

/** İndeksteki sure aralıklarından yalnız bu sayfanın ayetlerini yükler. */
export function loadQuranPage(pageNumber: number): QuranPage | null {
  const entry = pageIndex.pages.find((page) => page.pageNumber === pageNumber);
  if (entry === undefined) {
    return null;
  }

  const verses = entry.spans.flatMap((span) => {
    const content = loadQuranSurah(span.surahId);
    return (
      content?.verses.filter(
        (verse) =>
          verse.numberInSurah >= span.firstVerseNumber &&
          verse.numberInSurah <= span.lastVerseNumber &&
          verse.pageNumber === pageNumber,
      ) ?? []
    );
  });

  return {
    pageNumber,
    juzNumbers: entry.juzNumbers,
    verses: verses.sort((left, right) => left.globalOrder - right.globalOrder),
  };
}
