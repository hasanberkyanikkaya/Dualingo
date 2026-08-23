import { useRef, useState } from 'react';

import {
  findQuranVerse,
  getQuranManifest,
  getQuranPageIndex,
  loadQuranPage,
  loadQuranSurah,
} from '@/features/quran/contentLoader';
import {
  readLastReadPosition,
  recordQuranRead,
  saveLastReadPosition,
} from '@/features/quran/quranDb';
import { toLocalIsoDate } from '@/features/progress/streak';

import type { QuranPage, QuranSurahSummary, QuranVerseKey } from '@/types';

type InitialReaderState = {
  page: QuranPage;
  focusVerseKey: QuranVerseKey;
};

function firstReaderState(requestedVerseKey?: QuranVerseKey): InitialReaderState {
  const saved = readLastReadPosition();
  const requested = requestedVerseKey === undefined ? null : findQuranVerse(requestedVerseKey);
  const savedVerse =
    saved?.contentRevision === getQuranManifest().contentRevision
      ? findQuranVerse(saved.verseKey)
      : null;
  const verse = requested ?? savedVerse ?? loadQuranPage(1)?.verses[0] ?? null;

  if (verse === null) {
    throw new Error('Kur’an okuyucusu için başlangıç ayeti bulunamadı.');
  }

  const page = loadQuranPage(verse.pageNumber);
  if (page === null) {
    throw new Error(`Kur’an sayfası bulunamadı: ${verse.pageNumber}`);
  }

  return { page, focusVerseKey: verse.key };
}

export function useQuranReader(requestedVerseKey?: QuranVerseKey) {
  const [{ page, focusVerseKey }, setReader] = useState(() =>
    firstReaderState(requestedVerseKey),
  );
  const lastSavedKey = useRef<QuranVerseKey | null>(null);
  const pageCount = getQuranPageIndex().pages.length;

  function openPage(pageNumber: number, focusKey?: QuranVerseKey): boolean {
    if (pageNumber < 1 || pageNumber > pageCount) {
      return false;
    }
    const next = loadQuranPage(pageNumber);
    if (next === null || next.verses.length === 0) {
      return false;
    }

    setReader({ page: next, focusVerseKey: focusKey ?? next.verses[0].key });
    return true;
  }

  function openSurah(surah: QuranSurahSummary): boolean {
    const content = loadQuranSurah(surah.id);
    const firstVerse = content?.verses[0] ?? null;
    return firstVerse === null ? false : openPage(firstVerse.pageNumber, firstVerse.key);
  }

  function recordVisibleVerses(keys: readonly QuranVerseKey[]): void {
    if (keys.length === 0) {
      return;
    }

    const now = Date.now();
    const today = toLocalIsoDate(now);
    for (const key of keys) {
      recordQuranRead(today, key, now);
    }

    const lastKey = keys[keys.length - 1];
    if (lastSavedKey.current !== lastKey) {
      saveLastReadPosition(lastKey, getQuranManifest().contentRevision, now);
      lastSavedKey.current = lastKey;
    }
  }

  const focusedVerse = findQuranVerse(focusVerseKey);

  return {
    page,
    focusVerseKey,
    pageCount,
    selectedSurahId: focusedVerse?.surahId ?? page.verses[0]?.surahId ?? null,
    openPage,
    openSurah,
    recordVisibleVerses,
  };
}
