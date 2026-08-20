import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildBadgeSnapshot,
  evaluateBadges,
  hasSameUnlocks,
  isConditionMet,
  mergeAwards,
  queueBadges,
} from '@/features/progress/badges';

import type { BadgeSnapshot } from '@/features/progress/badges';
import type {
  BadgeDefinition,
  BadgeUnlock,
  LevelId,
  LevelProgress,
  LevelStatus,
  StreakState,
  Unit,
} from '@/types';

/** Tek satırlık seviye kaydı kurar. */
function record(levelId: LevelId, status: LevelStatus, deletedAt: number | null = null): LevelProgress {
  return {
    levelId,
    status,
    stars: status === 'completed' ? 3 : 0,
    bestAccuracy: status === 'completed' ? 1 : 0,
    attemptCount: status === 'completed' ? 1 : 0,
    updatedAt: 1,
    deletedAt,
  };
}

/** İki üniteli örnek yol: u1 iki seviye, u2 bir seviye. */
function sampleUnits(): Unit[] {
  return [
    {
      id: 'unit-1',
      title: 'Ünite 1',
      order: 1,
      levels: [
        { id: 'l1', title: 'S1', order: 1, difficulty: 'beginner', xpReward: 10, questions: [] },
        { id: 'l2', title: 'S2', order: 2, difficulty: 'beginner', xpReward: 10, questions: [] },
      ],
    },
    {
      id: 'unit-2',
      title: 'Ünite 2',
      order: 2,
      levels: [
        { id: 'l3', title: 'S3', order: 1, difficulty: 'basic', xpReward: 10, questions: [] },
      ],
    },
  ];
}

function streakOf(longestDays: number): StreakState {
  return { currentDays: 0, longestDays, lastActiveDate: '', updatedAt: 0 };
}

function snapshotOf(partial: Partial<BadgeSnapshot> = {}): BadgeSnapshot {
  return {
    xpTotal: 0,
    completedLevelCount: 0,
    streakDays: 0,
    completedUnitIds: [],
    ...partial,
  };
}

function definition(id: string, condition: BadgeDefinition['condition']): BadgeDefinition {
  return { id, name: 'ÖRNEK ROZET', description: 'ÖRNEK AÇIKLAMA', order: 1, condition };
}

describe('buildBadgeSnapshot', () => {
  it('yalnızca tamamlanmış seviyeleri sayar', () => {
    const levels = {
      l1: record('l1', 'completed'),
      l2: record('l2', 'available'),
      l3: record('l3', 'completed'),
    };

    const snapshot = buildBadgeSnapshot(sampleUnits(), levels, 40, streakOf(3));

    assert.equal(snapshot.completedLevelCount, 2);
    assert.equal(snapshot.xpTotal, 40);
    assert.equal(snapshot.streakDays, 3);
  });

  it('atlanan seviye (skipped) tamamlanmış sayılmaz', () => {
    const levels = { l1: record('l1', 'skipped'), l2: record('l2', 'skipped') };
    const snapshot = buildBadgeSnapshot(sampleUnits(), levels, 0, streakOf(0));

    assert.equal(snapshot.completedLevelCount, 0);
    assert.deepEqual(snapshot.completedUnitIds, []);
  });

  it('yumuşak silinmiş kayıt sayılmaz', () => {
    const levels = { l1: record('l1', 'completed', 999) };
    const snapshot = buildBadgeSnapshot(sampleUnits(), levels, 0, streakOf(0));

    assert.equal(snapshot.completedLevelCount, 0);
  });

  it('tüm seviyeleri biten üniteyi tamamlanmış listeler', () => {
    const levels = {
      l1: record('l1', 'completed'),
      l2: record('l2', 'completed'),
      l3: record('l3', 'available'),
    };

    const snapshot = buildBadgeSnapshot(sampleUnits(), levels, 0, streakOf(0));

    assert.deepEqual(snapshot.completedUnitIds, ['unit-1']);
  });

  it('SEVİYESİZ ünite tamamlanmış sayılmaz (boş-doğru tuzağı)', () => {
    const units: Unit[] = [{ id: 'unit-bos', title: 'Boş', order: 1, levels: [] }];
    const snapshot = buildBadgeSnapshot(units, {}, 0, streakOf(0));

    assert.deepEqual(snapshot.completedUnitIds, []);
  });

  it('bozuk sayıları sıfıra indirger', () => {
    const snapshot = buildBadgeSnapshot([], {}, Number.NaN, streakOf(Number.POSITIVE_INFINITY));

    assert.equal(snapshot.xpTotal, 0);
    assert.equal(snapshot.streakDays, 0);
  });
});

describe('isConditionMet — xpTotal', () => {
  it('eşiğin altında sağlanmaz', () => {
    assert.equal(isConditionMet({ type: 'xpTotal', threshold: 100 }, snapshotOf({ xpTotal: 99 })), false);
  });

  it('eşiğe EŞİTKEN sağlanır (eşik dahil)', () => {
    assert.equal(isConditionMet({ type: 'xpTotal', threshold: 100 }, snapshotOf({ xpTotal: 100 })), true);
  });

  it('sıfır eşik bedava rozet vermez', () => {
    assert.equal(isConditionMet({ type: 'xpTotal', threshold: 0 }, snapshotOf({ xpTotal: 0 })), false);
  });

  it('negatif ve ondalık eşik sağlanmaz', () => {
    assert.equal(isConditionMet({ type: 'xpTotal', threshold: -5 }, snapshotOf({ xpTotal: 10 })), false);
    assert.equal(isConditionMet({ type: 'xpTotal', threshold: 1.5 }, snapshotOf({ xpTotal: 10 })), false);
  });
});

describe('isConditionMet — levelsCompleted ve streakDays', () => {
  it('tamamlanmış seviye sayısı eşiğe ulaşınca sağlanır', () => {
    const condition = { type: 'levelsCompleted', threshold: 5 } as const;
    assert.equal(isConditionMet(condition, snapshotOf({ completedLevelCount: 4 })), false);
    assert.equal(isConditionMet(condition, snapshotOf({ completedLevelCount: 5 })), true);
  });

  it('ölçüt longestDays: serisi bugün kırık olsa bile rozet hak edilir', () => {
    // `currentDays` 0, ama geçmişte 10 günlük seri var.
    const snapshot = buildBadgeSnapshot([], {}, 0, {
      currentDays: 0,
      longestDays: 10,
      lastActiveDate: '2026-08-01',
      updatedAt: 0,
    });

    assert.equal(isConditionMet({ type: 'streakDays', threshold: 7 }, snapshot), true);
  });
});

describe('isConditionMet — unitCompleted', () => {
  it('ünite listede varsa sağlanır', () => {
    const snapshot = snapshotOf({ completedUnitIds: ['unit-1'] });
    assert.equal(isConditionMet({ type: 'unitCompleted', unitId: 'unit-1' }, snapshot), true);
  });

  it('bilinmeyen ünite sağlanmaz', () => {
    const snapshot = snapshotOf({ completedUnitIds: ['unit-1'] });
    assert.equal(isConditionMet({ type: 'unitCompleted', unitId: 'unit-yok' }, snapshot), false);
  });
});

describe('evaluateBadges', () => {
  const definitions = [
    definition('b-xp', { type: 'xpTotal', threshold: 100 }),
    definition('b-level', { type: 'levelsCompleted', threshold: 2 }),
  ];

  it('koşulu sağlayan rozetleri now damgasıyla verir', () => {
    const awards = evaluateBadges(
      definitions,
      snapshotOf({ xpTotal: 100, completedLevelCount: 2 }),
      [],
      1234,
    );

    assert.deepEqual(
      awards.map((award) => award.badgeId),
      ['b-xp', 'b-level'],
    );
    assert.equal(awards[0].earnedAt, 1234);
  });

  it('zaten kazanılmış rozeti tekrar vermez', () => {
    const awards = evaluateBadges(definitions, snapshotOf({ xpTotal: 100 }), ['b-xp'], 1);

    assert.deepEqual(awards, []);
  });

  it('koşul artık sağlanmasa bile GERİ ALMA üretmez (Expo Go amnezisi)', () => {
    // Kazanılmış rozet var, anlık görüntü sıfırlanmış: dönen liste boş.
    const awards = evaluateBadges(definitions, snapshotOf(), ['b-xp', 'b-level'], 1);

    assert.deepEqual(awards, []);
  });

  it('bilinmeyen koşul tipi taşıyan tanımı atlar, diğerlerini değerlendirir', () => {
    const bozuk = { id: 'b-bozuk', name: '', description: '', order: 9, condition: { type: 'gelecekten', threshold: 1 } } as unknown as BadgeDefinition;

    const awards = evaluateBadges(
      [bozuk, ...definitions],
      snapshotOf({ xpTotal: 100 }),
      [],
      1,
    );

    assert.deepEqual(
      awards.map((award) => award.badgeId),
      ['b-xp'],
    );
  });

  it('yeni rozet yoksa her çağrıda AYNI referansı döndürür', () => {
    const first = evaluateBadges(definitions, snapshotOf(), [], 1);
    const second = evaluateBadges(definitions, snapshotOf(), [], 2);

    assert.equal(first, second);
  });
});

describe('queueBadges', () => {
  it('yeni kimlikleri sona ekler', () => {
    assert.deepEqual(queueBadges(['a'], ['b', 'c']), ['a', 'b', 'c']);
  });

  it('aynı kimliği iki kez eklemez', () => {
    assert.deepEqual(queueBadges(['a'], ['a', 'b', 'b']), ['a', 'b']);
  });

  it('aynı girdiyle iki kez çağrılınca kuyruk büyümez (çift çalışma)', () => {
    const once = queueBadges([], ['a']);
    const twice = queueBadges(once, ['a']);

    assert.deepEqual(twice, ['a']);
    assert.equal(twice, once, 'değişiklik yoksa aynı referans dönmeli');
  });

  it('eklenecek bir şey yoksa AYNI referansı döndürür', () => {
    const current = ['a'];
    assert.equal(queueBadges(current, []), current);
  });
});

describe('mergeAwards', () => {
  const existing: BadgeUnlock[] = [{ badgeId: 'a', earnedAt: 100, updatedAt: 100, deletedAt: null }];

  it('yeni kazanımı ekler', () => {
    const merged = mergeAwards(existing, [{ badgeId: 'b', earnedAt: 200 }]);

    assert.equal(merged.length, 2);
    assert.deepEqual(merged[1], { badgeId: 'b', earnedAt: 200, updatedAt: 200, deletedAt: null });
  });

  it('var olan kazanımın earnedAt değerini EZMEZ', () => {
    const merged = mergeAwards(existing, [{ badgeId: 'a', earnedAt: 999 }]);

    assert.equal(merged[0].earnedAt, 100);
  });

  it('idempotent: aynı kazanımla iki kez çağrılınca liste büyümez', () => {
    const once = mergeAwards(existing, [{ badgeId: 'b', earnedAt: 200 }]);
    const twice = mergeAwards(once, [{ badgeId: 'b', earnedAt: 200 }]);

    assert.equal(twice.length, 2);
    assert.equal(twice, once);
  });

  it('kazanım yoksa AYNI referansı döndürür', () => {
    assert.equal(mergeAwards(existing, []), existing);
  });
});

describe('hasSameUnlocks', () => {
  const a: BadgeUnlock[] = [
    { badgeId: 'x', earnedAt: 1, updatedAt: 1, deletedAt: null },
    { badgeId: 'y', earnedAt: 2, updatedAt: 2, deletedAt: null },
  ];

  it('sıradan bağımsız aynı kümeyi eşit sayar', () => {
    const b: BadgeUnlock[] = [
      { badgeId: 'y', earnedAt: 9, updatedAt: 9, deletedAt: null },
      { badgeId: 'x', earnedAt: 9, updatedAt: 9, deletedAt: null },
    ];

    assert.equal(hasSameUnlocks(a, b), true);
  });

  it('farklı kimlik kümesini eşit saymaz', () => {
    const b: BadgeUnlock[] = [{ badgeId: 'x', earnedAt: 1, updatedAt: 1, deletedAt: null }];

    assert.equal(hasSameUnlocks(a, b), false);
  });
});
