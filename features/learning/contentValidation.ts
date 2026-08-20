import { isValidAudioKey } from '@/features/learning/audioKey';
import { isAnswerable, normalizeTr } from '@/features/learning/answerEngine';

import type { LearningPath, Level, Question, Unit } from '@/types';

/**
 * İçerik doğrulama — yolun tamamını tek geçişte denetler.
 *
 * ⚠️ **Bu dosya saf ve SESSİZ.** `console` yok, `__DEV__` yok, fırlatma yok;
 * yalnızca bulgu listesi döndürür. Uyarmak ya da susmak çağıranın kararı
 * (`contentLoader` `__DEV__` altında basıyor, tarama aracı raporluyor).
 * Sessiz olduğu için Node test koşucusunda olduğu gibi çalışıyor.
 *
 * ── NEDEN AYRI BİR KATMAN ───────────────────────────────────────────────────
 *
 * Projede zaten üç denetim var, ama üçü de **çizim anında** ve **soru başına**
 * konuşuyor: `isAnswerable` (ders başlarken eleme), `buildSentence` (boşluk
 * sayısı tutmuyorsa uyarı), `resolveImage` (kayıtta olmayan görsel). Hepsi
 * kullanıcı o soruya VARDIĞINDA öğreniliyor.
 *
 * Yayın öncesi gereken şey bunun tersi: **tek seferde, tüm içerik hakkında,
 * kimse ekrana bakmadan.** Buradaki denetimlerin çoğu `isAnswerable`'ın
 * göremediği sınıftan — soru cevaplanabilir görünür ama içerik yine de bozuktur
 * (doğru cevabı kelime havuzunda olmayan boşluk, aynı kimliği iki kez taşıyan
 * şık, sıra listesinde tekrar eden öğe).
 *
 * ── ŞİDDET ──────────────────────────────────────────────────────────────────
 *
 * `error`   — içerik kullanılamaz: soru düşer, ders kısalır ya da doğru cevap
 *             verilemez. Yayına çıkmamalı.
 * `warning` — çalışır ama kusurlu: ses yedeğe düşer, ekran okuyucu boş kalır,
 *             sıra numarası çakışır. Yayını durdurmaz, biri bakmalı.
 */

export type ContentIssueSeverity = 'error' | 'warning';

export type ContentIssue = {
  severity: ContentIssueSeverity;
  /** Okunabilir konum: `unit-01 › level-u1-02 › q-u1-02-3`. */
  where: string;
  message: string;
};

/** Ayraç `›` bilinçli: kimliklerin alfabesinde yok, ayrıştırması belirsizleşmez. */
const SEP = ' › ';

function issue(severity: ContentIssueSeverity, where: string, message: string): ContentIssue {
  return { severity, where, message };
}

/** Metin gerçekten var mı — `undefined`, boş ve yalnız boşluk aynı kefede. */
function isBlank(value: string | undefined): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

/** Yinelenen kimlikleri döndürür (her biri bir kez). */
function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      repeated.add(id);
    }
    seen.add(id);
  }

  return [...repeated];
}

// ── Soru ─────────────────────────────────────────────────────────────────────

/** Şık taşıyan iki tip (`multiple_choice`, `audio_choice`) için ortak denetim. */
function validateChoices(
  question: Extract<Question, { type: 'multiple_choice' | 'audio_choice' }>,
  where: string,
): ContentIssue[] {
  const found: ContentIssue[] = [];

  for (const id of duplicates(question.options.map((option) => option.id))) {
    found.push(issue('error', where, `şık kimliği "${id}" yineleniyor — iki şık birlikte seçili görünür.`));
  }

  for (const option of question.options) {
    // Görseli olan şık metinsiz durabilir; ikisi birden yoksa şık boş bir kutu.
    if (isBlank(option.text) && option.image === undefined) {
      found.push(issue('error', where, `"${option.id}" şıkkının ne metni ne görseli var.`));
    }
  }

  return found;
}

function validateOrdering(
  question: Extract<Question, { type: 'ordering' }>,
  where: string,
): ContentIssue[] {
  const found: ContentIssue[] = [];

  for (const id of duplicates(question.items.map((item) => item.id))) {
    found.push(issue('error', where, `sıralama öğesi "${id}" yineleniyor.`));
  }

  /**
   * ⚠️ `isAnswerable` bunu YAKALAMIYOR: uzunluk eşit ve her kimlik listede
   * bulunduğu için `[i1, i1, i2]` üç öğeli bir soruda denetimi geçer. Oysa
   * `i3` doğru sırada hiç geçmez ve soru asla doğru cevaplanamaz.
   */
  for (const id of duplicates(question.correctOrder)) {
    found.push(issue('error', where, `doğru sırada "${id}" iki kez geçiyor — sıra bir permütasyon olmalı.`));
  }

  return found;
}

function validateFillBlank(
  question: Extract<Question, { type: 'fill_blank' }>,
  where: string,
): ContentIssue[] {
  const found: ContentIssue[] = [];
  const { segments, blanks } = question;

  /**
   * Oturum 0.4'ün "tipte ifade edilemiyor, doğrulaması Faz 2'nin işi" dediği
   * kural. `buildSentence` çizim anında uyarıyor ama fazla segmenti sessizce
   * düz metin yapıp devam ediyor — yani ekranda bir boşluk EKSİK çizilir ve
   * kimse fark etmez. Burası o sessizliği yayın öncesine taşıyor.
   */
  if (segments.length !== blanks.length + 1) {
    found.push(
      issue(
        'error',
        where,
        `segments (${segments.length}) ile blanks (${blanks.length}) uyuşmuyor; beklenen segments = blanks + 1.`,
      ),
    );
  }

  for (const id of duplicates(blanks.map((blank) => blank.id))) {
    found.push(issue('error', where, `boşluk kimliği "${id}" yineleniyor.`));
  }

  const withChoices = blanks.filter((blank) => (blank.choices?.length ?? 0) > 0);

  // Kip soru başına seçilir (2.2d kararı); karışık soru bir boşluğu klavyeye
  // düşürmez, kelime havuzunda cevapsız bırakır.
  if (withChoices.length > 0 && withChoices.length < blanks.length) {
    found.push(
      issue('warning', where, 'boşlukların bir kısmında choices var, bir kısmında yok — soru kelime havuzu kipinde çalışır.'),
    );
  }

  for (const blank of withChoices) {
    /**
     * ⚠️ En sinsi içerik hatası: kelime havuzu kipinde kullanıcı yalnızca
     * `choices` içinden seçebilir. Doğru cevap havuzda yoksa soru
     * **cevaplanabilir görünür ama doğru cevaplanamaz** — `isAnswerable`
     * yalnızca `correctAnswers`'ın dolu olmasına bakıyor.
     * Karşılaştırma motorun kullandığı Türkçe duyarlı küçültmeyle yapılıyor;
     * başka bir kural kullanmak burada geçen içeriğin derste kalmasına yol açardı.
     */
    const reachable = blank.choices?.some((choice) =>
      blank.correctAnswers.some((answer) => normalizeTr(choice) === normalizeTr(answer)),
    );

    if (reachable !== true) {
      found.push(
        issue('error', where, `"${blank.id}" boşluğunun doğru cevabı kelime havuzunda yok — soru çözülemez.`),
      );
    }
  }

  return found;
}

function validateImageMatch(
  question: Extract<Question, { type: 'image_match' }>,
  where: string,
): ContentIssue[] {
  const found: ContentIssue[] = [];

  for (const id of duplicates(question.pairs.map((pair) => pair.id))) {
    found.push(issue('error', where, `eşleştirme çifti "${id}" yineleniyor.`));
  }

  for (const pair of question.pairs) {
    if (isBlank(pair.text)) {
      found.push(issue('error', where, `"${pair.id}" çiftinin metni boş — eşleştirilecek bir şey yok.`));
    }
    if (isBlank(pair.image.key)) {
      found.push(issue('error', where, `"${pair.id}" çiftinin görsel anahtarı boş.`));
    }
    if (isBlank(pair.image.alt)) {
      found.push(issue('warning', where, `"${pair.id}" çiftinin görseli alt metinsiz — ekran okuyucuda sessiz kalır.`));
    }
  }

  return found;
}

/** Ses ve görsel referanslarının sözleşmeye uygunluğu — her tipte aynı. */
function validateMedia(question: Question, where: string): ContentIssue[] {
  const found: ContentIssue[] = [];

  if (question.audio !== undefined && !isValidAudioKey(question.audio.key)) {
    /**
     * Ses bir süs; bozuk anahtar dersi durdurmaz, `resolveAudio` `null` döner.
     * `audio_choice`'ta bile durum aynı: soru `fallbackPrompt` ile yazılı çalışır.
     * Bu yüzden `error` değil `warning` — ama sessizce geçilirse ses hiç
     * duyulmadan yayına çıkar.
     */
    found.push(
      issue('warning', where, `ses anahtarı "${question.audio.key}" adlandırma düzenine uymuyor — ses çalınmaz.`),
    );
  }

  if (question.image !== undefined && isBlank(question.image.alt)) {
    found.push(issue('warning', where, 'soru görseli alt metinsiz.'));
  }

  return found;
}

/** Tek bir soruyu denetler. `where` çağıranın kurduğu okunabilir konum. */
export function validateQuestion(question: Question, where: string): ContentIssue[] {
  const found: ContentIssue[] = [];

  if (isBlank(question.prompt)) {
    found.push(issue('error', where, 'soru metni boş.'));
  }

  if (!isAnswerable(question)) {
    found.push(issue('error', where, 'cevaplanamaz — ders akışından çıkarılır, ders kısalır.'));
  }

  found.push(...validateMedia(question, where));

  switch (question.type) {
    case 'multiple_choice':
      found.push(...validateChoices(question, where));
      break;

    case 'audio_choice':
      found.push(...validateChoices(question, where));
      if (isBlank(question.fallbackPrompt)) {
        // Ses bulunamadığında sorunun yerine geçecek metin bu; boşsa soru boş görünür.
        found.push(issue('error', where, 'fallbackPrompt boş — ses yokken soru boş görünür.'));
      }
      break;

    case 'ordering':
      found.push(...validateOrdering(question, where));
      break;

    case 'fill_blank':
      found.push(...validateFillBlank(question, where));
      break;

    case 'image_match':
      found.push(...validateImageMatch(question, where));
      break;

    case 'true_false':
      break;
  }

  return found;
}

// ── Seviye ve ünite ──────────────────────────────────────────────────────────

export function validateLevel(level: Level, where: string): ContentIssue[] {
  const found: ContentIssue[] = [];

  if (isBlank(level.title)) {
    found.push(issue('warning', where, 'seviye başlığı boş — haritada adsız düğüm görünür.'));
  }

  if (!Number.isInteger(level.xpReward) || level.xpReward <= 0) {
    found.push(issue('warning', where, `xpReward "${String(level.xpReward)}" — pozitif tam sayı olmalı.`));
  }

  if (level.questions.length === 0) {
    found.push(issue('error', where, 'seviyenin hiç sorusu yok — ders açılır açılmaz biter.'));
  }

  for (const id of duplicates(level.questions.map((question) => question.id))) {
    // Soru kimliği `key` olarak da kullanılıyor (2.2a): yinelenen kimlik
    // React'in örneği yeniden kullanmasına, seçimin sonraki soruya taşınmasına yol açar.
    found.push(issue('error', where, `soru kimliği "${id}" seviye içinde yineleniyor.`));
  }

  for (const question of level.questions) {
    found.push(...validateQuestion(question, `${where}${SEP}${question.id}`));
  }

  return found;
}

export function validateUnit(unit: Unit, where: string): ContentIssue[] {
  const found: ContentIssue[] = [];

  if (isBlank(unit.title)) {
    found.push(issue('warning', where, 'ünite başlığı boş.'));
  }

  if (unit.levels.length === 0) {
    found.push(issue('error', where, 'ünitenin hiç seviyesi yok.'));
  }

  for (const order of duplicates(unit.levels.map((level) => String(level.order)))) {
    found.push(issue('warning', where, `iki seviye aynı "order" değerini (${order}) taşıyor — sıralama kararsız.`));
  }

  for (const level of unit.levels) {
    found.push(...validateLevel(level, `${where}${SEP}${level.id}`));
  }

  return found;
}

/**
 * Yolun tamamını denetler. Bulgu yoksa boş dizi.
 *
 * ⚠️ **Seviye kimliği benzersizliği yol GENELİNDE denetlenir**, ünite içinde
 * değil: `UserProgress.levels` düz bir sözlük (Oturum 2.1). Çakışan kimlik iki
 * seviyenin ilerlemesini birbirine bağlar — kullanıcı bir dersi bitirir,
 * başka bir ders tamamlanmış görünür.
 */
export function validateLearningPath(path: LearningPath): ContentIssue[] {
  const found: ContentIssue[] = [];

  if (path.units.length === 0) {
    found.push(issue('error', path.id, 'yolda hiç ünite yok.'));
  }

  for (const id of duplicates(path.units.map((unit) => unit.id))) {
    found.push(issue('error', path.id, `ünite kimliği "${id}" yineleniyor.`));
  }

  const levelIds = path.units.flatMap((unit) => unit.levels.map((level) => level.id));

  for (const id of duplicates(levelIds)) {
    found.push(issue('error', path.id, `seviye kimliği "${id}" yolda birden fazla yerde — ilerleme kayıtları birbirine karışır.`));
  }

  for (const unit of path.units) {
    found.push(...validateUnit(unit, unit.id));
  }

  return found;
}

/** Rapor satırı: `HATA  unit-01 › level-u1-02: soru metni boş.` */
export function formatIssue(found: ContentIssue): string {
  const label = found.severity === 'error' ? 'HATA ' : 'UYARI';
  return `${label} ${found.where}: ${found.message}`;
}

export function countBySeverity(issues: readonly ContentIssue[]): {
  errors: number;
  warnings: number;
} {
  return {
    errors: issues.filter((found) => found.severity === 'error').length,
    warnings: issues.filter((found) => found.severity === 'warning').length,
  };
}
