/**
 * `features/prayer/prayerChart.ts` — çizelge geometrisi ve durum döngüsü.
 *
 * Bu dosyanın saf olması testlerin var olma sebebi: "ay her zaman 42 hücredir"
 * ya da "31 Ocak + 1 ay Şubat'tır" gibi kuralları ekrana bakmadan sınamanın
 * başka yolu yok.
 *
 * ⚠️ **Testler MUTLAK EPOCH İDDİA ETMEZ** ve buna ihtiyaç da yok: bu modül
 * yalnızca `'YYYY-MM-DD'` dizgeleriyle çalışıyor, duvar saati çözmüyor. Gün
 * aritmetiği `streak.ts`ten geliyor ve o UTC gece yarısında yapılıyor —
 * sonuçlar saat diliminden bağımsız. Elle doğrulama (PowerShell):
 *   $env:TZ='America/New_York'; npm test
 *   $env:TZ='Pacific/Kiritimati'; npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CHART_PRAYERS,
  addMonths,
  buildMonth,
  buildWeek,
  isChartDate,
  monthOf,
  monthRange,
  nextStatus,
  startOfWeek,
  summarize,
  weekRange,
} from '@/features/prayer/prayerChart';

import type { ChartCell } from '@/features/prayer/prayerChart';
import type { IsoDate, PrayerMarkMap } from '@/types';

/** 20 Ağustos 2026 bir Perşembe. */
const TODAY: IsoDate = '2026-08-20';

function marks(byDate: Record<IsoDate, PrayerMarkMap>): Record<IsoDate, PrayerMarkMap> {
  return byDate;
}

describe('nextStatus', () => {
  it('döngü: kayıt yok → kılındı → kayıt yok', () => {
    assert.equal(nextStatus('kilinmadi'), 'kilindi');
    assert.equal(nextStatus('kilindi'), 'kilinmadi');
  });

  it('iki dokunuş başladığı yere döndürür', () => {
    assert.equal(nextStatus(nextStatus('kilinmadi')), 'kilinmadi');
  });
});

describe('startOfWeek / weekRange', () => {
  it('hafta PAZARTESİ başlar', () => {
    // 20.08.2026 Perşembe → 17.08.2026 Pazartesi.
    assert.equal(startOfWeek(TODAY), '2026-08-17');
  });

  it('pazartesinin kendisi kaymaz', () => {
    assert.equal(startOfWeek('2026-08-17'), '2026-08-17');
  });

  it('PAZAR bir sonraki haftaya değil, biten haftaya aittir', () => {
    // ⚠️ En kolay kaçırılan sınır: `getUTCDay()` sırasıyla Pazar 0'dır ve
    // düzeltilmezse Pazar kendi haftasının başı sanılır.
    assert.equal(startOfWeek('2026-08-23'), '2026-08-17');
  });

  it('aralık yedi günü kapsar, sınırlar dahil', () => {
    assert.deepEqual(weekRange(TODAY), { from: '2026-08-17', to: '2026-08-23' });
  });

  it('ay ve yıl sınırını aşan hafta bölünmez', () => {
    // 01.01.2027 Cuma → hafta 28.12.2026'da başlıyor.
    assert.deepEqual(weekRange('2027-01-01'), { from: '2026-12-28', to: '2027-01-03' });
  });

  it('bozuk tarihte null', () => {
    assert.equal(startOfWeek('20.08.2026'), null);
    assert.equal(weekRange(''), null);
  });
});

describe('monthRange / addMonths / monthOf', () => {
  it('ayın ilk ve son günü', () => {
    assert.deepEqual(monthRange(TODAY), { from: '2026-08-01', to: '2026-08-31' });
  });

  it('30 günlük ay', () => {
    assert.deepEqual(monthRange('2026-09-15'), { from: '2026-09-01', to: '2026-09-30' });
  });

  it('artık yıl Şubat 29 çeker', () => {
    assert.deepEqual(monthRange('2028-02-10'), { from: '2028-02-01', to: '2028-02-29' });
  });

  it('artık olmayan yıl Şubat 28 çeker', () => {
    assert.deepEqual(monthRange('2026-02-10'), { from: '2026-02-01', to: '2026-02-28' });
  });

  it('ay ekleme AYIN İLKİNE oturur — 31 Ocak + 1 ay Mart olmaz', () => {
    // ⚠️ Gün korunsaydı `Date` 31 Şubat'ı 3 Mart'a atardı ve kullanıcı
    // "sonraki ay" düğmesine basınca Şubat'ı atlardı.
    assert.equal(addMonths('2026-01-31', 1), '2026-02-01');
  });

  it('yıl sınırını iki yönde de aşar', () => {
    assert.equal(addMonths('2026-12-15', 1), '2027-01-01');
    assert.equal(addMonths('2026-01-15', -1), '2025-12-01');
    assert.equal(addMonths('2026-08-20', -20), '2024-12-01');
  });

  it('takvimde olmayan tarih reddedilir', () => {
    // ⚠️ `streak.parseIsoDate` bunu KABUL ederdi (yalnızca biçim denetliyor);
    // bu modül rota parametresi de alabildiği için takvimi de doğruluyor.
    assert.equal(monthRange('2026-02-29'), null);
    assert.equal(addMonths('2026-04-31', 1), null);
    assert.equal(monthOf('2026-13-01'), null);
    assert.equal(isChartDate('2026-02-29'), false);
    assert.equal(isChartDate('2026-02-28'), true);
  });

  it('monthOf yıl ve ayı verir', () => {
    assert.deepEqual(monthOf(TODAY), { year: 2026, month: 8 });
  });
});

describe('buildWeek', () => {
  it('HER ZAMAN yedi hücre', () => {
    assert.equal(buildWeek(TODAY, {}, TODAY).length, 7);
    assert.equal(buildWeek('2026-08-17', {}, TODAY).length, 7);
    assert.equal(buildWeek('2026-08-23', {}, TODAY).length, 7);
  });

  it('pazartesiden pazara sıralı', () => {
    assert.deepEqual(
      buildWeek(TODAY, {}, TODAY).map((cell) => cell?.date),
      [
        '2026-08-17',
        '2026-08-18',
        '2026-08-19',
        '2026-08-20',
        '2026-08-21',
        '2026-08-22',
        '2026-08-23',
      ],
    );
  });

  it('işaretler doğru güne oturur', () => {
    const cells = buildWeek(
      TODAY,
      marks({ '2026-08-18': { ogle: 'kilindi', ikindi: 'kilindi' } }),
      TODAY,
    );

    assert.deepEqual(cells[1]?.marks, { ogle: 'kilindi', ikindi: 'kilindi' });
    assert.deepEqual(cells[2]?.marks, {});
  });

  it('GELECEK günler düzenlenemez, bugün ve geçmiş düzenlenebilir', () => {
    const cells = buildWeek(TODAY, {}, TODAY);

    assert.equal(cells[0]?.editable, true, 'geçmiş gün');
    assert.equal(cells[3]?.editable, true, 'bugün');
    assert.equal(cells[4]?.editable, false, 'yarın');
    assert.equal(cells[6]?.editable, false, 'haftanın sonu');
  });

  it('bugün işaretlenir, başka gün işaretlenmez', () => {
    const cells = buildWeek(TODAY, {}, TODAY);

    assert.deepEqual(
      cells.map((cell) => cell?.isToday),
      [false, false, false, true, false, false, false],
    );
  });

  it('bozuk çapa boş dizi verir — kısmi hafta üretmez', () => {
    assert.deepEqual(buildWeek('bozuk', {}, TODAY), []);
  });
});

describe('buildMonth', () => {
  it('HER ZAMAN 42 hücre', () => {
    // ⚠️ Sabit yükseklik bir arayüz sözleşmesi: bir ay 4, 5 ya da 6 satıra
    // sığabiliyor ve ızgara aylar arasında gezinirken zıplamamalı.
    for (const anchor of ['2026-02-01', '2026-08-01', '2026-11-01', '2028-02-01']) {
      assert.equal(buildMonth(anchor, {}, TODAY).length, 42, anchor);
    }
  });

  it('ay DIŞI hücreler boş', () => {
    // Ağustos 2026: 1'i Cumartesi → ızgara 27 Temmuz Pazartesi'de başlıyor,
    // ilk beş hücre ay dışı.
    const cells = buildMonth('2026-08-01', {}, TODAY);

    assert.deepEqual(cells.slice(0, 5), [null, null, null, null, null]);
    assert.equal(cells[5]?.date, '2026-08-01');
  });

  it('ayın son günü ızgarada, sonrası boş', () => {
    const cells = buildMonth('2026-08-01', {}, TODAY);
    const filled = cells.filter((cell): cell is NonNullable<ChartCell> => cell !== null);

    assert.equal(filled.length, 31);
    assert.equal(filled[filled.length - 1].date, '2026-08-31');
    assert.equal(cells[cells.length - 1], null);
  });

  it('ayın ilki Pazartesi ise ızgara ayla birlikte başlar', () => {
    // Haziran 2026'nın 1'i Pazartesi.
    const cells = buildMonth('2026-06-01', {}, TODAY);

    assert.equal(cells[0]?.date, '2026-06-01');
  });

  it('gün sayısı ve hücre günü tutarlı', () => {
    const cells = buildMonth('2026-08-01', {}, TODAY);

    assert.equal(cells[5]?.dayOfMonth, 1);
    assert.equal(cells[35]?.dayOfMonth, 31);
  });

  it('çapa ayın ortası olsa da aynı ay çizilir', () => {
    assert.deepEqual(buildMonth('2026-08-20', {}, TODAY), buildMonth('2026-08-01', {}, TODAY));
  });

  it('bozuk çapa boş dizi verir', () => {
    assert.deepEqual(buildMonth('2026-02-30', {}, TODAY), []);
  });
});

describe('summarize', () => {
  it('yalnızca OLUMLU kayıtlar sayılır, payda üretilmez', () => {
    const cells = buildWeek(
      TODAY,
      marks({
        '2026-08-17': { imsak: 'kilindi', ogle: 'kilindi', ikindi: 'kilindi' },
        '2026-08-18': { yatsi: 'kilindi' },
      }),
      TODAY,
    );

    const summary = summarize(cells);

    assert.deepEqual(summary, { kilindi: 4 });
    // ⚠️ Sözleşme testi: özet nesnesinde "işaretsiz" ya da "toplam" alanı
    // OLMAMALI. Hesaplanabilir olması bile o satırın bir gün ekrana çıkmasına
    // davetiye olurdu.
    assert.deepEqual(Object.keys(summary), ['kilindi']);
  });

  it('boş hücreler ve boş liste sıfır verir', () => {
    assert.deepEqual(summarize([]), { kilindi: 0 });
    assert.deepEqual(summarize([null, null]), { kilindi: 0 });
  });

  it('GÜNEŞ kaydı sayılmaz', () => {
    // Bugün bunu yazan bir yol yok ama diskteki artık bir kayıt özeti
    // bozmamalı (`prayerDay`in aynı sözleşmesi).
    const cells = buildWeek(TODAY, marks({ '2026-08-17': { gunes: 'kilindi' } }), TODAY);

    assert.deepEqual(summarize(cells), { kilindi: 0 });
  });

  it('çizelge sütunları beş vakit, Güneş yok', () => {
    assert.deepEqual(CHART_PRAYERS, ['imsak', 'ogle', 'ikindi', 'aksam', 'yatsi']);
  });
});
