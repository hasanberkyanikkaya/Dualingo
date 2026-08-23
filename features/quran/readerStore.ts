import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { quranStorage } from '@/features/quran/storage';

import type { QuranReaderFontSize } from '@/types';

type QuranReaderState = {
  showTranslation: boolean;
  fontSize: QuranReaderFontSize;
  setShowTranslation: (visible: boolean) => void;
  setFontSize: (size: QuranReaderFontSize) => void;
};

export const useQuranReaderStore = create<QuranReaderState>()(
  persist(
    (set) => ({
      showTranslation: true,
      fontSize: 'medium',
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'quran-reader-v1',
      version: 1,
      storage: createJSONStorage(() => quranStorage),
      partialize: ({ showTranslation, fontSize }) => ({ showTranslation, fontSize }),
    },
  ),
);

