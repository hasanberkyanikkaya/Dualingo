import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  countBySeverity,
  formatIssue,
  validateBadgeContent,
  validateLearningPath,
  validatePlacementContent,
} from '@/features/learning/contentValidation';
import {
  countQuranIssues,
  validateQuranCorpus,
} from '@/features/quran/contentValidation';

import type {
  BadgeCatalog,
  ContentEnvelope,
  LearningPath,
  LearningPathIndex,
  PlacementContent,
  QuranCatalog,
  QuranContentManifest,
  QuranPageIndex,
  QuranSurahContent,
  Unit,
} from '@/types';

/**
 * İçerik denetimi — yayın öncesi tek komut: `npm run check:content`.
 *
 * İki iş yapar ve **hiçbir dosyayı DEĞİŞTİRMEZ**:
 *
 *   A. Yapısal doğrulama — `/content` diskten okunur, birleştirilir ve
 *      `contentValidation`'a verilir. Uygulamanın içinde `contentLoader` aynı
 *      denetimi `__DEV__` altında yapıyor; burada terminalden, ekran açmadan.
 *   B. Yer tutucu taraması — yayına kaçmaması gereken işaretler.
 *
 * ⚠️ **Yükleyici yeniden yazılmadı, çünkü yazılamazdı.** `contentLoader.ts`
 * JSON'u `import` ile alıyor; Metro bunu çözüyor, Node çözmüyor (ESM'de JSON
 * içe aktarımı `with { type: 'json' }` istiyor ve takma ad çözücümüz onu
 * taşımıyor). Bu yüzden dosyalar burada `readFileSync` ile okunuyor.
 * ⚠️ Bunun bedeli: **ünite dosyası eklenince burası da öğrenmeli.** Öğrenir —
 * `path.json` klasörü tarıyor gibi değil, `unitRefs` üzerinden geziyor, yani
 * yeni ünite `path.json`'a yazıldığı anda tarama kapsamına girer. Statik kayıt
 * tutmak gerekmiyor.
 *
 * ── ÇIKIŞ KODU ──────────────────────────────────────────────────────────────
 *
 * `1` yalnızca **yapısal hata** varsa. Yer tutucu ve `isSampleData` çıkış kodunu
 * değiştirmez, ekrana basılır: bugün içeriğin tamamı örnek veri ve komutun her
 * seferinde kırmızı dönmesi onu bakılmaz hâle getirirdi. Gerçek içerik girdiği
 * gün "YAYIN ENGELİ" satırlarının hepsi kendiliğinden kaybolur.
 */

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(projectRoot, 'content');
const lessonsDir = join(contentDir, 'lessons');
const quranDir = join(contentDir, 'quran');
const quranSurahsDir = join(quranDir, 'surahs');

// ── A. Yapısal doğrulama ─────────────────────────────────────────────────────

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

/**
 * `/content/lessons` dosyalarını `contentLoader` ile aynı sırayla birleştirir.
 *
 * ⚠️ Burada bilinçli olarak **hoşgörüsüz** davranılıyor: yükleyici bozuk
 * üniteyi atlayıp uygulamayı ayakta tutmak zorunda, bu araç ise bozukluğu
 * göstermek için var. Okunamayan dosya sessizce atlanmaz, ekrana yazılır.
 */
function loadPathFromDisk(): { path: LearningPath; fatal: string[] } {
  const fatal: string[] = [];
  const index = readJson(join(lessonsDir, 'path.json')) as ContentEnvelope<LearningPathIndex>;

  const units: Unit[] = [];

  for (const ref of [...index.data.unitRefs].sort((a, b) => a.order - b.order)) {
    const file = join(lessonsDir, ref.file);

    try {
      const envelope = readJson(file) as ContentEnvelope<Unit>;

      if (envelope.data.id !== ref.id) {
        fatal.push(
          `${ref.file}: dosyadaki kimlik "${envelope.data.id}", path.json ise "${ref.id}" diyor.`,
        );
        continue;
      }

      units.push({
        ...envelope.data,
        levels: [...envelope.data.levels].sort((a, b) => a.order - b.order),
      });
    } catch (error) {
      fatal.push(`${ref.file}: okunamadı — ${String(error)}`);
    }
  }

  return {
    path: {
      id: index.data.id,
      title: index.data.title,
      description: index.data.description,
      units,
    },
    fatal,
  };
}

/**
 * Tespit sınavı havuzu.
 *
 * ⚠️ `path.json`ın `unitRefs`i gibi bir gezinti noktası YOK — sınav havuzu tekil
 * bir dosya ve adı burada sabit. Havuz bir gün bölünürse burası da öğrenmeli;
 * `contentLoader`daki statik `import`la aynı bağ.
 */
function loadPlacementFromDisk(): { content: PlacementContent | null; fatal: string[] } {
  const file = join(contentDir, 'placement.json');

  try {
    const envelope = readJson(file) as ContentEnvelope<PlacementContent>;
    return { content: envelope.data, fatal: [] };
  } catch (error) {
    return { content: null, fatal: [`placement.json: okunamadı — ${String(error)}`] };
  }
}

/**
 * Rozet kataloğu.
 *
 * ⚠️ `loadPlacementFromDisk` ile aynı bağ: dosya adı burada SABİT. Katalog bir
 * gün bölünürse hem burası hem `contentLoader`daki statik `import` öğrenmeli.
 */
function loadBadgesFromDisk(): { content: BadgeCatalog | null; fatal: string[] } {
  const file = join(contentDir, 'badges.json');

  try {
    const envelope = readJson(file) as ContentEnvelope<BadgeCatalog>;
    return { content: envelope.data, fatal: [] };
  } catch (error) {
    return { content: null, fatal: [`badges.json: okunamadı — ${String(error)}`] };
  }
}

function loadQuranFromDisk(): {
  manifest: QuranContentManifest | null;
  catalog: QuranCatalog | null;
  pageIndex: QuranPageIndex | null;
  surahs: QuranSurahContent[];
  fatal: string[];
} {
  const fatal: string[] = [];
  let manifest: QuranContentManifest | null = null;
  let catalog: QuranCatalog | null = null;
  let pageIndex: QuranPageIndex | null = null;
  const surahs: QuranSurahContent[] = [];

  try {
    manifest = readJson(join(quranDir, 'manifest.json')) as QuranContentManifest;
    catalog = readJson(join(quranDir, 'catalog.json')) as QuranCatalog;
    pageIndex = readJson(join(quranDir, 'page-index.json')) as QuranPageIndex;
  } catch (error) {
    fatal.push(`quran manifesti veya kataloğu okunamadı — ${String(error)}`);
  }

  try {
    const files = readdirSync(quranSurahsDir)
      .filter((file) => file.endsWith('.json'))
      .sort();

    for (const file of files) {
      surahs.push(readJson(join(quranSurahsDir, file)) as QuranSurahContent);
    }
  } catch (error) {
    fatal.push(`quran sure dosyaları okunamadı — ${String(error)}`);
  }

  return { manifest, catalog, pageIndex, surahs, fatal };
}

// ── B. Yer tutucu taraması ───────────────────────────────────────────────────

/**
 * `/content` içinde aranan işaretler. Burada "ÖRNEK" de aranıyor, çünkü içerik
 * dosyalarında geçmesinin tek anlamı yer tutucu olmasıdır.
 */
const CONTENT_MARKERS = ['ÖRNEK', 'TODO', 'GERÇEK DEĞİL', 'placeholder', 'lorem'];

/**
 * Kaynak dosyalarda aranan işaretler.
 *
 * ⚠️ **"ÖRNEK" burada BİLEREK yok.** Kaynakta o kelime yer tutucu değil,
 * açıklama: yorumlar Türkçe ve örnek veriden söz eden düzinelerce satır var.
 * Aransaydı rapor kendi belgelerini suçlar, kimse okumazdı.
 */
const SOURCE_MARKERS = ['TODO', 'FIXME', 'lorem'];

const SOURCE_DIRS = ['app', 'components', 'constants', 'features', 'lib', 'types'];

type Hit = { file: string; line: number; marker: string; text: string };

function walk(dir: string, extensions: readonly string[]): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      found.push(...walk(full, extensions));
    } else if (extensions.some((extension) => entry.endsWith(extension))) {
      found.push(full);
    }
  }

  return found;
}

function scan(files: readonly string[], markers: readonly string[]): Hit[] {
  const hits: Hit[] = [];

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);

    lines.forEach((text, index) => {
      for (const marker of markers) {
        if (text.includes(marker)) {
          hits.push({
            file: relative(projectRoot, file),
            line: index + 1,
            marker,
            // Uzun satır raporu okunmaz hâle getiriyor; baş kısmı yeter.
            text: text.trim().slice(0, 100),
          });
          break;
        }
      }
    });
  }

  return hits;
}

/**
 * ⚠️ Varsayılan rapor **dosya başına özet**, satır satır değil.
 *
 * Bugün içeriğin tamamı yer tutucu: tam liste 300 satırın üzerinde ve o
 * uzunlukta bir çıktı okunmaz — okunmayan rapor da yayın engeli göremez.
 * Satır numaralarının tamamı `--tam` ile bir tuş uzakta; gerçek içerik girdikçe
 * liste kendiliğinden kısalacak ve ayrım anlamsızlaşacak.
 */
function printHits(title: string, hits: readonly Hit[], detailed: boolean): void {
  console.log(`\n${title} — ${hits.length} satır`);

  if (hits.length === 0) {
    return;
  }

  if (detailed) {
    for (const hit of hits) {
      console.log(`  ${hit.file}:${hit.line}  [${hit.marker}]  ${hit.text}`);
    }
    return;
  }

  const byFile = new Map<string, Hit[]>();

  for (const hit of hits) {
    const bucket = byFile.get(hit.file);

    if (bucket === undefined) {
      byFile.set(hit.file, [hit]);
    } else {
      bucket.push(hit);
    }
  }

  for (const [file, fileHits] of byFile) {
    const perMarker = new Map<string, number>();

    for (const hit of fileHits) {
      perMarker.set(hit.marker, (perMarker.get(hit.marker) ?? 0) + 1);
    }

    const breakdown = [...perMarker]
      .sort((a, b) => b[1] - a[1])
      .map(([marker, count]) => `${marker} ${count}`)
      .join(', ');

    console.log(`  ${file} — ${fileHits.length} satır (${breakdown})`);
    console.log(`      ilk satır ${fileHits[0].line}, son satır ${fileHits[fileHits.length - 1].line}`);
  }

  console.log('  (satır satır liste: npm run check:content -- --tam)');
}

// ── Çalıştırma ───────────────────────────────────────────────────────────────

function main(): number {
  const detailed = process.argv.includes('--tam');

  console.log('İçerik denetimi\n' + '='.repeat(60));

  const { path, fatal } = loadPathFromDisk();

  for (const message of fatal) {
    console.log(`HATA  ${message}`);
  }

  const placement = loadPlacementFromDisk();

  for (const message of placement.fatal) {
    console.log(`HATA  ${message}`);
  }

  /**
   * Sınav soruları ders sorularıyla AYNI denetimden geçiyor; ek olarak
   * kimliklerin ders içeriğiyle çakışmadığı sınanıyor. Kimlik listesi
   * doğrulayıcıya argüman olarak veriliyor — o dosya saf kalmalı.
   */
  const pathQuestionIds = path.units.flatMap((unit) =>
    unit.levels.flatMap((level) => level.questions.map((question) => question.id)),
  );

  const badges = loadBadgesFromDisk();

  for (const message of badges.fatal) {
    console.log(`HATA  ${message}`);
  }

  const quran = loadQuranFromDisk();

  for (const message of quran.fatal) {
    console.log(`HATA  ${message}`);
  }

  // Rozet eşiklerinin erişilebilirliği yola bağlı; sınırlar doğrulayıcıya
  // argüman olarak veriliyor (aynı saflık gerekçesi).
  const allLevels = path.units.flatMap((unit) => unit.levels);

  const issues = [
    ...validateLearningPath(path),
    ...(placement.content === null
      ? []
      : validatePlacementContent(placement.content, pathQuestionIds)),
    ...(badges.content === null
      ? []
      : validateBadgeContent(badges.content, {
          totalLevelCount: allLevels.length,
          totalFirstPassXp: allLevels.reduce((total, level) => total + (level.xpReward ?? 0), 0),
          knownUnitIds: path.units.map((unit) => unit.id),
        })),
  ];

  const { errors, warnings } = countBySeverity(issues);
  const quranIssues =
    quran.manifest === null || quran.catalog === null || quran.pageIndex === null
      ? []
      : validateQuranCorpus(quran.manifest, quran.catalog, quran.pageIndex, quran.surahs);
  const quranCounts = countQuranIssues(quranIssues);
  const allFatal = [...fatal, ...placement.fatal, ...badges.fatal, ...quran.fatal];

  console.log(`\nA. Yapısal doğrulama — ${errors} hata, ${warnings} uyarı`);

  for (const issue of issues) {
    console.log(`  ${formatIssue(issue)}`);
  }

  if (issues.length === 0 && allFatal.length === 0) {
    console.log('  Bulgu yok.');
  }

  console.log(
    `\nA2. Kur’an içerik doğrulama — ${quranCounts.errors} hata, ${quranCounts.warnings} uyarı`,
  );

  for (const issue of quranIssues) {
    console.log(`  ${issue.severity.toUpperCase()}  ${issue.where}: ${issue.message}`);
  }

  if (quranIssues.length === 0 && quran.fatal.length === 0) {
    console.log('  Bulgu yok.');
  }

  for (const reason of quran.manifest?.releaseBlockedReasons ?? []) {
    console.log(`  YAYIN ENGELİ  ${reason}`);
  }

  // ⚠️ Klasörü tarıyor: `placement.json` gibi `lessons/` dışındaki içerik
  // dosyaları da yer tutucu taramasına kendiliğinden giriyor.
  const contentFiles = walk(contentDir, ['.json']);
  const markerFiles = contentFiles.filter((file) => !file.startsWith(quranSurahsDir));
  printHits('B1. İçerik yer tutucuları (/content)', scan(markerFiles, CONTENT_MARKERS), detailed);

  const sourceFiles = SOURCE_DIRS.flatMap((dir) =>
    walk(join(projectRoot, dir), ['.ts', '.tsx']),
  );
  printHits('B2. Kaynakta yer tutucu izleri', scan(sourceFiles, SOURCE_MARKERS), detailed);

  const sampleFlags = contentFiles.filter((file) => {
    const envelope = readJson(file) as { isSampleData?: boolean };
    return envelope.isSampleData === true;
  });

  console.log(`\nC. isSampleData bayrağı — ${sampleFlags.length} dosya örnek veri`);

  for (const file of sampleFlags) {
    console.log(`  YAYIN ENGELİ  ${relative(projectRoot, file)}`);
  }

  console.log('\n' + '='.repeat(60));

  return errors > 0 || quranCounts.errors > 0 || allFatal.length > 0 ? 1 : 0;
}

process.exitCode = main();
