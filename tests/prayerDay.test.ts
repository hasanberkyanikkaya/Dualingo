/**
 * `features/prayer/prayerDay.ts` — tablodaki her satırın durumu.
 *
 * Bu dosyanın saf olması testlerin var olma sebebi: "Yatsı'dan sonra tüm
 * satırlar geçmiştir ve hiçbiri sıradaki değildir" gibi bir kuralı cihaz
 * saatini değiştirmeden sınamanın başka yolu yok.
 *
 * ⚠️ **Testler MUTLAK EPOCH İDDİA ETMEZ.** `localEpochFor` yerel duvar saatini
 * çözüyor; sabit bir epoch yazmak testi makinenin saat dilimine bağlardı.
 * Bunun yerine "şimdi" hep `localEpochFor` üzerinden kuruluyor ve saat
 * diliminden bağımsız değişmezler sınanıyor (`prayerSchedule.test.ts`
 * disiplininin aynısı). Elle doğrulama (PowerShell):
 *   $env:TZ='America/New_York'; npm test
 *   $env:TZ='Pacific/Kiritimati'; npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildPrayerDay, countStatus, isTrackable } from '@/features/prayer/prayerDay';
import { findNextPrayer, localEpochFor } from '@/features/prayer/prayerSchedule';

import type { PrayerMarkMap, PrayerTimes } from '@/types';

const AT = 1_755_000_000_000;
const TODAY = '2026-08-20';
const TOMORROW = '2026-08-21';

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
    hicriShort: '2.3.1448',
    hicriLong: '2 Rebîulevvel 1448',
    updatedAt: AT,
    deletedAt: null,
    ...overrides,
  };
}

/** Duvar saatinden "şimdi" kurar — saat diliminden bağımsız. */
function at(clock: string, date: string = TODAY): number {
  const epoch = localEpochFor(date, clock);
  assert.notEqual(epoch, null);
  return epoch as number;
}

/** Tabloyu gerçek akışıyla kurar: `findNextPrayer` ne dediyse `phase` ona uyar. */
function day(
  now: number,
  marks: PrayerMarkMap = {},
  today: PrayerTimes | null = times(TODAY),
) {
  const tomorrow = times(TOMORROW);
  return buildPrayerDay(today, findNextPrayer(today, tomorrow, now), marks, now);
}

function phases(now: number) {
  return day(now).map((row) => `${row.name}:${row.phase}`);
}

describe('isTrackable', () => {
  it('beş vakit işaretlenebilir, Güneş DEĞİL', () => {
    // ⚠️ Güneş bir namaz vakti değil, sabah namazının bittiği an. Satır
    // tabloda kalır (Diyanet'in yayınladığı tablo altı satır) ama kutu almaz.
    assert.equal(isTrackable('imsak'), true);
    assert.equal(isTrackable('ogle'), true);
    assert.equal(isTrackable('ikindi'), true);
    assert.equal(isTrackable('aksam'), true);
    assert.equal(isTrackable('yatsi'), true);
    assert.equal(isTrackable('gunes'), false);
  });
});

describe('buildPrayerDay', () => {
  it('veri yoksa boş tablo — çökmez, yer tutucu satır uydurmaz', () => {
    assert.deepEqual(buildPrayerDay(null, null, {}, at('12:00')), []);
  });

  it('altı vakti gün içi sırasıyla verir', () => {
    assert.deepEqual(
      day(at('12:00')).map((row) => row.name),
      ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'],
    );
  });

  it('gün ortasında geçmiş, sıradaki ve gelecek ayrışır', () => {
    assert.deepEqual(phases(at('12:00')), [
      'imsak:past',
      'gunes:past',
      'ogle:next',
      'ikindi:upcoming',
      'aksam:upcoming',
      'yatsi:upcoming',
    ]);
  });

  it('İmsak öncesinde hiçbir satır geçmiş değil', () => {
    assert.deepEqual(phases(at('03:00')), [
      'imsak:next',
      'gunes:upcoming',
      'ogle:upcoming',
      'ikindi:upcoming',
      'aksam:upcoming',
      'yatsi:upcoming',
    ]);
  });

  it('vaktin TAM dakikasında satır artık GEÇMİŞTİR', () => {
    // ⚠️ `findNextPrayer` katı `>` kullanıyor; buradaki `at <= now` onun
    // aynadaki yüzü. İkisi gevşerse aynı satır hem "geçti" hem "sıradaki" olur.
    const rows = day(at('13:14'));

    assert.equal(rows[2].name, 'ogle');
    assert.equal(rows[2].phase, 'past');
    assert.equal(rows[3].phase, 'next');
  });

  it('vaktin bir dakika öncesinde hâlâ sıradaki', () => {
    assert.equal(day(at('13:13'))[2].phase, 'next');
  });

  it('YATSIDAN SONRA altı satırın altısı da geçmiş, hiçbiri sıradaki değil', () => {
    // Gün dönümü: `next` artık yarının İmsakı ve bu tabloya ait değil.
    // Doğru ve dürüst hâl — gün bitmiştir.
    const now = at('22:30');

    assert.deepEqual(phases(now), [
      'imsak:past',
      'gunes:past',
      'ogle:past',
      'ikindi:past',
      'aksam:past',
      'yatsi:past',
    ]);

    const next = findNextPrayer(times(TODAY), times(TOMORROW), now);
    assert.equal(next?.isTomorrow, true);
    assert.equal(next?.name, 'imsak');
  });

  it('gece yarısını geçince YENİ günün tablosu kurulur, dünkü satırlar taşınmaz', () => {
    const now = at('00:30', TOMORROW);
    const rows = buildPrayerDay(
      times(TOMORROW),
      findNextPrayer(times(TOMORROW), times('2026-08-22'), now),
      {},
      now,
    );

    assert.equal(rows[0].phase, 'next');
    assert.equal(
      rows.every((row) => row.phase !== 'past'),
      true,
    );
  });

  it('yarına ait bir sıradaki vakit BUGÜNÜN tablosunu işaretlemez', () => {
    // Doğrudan sözleşme testi: adlar eşleşse bile (ikisi de İmsak) yarının
    // vakti bugünün tablosunda "sıradaki" çıkmamalı.
    const now = at('22:30');
    const rows = buildPrayerDay(
      times(TODAY),
      {
        name: 'imsak',
        date: TOMORROW,
        time: '04:30',
        at: at('04:30', TOMORROW),
        isTomorrow: true,
      },
      {},
      now,
    );

    assert.equal(
      rows.some((row) => row.phase === 'next'),
      false,
    );
  });

  it('bugünün verisi yoksa tablo boş kalır, yarının vakitleri sızmaz', () => {
    assert.deepEqual(day(at('12:00'), {}, null), []);
  });

  it('okunamayan vakit satırdan DÜŞER — yanlış saat gösterilmez', () => {
    const rows = day(at('12:00'), {}, times(TODAY, { ikindi: 'bozuk' }));

    assert.deepEqual(
      rows.map((row) => row.name),
      ['imsak', 'gunes', 'ogle', 'aksam', 'yatsi'],
    );
  });

  it('işaretler satırlara oturur ve DURUMU taşır', () => {
    const rows = day(at('22:30'), { ogle: 'kilindi', ikindi: 'kilindi' });

    assert.deepEqual(
      rows.filter((row) => row.status !== 'kilinmadi').map((row) => `${row.name}:${row.status}`),
      ['ogle:kilindi', 'ikindi:kilindi'],
    );
  });

  it('işaretsiz vakit kilinmadi — eksik anahtar bir durumdur', () => {
    const rows = day(at('22:30'), { ogle: 'kilindi' });

    assert.equal(rows.find((row) => row.name === 'yatsi')?.status, 'kilinmadi');
  });

  it('GÜNEŞ işaretli gelse bile işaretli SAYILMAZ', () => {
    // Bugün bunu yazan bir yol yok (`store.cycleMark` yalnızca kontrolü olan
    // satırdan çağrılıyor) ama diskteki artık bir kayıt tabloyu bozmamalı.
    const gunes = day(at('22:30'), { gunes: 'kilindi' }).find((row) => row.name === 'gunes');

    assert.equal(gunes?.status, 'kilinmadi');
    assert.equal(gunes?.trackable, false);
  });
});

describe('countStatus', () => {
  it('yalnızca işaretlenebilir satırlar sayılır', () => {
    const rows = day(at('22:30'), { imsak: 'kilindi', gunes: 'kilindi', yatsi: 'kilindi' });

    assert.equal(countStatus(rows, 'kilindi'), 2);
  });

  it('boş tabloda sıfır', () => {
    assert.equal(countStatus([], 'kilindi'), 0);
  });
});
