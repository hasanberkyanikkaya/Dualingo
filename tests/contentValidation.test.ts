import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countBySeverity,
  formatIssue,
  validateBadgeContent,
  validateLearningPath,
  validateLevel,
  validateQuestion,
} from '@/features/learning/contentValidation';

import type { ContentIssue } from '@/features/learning/contentValidation';
import type {
  BadgeCatalog,
  BadgeDefinition,
  LearningPath,
  Level,
  MultipleChoiceQuestion,
  Question,
  Unit,
} from '@/types';

/**
 * İçerik doğrulama testleri.
 *
 * ⚠️ Buradaki soruların hepsi **kasten bozuk** ve hiçbiri gerçek içerik değil;
 * amaç doğrulayıcının bozukluğu görüp görmediği. Metinler yer tutucu.
 *
 * Testlerin çoğu `isAnswerable`'ın GÖREMEDİĞİ sınıfı hedefliyor: soru
 * cevaplanabilir görünür, denetimi geçer, ama içerik yine de bozuktur.
 */

// ── Yardımcılar ──────────────────────────────────────────────────────────────

const WHERE = 'test';

function messages(issues: readonly ContentIssue[]): string {
  return issues.map(formatIssue).join('\n');
}

function errorsOf(issues: readonly ContentIssue[]): ContentIssue[] {
  return issues.filter((found) => found.severity === 'error');
}

/** Kusursuz bir çoktan seçmeli — testler bunun üzerinde bozukluk üretir. */
function goodQuestion(id = 'q1'): MultipleChoiceQuestion {
  return {
    id,
    type: 'multiple_choice',
    prompt: 'ÖRNEK SORU 1',
    options: [
      { id: 'a', text: 'ÖRNEK CEVAP A' },
      { id: 'b', text: 'ÖRNEK CEVAP B' },
    ],
    correctOptionId: 'a',
  };
}

function levelWith(questions: Question[], id = 'level-1'): Level {
  return {
    id,
    title: 'ÖRNEK SEVİYE',
    order: 1,
    difficulty: 'beginner',
    xpReward: 10,
    questions,
  };
}

function pathWith(units: Unit[]): LearningPath {
  return { id: 'path-1', title: 'ÖRNEK YOL', description: '', units };
}

function unitWith(levels: Level[], id = 'unit-1'): Unit {
  return { id, title: 'ÖRNEK ÜNİTE', order: 1, levels };
}

// ── Sağlam içerik ────────────────────────────────────────────────────────────

describe('validateQuestion — sağlam içerik', () => {
  it('kusursuz soruda hiç bulgu üretmez', () => {
    assert.deepEqual(validateQuestion(goodQuestion(), WHERE), []);
  });

  it('doğru/yanlış sorusunda ek denetim aramaz', () => {
    const question: Question = {
      id: 'q1',
      type: 'true_false',
      prompt: 'ÖRNEK SORU',
      correctAnswer: true,
    };

    assert.deepEqual(validateQuestion(question, WHERE), []);
  });
});

// ── Her tipte ortak ──────────────────────────────────────────────────────────

describe('validateQuestion — ortak alanlar', () => {
  it('boş soru metnini hata sayar', () => {
    const question = { ...goodQuestion(), prompt: '   ' };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /soru metni boş/);
  });

  it('cevaplanamaz soruyu hata sayar', () => {
    // Doğru cevabı hiçbir şıkka denk düşmüyor: `isAnswerable` false döner,
    // ders akışı soruyu ELER ve ders kısalır. Yayın öncesi görülmeli.
    const question = { ...goodQuestion(), correctOptionId: 'yok' };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /cevaplanamaz/);
  });

  it('sözleşmeye uymayan ses anahtarını UYARI sayar, hata değil', () => {
    // Ses bir süs: bozuk anahtar dersi durdurmaz, soru yazılı çalışır.
    const question: Question = {
      ...goodQuestion(),
      audio: { key: 'Ünite/Ses_01.mp3' },
    };
    const issues = validateQuestion(question, WHERE);

    assert.equal(errorsOf(issues).length, 0, messages(issues));
    assert.equal(issues.length, 1);
    assert.equal(issues[0].severity, 'warning');
    assert.match(issues[0].message, /adlandırma düzenine uymuyor/);
  });

  it('geçerli ses anahtarına dokunmaz', () => {
    const question: Question = {
      ...goodQuestion(),
      audio: { key: 'temel-inanc/kelime-i-tevhid-01.m4a' },
    };

    assert.deepEqual(validateQuestion(question, WHERE), []);
  });

  it('alt metinsiz görseli uyarır', () => {
    const question: Question = {
      ...goodQuestion(),
      image: { key: 'ornek/placeholder-01.png', alt: '' },
    };
    const issues = validateQuestion(question, WHERE);

    assert.equal(issues.length, 1, messages(issues));
    assert.equal(issues[0].severity, 'warning');
  });
});

// ── Şıklar ───────────────────────────────────────────────────────────────────

describe('validateQuestion — şıklar', () => {
  it('yinelenen şık kimliğini yakalar', () => {
    const question: Question = {
      ...goodQuestion(),
      options: [
        { id: 'a', text: 'ÖRNEK CEVAP A' },
        { id: 'a', text: 'ÖRNEK CEVAP B' },
      ],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /yineleniyor/);
  });

  it('ne metni ne görseli olan şıkkı yakalar', () => {
    const question: Question = {
      ...goodQuestion(),
      options: [
        { id: 'a', text: 'ÖRNEK CEVAP A' },
        { id: 'b', text: '  ' },
      ],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /"b"/);
  });

  it('metinsiz ama görselli şıkkı sorun saymaz', () => {
    const question: Question = {
      ...goodQuestion(),
      options: [
        { id: 'a', text: 'ÖRNEK CEVAP A' },
        { id: 'b', text: '', image: { key: 'ornek/x-01.png', alt: 'ÖRNEK ALT' } },
      ],
    };

    assert.deepEqual(validateQuestion(question, WHERE), []);
  });

  it('audio_choice: boş fallbackPrompt hatadır', () => {
    const question: Question = {
      id: 'q1',
      type: 'audio_choice',
      prompt: 'ÖRNEK SORU',
      audio: { key: 'ornek/placeholder-01.m4a' },
      fallbackPrompt: '',
      options: [
        { id: 'a', text: 'ÖRNEK CEVAP A' },
        { id: 'b', text: 'ÖRNEK CEVAP B' },
      ],
      correctOptionId: 'a',
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /fallbackPrompt/);
  });
});

// ── Sıralama ─────────────────────────────────────────────────────────────────

describe('validateQuestion — sıralama', () => {
  it('doğru sırada tekrar eden kimliği yakalar', () => {
    /**
     * ⚠️ Bu sorunun bütün noktası: `isAnswerable` bunu GEÇİRİYOR. Uzunluk
     * eşit (3 = 3) ve her kimlik `items` içinde var. Oysa `i3` doğru sırada
     * hiç geçmiyor ve soru asla doğru cevaplanamıyor.
     */
    const question: Question = {
      id: 'q1',
      type: 'ordering',
      prompt: 'ÖRNEK SORU',
      items: [
        { id: 'i1', text: 'ÖRNEK 1' },
        { id: 'i2', text: 'ÖRNEK 2' },
        { id: 'i3', text: 'ÖRNEK 3' },
      ],
      correctOrder: ['i1', 'i1', 'i2'],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /permütasyon/);
  });

  it('yinelenen öğe kimliğini yakalar', () => {
    const question: Question = {
      id: 'q1',
      type: 'ordering',
      prompt: 'ÖRNEK SORU',
      items: [
        { id: 'i1', text: 'ÖRNEK 1' },
        { id: 'i1', text: 'ÖRNEK 2' },
      ],
      correctOrder: ['i1', 'i1'],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 2, messages(found));
  });
});

// ── Boşluk doldurma ──────────────────────────────────────────────────────────

describe('validateQuestion — boşluk doldurma', () => {
  it('segments = blanks + 1 kuralını denetler', () => {
    const question: Question = {
      id: 'q1',
      type: 'fill_blank',
      prompt: 'ÖRNEK SORU',
      segments: ['ÖRNEK ', ' orta ', ' son'],
      blanks: [{ id: 'b1', correctAnswers: ['ÖRNEK CEVAP'] }],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /uyuşmuyor/);
  });

  it('doğru cevabı kelime havuzunda olmayan boşluğu yakalar', () => {
    // Kullanıcı yalnızca `choices` içinden seçebilir; doğru cevap havuzda
    // yoksa soru cevaplanabilir GÖRÜNÜR ama doğru cevaplanamaz.
    const question: Question = {
      id: 'q1',
      type: 'fill_blank',
      prompt: 'ÖRNEK SORU',
      segments: ['ÖRNEK ', ' son'],
      blanks: [
        { id: 'b1', correctAnswers: ['ÖRNEK CEVAP'], choices: ['BAŞKA', 'ÜÇÜNCÜ'] },
      ],
    };
    const found = errorsOf(validateQuestion(question, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /kelime havuzunda yok/);
  });

  it('havuzdaki cevabı Türkçe duyarlı karşılaştırır', () => {
    // "ISLAM" naif `toLowerCase()` ile "islam" olur; motor `ıslam` üretir.
    // Doğrulayıcı motorun kuralını kullanmalı, yoksa burada geçen içerik
    // derste yanlış işaretlenir.
    const question: Question = {
      id: 'q1',
      type: 'fill_blank',
      prompt: 'ÖRNEK SORU',
      segments: ['ÖRNEK ', ' son'],
      blanks: [{ id: 'b1', correctAnswers: ['ıslam'], choices: ['ISLAM', 'BAŞKA'] }],
    };

    assert.deepEqual(validateQuestion(question, WHERE), []);
  });

  it('karışık kipi uyarır ama hata saymaz', () => {
    const question: Question = {
      id: 'q1',
      type: 'fill_blank',
      prompt: 'ÖRNEK SORU',
      segments: ['ÖRNEK ', ' orta ', ' son'],
      blanks: [
        { id: 'b1', correctAnswers: ['bir'], choices: ['bir', 'iki'] },
        { id: 'b2', correctAnswers: ['iki'] },
      ],
    };
    const issues = validateQuestion(question, WHERE);

    assert.equal(errorsOf(issues).length, 0, messages(issues));
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /bir kısmında choices/);
  });
});

// ── Görsel eşleştirme ────────────────────────────────────────────────────────

describe('validateQuestion — görsel eşleştirme', () => {
  it('boş metinli çifti ve alt metinsiz görseli ayırt eder', () => {
    const question: Question = {
      id: 'q1',
      type: 'image_match',
      prompt: 'ÖRNEK SORU',
      pairs: [
        { id: 'p1', image: { key: 'ornek/a-01.png', alt: 'ÖRNEK ALT' }, text: 'ÖRNEK 1' },
        { id: 'p2', image: { key: 'ornek/b-01.png', alt: '' }, text: '' },
      ],
    };
    const issues = validateQuestion(question, WHERE);

    assert.equal(errorsOf(issues).length, 1, messages(issues));
    assert.equal(issues.length, 2, messages(issues));
  });
});

// ── Seviye ve yol ────────────────────────────────────────────────────────────

describe('validateLevel', () => {
  it('sorusuz seviyeyi hata sayar', () => {
    const found = errorsOf(validateLevel(levelWith([]), WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /hiç sorusu yok/);
  });

  it('seviye içinde yinelenen soru kimliğini yakalar', () => {
    const level = levelWith([goodQuestion('q1'), goodQuestion('q1')]);
    const found = errorsOf(validateLevel(level, WHERE));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /soru kimliği/);
  });

  it('geçersiz xpReward uyarır', () => {
    const level = { ...levelWith([goodQuestion()]), xpReward: 0 };
    const issues = validateLevel(level, WHERE);

    assert.equal(issues.length, 1, messages(issues));
    assert.equal(issues[0].severity, 'warning');
  });

  it('konumu soruya kadar zincirler', () => {
    const level = levelWith([{ ...goodQuestion('q7'), prompt: '' }], 'level-9');
    const issues = validateLevel(level, 'unit-1 › level-9');

    assert.equal(issues.length, 1, messages(issues));
    assert.equal(issues[0].where, 'unit-1 › level-9 › q7');
  });
});

describe('validateLearningPath', () => {
  it('sağlam yolda susar', () => {
    const path = pathWith([unitWith([levelWith([goodQuestion()])])]);

    assert.deepEqual(validateLearningPath(path), []);
  });

  it('boş yolu hata sayar', () => {
    const found = errorsOf(validateLearningPath(pathWith([])));

    assert.equal(found.length, 1, messages(found));
  });

  it('AYRI ünitelerdeki aynı seviye kimliğini yakalar', () => {
    // `UserProgress.levels` düz bir sözlük: çakışan kimlik iki seviyenin
    // ilerlemesini birbirine bağlar. Ünite içi denetim bunu göremezdi.
    const path = pathWith([
      unitWith([levelWith([goodQuestion()], 'level-x')], 'unit-1'),
      unitWith([levelWith([goodQuestion()], 'level-x')], 'unit-2'),
    ]);
    const found = errorsOf(validateLearningPath(path));

    assert.equal(found.length, 1, messages(found));
    assert.match(found[0].message, /seviye kimliği/);
  });

  it('aynı order değerini taşıyan iki seviyeyi uyarır', () => {
    const path = pathWith([
      unitWith([
        levelWith([goodQuestion('q1')], 'level-1'),
        levelWith([goodQuestion('q2')], 'level-2'),
      ]),
    ]);
    const issues = validateLearningPath(path);

    assert.equal(issues.length, 1, messages(issues));
    assert.equal(issues[0].severity, 'warning');
    assert.match(issues[0].message, /order/);
  });
});

describe('rapor biçimi', () => {
  it('şiddetleri sayar', () => {
    const issues: ContentIssue[] = [
      { severity: 'error', where: 'a', message: 'x' },
      { severity: 'warning', where: 'b', message: 'y' },
      { severity: 'error', where: 'c', message: 'z' },
    ];

    assert.deepEqual(countBySeverity(issues), { errors: 2, warnings: 1 });
  });

  it('satırı okunabilir yazar', () => {
    assert.equal(
      formatIssue({ severity: 'error', where: 'unit-1 › level-1', message: 'boş.' }),
      'HATA  unit-1 › level-1: boş.',
    );
  });
});

// ── Rozetler ─────────────────────────────────────────────────────────────────

/** Denetlenecek en küçük geçerli rozet. */
function badge(overrides: Partial<BadgeDefinition> = {}): BadgeDefinition {
  return {
    id: 'badge-1',
    name: 'ÖRNEK ROZET',
    description: 'ÖRNEK AÇIKLAMA',
    order: 1,
    condition: { type: 'xpTotal', threshold: 100 },
    ...overrides,
  };
}

function catalog(badges: BadgeDefinition[]): BadgeCatalog {
  return { id: 'badges-test', badges };
}

const LIMITS = { totalLevelCount: 10, totalFirstPassXp: 150, knownUnitIds: ['unit-1'] };

describe('validateBadgeContent', () => {
  it('sağlam katalogda susar', () => {
    const found = validateBadgeContent(
      catalog([
        badge(),
        badge({ id: 'badge-2', order: 2, condition: { type: 'unitCompleted', unitId: 'unit-1' } }),
      ]),
      LIMITS,
    );

    assert.deepEqual(found, []);
  });

  it('yinelenen rozet kimliğini hata sayar (veritabanı anahtarı)', () => {
    const found = validateBadgeContent(catalog([badge(), badge({ order: 2 })]), LIMITS);

    assert.equal(found.filter((issue) => issue.severity === 'error').length, 1);
    assert.match(found[0].message, /yineleniyor/);
  });

  it('sıfır ve ondalık eşiği hata sayar', () => {
    const zero = validateBadgeContent(
      catalog([badge({ condition: { type: 'xpTotal', threshold: 0 } })]),
      LIMITS,
    );
    const fraction = validateBadgeContent(
      catalog([badge({ condition: { type: 'streakDays', threshold: 2.5 } })]),
      LIMITS,
    );

    assert.equal(zero[0].severity, 'error');
    assert.equal(fraction[0].severity, 'error');
  });

  it('bilinmeyen üniteyi hata sayar', () => {
    const found = validateBadgeContent(
      catalog([badge({ condition: { type: 'unitCompleted', unitId: 'unit-yok' } })]),
      LIMITS,
    );

    assert.equal(found[0].severity, 'error');
    assert.match(found[0].message, /yolda yok/);
  });

  it('yoldaki seviye sayısını aşan eşiği hata sayar (ölü içerik)', () => {
    const found = validateBadgeContent(
      catalog([badge({ condition: { type: 'levelsCompleted', threshold: 11 } })]),
      LIMITS,
    );

    assert.equal(found[0].severity, 'error');
  });

  it('ilk geçiş XP toplamını aşan eşiği UYARI sayar — tekrar çalışmayla ulaşılabilir', () => {
    const found = validateBadgeContent(
      catalog([badge({ condition: { type: 'xpTotal', threshold: 500 } })]),
      LIMITS,
    );

    assert.equal(found[0].severity, 'warning');
  });

  it('limits verilmezse erişilebilirlik denetimini ATLAR (saflık sözleşmesi)', () => {
    const found = validateBadgeContent(
      catalog([badge({ condition: { type: 'levelsCompleted', threshold: 9999 } })]),
    );

    assert.deepEqual(found, []);
  });

  it('boş ad ve açıklamayı uyarır, boş kataloğu uyarır', () => {
    const blank = validateBadgeContent(catalog([badge({ name: ' ', description: '' })]), LIMITS);
    const empty = validateBadgeContent(catalog([]), LIMITS);

    assert.equal(blank.length, 2);
    assert.equal(blank.every((issue) => issue.severity === 'warning'), true);
    assert.equal(empty[0].severity, 'warning');
  });

  it('aynı koşulu taşıyan iki rozeti uyarır', () => {
    const found = validateBadgeContent(catalog([badge(), badge({ id: 'badge-2', order: 2 })]), LIMITS);

    assert.equal(found.some((issue) => /aynı koşulu/.test(issue.message)), true);
  });
});
