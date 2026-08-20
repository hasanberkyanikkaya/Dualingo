import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MIN_REFRESH_INTERVAL_MS,
  decideRefresh,
  isStale,
} from '@/features/prayer/prayerCache';

import type { RefreshInput } from '@/features/prayer/prayerCache';

const TODAY = '2026-08-20';
const NOW = 1_755_000_000_000;
const HOUR = 60 * 60 * 1000;

function input(overrides: Partial<RefreshInput> = {}): RefreshInput {
  return {
    districtId: '9541',
    latestCachedDate: '2026-09-15',
    hasTodayRow: true,
    todayIso: TODAY,
    lastSyncAt: null,
    attemptedThisSession: false,
    userInitiated: false,
    now: NOW,
    ...overrides,
  };
}

describe('isStale — ölçüt kalan GÜN sayısı, kayıt sayısı değil', () => {
  it('hiç veri yoksa bayat', () => {
    assert.equal(isStale(null, TODAY), true);
  });

  it('biçimi bozuk tarihte bayat', () => {
    assert.equal(isStale('20.08.2026', TODAY), true);
    assert.equal(isStale('2026-09-15', '20.08.2026'), true);
  });

  it('pencere bugünde bitiyorsa bayat', () => {
    assert.equal(isStale(TODAY, TODAY), true);
  });

  it('pencere tamamen geçmişteyse bayat', () => {
    assert.equal(isStale('2026-08-10', TODAY), true);
  });

  it('eşik komşuları: 6 gün kaldıysa BAYAT', () => {
    assert.equal(isStale('2026-08-26', TODAY), true);
  });

  it('eşik komşuları: 7 gün kaldıysa TAZE — sınır dahil', () => {
    assert.equal(isStale('2026-08-27', TODAY), false);
  });

  it('eşik dışarıdan geçersiz kılınabilir', () => {
    assert.equal(isStale('2026-08-22', TODAY, 2), false);
    assert.equal(isStale('2026-08-22', TODAY, 3), true);
  });
});

describe('decideRefresh', () => {
  it('ilçe seçilmemişse ağa çıkılmaz', () => {
    assert.equal(decideRefresh(input({ districtId: null, latestCachedDate: null })), 'skip');
  });

  it('kullanıcı istediyse her koşulda çekilir', () => {
    // "Yenile" hiçbir şey yapmıyormuş gibi görünmemeli.
    assert.equal(
      decideRefresh(input({ userInitiated: true, attemptedThisSession: true, lastSyncAt: NOW })),
      'fetch',
    );
  });

  it('pencere ileride ve bugünün satırı elde → çekilmez', () => {
    assert.equal(decideRefresh(input()), 'skip');
  });

  it('pencere bayatsa çekilir', () => {
    assert.equal(decideRefresh(input({ latestCachedDate: '2026-08-22' })), 'fetch');
  });

  it('hiç veri yoksa çekilir', () => {
    assert.equal(
      decideRefresh(input({ latestCachedDate: null, hasTodayRow: false })),
      'fetch',
    );
  });

  it('DÖNGÜ KIRICI #1 — aynı oturumda ikinci OTOMATİK çağrı atlanır', () => {
    const stale = input({ latestCachedDate: '2026-08-22', attemptedThisSession: true });
    assert.equal(decideRefresh(stale), 'skip');
  });

  it('"pencere ilerlemedi" senaryosu bir döngüye dönmez', () => {
    // 4.0'ın bulgusu: mirror'ın önbelleği bayatsa yenileme AYNI eski pencereyi
    // döndürür. `isStale` true kalır, koşul yeniden sağlanır — ve bu madde
    // olmasa sekmeye her girişte yeni bir istek atılırdı.
    const before = input({ latestCachedDate: '2026-08-22', attemptedThisSession: false });
    assert.equal(decideRefresh(before), 'fetch');

    // Çekim yapıldı, pencere hiç ilerlemedi, `lastSyncAt` yine de yazıldı.
    const after = input({
      latestCachedDate: '2026-08-22',
      attemptedThisSession: true,
      lastSyncAt: NOW,
    });
    assert.equal(decideRefresh(after), 'skip');
  });

  it('DÖNGÜ KIRICI #2 — oturumlar arası soğuma, 6 saat dolmadan çekilmez', () => {
    // Uygulamayı üst üste kapatıp açan kullanıcı `attemptedThisSession`i
    // sıfırlıyor; bu madde o yolu da kapatıyor.
    const recent = input({
      latestCachedDate: '2026-08-22',
      lastSyncAt: NOW - HOUR,
      attemptedThisSession: false,
    });
    assert.equal(decideRefresh(recent), 'skip');
  });

  it('soğuma dolduysa yeniden çekilir', () => {
    const old = input({
      latestCachedDate: '2026-08-22',
      lastSyncAt: NOW - MIN_REFRESH_INTERVAL_MS - 1,
      attemptedThisSession: false,
    });
    assert.equal(decideRefresh(old), 'fetch');
  });

  it('bugünün satırı YOKSA soğuma uygulanmaz — boş ekranda "yakında denedik" gerekçe değil', () => {
    const emptyToday = input({
      latestCachedDate: '2026-09-15',
      hasTodayRow: false,
      lastSyncAt: NOW - HOUR,
    });
    assert.equal(decideRefresh(emptyToday), 'fetch');
  });

  it('bugünün satırı yoksa bile oturum başına bir kez ile sınırlı', () => {
    const emptyToday = input({
      latestCachedDate: '2026-09-15',
      hasTodayRow: false,
      lastSyncAt: NOW - HOUR,
      attemptedThisSession: true,
    });
    assert.equal(decideRefresh(emptyToday), 'skip');
  });
});
