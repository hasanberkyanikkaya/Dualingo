import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  latestDate,
  parseClockTime,
  parseDottedDate,
  parseTimetable,
  toPrayerTimes,
} from '@/features/prayer/prayerParse';

import type { PrayerTimes } from '@/types';

const AT = 1_755_000_000_000;

/** 4.0'da canlı ölçülen gerçek yanıt şekli (ilçe 9541, 15.08.2026). */
function raw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    MiladiTarihKisaIso8601: '15.08.2026',
    MiladiTarihKisa: '15.08.2026',
    GreenwichOrtalamaZamani: 3.0,
    Imsak: '04:29',
    Gunes: '06:07',
    Ogle: '13:14',
    Ikindi: '17:03',
    Aksam: '20:11',
    Yatsi: '21:41',
    GunesDogus: '06:14',
    GunesBatis: '20:04',
    KibleSaati: '12:13',
    HicriTarihKisa: '2.3.1448',
    HicriTarihUzun: '2 Rebîulevvel 1448',
    HicriTarihKisaIso8601: null,
    HicriTarihUzunIso8601: null,
    ...overrides,
  };
}

/** Belirli bir tarihi taşıyan ham kayıt — iki tarih alanı birlikte değişmeli. */
function rawOn(date: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return raw({ MiladiTarihKisaIso8601: date, MiladiTarihKisa: date, ...overrides });
}

describe('parseDottedDate', () => {
  it('servisin noktalı tarihini yerel ISO tarihe çevirir', () => {
    assert.equal(parseDottedDate('15.08.2026'), '2026-08-15');
  });

  it('tek haneli gün ve ayı sıfırla doldurur', () => {
    assert.equal(parseDottedDate('1.3.2026'), '2026-03-01');
  });

  it('ISO görünümlü girdiyi REDDEDER — alan adı yanıltıcı, içeriği ISO değil', () => {
    // `MiladiTarihKisaIso8601` alanının adına aldanıp değeri doğrudan IsoDate
    // saymak sessiz bir hata olurdu. Bu test o kapıyı kapatıyor.
    assert.equal(parseDottedDate('2026-08-15'), null);
  });

  it('bozuk girdide null döner', () => {
    assert.equal(parseDottedDate(''), null);
    assert.equal(parseDottedDate(null), null);
    assert.equal(parseDottedDate(undefined), null);
    assert.equal(parseDottedDate('15/08/2026'), null);
    assert.equal(parseDottedDate('13.13.2026'), null);
    assert.equal(parseDottedDate('0.8.2026'), null);
    assert.equal(parseDottedDate(20260815), null);
  });
});

describe('parseClockTime', () => {
  it('sıfır dolgulu biçime getirir', () => {
    assert.equal(parseClockTime('04:29'), '04:29');
    assert.equal(parseClockTime('4:29'), '04:29');
  });

  it('aralık dışı ve bozuk girdide null döner', () => {
    assert.equal(parseClockTime('25:00'), null);
    assert.equal(parseClockTime('12:60'), null);
    assert.equal(parseClockTime('12:5'), null);
    assert.equal(parseClockTime(''), null);
    assert.equal(parseClockTime(null), null);
  });
});

describe('toPrayerTimes', () => {
  it('gerçek yanıt kaydını tipli satıra çevirir', () => {
    const row = toPrayerTimes(raw(), '9541', AT);

    assert.notEqual(row, null);
    assert.equal(row?.districtId, '9541');
    assert.equal(row?.date, '2026-08-15');
    assert.equal(row?.imsak, '04:29');
    assert.equal(row?.yatsi, '21:41');
    assert.equal(row?.kibleSaati, '12:13');
    assert.equal(row?.hicriShort, '2.3.1448');
    assert.equal(row?.hicriLong, '2 Rebîulevvel 1448');
    assert.equal(row?.updatedAt, AT);
    assert.equal(row?.deletedAt, null);
  });

  it('HicriTarih*Iso8601 null gelse de satır GEÇERLİ kalır', () => {
    // Servis bu iki alanı da her zaman null döndürüyor (4.0 ölçümü, 4.1'de
    // yeniden doğrulandı); satırı düşürmek bütün pencereyi çöpe atardı.
    const row = toPrayerTimes(
      raw({ HicriTarihKisaIso8601: null, HicriTarihUzunIso8601: null }),
      '9541',
      AT,
    );
    assert.notEqual(row, null);
  });

  it('hicri UZUN biçim okunuyor ve olduğu gibi saklanıyor', () => {
    // ⚠️ Ay adı ayrıştırılmıyor, çevrilmiyor, biçimlendirilmiyor — kaynak ne
    // yazdıysa o saklanıyor. Hicri ay adları bu projede ÜRETİLMEZ.
    const row = toPrayerTimes(raw({ HicriTarihUzun: '15 Şaban 1447' }), '9541', AT);
    assert.equal(row?.hicriLong, '15 Şaban 1447');
  });

  it('hicri uzun biçim YOKSA satır düşmez, alan null kalır', () => {
    // 4.2'den önce indirilmiş pencerelerde sütun NULL; ekran kısa biçime düşer.
    const row = toPrayerTimes(raw({ HicriTarihUzun: undefined }), '9541', AT);

    assert.notEqual(row, null);
    assert.equal(row?.hicriLong, null);
  });

  it('kıble ve hicri okunamazsa satır yine geçerli, alanlar null', () => {
    const row = toPrayerTimes(
      raw({ KibleSaati: '', HicriTarihKisa: null, HicriTarihUzun: null }),
      '9541',
      AT,
    );

    assert.notEqual(row, null);
    assert.equal(row?.kibleSaati, null);
    assert.equal(row?.hicriShort, null);
    assert.equal(row?.hicriLong, null);
  });

  it('altı vakitten biri eksikse KISMİ satır yazılmaz', () => {
    // Yarım satır diske girse `findNextPrayer` onu "bugünün verisi var" sayar
    // ve kullanıcı bir vakti hiç görmez — boş durumdan kötü.
    assert.equal(toPrayerTimes(raw({ Yatsi: '' }), '9541', AT), null);
    assert.equal(toPrayerTimes(raw({ Imsak: null }), '9541', AT), null);
  });

  it('tarih hiç okunamazsa null', () => {
    assert.equal(
      toPrayerTimes(raw({ MiladiTarihKisaIso8601: null, MiladiTarihKisa: null }), '9541', AT),
      null,
    );
  });

  it('nesne olmayan girdide çökmez', () => {
    assert.equal(toPrayerTimes(null, '9541', AT), null);
    assert.equal(toPrayerTimes('502', '9541', AT), null);
    assert.equal(toPrayerTimes([], '9541', AT), null);
  });
});

describe('parseTimetable', () => {
  it('dizi olmayan yükte boş liste döner', () => {
    assert.deepEqual(parseTimetable(null, '9541', AT), []);
    assert.deepEqual(parseTimetable({}, '9541', AT), []);
    assert.deepEqual(parseTimetable('502', '9541', AT), []);
  });

  it('bozuk kayıt düşer, diğerleri hayatta kalır', () => {
    const rows = parseTimetable(
      [rawOn('15.08.2026'), rawOn('16.08.2026', { Yatsi: '' }), rawOn('17.08.2026')],
      '9541',
      AT,
    );

    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((row) => row.date),
      ['2026-08-15', '2026-08-17'],
    );
  });

  it('aynı tarih iki kez gelirse tek satır kalır ve SON kayıt kazanır', () => {
    const rows = parseTimetable([raw({ Imsak: '04:29' }), raw({ Imsak: '04:30' })], '9541', AT);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].imsak, '04:30');
  });

  it('GEÇMİŞ günler düşürülmez — süzme okuma tarafının işi', () => {
    // Servisin penceresi bugünden başlamıyor (4.0 ölçümü) ve geçmiş günleri
    // atmak "pencere ilerledi mi" sorusunu cevaplayan veriyi zayıflatır.
    const rows = parseTimetable([rawOn('01.01.2020'), rawOn('15.08.2026')], '9541', AT);

    assert.equal(rows.length, 2);
    assert.equal(rows[0].date, '2020-01-01');
  });

  it('çıktı tarihe göre artan sıralanır', () => {
    const rows = parseTimetable(
      [rawOn('17.08.2026'), rawOn('15.08.2026'), rawOn('16.08.2026')],
      '9541',
      AT,
    );

    assert.deepEqual(
      rows.map((row) => row.date),
      ['2026-08-15', '2026-08-16', '2026-08-17'],
    );
  });
});

describe('latestDate', () => {
  function row(date: string): PrayerTimes {
    return {
      districtId: '9541',
      date,
      imsak: '04:29',
      gunes: '06:07',
      ogle: '13:14',
      ikindi: '17:03',
      aksam: '20:11',
      yatsi: '21:41',
      kibleSaati: null,
      hicriShort: null,
      hicriLong: null,
      updatedAt: AT,
      deletedAt: null,
    };
  }

  it('boş listede null', () => {
    assert.equal(latestDate([]), null);
  });

  it('SIRALANMAMIŞ listede de gerçek maksimumu verir', () => {
    // `rows[rows.length - 1]` yazmak çağıranın sıralama yaptığına dair sessiz
    // bir bağımlılık olurdu.
    assert.equal(latestDate([row('2026-09-15'), row('2026-08-15'), row('2026-08-20')]), '2026-09-15');
  });
});
