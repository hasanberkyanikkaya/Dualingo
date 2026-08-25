import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatQuranVerseMarker,
  groupQuranVersesBySurah,
  shouldTrackQuranReading,
} from '@/features/quran/readerLayout';

import type { QuranVerse } from '@/types';

/** ÖRNEK VERİ — GERÇEK DEĞİL. Yalnız okuyucu yerleşimini sınar. */
function verse(key: string, surahId: number, numberInSurah: number): QuranVerse {
  return {
    key,
    surahId,
    numberInSurah,
    globalOrder: numberInSurah,
    pageNumber: 1,
    juzNumber: 1,
    arabicText: 'ÖRNEK ARAPÇA METİN — GERÇEK DEĞİL',
    translationText: 'ÖRNEK MEAL — GERÇEK DEĞİL',
    translationFootnotes: [],
  };
}

describe('Kur’an okuyucu yerleşimi', () => {
  it('ayetleri yalnız sure değiştiğinde yeni akış bölümüne ayırır', () => {
    const first = verse('1:1', 1, 1);
    const second = verse('1:2', 1, 2);
    const third = verse('2:1', 2, 1);

    assert.deepEqual(groupQuranVersesBySurah([first, second, third]), [
      { surahId: 1, verses: [first, second] },
      { surahId: 2, verses: [third] },
    ]);
  });

  it('ayet numarasını küçük Mushaf işareti için Arapça-Hint rakamına çevirir', () => {
    assert.equal(formatQuranVerseMarker(123), ' ﴿١٢٣﴾ ');
  });

  it('yalnız Mushaf okumasını geçmiş ve hedef takibine açar', () => {
    assert.equal(shouldTrackQuranReading('mushaf'), true);
    assert.equal(shouldTrackQuranReading('surah'), false);
  });
});
