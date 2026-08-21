/**
 * `lib/turkishDate.ts` — Türkçe tarih biçimlendirme.
 *
 * ⚠️ Bu testlerin var olma sebebi `toLocaleDateString` KULLANILMAMASI:
 * yerel biçimlendirme Hermes'in tam ICU içermeyen Android derlemesinde sessizce
 * İngilizceye düşebiliyor ve hata yalnızca bazı cihazlarda görünüyor. Elle
 * yazılan tablo sınanabilir, yerel biçimlendirici sınanamaz.
 *
 * ⚠️ Testler mutlak epoch iddia etmez; gün adı `Date.UTC` üzerinden bulunduğu
 * için sonuç saat diliminden bağımsız olmak ZORUNDA. Elle doğrulama
 * (PowerShell; Windows cmd `TZ=... npm test` önekini anlamıyor):
 *   $env:TZ='America/New_York'; npm test
 *   $env:TZ='Pacific/Kiritimati'; npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  WEEKDAY_HEADERS_TR,
  formatGregorianTr,
  monthTitleTr,
  shortDateTr,
  weekdayShortTr,
} from '@/lib/turkishDate';

describe('formatGregorianTr', () => {
  it('gün, ay adı, yıl ve gün adını Türkçe yazar', () => {
    assert.equal(formatGregorianTr('2026-08-20'), '20 Ağustos 2026, Perşembe');
  });

  it('gün başında sıfır dolgusu YAZMAZ', () => {
    // Diskteki biçim '2026-03-05' ama ekranda "05 Mart" değil "5 Mart" doğru.
    assert.equal(formatGregorianTr('2026-03-05'), '5 Mart 2026, Perşembe');
  });

  it('on iki ayın hepsi Türkçe ve sırayla', () => {
    const names = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1 < 10 ? `0${index + 1}` : String(index + 1);
      return formatGregorianTr(`2026-${month}-01`)?.split(' ')[1];
    });

    assert.deepEqual(names, [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ]);
  });

  it('haftanın yedi günü sırayla ve Türkçe', () => {
    // 2026-08-16 bir Pazar; ardışık yedi gün tüm adları dolaşır.
    const days = Array.from({ length: 7 }, (_, index) =>
      formatGregorianTr(`2026-08-${16 + index}`)?.split(', ')[1],
    );

    assert.deepEqual(days, [
      'Pazar',
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi',
    ]);
  });

  it('artık yılın 29 Şubat\'ı geçerli', () => {
    assert.equal(formatGregorianTr('2024-02-29'), '29 Şubat 2024, Perşembe');
  });

  it('takvimde OLMAYAN gün null — sessizce bir sonraki aya taşınmaz', () => {
    // ⚠️ `Date.UTC(2026, 1, 29)` 1 Mart döner. Taşma denetimi olmasaydı ekranda
    // "29 Şubat 2026, Pazar" yazardı: hem var olmayan bir gün hem yanlış gün adı.
    assert.equal(formatGregorianTr('2026-02-29'), null);
    assert.equal(formatGregorianTr('2026-04-31'), null);
    assert.equal(formatGregorianTr('2026-13-01'), null);
    assert.equal(formatGregorianTr('2026-00-10'), null);
  });

  it('biçimi bozuk girdide null', () => {
    assert.equal(formatGregorianTr('20.08.2026'), null);
    assert.equal(formatGregorianTr('2026-8-20'), null);
    assert.equal(formatGregorianTr(''), null);
  });

  it('yıl sınırında gün adı kaymıyor', () => {
    // Yerel `new Date(y, m, d)` ile hesaplansaydı UTC- saat dilimlerinde bu
    // satır bir gün geriye kayardı; testin asıl konusu bu.
    assert.equal(formatGregorianTr('2027-01-01'), '1 Ocak 2027, Cuma');
    assert.equal(formatGregorianTr('2026-12-31'), '31 Aralık 2026, Perşembe');
  });
});

describe('monthTitleTr', () => {
  it('ay adı ve yıl', () => {
    assert.equal(monthTitleTr(2026, 8), 'Ağustos 2026');
    assert.equal(monthTitleTr(2026, 1), 'Ocak 2026');
    assert.equal(monthTitleTr(2026, 12), 'Aralık 2026');
  });

  it('aralık dışında null', () => {
    assert.equal(monthTitleTr(2026, 0), null);
    assert.equal(monthTitleTr(2026, 13), null);
  });
});

describe('shortDateTr', () => {
  it('gün ve kısa ay', () => {
    assert.equal(shortDateTr('2026-08-18'), '18 Ağu');
    assert.equal(shortDateTr('2026-01-01'), '1 Oca');
    assert.equal(shortDateTr('2026-05-09'), '9 May');
  });

  it('takvimde olmayan ya da bozuk tarihte null', () => {
    assert.equal(shortDateTr('2026-02-29'), null);
    assert.equal(shortDateTr('18.08.2026'), null);
  });
});

describe('weekdayShortTr', () => {
  it('kısa gün adı', () => {
    // 17.08.2026 Pazartesi, 23.08.2026 Pazar.
    assert.equal(weekdayShortTr('2026-08-17'), 'Pzt');
    assert.equal(weekdayShortTr('2026-08-20'), 'Per');
    assert.equal(weekdayShortTr('2026-08-23'), 'Paz');
  });

  it('uzun ad ile aynı günü söyler', () => {
    // İki biçimlendirici aynı `parse` üzerine kurulu; ayrışırlarsa çizelgedeki
    // gün adı ile başlıktaki gün adı çelişirdi.
    assert.equal(formatGregorianTr('2026-08-23')?.endsWith('Pazar'), true);
    assert.equal(weekdayShortTr('2026-08-23'), 'Paz');
  });

  it('bozuk tarihte null', () => {
    assert.equal(weekdayShortTr('2026-13-01'), null);
  });
});

describe('WEEKDAY_HEADERS_TR', () => {
  it('PAZARTESİ başlar — ızgaranın sırası', () => {
    // ⚠️ `Date.getUTCDay()` sırasıyla karışırsa takvim bir gün kayar ve hata
    // yalnızca gözle görülür.
    assert.deepEqual(WEEKDAY_HEADERS_TR, ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);
  });

  it('başlık sırası gerçek günlerle örtüşüyor', () => {
    const week = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23'];

    assert.deepEqual(
      week.map((date) => weekdayShortTr(date)),
      [...WEEKDAY_HEADERS_TR],
    );
  });
});
