import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  QuranCatalog,
  QuranContentManifest,
  QuranPageIndex,
  QuranPageIndexEntry,
  QuranSurahContent,
  QuranSurahSummary,
  QuranVerse,
} from '@/types';

const ARABIC_URL =
  'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=xml&marks=true&sajdah=true&tatweel=true&agree=true';
const TRANSLATION_URL = 'https://tanzil.net/trans/?transID=tr.yazir&type=xml';
const METADATA_URL = 'https://tanzil.net/res/text/metadata/quran-data.xml';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(projectRoot, 'content', 'quran');
const surahsDir = join(outputDir, 'surahs');
const generatedRegistry = join(projectRoot, 'features', 'quran', 'contentRegistry.generated.ts');

type RawVerse = { surahId: number; numberInSurah: number; text: string };
type RawSurah = { id: number; nameArabic: string; verses: RawVerse[] };
type Boundary = { index: number; surahId: number; verseNumber: number };
type SourceFile = { bytes: Uint8Array; text: string; sha256: string };

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function download(url: string): Promise<SourceFile> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} indirilemedi: HTTP ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, text: new TextDecoder().decode(bytes), sha256: sha256(bytes) };
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function readAttribute(source: string, name: string): string {
  const match = new RegExp(`${name}="([^"]*)"`).exec(source);
  if (match === null) {
    throw new Error(`XML alanı eksik: ${name}`);
  }
  return decodeXml(match[1]);
}

function parseCorpus(xml: string): RawSurah[] {
  const surahs: RawSurah[] = [];
  const surahPattern = /<sura\s+([^>]+)>([\s\S]*?)<\/sura>/g;

  for (const match of xml.matchAll(surahPattern)) {
    const id = Number(readAttribute(match[1], 'index'));
    const verses = [...match[2].matchAll(/<aya\s+([^>]+)\/>/g)].map((verseMatch) => ({
      surahId: id,
      numberInSurah: Number(readAttribute(verseMatch[1], 'index')),
      text: readAttribute(verseMatch[1], 'text'),
    }));

    surahs.push({ id, nameArabic: readAttribute(match[1], 'name'), verses });
  }

  return surahs;
}

function parseBoundaries(xml: string, container: 'juzs' | 'pages', item: 'juz' | 'page'): Boundary[] {
  const body = new RegExp(`<${container}[^>]*>([\\s\\S]*?)<\\/${container}>`).exec(xml)?.[1];
  if (body === undefined) {
    throw new Error(`Metadata bölümü eksik: ${container}`);
  }

  return [...body.matchAll(new RegExp(`<${item}\\s+([^>]+)\\/>`, 'g'))].map((match) => ({
    index: Number(readAttribute(match[1], 'index')),
    surahId: Number(readAttribute(match[1], 'sura')),
    verseNumber: Number(readAttribute(match[1], 'aya')),
  }));
}

function splitTranslation(text: string): { translationText: string; translationFootnotes: string[] } {
  const translationFootnotes: string[] = [];
  const translationText = text.replace(/\[\[([\s\S]*?)\]\]/g, (_, note: string) => {
    translationFootnotes.push(note);
    return '';
  });

  return { translationText: translationText.trim(), translationFootnotes };
}

function boundaryIndex(
  boundaries: readonly Boundary[],
  surahId: number,
  verseNumber: number,
): number {
  let current = boundaries[0]?.index ?? 1;

  for (const boundary of boundaries) {
    if (
      boundary.surahId > surahId ||
      (boundary.surahId === surahId && boundary.verseNumber > verseNumber)
    ) {
      break;
    }
    current = boundary.index;
  }

  return current;
}

function composeSurahs(
  arabic: readonly RawSurah[],
  translation: readonly RawSurah[],
  pages: readonly Boundary[],
  juzs: readonly Boundary[],
): QuranSurahContent[] {
  let globalOrder = 0;

  return arabic.map((sourceSurah, surahIndex) => {
    const translated = translation[surahIndex];
    if (translated?.id !== sourceSurah.id || translated.verses.length !== sourceSurah.verses.length) {
      throw new Error(`Arapça ve meal hizası bozuk: sure ${sourceSurah.id}`);
    }

    const firstGlobalOrder = globalOrder + 1;
    const verses: QuranVerse[] = sourceSurah.verses.map((sourceVerse, verseIndex) => {
      globalOrder += 1;
      const meal = splitTranslation(translated.verses[verseIndex].text);

      return {
        key: `${sourceSurah.id}:${sourceVerse.numberInSurah}`,
        surahId: sourceSurah.id,
        numberInSurah: sourceVerse.numberInSurah,
        globalOrder,
        pageNumber: boundaryIndex(pages, sourceSurah.id, sourceVerse.numberInSurah),
        juzNumber: boundaryIndex(juzs, sourceSurah.id, sourceVerse.numberInSurah),
        arabicText: sourceVerse.text,
        ...meal,
      };
    });

    return {
      schemaVersion: 1,
      surah: {
        id: sourceSurah.id,
        nameArabic: sourceSurah.nameArabic,
        nameTurkish: null,
        verseCount: verses.length,
        firstGlobalOrder,
      },
      verses,
    };
  });
}

function buildManifest(
  surahs: readonly QuranSurahContent[],
  arabic: SourceFile,
  translation: SourceFile,
  metadata: SourceFile,
): QuranContentManifest {
  const retrievedAt = new Date().toISOString();
  const date = retrievedAt.slice(0, 10);

  return {
    schemaVersion: 1,
    contentRevision: `tanzil-uthmani-1.1__tr-yazir__${date}`,
    retrievedAt,
    publicationStatus: 'development_only',
    expertApproved: false,
    releaseBlockedReasons: [
      'Meal veri setinin ticari yeniden dağıtım izni yayın öncesi doğrulanmalı.',
      'Tanzil metadata kullanım şartları yayın öncesi ayrıca doğrulanmalı.',
      'Arapça metin ve meal insan uzman tarafından karşılaştırmalı onaylanmalı.',
      'Elektronik Kur’an yayımı için ilgili kurul süreci tamamlanmalı.',
    ],
    surahCount: surahs.length,
    verseCount: surahs.reduce((total, surah) => total + surah.verses.length, 0),
    sources: [
      {
        id: 'tanzil-quran-uthmani-1.1',
        kind: 'arabic',
        title: 'Tanzil Uthmani Quran Text',
        version: '1.1',
        sourceUrl: ARABIC_URL,
        termsUrl: 'https://tanzil.net/download/',
        licenseId: 'tanzil-verbatim-attribution',
        attribution: 'Quran text provided by Tanzil Project — https://tanzil.net/',
        contentSha256: arabic.sha256,
      },
      {
        id: 'tanzil-tr-yazir',
        kind: 'translation',
        title: 'Elmalılı Hamdi Yazır Turkish Translation',
        version: 'Tanzil repository snapshot',
        sourceUrl: TRANSLATION_URL,
        termsUrl: 'https://tanzil.net/trans/',
        licenseId: 'tanzil-non-commercial-only',
        attribution: 'Translation data obtained from Tanzil Translations Repository.',
        contentSha256: translation.sha256,
      },
      {
        id: 'tanzil-quran-metadata-1.0',
        kind: 'metadata',
        title: 'Tanzil Quran Metadata',
        version: '1.0',
        sourceUrl: METADATA_URL,
        termsUrl: 'https://tanzil.net/docs/Quran_Metadata',
        licenseId: 'terms-not-stated-on-source-page',
        attribution: 'Quran metadata provided by Tanzil Project.',
        contentSha256: metadata.sha256,
      },
    ],
  };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildPageIndex(
  surahs: readonly QuranSurahContent[],
  contentRevision: string,
): QuranPageIndex {
  const versesByPage = new Map<number, QuranVerse[]>();
  const verseCountsByJuz = Array.from({ length: 30 }, () => 0);

  for (const content of surahs) {
    for (const verse of content.verses) {
      verseCountsByJuz[verse.juzNumber - 1] += 1;
      const verses = versesByPage.get(verse.pageNumber) ?? [];
      verses.push(verse);
      versesByPage.set(verse.pageNumber, verses);
    }
  }

  const pages: QuranPageIndexEntry[] = [...versesByPage.entries()]
    .sort(([left], [right]) => left - right)
    .map(([pageNumber, verses]) => ({
      pageNumber,
      juzNumbers: [...new Set(verses.map((verse) => verse.juzNumber))],
      spans: [...new Set(verses.map((verse) => verse.surahId))].map((surahId) => {
        const inSurah = verses.filter((verse) => verse.surahId === surahId);
        return {
          surahId,
          firstVerseNumber: inSurah[0].numberInSurah,
          lastVerseNumber: inSurah[inSurah.length - 1].numberInSurah,
        };
      }),
    }));

  return { schemaVersion: 1, contentRevision, verseCountsByJuz, pages };
}

function registrySource(surahs: readonly QuranSurahContent[]): string {
  const entries = surahs.map(({ surah }) => {
    const file = String(surah.id).padStart(3, '0');
    return `  ${surah.id}: () => require('@/content/quran/surahs/${file}.json') as QuranSurahContent,`;
  });

  return [
    "import type { QuranSurahContent } from '@/types';",
    '',
    '/** scripts/importQuranContent.ts tarafından üretilir; elle düzenlenmez. */',
    'export const QURAN_SURAH_LOADERS: Readonly<Record<number, () => QuranSurahContent>> = {',
    ...entries,
    '};',
    '',
  ].join('\n');
}

async function writeOutput(surahs: readonly QuranSurahContent[], manifest: QuranContentManifest): Promise<void> {
  await mkdir(surahsDir, { recursive: true });
  await mkdir(dirname(generatedRegistry), { recursive: true });

  for (const surah of surahs) {
    const file = `${String(surah.surah.id).padStart(3, '0')}.json`;
    await writeFile(join(surahsDir, file), json(surah), 'utf8');
  }

  const catalog: QuranCatalog = {
    schemaVersion: 1,
    contentRevision: manifest.contentRevision,
    surahs: surahs.map((surah) => surah.surah satisfies QuranSurahSummary),
  };
  const pageIndex = buildPageIndex(surahs, manifest.contentRevision);

  await writeFile(join(outputDir, 'manifest.json'), json(manifest), 'utf8');
  await writeFile(join(outputDir, 'catalog.json'), json(catalog), 'utf8');
  await writeFile(join(outputDir, 'page-index.json'), json(pageIndex), 'utf8');
  await writeFile(generatedRegistry, registrySource(surahs), 'utf8');
}

async function main(): Promise<void> {
  const [arabic, translation, metadata] = await Promise.all([
    download(ARABIC_URL),
    download(TRANSLATION_URL),
    download(METADATA_URL),
  ]);

  const surahs = composeSurahs(
    parseCorpus(arabic.text),
    parseCorpus(translation.text),
    parseBoundaries(metadata.text, 'pages', 'page'),
    parseBoundaries(metadata.text, 'juzs', 'juz'),
  );
  const manifest = buildManifest(surahs, arabic, translation, metadata);

  await writeOutput(surahs, manifest);
  console.log(`${manifest.surahCount} sure ve ${manifest.verseCount} ayet içe aktarıldı.`);
  console.log(`İçerik durumu: ${manifest.publicationStatus} — yayın engelleri manifestte.`);
}

await main();
