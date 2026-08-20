import pathIndexJson from '@/content/lessons/path.json';
import unit01Json from '@/content/lessons/01-temel-inanc.json';
import unit02Json from '@/content/lessons/02-islamin-sartlari.json';
import {
  countBySeverity,
  formatIssue,
  validateLearningPath,
} from '@/features/learning/contentValidation';

import type { LearningPath, LearningPathIndex, Level, LevelId, Unit, UnitRef } from '@/types';

/**
 * İçerik yükleyici — JSON ile tiplenmiş dünya arasındaki TEK geçiş noktası.
 *
 * `/content` altındaki dosyalar pakete gömülü, salt okunur veridir. TypeScript
 * bir JSON'u içe aktarırken tipleri GENİŞLETİR: `"type": "multiple_choice"`
 * değeri `string`e döner ve `Question` birleşik tipine doğrudan oturmaz. Bu
 * yüzden dönüşüm burada, tek bir yerde yapılır (Oturum 0.5 kararı) ve
 * doğrulama derleme anında değil ÇALIŞMA ANINDA üstlenilir.
 *
 * Dönüşümü başka dosyaya taşıma. Buradan `LearningPath` çıkar; dışarısı
 * yalnızca tiplenmiş sonucu görür.
 *
 * ⚠️ Metro değişken yollu `require` yapamaz — `require(unitRef.file)` çalışmaz.
 * Bu yüzden dosya adı → modül eşlemesi aşağıdaki statik kayıtta ELLE durur.
 * **Yeni bir ünite dosyası eklemek buraya bir satır ister.** (Mimari kural 1'e
 * bilinçli istisna; ünitelere seviye/soru eklemek saf veri olmayı sürdürür.)
 */

/** Yükleyicinin okuduğu şema sürümü. Dosya farklı sürüm taşırsa atlanır. */
const SUPPORTED_SCHEMA_VERSION = 1;

/**
 * Ünite dosyası adı → içe aktarılmış JSON.
 * Anahtar, `path.json` içindeki `unitRefs[].file` değeriyle birebir aynı olmalı.
 */
const UNIT_MODULES: Record<string, unknown> = {
  '01-temel-inanc.json': unit01Json,
  '02-islamin-sartlari.json': unit02Json,
};

/** Geliştirme sırasında görünür uyarı; yayında sessiz. */
function warn(message: string): void {
  if (__DEV__) {
    console.warn(`[contentLoader] ${message}`);
  }
}

/**
 * Zarfın gövdesini alır. Şema sürümü tutmuyorsa `null` döner.
 *
 * Girdi `unknown` olarak alınıyor: JSON'dan gelen genişlemiş tipler (`type`
 * alanının `string`e dönmesi gibi) hedef tiple örtüşmediği için ara bir
 * dönüşüm gerekiyordu; `unknown` bunu tek adıma indiriyor.
 */
function unwrap<T>(raw: unknown, label: string): T | null {
  const envelope = raw as { schemaVersion?: number; data?: T };

  if (envelope?.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    warn(
      `${label}: şema sürümü ${String(envelope?.schemaVersion)}, beklenen ${SUPPORTED_SCHEMA_VERSION}. Atlandı.`,
    );
    return null;
  }

  if (envelope.data == null) {
    warn(`${label}: "data" alanı yok. Atlandı.`);
    return null;
  }

  return envelope.data;
}

/** `order` alanına göre artan sıralama — HER ZAMAN kopya üzerinde. */
function sortByOrder<T extends { order: number }>(items: readonly T[]): T[] {
  // ⚠️ Doğrudan `items.sort()` içe aktarılan JSON nesnesini kalıcı olarak
  // karıştırır: Metro modülü önbelleğe alır, ikinci okuyan bozuk sıra görür.
  return [...items].sort((a, b) => a.order - b.order);
}

/** Tek bir üniteyi kendi dosyasından çözer. Çözemezse `null`. */
function resolveUnit(ref: UnitRef): Unit | null {
  const raw = UNIT_MODULES[ref.file];

  if (raw === undefined) {
    warn(`"${ref.file}" statik kayıtta yok — UNIT_MODULES'e eklenmeli. Ünite atlandı.`);
    return null;
  }

  const unit = unwrap<Unit>(raw, ref.file);
  if (unit === null) {
    return null;
  }

  if (unit.id !== ref.id) {
    warn(`"${ref.file}": dosyadaki kimlik "${unit.id}", path.json ise "${ref.id}" diyor. Atlandı.`);
    return null;
  }

  if (!Array.isArray(unit.levels) || unit.levels.length === 0) {
    warn(`"${ref.file}": ünitenin hiç seviyesi yok. Atlandı.`);
    return null;
  }

  return { ...unit, levels: sortByOrder(unit.levels) };
}

/**
 * Yolun tamamını `contentValidation`'a verir ve bulguları basar — yalnızca
 * `__DEV__`, yalnızca bir kez (önbelleğin arkasında).
 *
 * ⚠️ **Bulgular içeriği DÜŞÜRMEZ.** Bozuk bir soruyu burada ayıklamak ders
 * uzunluğunu sessizce değiştirirdi; o kararı ders oturumu `isAnswerable` ile
 * ekranda veriyor (Oturum 2.3). Yükleyicinin işi görünür kılmak.
 *
 * Yinelenen seviye kimliği denetimi de artık burada: kural tek yerde durmalı
 * ve o yer sınanabilir olan (`contentValidation`), sınanamayan yükleyici değil.
 */
function reportContentIssues(path: LearningPath): void {
  if (!__DEV__) {
    return;
  }

  const issues = validateLearningPath(path);

  if (issues.length === 0) {
    return;
  }

  const { errors, warnings } = countBySeverity(issues);
  warn(`içerik denetimi: ${errors} hata, ${warnings} uyarı.`);

  for (const issue of issues) {
    warn(formatIssue(issue));
  }
}

/** Dosyalardan okunup birleştirilmiş yol. Modül başına bir kez hesaplanır. */
let cachedPath: LearningPath | null = null;

/**
 * Öğrenme yolunu döndürür: `path.json` sırayı verir, her ünite kendi dosyasından
 * gelir, hepsi `order`'a göre sıralanır.
 *
 * Hiçbir koşulda hata fırlatmaz. Bozuk ünite atlanır, geri kalanı çalışır;
 * içerik hatası yüzünden uygulama açılmaz duruma düşmez.
 */
export function getLearningPath(): LearningPath {
  if (cachedPath !== null) {
    return cachedPath;
  }

  const index = unwrap<LearningPathIndex>(pathIndexJson, 'path.json');

  if (index === null || !Array.isArray(index.unitRefs)) {
    warn('Yol listesi okunamadı — boş yol döndürülüyor.');
    cachedPath = { id: 'path-unknown', title: '', description: '', units: [] };
    return cachedPath;
  }

  const units = sortByOrder(index.unitRefs)
    .map(resolveUnit)
    .filter((unit): unit is Unit => unit !== null);

  cachedPath = {
    id: index.id,
    title: index.title,
    description: index.description,
    units,
  };

  reportContentIssues(cachedPath);

  return cachedPath;
}

/** Seviye kimliğinden seviyeye — ilk çağrıda kurulur. */
let cachedLevels: Map<LevelId, Level> | null = null;

/**
 * Bir seviyeyi kimliğiyle bulur. Yoksa `null` — fırlatmaz.
 *
 * Kimlikler yolun tamamında benzersiz (CLAUDE.md kuralı, yükleyici `__DEV__`
 * altında denetliyor), bu yüzden düz bir sözlük yeterli. Ders ekranı ve Faz
 * 2.6'daki tespit sınavı bunu kullanacak.
 */
export function findLevelById(levelId: LevelId): Level | null {
  if (cachedLevels === null) {
    cachedLevels = new Map();
    for (const unit of getLearningPath().units) {
      for (const level of unit.levels) {
        cachedLevels.set(level.id, level);
      }
    }
  }

  return cachedLevels.get(levelId) ?? null;
}
