import type { QuranReaderMode, QuranVerse } from '@/types';

export type QuranVerseSection = {
  surahId: number;
  verses: readonly QuranVerse[];
};

/** Ayet sırasını değiştirmeden, yalnız sure geçişlerinde yeni bölüm açar. */
export function groupQuranVersesBySurah(
  verses: readonly QuranVerse[],
): readonly QuranVerseSection[] {
  const sections: { surahId: number; verses: QuranVerse[] }[] = [];

  for (const verse of verses) {
    const current = sections[sections.length - 1];
    if (current?.surahId === verse.surahId) {
      current.verses.push(verse);
    } else {
      sections.push({ surahId: verse.surahId, verses: [verse] });
    }
  }

  return sections;
}

/** Mushaf içi küçük ayet işaretinde Latin rakamı yerine Arapça-Hint rakamı gösterir. */
export function formatQuranVerseMarker(verseNumber: number): string {
  const digits = String(verseNumber).replace(/\d/g, (digit) =>
    String.fromCharCode(0x0660 + Number(digit)),
  );
  return ` ﴿${digits}﴾ `;
}

export function shouldTrackQuranReading(mode: QuranReaderMode): boolean {
  return mode === 'mushaf';
}
