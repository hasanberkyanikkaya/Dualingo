import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeStreak, toStreakState } from '@/features/progress/dayLog';

import type { IsoDate } from '@/types';

/**
 * Seri hesabı testleri.
 *
 * ⚠️ Faz 3.1'de iki davranış **bilinçli olarak değişti** (eski `advanceStreak`e
 * göre):
 * 1. Biçimi bozuk tarih artık seriyi sıfırlamıyor, **o giriş atılıyor**.
 * 2. İleri tarihli gün artık seriyi sıfırlamıyor, **yok sayılıyor**.
 * Ayrıca uzun boşlukta `currentDays` eskiden `1`di; artık **`0`** — seri okuma
 * anında hesaplandığı için "kırık" durumunun sayısal karşılığı sıfır.
 */

/** `2026-08-01`den başlayarak verilen gün numaralarını tarihe çevirir. */
function day(index: number): IsoDate {
  const date = new Date(Date.UTC(2026, 7, index));
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${dayOfMonth}`;
}

/** `from`dan `to`ya (dahil) kesintisiz gün dizisi. */
function range(from: number, to: number): IsoDate[] {
  const days: IsoDate[] = [];
  for (let index = from; index <= to; index += 1) {
    days.push(day(index));
  }
  return days;
}

describe('computeStreak — gün devri', () => {
  it('hiç gün yoksa none döner', () => {
    const snapshot = computeStreak([], day(10));
    assert.equal(snapshot.status, 'none');
    assert.equal(snapshot.currentDays, 0);
    assert.equal(snapshot.longestDays, 0);
    assert.equal(snapshot.lastActiveDate, null);
    assert.equal(snapshot.totalActiveDays, 0);
  });

  it('yalnızca bugün varsa seri 1 ve active', () => {
    const snapshot = computeStreak([day(10)], day(10));
    assert.equal(snapshot.status, 'active');
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.longestDays, 1);
  });

  it('ardışık üç gün, sonuncusu bugün → 3', () => {
    const snapshot = computeStreak(range(8, 10), day(10));
    assert.equal(snapshot.status, 'active');
    assert.equal(snapshot.currentDays, 3);
  });

  it('aynı gün birden çok ders seriyi şişirmez', () => {
    // Günde beş ders bitirmek seriyi beşe çıkarmamalı; tablo zaten gün başına
    // tek satır tutuyor ama hesap girdiye de dayanmamalı.
    const snapshot = computeStreak([day(10), day(10), day(10)], day(10));
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.totalActiveDays, 1);
  });

  it('sıralanmamış girdiyi doğru hesaplar', () => {
    const snapshot = computeStreak([day(10), day(8), day(9)], day(10));
    assert.equal(snapshot.currentDays, 3);
    assert.equal(snapshot.lastActiveDate, day(10));
  });

  it('dün ders var bugün yok → atRisk, sayaç DÜŞMEZ', () => {
    const snapshot = computeStreak(range(8, 10), day(11));
    assert.equal(snapshot.status, 'atRisk');
    assert.equal(snapshot.currentDays, 3);
  });
});

describe('computeStreak — dondurma', () => {
  it('tek gün boşluğu kurtarır ve dondurulan günü SAYMAZ (5 → 6)', () => {
    // 1-5 etkin (5 gün), 6 kaçırıldı, 7 etkin. Sonuç 6 olmalı, 7 değil:
    // dondurulan günde ders yapılmadı, sayan şey onu izleyen etkin gün.
    const snapshot = computeStreak([...range(1, 5), day(7)], day(7));
    assert.equal(snapshot.status, 'active');
    assert.equal(snapshot.currentDays, 6);
    assert.equal(snapshot.totalActiveDays, 6);
    assert.deepEqual(snapshot.frozenDates, [day(6)]);
  });

  it('dün kaçırıldı bugün henüz boş → frozen, hak REZERVE (tüketilmiş değil)', () => {
    const snapshot = computeStreak(range(1, 5), day(7));
    assert.equal(snapshot.status, 'frozen');
    assert.equal(snapshot.currentDays, 5);
    // Boşluğun ikinci ucu henüz yok; kullanıcı bugün de oynamazsa hak
    // harcanmamış olur. Bu yüzden `frozenDates` BOŞ.
    assert.deepEqual(snapshot.frozenDates, []);
    assert.equal(snapshot.freezeReadyOn, null);
  });

  it('ardışık iki dondurma denemesinde ikincisi reddedilir', () => {
    // 1-2-3 etkin · 4 boş · 5 etkin · 6 boş · 7 etkin.
    // İlk boşluk dondurulur (hak vardı), ikincisi 7 günlük pencerenin içinde
    // kaldığı için reddedilir ve seri 7. günde 1'e döner.
    const snapshot = computeStreak([...range(1, 3), day(5), day(7)], day(7));
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.longestDays, 4);
    assert.deepEqual(snapshot.frozenDates, [day(4)]);
  });

  it('pencere sınırı — 6 gün sonra hak YOK, seri kırılır', () => {
    // 3. gün donduruldu. Sonraki kaçırılan gün 9 → aradaki fark 6 < 7.
    const snapshot = computeStreak([...range(1, 2), ...range(4, 8), day(10)], day(10));
    assert.deepEqual(snapshot.frozenDates, [day(3)]);
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.longestDays, 7);
  });

  it('pencere sınırı — tam 7 gün sonra hak VAR, seri korunur', () => {
    // 3. gün donduruldu. Sonraki kaçırılan gün 10 → fark tam 7, sınır dahil.
    const snapshot = computeStreak([...range(1, 2), ...range(4, 9), day(11)], day(11));
    assert.deepEqual(snapshot.frozenDates, [day(3), day(10)]);
    assert.equal(snapshot.currentDays, 9);
  });

  it('iki gün kaçırma tek dondurmayla kurtarılmaz', () => {
    const snapshot = computeStreak([...range(1, 5), day(8)], day(8));
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.longestDays, 5);
    assert.deepEqual(snapshot.frozenDates, []);
  });

  it('dondurulan gün etkin günlerle kesişmez', () => {
    const active = [...range(1, 5), day(7), ...range(8, 12), day(14)];
    const snapshot = computeStreak(active, day(14));
    for (const frozen of snapshot.frozenDates) {
      assert.equal(active.includes(frozen), false, `${frozen} hem etkin hem donmuş`);
    }
  });

  it('hak tüketildikten sonra freezeReadyOn doğacağı günü verir', () => {
    // 6. gün donduruldu, bugün 7. gün → hak 13'te doğar.
    const snapshot = computeStreak([...range(1, 5), day(7)], day(7));
    assert.equal(snapshot.freezeReadyOn, day(13));
  });

  it('pencere dolduğunda freezeReadyOn tekrar null olur', () => {
    const snapshot = computeStreak([...range(1, 5), day(7)], day(13));
    assert.equal(snapshot.freezeReadyOn, null);
  });

  it('kurallar dışarıdan geçilebilir', () => {
    // 7 günlük pencere yerine 2 günlük: ardışık iki dondurma da kabul edilir.
    const snapshot = computeStreak([...range(1, 3), day(5), day(7)], day(7), {
      freezeWindowDays: 2,
    });
    assert.equal(snapshot.currentDays, 5);
    assert.deepEqual(snapshot.frozenDates, [day(4), day(6)]);
  });
});

describe('computeStreak — sıfırlama ve uzun boşluk', () => {
  it('uzun boşluk seriyi kırar ve currentDays 0 olur', () => {
    const snapshot = computeStreak(range(1, 3), '2027-03-15');
    assert.equal(snapshot.status, 'broken');
    assert.equal(snapshot.currentDays, 0);
  });

  it('kırılan seride longestDays korunur', () => {
    const snapshot = computeStreak(range(1, 3), '2027-03-15');
    assert.equal(snapshot.longestDays, 3);
    assert.equal(snapshot.lastActiveDate, day(3));
  });

  it('geçmişteki uzun seri bugünkü kısa seriyi ezmez', () => {
    const snapshot = computeStreak([...range(1, 10), '2026-12-01'], '2026-12-01');
    assert.equal(snapshot.currentDays, 1);
    assert.equal(snapshot.longestDays, 10);
  });

  it('longestDays dondurma içeren seriyi de doğru ölçer', () => {
    // 1-5 etkin, 6 dondu, 7-9 etkin → 9 uzunluğunda seri değil, 8 etkin gün.
    const snapshot = computeStreak([...range(1, 5), ...range(7, 9), '2026-12-01'], '2026-12-01');
    assert.equal(snapshot.longestDays, 8);
    assert.equal(snapshot.currentDays, 1);
  });
});

describe('computeStreak — sınır ve bozuk veri', () => {
  it('ay sınırını geçen seri kırılmaz', () => {
    const snapshot = computeStreak(['2026-08-30', '2026-08-31', '2026-09-01'], '2026-09-01');
    assert.equal(snapshot.currentDays, 3);
  });

  it('yıl sınırını geçen seri kırılmaz', () => {
    const snapshot = computeStreak(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01');
    assert.equal(snapshot.currentDays, 3);
  });

  it('yaz saati geçişindeki 25 saatlik gün seriyi kırmaz', () => {
    const snapshot = computeStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26');
    assert.equal(snapshot.currentDays, 3);
  });

  it('biçimi bozuk tarih ATILIR, kalan günler doğru hesaplanır', () => {
    // ⚠️ Davranış değişti: eskiden bozuk tarih seriyi 1'e çekiyordu.
    const snapshot = computeStreak([day(8), 'bozuk', day(9), '', day(10)], day(10));
    assert.equal(snapshot.currentDays, 3);
    assert.equal(snapshot.totalActiveDays, 3);
  });

  it('ileri tarihli gün YOK SAYILIR', () => {
    // ⚠️ Davranış değişti: eskiden ileri tarih seriyi sıfırlıyordu.
    const snapshot = computeStreak([...range(8, 10), day(30)], day(10));
    assert.equal(snapshot.currentDays, 3);
    assert.equal(snapshot.lastActiveDate, day(10));
    assert.equal(snapshot.totalActiveDays, 3);
  });

  it('bugünün tarihi bozuksa none döner ama longestDays yine hesaplanır', () => {
    const snapshot = computeStreak(range(1, 4), 'bugün');
    assert.equal(snapshot.status, 'none');
    assert.equal(snapshot.currentDays, 0);
    assert.equal(snapshot.longestDays, 4);
  });

  it('değişmezler: currentDays ne toplam etkin günü ne de rekoru aşar', () => {
    // Deterministik sözde rastgele 400 günlük küme — sabit tohumla, çünkü
    // `app.json`da `reactCompiler` açık ve proje genelinde `Math.random()`
    // kaçınılan bir şey; testin de her koşuda aynı veriyi görmesi gerekiyor.
    let seed = 20260820;
    const dates: IsoDate[] = [];
    for (let index = 0; index < 400; index += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      if (seed % 3 !== 0) {
        dates.push(day(index + 1));
      }
    }

    const snapshot = computeStreak(dates, day(400));
    assert.ok(snapshot.currentDays <= snapshot.totalActiveDays);
    assert.ok(snapshot.currentDays <= snapshot.longestDays);
    assert.ok(snapshot.longestDays <= snapshot.totalActiveDays);
  });
});

describe('toStreakState', () => {
  it('türetilmiş alanları DÜŞÜRÜR — diske yalnızca dört alan gider', () => {
    const snapshot = computeStreak([...range(1, 5), day(7)], day(7));
    const state = toStreakState(snapshot, 1_755_000_000_000);

    // ⚠️ Diske sızmayı yakalayan test budur. `status`, `frozenDates` ve
    // `freezeReadyOn` bugüne bağlı; kalıcılaşırlarsa yarın yalan söylerler.
    assert.deepEqual(Object.keys(state).sort(), [
      'currentDays',
      'lastActiveDate',
      'longestDays',
      'updatedAt',
    ]);
    assert.equal(state.currentDays, 6);
    assert.equal(state.lastActiveDate, day(7));
    assert.equal(state.updatedAt, 1_755_000_000_000);
  });

  it('hiç etkin gün yoksa lastActiveDate boş dizge olur', () => {
    const state = toStreakState(computeStreak([], day(10)), 1);
    assert.equal(state.lastActiveDate, '');
  });
});
