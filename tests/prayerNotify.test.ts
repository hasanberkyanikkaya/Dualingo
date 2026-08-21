import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MAX_SCHEDULED,
  NOTIFICATION_OFFSETS,
  normalizeOffset,
  notificationKey,
  planNotifications,
  planSignature,
  resolvePref,
} from '@/features/prayer/prayerNotify';
import { localEpochFor } from '@/features/prayer/prayerSchedule';
import { addDays } from '@/features/progress/streak';

import type { PrayerNotificationPref, PrayerNotificationPrefMap, PrayerTimes } from '@/types';

/**
 * ⚠️ Bu dosyada MUTLAK epoch değeri iddia EDİLMEZ — `prayerSchedule.test.ts`
 * ile aynı gerekçe: sabit bir epoch yazmak testi geliştirme makinesinin saat
 * dilimine çivilerdi. Sınanan şey saat diliminden bağımsız değişmezler:
 * sıralama, `at > now` katılığı, gecikmenin TAM farkı, kesme yönü.
 *
 * Elle doğrulama:
 *   $env:TZ='America/New_York'; npm test
 *   $env:TZ='Pacific/Kiritimati'; npm test
 */

const AT = 1_755_000_000_000;
const MINUTE = 60_000;

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

function pref(overrides: Partial<PrayerNotificationPref>): PrayerNotificationPref {
  return {
    prayer: 'ogle',
    enabled: true,
    offsetMinutes: 0,
    updatedAt: AT,
    deletedAt: null,
    ...overrides,
  };
}

/** Ardışık günler — `2026-08-21`den başlayarak. */
function window(days: number): PrayerTimes[] {
  const rows: PrayerTimes[] = [];
  let date: string = '2026-08-21';

  for (let index = 0; index < days; index += 1) {
    rows.push(times(date));
    date = addDays(date, 1) as string;
  }

  return rows;
}

describe('normalizeOffset', () => {
  it('bilinen değerleri korur', () => {
    for (const offset of NOTIFICATION_OFFSETS) {
      assert.equal(normalizeOffset(offset), offset);
    }
  });

  it('tanınmayan her değeri 0a çeker', () => {
    // ⚠️ Dizge `'10'` de reddediliyor: SQLite bir gün metin döndürürse ekran
    // hiçbir seçeneği seçili gösteremeyen bir hâle düşmemeli.
    for (const value of [7, -5, 45, '10', null, undefined, NaN, Infinity, {}, [15]]) {
      assert.equal(normalizeOffset(value), 0);
    }
  });
});

describe('resolvePref', () => {
  it('kayıt yoksa AÇIK ve gecikmesiz döner', () => {
    // Kullanıcı kararı: beş vakit açık gelir. Varsayılan tabloda değil burada.
    assert.deepEqual(resolvePref({}, 'ogle'), { enabled: true, offsetMinutes: 0 });
  });

  it('yumuşak silinmiş kaydı YOK sayar', () => {
    const prefs: PrayerNotificationPrefMap = {
      ogle: pref({ enabled: false, offsetMinutes: 30, deletedAt: AT }),
    };

    assert.deepEqual(resolvePref(prefs, 'ogle'), { enabled: true, offsetMinutes: 0 });
  });

  it('yaşayan kaydı olduğu gibi okur ve gecikmeyi daraltır', () => {
    const prefs = {
      ogle: pref({ enabled: false, offsetMinutes: 15 }),
      // Diske bir gün bozuk değer girerse okuma yolu onu 0a çeker.
      ikindi: pref({ prayer: 'ikindi', offsetMinutes: 7 as never }),
    };

    assert.deepEqual(resolvePref(prefs, 'ogle'), { enabled: false, offsetMinutes: 15 });
    assert.deepEqual(resolvePref(prefs, 'ikindi'), { enabled: true, offsetMinutes: 0 });
  });
});

describe('notificationKey', () => {
  it('gün ve vakitten kurulur, GECİKME girmez', () => {
    // Gecikme kimliğe girseydi kullanıcı gecikmeyi değiştirdiğinde eski
    // bildirim yetim kalır, yenisi yanına kurulurdu.
    assert.equal(notificationKey('ogle', '2026-08-21'), 'prayer-time:2026-08-21:ogle');
  });
});

describe('planNotifications', () => {
  it('beş vakit planlar, GÜNEŞ hiç girmez', () => {
    const now = localNow('2026-08-21', '00:01');
    const planned = planNotifications([times('2026-08-21')], {}, now);

    assert.equal(planned.length, 5);
    assert.equal(
      planned.some((item) => item.prayer === 'gunes'),
      false,
    );
    assert.deepEqual(
      planned.map((item) => item.prayer),
      ['imsak', 'ogle', 'ikindi', 'aksam', 'yatsi'],
    );
  });

  it('geçmiş vakitleri ve TAM o anı dışarıda bırakır', () => {
    // ⚠️ Katı `>` — `findNextPrayer`in aynı disiplini.
    const now = localNow('2026-08-21', '13:14');
    const planned = planNotifications([times('2026-08-21')], {}, now);

    assert.deepEqual(
      planned.map((item) => item.prayer),
      ['ikindi', 'aksam', 'yatsi'],
    );
  });

  it('kapalı vakti planlamaz, hepsi kapalıysa plan boştur', () => {
    const now = localNow('2026-08-21', '00:01');

    const partial = planNotifications(
      [times('2026-08-21')],
      { ogle: pref({ enabled: false }) },
      now,
    );
    assert.equal(
      partial.some((item) => item.prayer === 'ogle'),
      false,
    );
    assert.equal(partial.length, 4);

    const allOff: PrayerNotificationPrefMap = {
      imsak: pref({ prayer: 'imsak', enabled: false }),
      ogle: pref({ prayer: 'ogle', enabled: false }),
      ikindi: pref({ prayer: 'ikindi', enabled: false }),
      aksam: pref({ prayer: 'aksam', enabled: false }),
      yatsi: pref({ prayer: 'yatsi', enabled: false }),
    };
    assert.deepEqual(planNotifications([times('2026-08-21')], allOff, now), []);
  });

  it('gecikmeyi TAM dakika olarak uygular', () => {
    const now = localNow('2026-08-21', '00:01');

    const base = planNotifications([times('2026-08-21')], {}, now);
    const delayed = planNotifications(
      [times('2026-08-21')],
      { ogle: pref({ offsetMinutes: 15 }) },
      now,
    );

    const baseOgle = base.find((item) => item.prayer === 'ogle');
    const delayedOgle = delayed.find((item) => item.prayer === 'ogle');
    assert.notEqual(baseOgle, undefined);
    assert.notEqual(delayedOgle, undefined);

    // ⚠️ Saat diliminden bağımsız: iki mutlak değer değil, FARKLARI sınanıyor.
    assert.equal((delayedOgle as { at: number }).at - (baseOgle as { at: number }).at, 15 * MINUTE);
  });

  it('gecikme bir vakti sıradaki vaktin ötesine taşıyabilir ve sıra buna uyar', () => {
    // Öğle 13:14 + 30 dk = 13:44; İkindi 17:03. Sıra bozulmuyor ama plan
    // sıralamasının vakit sırasına DEĞİL `at`e dayandığı burada çiviliyor:
    // Akşam'ı 30 dk geciktirip Yatsı'yı yerinde bırakmak sırayı korumalı.
    const now = localNow('2026-08-21', '00:01');
    const planned = planNotifications(
      [times('2026-08-21', { aksam: '21:30' })],
      { aksam: pref({ prayer: 'aksam', offsetMinutes: 30 }) },
      now,
    );

    // Akşam 21:30 + 30 dk = 22:00, Yatsı 21:41 → Yatsı önce gelir.
    const order = planned.map((item) => item.prayer);
    assert.deepEqual(order, ['imsak', 'ogle', 'ikindi', 'yatsi', 'aksam']);
  });

  it('plan `at`e göre kesin artan sıradadır', () => {
    const now = localNow('2026-08-21', '00:01');
    const planned = planNotifications(window(6), {}, now);

    for (let index = 1; index < planned.length; index += 1) {
      assert.ok(planned[index].at > planned[index - 1].at);
    }
  });

  it('okunamayan bir vakti düşürür, satırın tamamını değil', () => {
    const now = localNow('2026-08-21', '00:01');
    const planned = planNotifications([times('2026-08-21', { ikindi: '99:99' })], {}, now);

    assert.equal(planned.length, 4);
    assert.equal(
      planned.some((item) => item.prayer === 'ikindi'),
      false,
    );
  });

  it('sınırı aşmaz ve EN GEÇ olanlardan keser', () => {
    const now = localNow('2026-08-21', '00:01');
    const planned = planNotifications(window(20), {}, now);

    assert.equal(planned.length, MAX_SCHEDULED);
    // 60 kayıt = 12 gün × 5 vakit; 13. gün hiç girmemeli.
    assert.equal(planned[0].date, '2026-08-21');
    assert.equal(planned[planned.length - 1].date, '2026-09-01');
    assert.equal(
      planned.some((item) => item.date > '2026-09-01'),
      false,
    );
  });

  it('sınır 0 ya da altındaysa hiçbir şey planlamaz', () => {
    const now = localNow('2026-08-21', '00:01');
    assert.deepEqual(planNotifications(window(3), {}, now, 0), []);
    assert.deepEqual(planNotifications(window(3), {}, now, -1), []);
  });

  it('boş pencere boş plan verir', () => {
    assert.deepEqual(planNotifications([], {}, AT), []);
  });
});

describe('planSignature', () => {
  it('aynı plan aynı imzayı, değişen gecikme farklı imzayı verir', () => {
    const now = localNow('2026-08-21', '00:01');
    const rows = [times('2026-08-21')];

    const base = planNotifications(rows, {}, now);
    const same = planNotifications(rows, {}, now);
    const shifted = planNotifications(rows, { ogle: pref({ offsetMinutes: 5 }) }, now);

    assert.equal(planSignature(base), planSignature(same));
    assert.notEqual(planSignature(base), planSignature(shifted));
  });

  it('boş plan boş imza verir', () => {
    assert.equal(planSignature([]), '');
  });
});
