import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyPlacement,
  findEntryLevelId,
  resolvePlacementDifficulty,
} from '@/features/progress/placement';

import type { Difficulty, LevelId, LevelProgress, LevelStatus, Unit } from '@/types';

/**
 * Seviye tespiti testleri.
 *
 * ⚠️ `unlock.test.ts` ile aynı gerekçe: **yanlış yerleştirme elle test etmekle
 * görünmez.** Sınav biter, harita makul görünür, kullanıcı yanlış noktadan
 * başlar. Hatanın ortaya çıkması için içeriğin tamamını bilmek gerekir.
 */

const NOW = 1_755_000_000_000;

/**
 * Sınama yolu — kademeleri **bilerek monoton DEĞİL**, gerçek örnek içeriğin
 * deseniyle aynı: `beginner×4, basic, beginner×2, basic×2, advanced`.
 *
 * Bu desen olmadan "sıra tabanlı" ile "kademe tabanlı" kural aynı sonucu verir
 * ve test kuralı gerçekten sınamaz.
 */
function makeUnits(): Unit[] {
  const level = (id: LevelId, order: number, difficulty: Difficulty) => ({
    id,
    title: id,
    order,
    difficulty,
    xpReward: 10,
    questions: [],
  });

  return [
    {
      id: 'u1',
      title: 'Ünite 1',
      order: 1,
      levels: [
        level('a1', 1, 'beginner'),
        level('a2', 2, 'beginner'),
        level('a3', 3, 'beginner'),
        level('a4', 4, 'beginner'),
        level('a5', 5, 'basic'),
      ],
    },
    {
      id: 'u2',
      title: 'Ünite 2',
      order: 2,
      levels: [
        level('b1', 1, 'beginner'),
        level('b2', 2, 'beginner'),
        level('b3', 3, 'basic'),
        level('b4', 4, 'basic'),
        level('b5', 5, 'advanced'),
      ],
    },
  ];
}

const ORDER: readonly LevelId[] = ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2', 'b3', 'b4', 'b5'];

function record(
  levelId: LevelId,
  status: LevelStatus,
  deletedAt: number | null = null,
): LevelProgress {
  return {
    levelId,
    status,
    stars: status === 'completed' ? 3 : 0,
    bestAccuracy: status === 'completed' ? 1 : 0,
    attemptCount: status === 'completed' ? 1 : 0,
    updatedAt: NOW,
    deletedAt,
  };
}

/** Sözlüğü okunabilir bir `id → status` haritasına indirir. */
function statuses(levels: Record<LevelId, LevelProgress>): Record<string, LevelStatus | '—'> {
  const out: Record<string, LevelStatus | '—'> = {};

  for (const id of ORDER) {
    const found = levels[id];
    out[id] = found === undefined || found.deletedAt !== null ? '—' : found.status;
  }

  return out;
}

describe('resolvePlacementDifficulty', () => {
  it('eşiği tam tutturan beyanı DOĞRULAR (%70)', () => {
    // 7/10 = tam %70. Kayan noktada bu sınır yanlış yöne yuvarlanabilirdi;
    // hesap tam sayı aritmetiğiyle yapılıyor.
    assert.equal(resolvePlacementDifficulty('advanced', 7, 10), 'advanced');
  });

  it('eşiğin bir altında bir kademe DÜŞÜRÜR', () => {
    assert.equal(resolvePlacementDifficulty('advanced', 69, 100), 'basic');
  });

  it('kusursuz sonuçta beyanı korur — asla YÜKSELTMEZ', () => {
    assert.equal(resolvePlacementDifficulty('beginner', 6, 6), 'beginner');
    assert.equal(resolvePlacementDifficulty('basic', 6, 6), 'basic');
  });

  it('beginner taban yapar, altına inmez', () => {
    assert.equal(resolvePlacementDifficulty('beginner', 0, 6), 'beginner');
  });

  it('advanced yalnızca BİR kademe düşer, dibe vurmaz', () => {
    assert.equal(resolvePlacementDifficulty('advanced', 0, 6), 'basic');
  });

  it('soru sorulmadıysa (total = 0) beyanı olduğu gibi kabul eder', () => {
    // "En baştan başlamak istiyorum" yolu ve boş havuz durumu buradan geçiyor.
    assert.equal(resolvePlacementDifficulty('advanced', 0, 0), 'advanced');
  });

  it('bozuk sayılarda beyana düşer, NaN üretmez', () => {
    assert.equal(resolvePlacementDifficulty('basic', Number.NaN, 6), 'basic');
    assert.equal(resolvePlacementDifficulty('basic', 3, Number.POSITIVE_INFINITY), 'basic');
    assert.equal(resolvePlacementDifficulty('basic', 3, -5), 'basic');
  });
});

describe('findEntryLevelId', () => {
  it('kademenin düz sıradaki İLK seviyesini bulur', () => {
    assert.equal(findEntryLevelId(makeUnits(), 'beginner'), 'a1');
    assert.equal(findEntryLevelId(makeUnits(), 'basic'), 'a5');
    assert.equal(findEntryLevelId(makeUnits(), 'advanced'), 'b5');
  });

  it('kademe hiç yoksa bir alt kademeye iner', () => {
    // `advanced` seviyesi olmayan bir yol — `advanced` sonucu `basic`in ilkine düşer.
    const units = makeUnits();
    units[1].levels = units[1].levels.filter((level) => level.difficulty !== 'advanced');

    assert.equal(findEntryLevelId(units, 'advanced'), 'a5');
  });

  it('hiçbir kademe tutmuyorsa yolun ilk seviyesine düşer', () => {
    const units = makeUnits();
    for (const unit of units) {
      unit.levels = unit.levels.map((level) => ({ ...level, difficulty: 'advanced' as const }));
    }

    // `beginner` arandı, hiçbiri yok, aşağı inecek kademe de yok.
    assert.equal(findEntryLevelId(units, 'beginner'), 'a1');
  });

  it('boş yolda null döner, fırlatmaz', () => {
    assert.equal(findEntryLevelId([], 'basic'), null);
  });
});

describe('applyPlacement', () => {
  it('öncesini skipped, girişi available yapar; SONRASINA dokunmaz', () => {
    const result = applyPlacement(makeUnits(), {}, 'basic', NOW);

    assert.deepEqual(statuses(result), {
      a1: 'skipped',
      a2: 'skipped',
      a3: 'skipped',
      a4: 'skipped',
      a5: 'available',
      // ⚠️ `b1`/`b2` `beginner` ama `a5`in İLERİSİNDE — sıra tabanlı kural
      // onlara dokunmuyor. Kademe tabanlı bir kural burada `skipped` yazar,
      // `b3` kilitli kalır ve haritada delik açılırdı.
      b1: '—',
      b2: '—',
      b3: '—',
      b4: '—',
      b5: '—',
    });
  });

  it('beginner sonucunda hiçbir şey atlanmaz, yalnızca giriş açılır', () => {
    const result = applyPlacement(makeUnits(), {}, 'beginner', NOW);

    assert.equal(result.a1.status, 'available');
    assert.equal(result.a2, undefined);
  });

  it('advanced sonucunda yolun sonuna kadar her şey skipped olur', () => {
    const result = applyPlacement(makeUnits(), {}, 'advanced', NOW);

    assert.deepEqual(
      ORDER.slice(0, 9).map((id) => result[id].status),
      Array(9).fill('skipped'),
    );
    assert.equal(result.b5.status, 'available');
  });

  it('atlanan kayıt hiç çalışılmamış görünür — tam XP kuralı buna dayanıyor', () => {
    const result = applyPlacement(makeUnits(), {}, 'basic', NOW);

    assert.deepEqual(result.a1, {
      levelId: 'a1',
      status: 'skipped',
      stars: 0,
      bestAccuracy: 0,
      attemptCount: 0,
      updatedAt: NOW,
      deletedAt: null,
    });
  });

  it('tamamlanmış kaydı ASLA geri düşürmez', () => {
    // Tekrar sınavı: kullanıcı daha önce a1 ve a2'yi bitirmiş, şimdi `advanced` alıyor.
    const before = { a1: record('a1', 'completed'), a2: record('a2', 'completed') };
    const result = applyPlacement(makeUnits(), before, 'advanced', NOW + 1);

    assert.equal(result.a1, before.a1, 'aynı referans korunmalı');
    assert.equal(result.a2, before.a2);
    assert.equal(result.a3.status, 'skipped');
  });

  it('giriş noktası tamamlanmışsa ona da dokunmaz', () => {
    const before = { a5: record('a5', 'completed') };
    const result = applyPlacement(makeUnits(), before, 'basic', NOW + 1);

    assert.equal(result.a5, before.a5);
  });

  it('sırası gelen skipped kaydı available yapar', () => {
    // Daha önce `advanced` alınmış, şimdi `basic`e dönülüyor: a5 artık sırada.
    const before = { a5: record('a5', 'skipped') };
    const result = applyPlacement(makeUnits(), before, 'basic', NOW + 1);

    assert.equal(result.a5.status, 'available');
    assert.equal(result.a5.updatedAt, NOW + 1);
  });

  it('açık ama atlanmış olması gereken kaydı skipped yapar', () => {
    // `openEntryPoint()` her açılışta a1'i `available` bırakıyor; tespit onu
    // ileri taşımalı, yoksa harita iki "şu an buradasın" gösterir.
    const before = { a1: record('a1', 'available') };
    const result = applyPlacement(makeUnits(), before, 'basic', NOW + 1);

    assert.equal(result.a1.status, 'skipped');
  });

  it('yumuşak silinmiş kaydın ÜZERİNE taze kayıt yazar', () => {
    // `levelStatus.ts`e göre silinmiş kayıt "hiç açılmamış" demek.
    const before = { a1: record('a1', 'completed', NOW - 1) };
    const result = applyPlacement(makeUnits(), before, 'basic', NOW);

    assert.equal(result.a1.status, 'skipped');
    assert.equal(result.a1.deletedAt, null);
    assert.equal(result.a1.stars, 0);
  });

  it('değişiklik yoksa AYNI referansı döndürür', () => {
    const first = applyPlacement(makeUnits(), {}, 'basic', NOW);
    const second = applyPlacement(makeUnits(), first, 'basic', NOW + 1);

    // Aynı sonuç iki kez uygulanınca harita boşuna yeniden çizilmemeli.
    assert.equal(second, first);
  });

  it('her sonuçta yaşayan en az bir kayıt bırakır', () => {
    // Bu garanti olmadan `findCurrentLevelId` null döner ve "Şu an buradasın"
    // kaybolur — kullanıcının gidecek yeri kalmaz.
    for (const difficulty of ['beginner', 'basic', 'advanced'] as const) {
      const result = applyPlacement(makeUnits(), {}, difficulty, NOW);
      const live = Object.values(result).filter((entry) => entry.deletedAt === null);

      assert.ok(live.length > 0, `${difficulty}: yaşayan kayıt yok`);
      assert.ok(
        live.some((entry) => entry.status === 'available'),
        `${difficulty}: available seviye yok`,
      );
    }
  });

  it('boş yolda girdiyi olduğu gibi döndürür', () => {
    const before = { a1: record('a1', 'available') };
    assert.equal(applyPlacement([], before, 'basic', NOW), before);
  });

  it('girdiyi DEĞİŞTİRMEZ', () => {
    const before = { a1: record('a1', 'available') };
    const snapshot = { ...before.a1 };

    applyPlacement(makeUnits(), before, 'advanced', NOW + 1);

    assert.deepEqual(before.a1, snapshot);
  });
});
