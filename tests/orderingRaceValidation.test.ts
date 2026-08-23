import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateOrderingRaceContent } from '@/features/games/orderingRaceValidation';

const valid = {
  id: 'ordering-race',
  title: 'Sıralama Yarışı',
  description: 'ÖRNEK AÇIKLAMA',
  puzzles: [
    {
      id: 'p1',
      prompt: 'ÖRNEK SORU',
      items: [
        { id: 'a', text: 'ÖRNEK A' },
        { id: 'b', text: 'ÖRNEK B' },
      ],
      correctOrder: ['b', 'a'],
    },
  ],
};

describe('Sıralama Yarışı içerik doğrulaması', () => {
  it('sağlam örnek içeriği kabul eder', () => {
    assert.deepEqual(validateOrderingRaceContent(valid), []);
  });

  it('yinelenen öğe ve bulmaca kimliklerini yakalar', () => {
    const broken = {
      ...valid,
      puzzles: [
        {
          ...valid.puzzles[0],
          items: [
            { id: 'a', text: 'ÖRNEK A' },
            { id: 'a', text: 'ÖRNEK B' },
          ],
          correctOrder: ['a', 'a'],
        },
        valid.puzzles[0],
      ],
    };
    const issues = validateOrderingRaceContent(broken);

    assert.equal(issues.some((issue) => issue.message.includes('öğe kimlikleri')), true);
    assert.equal(issues.some((issue) => issue.message.includes('bulmaca kimlikleri')), true);
  });

  it('doğru sıranın öğe permütasyonu olmasını zorunlu tutar', () => {
    const broken = {
      ...valid,
      puzzles: [{ ...valid.puzzles[0], correctOrder: ['a', 'x'] }],
    };
    const issues = validateOrderingRaceContent(broken);

    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /permütasyonu/);
  });

  it('nesne olmayan ve boş içeriği hata olarak döndürür', () => {
    assert.equal(validateOrderingRaceContent(null).length, 1);
    assert.equal(validateOrderingRaceContent({ id: 'ordering-race', puzzles: [] }).length >= 3, true);
  });
});
