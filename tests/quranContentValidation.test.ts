import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countQuranIssues,
  validateQuranCorpus,
} from '@/features/quran/contentValidation';

import type {
  QuranCatalog,
  QuranContentManifest,
  QuranPageIndex,
  QuranSurahContent,
} from '@/types';

/** ÖRNEK VERİ — GERÇEK DEĞİL. Yalnız veri sözleşmesini sınar. */
function manifest(): QuranContentManifest {
  return {
    schemaVersion: 1,
    contentRevision: 'test-revision',
    retrievedAt: '2026-08-23T00:00:00.000Z',
    publicationStatus: 'expert_approved',
    expertApproved: true,
    releaseBlockedReasons: [],
    surahCount: 1,
    verseCount: 2,
    sources: ['arabic', 'translation', 'metadata'].map((kind, index) => ({
      id: `test-source-${index}`,
      kind: kind as 'arabic' | 'translation' | 'metadata',
      title: 'ÖRNEK KAYNAK',
      version: 'test',
      sourceUrl: 'https://example.invalid/source',
      termsUrl: 'https://example.invalid/terms',
      licenseId: 'test-only',
      attribution: 'ÖRNEK ATIF',
      contentSha256: String(index).repeat(64),
    })),
  };
}

function surah(): QuranSurahContent {
  return {
    schemaVersion: 1,
    surah: {
      id: 1,
      nameArabic: 'ÖRNEK AD',
      nameTurkish: null,
      verseCount: 2,
      firstGlobalOrder: 1,
    },
    verses: [
      {
        key: '1:1',
        surahId: 1,
        numberInSurah: 1,
        globalOrder: 1,
        pageNumber: 1,
        juzNumber: 1,
        arabicText: 'ÖRNEK ARAPÇA METİN — GERÇEK DEĞİL',
        translationText: 'ÖRNEK MEAL — GERÇEK DEĞİL',
        translationFootnotes: [],
      },
      {
        key: '1:2',
        surahId: 1,
        numberInSurah: 2,
        globalOrder: 2,
        pageNumber: 1,
        juzNumber: 1,
        arabicText: 'ÖRNEK ARAPÇA METİN 2 — GERÇEK DEĞİL',
        translationText: 'ÖRNEK MEAL 2 — GERÇEK DEĞİL',
        translationFootnotes: [],
      },
    ],
  };
}

function catalog(content: QuranSurahContent): QuranCatalog {
  return {
    schemaVersion: 1,
    contentRevision: 'test-revision',
    surahs: [content.surah],
  };
}

function pageIndex(): QuranPageIndex {
  return {
    schemaVersion: 1,
    contentRevision: 'test-revision',
    verseCountsByJuz: [2, ...Array.from({ length: 29 }, () => 0)],
    pages: [
      {
        pageNumber: 1,
        juzNumbers: [1],
        spans: [{ surahId: 1, firstVerseNumber: 1, lastVerseNumber: 2 }],
      },
    ],
  };
}

describe('Kur’an içerik doğrulaması', () => {
  it('tutarlı örnek külliyatta bulgu üretmez', () => {
    const content = surah();
    assert.deepEqual(validateQuranCorpus(manifest(), catalog(content), pageIndex(), [content]), []);
  });

  it('geliştirme içeriğini yayın uyarısı olarak işaretler', () => {
    const content = surah();
    const developmentManifest: QuranContentManifest = {
      ...manifest(),
      publicationStatus: 'development_only',
      expertApproved: false,
      releaseBlockedReasons: ['ÖRNEK YAYIN ENGELİ'],
    };
    const issues = validateQuranCorpus(
      developmentManifest,
      catalog(content),
      pageIndex(),
      [content],
    );

    assert.deepEqual(countQuranIssues(issues), { errors: 0, warnings: 1 });
    assert.match(issues[0].message, /yayın için onaylı değil/);
  });

  it('bozuk ayet anahtarını ve kesintili sırayı hata sayar', () => {
    const content = surah();
    const broken: QuranSurahContent = {
      ...content,
      verses: [content.verses[0], { ...content.verses[1], key: 'bozuk', globalOrder: 9 }],
    };
    const issues = validateQuranCorpus(manifest(), catalog(content), pageIndex(), [broken]);
    const messages = issues.map((issue) => issue.message).join('\n');

    assert.ok(countQuranIssues(issues).errors >= 2, messages);
    assert.match(messages, /ayet anahtarı/);
    assert.match(messages, /global sıra/);
  });
});
