import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import type {
  QuranContentManifest,
  QuranPageIndex,
  QuranSurahContent,
  QuranVerse,
} from '@/types';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

const manifest = readJson<QuranContentManifest>('content/quran/manifest.json');
const pageIndex = readJson<QuranPageIndex>('content/quran/page-index.json');
const surahCache = new Map<number, QuranSurahContent>();

function loadSurah(surahId: number): QuranSurahContent {
  const cached = surahCache.get(surahId);
  if (cached !== undefined) {
    return cached;
  }

  const fileName = `${String(surahId).padStart(3, '0')}.json`;
  const content = readJson<QuranSurahContent>(`content/quran/surahs/${fileName}`);
  surahCache.set(surahId, content);
  return content;
}

function versesOnPage(pageNumber: number): QuranVerse[] {
  const entry = pageIndex.pages.find((page) => page.pageNumber === pageNumber);
  if (entry === undefined) {
    return [];
  }

  return entry.spans
    .flatMap((span) =>
      loadSurah(span.surahId).verses.filter(
        (verse) =>
          verse.numberInSurah >= span.firstVerseNumber &&
          verse.numberInSurah <= span.lastVerseNumber &&
          verse.pageNumber === pageNumber,
      ),
    )
    .sort((left, right) => left.globalOrder - right.globalOrder);
}

describe('Kur’an sayfa indeksi', () => {
  it('604 sayfayı kesintisiz sırada taşır', () => {
    const pages = pageIndex.pages;

    assert.equal(pages.length, 604);
    assert.deepEqual(
      pages.map((page) => page.pageNumber),
      Array.from({ length: 604 }, (_, index) => index + 1),
    );
  });

  it('her ayeti tam bir sayfada ve doğru sırada yükler', () => {
    const loadedKeys: string[] = [];

    for (const entry of pageIndex.pages) {
      const verses = versesOnPage(entry.pageNumber);

      assert.ok(verses.length > 0, `${entry.pageNumber}. sayfa boş`);
      assert.ok(
        verses.every((verse) => verse.pageNumber === entry.pageNumber),
        `${entry.pageNumber}. sayfada yanlış konumlu ayet var`,
      );
      assert.deepEqual(
        verses.map((verse) => verse.globalOrder),
        [...verses]
          .map((verse) => verse.globalOrder)
          .sort((left, right) => left - right),
      );
      loadedKeys.push(...verses.map((verse) => verse.key));
    }

    assert.equal(loadedKeys.length, manifest.verseCount);
    assert.equal(new Set(loadedKeys).size, manifest.verseCount);
  });
});
