import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  clockToMinutes,
  findNextPrayer,
  localEpochFor,
  nextDay,
  orderedPrayers,
} from '@/features/prayer/prayerSchedule';

import type { PrayerTimes } from '@/types';

/**
 * ⚠️ Bu dosyada MUTLAK epoch değeri iddia EDİLMEZ.
 *
 * Türkiye 2016'dan beri kalıcı UTC+3 ve yaz saati uygulamıyor; yani DST riski
 * Türkiye'deki kullanıcıda değil, testin koştuğu makinede ve Türkiye
 * vakitlerine yurt dışından bakan kullanıcıda. Sabit bir epoch yazmak testi
 * geliştirme makinesinin saat dilimine çivilerdi.
 *
 * Bunun yerine saat diliminden BAĞIMSIZ değişmezler sınanıyor: sıra
 * monotonluğu, `at > now` katılığı, gece yarısının aşılması. Elle doğrulama
 * (3.1'in kararı — `package.json`'a `TZ=` script'i eklenmez, Windows cmd
 * öneki anlamıyor):
 *   $env:TZ='America/New_York'; npm test
 *   $env:TZ='Pacific/Kiritimati'; npm test
 */

const AT = 1_755_000_000_000;

function times(date: string, overrides: Partial<PrayerTimes> = {}): PrayerTimes {
  return {
    districtId: '9541',
    date,
    imsak: '04:29',
    gunes: '06:07',
    ogle: '13:14',
    ikindi: '17:03',
    aksam: '20:11',
    yatsi: '21:41',
    kibleSaati: '12:13',
    hicriShort: null,
    hicriLong: null,
    updatedAt: AT,
    deletedAt: null,
    ...overrides,
  };
}

/** Yerel duvar saatinden "şimdi" üretir — makinenin saat dilimi ne olursa olsun. */
function localNow(date: string, time: string, seconds = 0): number {
  const at = localEpochFor(date, time);
  assert.notEqual(at, null);
  return (at as number) + seconds * 1000;
}

describe('clockToMinutes', () => {
  it('gün içi dakikaya çevirir', () => {
    assert.equal(clockToMinutes('00:00'), 0);
    assert.equal(clockToMinutes('04:29'), 269);
    assert.equal(clockToMinutes('23:59'), 1439);
  });

  it('bozuk ve aralık dışı girdide null', () => {
    assert.equal(clockToMinutes('4:29'), null); // sıfır dolgu bekleniyor
    assert.equal(clockToMinutes('24:00'), null);
    assert.equal(clockToMinutes('12:60'), null);
    assert.equal(clockToMinutes(''), null);
  });
});

describe('localEpochFor', () => {
  it('aynı günün iki vakti arasındaki fark duvar saatiyle tutarlı', () => {
    // Saat diliminden bağımsız değişmez: 04:29 → 06:07 arası 98 dakika.
    const imsak = localEpochFor('2026-08-15', '04:29');
    const gunes = localEpochFor('2026-08-15', '06:07');

    assert.notEqual(imsak, null);
    assert.notEqual(gunes, null);
    assert.equal((gunes as number) - (imsak as number), 98 * 60 * 1000);
  });

  it('ertesi günün İmsak\'ı bugünün Yatsı\'sından SONRA gelir', () => {
    const yatsi = localEpochFor('2026-08-15', '21:41') as number;
    const tomorrowImsak = localEpochFor('2026-08-16', '04:29') as number;

    assert.ok(tomorrowImsak > yatsi);
  });

  it('bozuk tarih ya da saatte null', () => {
    assert.equal(localEpochFor('15.08.2026', '04:29'), null);
    assert.equal(localEpochFor('2026-08-15', '4:29'), null);
    assert.equal(localEpochFor('2026-08-15', ''), null);
  });
});

describe('orderedPrayers', () => {
  it('altı vakti gün içi sırasıyla verir', () => {
    assert.deepEqual(
      orderedPrayers(times('2026-08-15')).map((entry) => entry.name),
      ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'],
    );
  });

  it('okunamayan vakit listeden düşer', () => {
    const result = orderedPrayers(times('2026-08-15', { ikindi: 'bozuk' }));

    assert.equal(result.length, 5);
    assert.ok(!result.some((entry) => entry.name === 'ikindi'));
  });
});

describe('findNextPrayer', () => {
  const today = times('2026-08-15');
  const tomorrow = times('2026-08-16', { imsak: '04:30' });

  it('İmsak öncesinde sıradaki vakit İmsak', () => {
    const next = findNextPrayer(today, tomorrow, localNow('2026-08-15', '03:00'));

    assert.equal(next?.name, 'imsak');
    assert.equal(next?.isTomorrow, false);
    assert.equal(next?.date, '2026-08-15');
  });

  it('vaktin TAM dakikasında sıradaki bir SONRAKİ vakittir', () => {
    // Katı `>` sınırı. `>=` olsaydı geri sayım o dakika boyunca sıfırda
    // takılır ve `useCountdown` sürekli `onElapsed` tetiklerdi.
    const next = findNextPrayer(today, tomorrow, localNow('2026-08-15', '13:14'));

    assert.equal(next?.name, 'ikindi');
  });

  it('vaktin bir saniye öncesinde hâlâ o vakit', () => {
    const next = findNextPrayer(today, tomorrow, localNow('2026-08-15', '13:13', 59));

    assert.equal(next?.name, 'ogle');
  });

  it('Yatsı\'dan sonra sıradaki YARININ İmsak\'ı — gece yarısı kendiliğinden aşılıyor', () => {
    const now = localNow('2026-08-15', '22:30');
    const next = findNextPrayer(today, tomorrow, now);

    assert.equal(next?.name, 'imsak');
    assert.equal(next?.isTomorrow, true);
    assert.equal(next?.date, '2026-08-16');
    assert.equal(next?.time, '04:30');
    assert.ok((next?.at as number) > now);
  });

  it('gece yarısına saniyeler kala kalan süre hâlâ pozitif ve saniye hassasiyetinde', () => {
    const now = localNow('2026-08-15', '23:59', 30);
    const next = findNextPrayer(today, tomorrow, now);

    assert.equal(next?.isTomorrow, true);
    const remaining = (next?.at as number) - now;
    assert.ok(remaining > 0);
    // 23:59:30 → ertesi gün 04:30 = 4 saat 30 dakika 30 saniye.
    assert.equal(remaining, (4 * 3600 + 30 * 60 + 30) * 1000);
  });

  it('Yatsı geçti ve yarın YOKSA null — negatif geri sayım yok', () => {
    assert.equal(findNextPrayer(today, null, localNow('2026-08-15', '22:30')), null);
  });

  it('bugün yoksa ama yarın varsa yarının İmsak\'ı', () => {
    const next = findNextPrayer(null, tomorrow, localNow('2026-08-15', '13:00'));

    assert.equal(next?.name, 'imsak');
    assert.equal(next?.isTomorrow, true);
  });

  it('iki gün de yoksa null', () => {
    assert.equal(findNextPrayer(null, null, AT), null);
  });

  it('bugünün altı vakti de bozuksa yarına düşer', () => {
    const broken = times('2026-08-15', {
      imsak: 'x',
      gunes: 'x',
      ogle: 'x',
      ikindi: 'x',
      aksam: 'x',
      yatsi: 'x',
    });
    const next = findNextPrayer(broken, tomorrow, localNow('2026-08-15', '03:00'));

    assert.equal(next?.isTomorrow, true);
  });

  it('adaylar sıraya göre değil ZAMANA göre seçiliyor', () => {
    // Gün içi sıra ile epoch sırası uyuşmalı; uyuşmuyorsa hesap yanlıştır.
    const now = localNow('2026-08-15', '18:00');
    const next = findNextPrayer(today, tomorrow, now);

    assert.equal(next?.name, 'aksam');
    assert.ok((next?.at as number) > now);
  });
});

describe('nextDay', () => {
  it('ertesi günü verir, ay sonunu aşar', () => {
    assert.equal(nextDay('2026-08-15'), '2026-08-16');
    assert.equal(nextDay('2026-08-31'), '2026-09-01');
    assert.equal(nextDay('2026-12-31'), '2027-01-01');
  });

  it('bozuk tarihte null', () => {
    assert.equal(nextDay('15.08.2026'), null);
  });
});
