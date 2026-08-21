/**
 * Kıble matematiği testleri.
 *
 * ⚠️ **Kesin ondalık değerler ÇAKILMAZ, bant sınanır.** Bir bant, hesabın düz
 * trigonometriye kayması ya da enlem/boylamın yer değiştirmesi gibi GERÇEK
 * hataları yakalar; ondalık gürültüsünde kırılmaz. Tersini yapmak testi
 * kırılgan, dolayısıyla bir süre sonra silinesi hâle getirirdi.
 *
 * ⚠️ Saat dilimi turu bu dosyada GEREKMİYOR — modül zaman içermiyor.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ALIGN_TOLERANCE,
  KAABA,
  headingQuality,
  isAligned,
  normalizeDegrees,
  qiblaBearing,
  shouldEmit,
  signedDelta,
  unwrapRotation,
} from '@/features/prayer/qibla';

describe('normalizeDegrees', () => {
  it('açıyı [0, 360) aralığına çeker', () => {
    assert.equal(normalizeDegrees(0), 0);
    assert.equal(normalizeDegrees(359), 359);
    assert.equal(normalizeDegrees(360), 0);
    assert.equal(normalizeDegrees(720), 0);
  });

  it('negatif açıyı doğru çevirir — JS modulosu tek başına yetmez', () => {
    assert.equal(normalizeDegrees(-10), 350);
    assert.equal(normalizeDegrees(-370), 350);
  });

  it('bozuk girdide sıfır döner', () => {
    assert.equal(normalizeDegrees(Number.NaN), 0);
    assert.equal(normalizeDegrees(Number.POSITIVE_INFINITY), 0);
  });
});

describe('signedDelta', () => {
  it('kısa yolu verir', () => {
    assert.equal(signedDelta(0, 90), 90);
    assert.equal(signedDelta(0, 270), -90);
  });

  it('360/0 dikişini kısa yoldan geçer', () => {
    assert.equal(signedDelta(359, 1), 2);
    assert.equal(signedDelta(1, 359), -2);
  });

  it('sonuç her zaman [-180, 180) içinde', () => {
    for (let from = 0; from < 360; from += 7) {
      for (let to = 0; to < 360; to += 11) {
        const delta = signedDelta(from, to);
        assert.ok(delta >= -180 && delta < 180, `${from}→${to} = ${delta}`);
      }
    }
  });
});

describe('unwrapRotation', () => {
  /*
   * ⚠️ Bu dosyanın EN KRİTİK testi. Ham açı paylaşılan değere doğrudan
   * yazılsaydı kadran burada tam tur geri sıçrardı — cihazda görülene kadar
   * fark edilmeyen, görüldüğünde de sebebi anlaşılmayan bir hata.
   */
  it('dikişte tam tur sıçratmaz', () => {
    assert.equal(unwrapRotation(359, 1), 361);
    assert.equal(unwrapRotation(1, 359), -1);
  });

  it('sürekli dönüşte birikir, sarmaz', () => {
    let rotation = 0;
    for (let step = 0; step < 8; step += 1) {
      rotation = unwrapRotation(rotation, normalizeDegrees(step * 45));
    }
    // Sekiz adımda tam tur: değer 315'te değil, 315'te birikmiş olmalı.
    assert.equal(rotation, 315);
  });

  it('ilk değerde ham açıya oturur', () => {
    assert.equal(unwrapRotation(Number.NaN, 42), 42);
  });

  it('bozuk yeni değeri yok sayar — kadran donar, sıçramaz', () => {
    assert.equal(unwrapRotation(120, Number.NaN), 120);
  });
});

describe('qiblaBearing', () => {
  it('Kâbe’nin tam kuzeyinden bakınca güneyi gösterir', () => {
    const bearing = qiblaBearing({ latitude: KAABA.latitude + 10, longitude: KAABA.longitude });
    assert.ok(bearing !== null);
    assert.ok(Math.abs(bearing - 180) < 0.001, `${bearing}`);
  });

  it('Kâbe’nin tam güneyinden bakınca kuzeyi gösterir', () => {
    const bearing = qiblaBearing({ latitude: KAABA.latitude - 10, longitude: KAABA.longitude });
    assert.ok(bearing !== null);
    assert.ok(Math.abs(bearing) < 0.001, `${bearing}`);
  });

  it('İstanbul’dan güneydoğuyu gösterir', () => {
    const bearing = qiblaBearing({ latitude: 41.0082, longitude: 28.9784 });
    assert.ok(bearing !== null);
    // Bilinen değer ~151°. Bant düz trigonometriye kaymayı yakalayacak kadar dar.
    assert.ok(bearing > 149 && bearing < 154, `${bearing}`);
  });

  it('Londra’dan güneydoğuyu, Cakarta’dan batı-kuzeybatıyı gösterir', () => {
    const london = qiblaBearing({ latitude: 51.5072, longitude: -0.1276 });
    const jakarta = qiblaBearing({ latitude: -6.2088, longitude: 106.8456 });

    assert.ok(london !== null && jakarta !== null);
    assert.ok(london > 90 && london < 140, `londra ${london}`);
    assert.ok(jakarta > 270 && jakarta < 300, `cakarta ${jakarta}`);
  });

  it('sonuç her zaman [0, 360) içinde', () => {
    for (let latitude = -80; latitude <= 80; latitude += 20) {
      for (let longitude = -180; longitude < 180; longitude += 30) {
        const bearing = qiblaBearing({ latitude, longitude });
        if (bearing !== null) {
          assert.ok(bearing >= 0 && bearing < 360, `${latitude},${longitude} = ${bearing}`);
        }
      }
    }
  });

  it('Kâbe’nin kendisinde ve karşı ayak noktasında yön tanımsızdır', () => {
    assert.equal(qiblaBearing(KAABA), null);
    assert.equal(
      qiblaBearing({ latitude: -KAABA.latitude, longitude: KAABA.longitude - 180 }),
      null,
    );
  });

  it('bozuk ve aralık dışı girdide sessizce null döner', () => {
    assert.equal(qiblaBearing({ latitude: Number.NaN, longitude: 30 }), null);
    assert.equal(qiblaBearing({ latitude: 40, longitude: Number.POSITIVE_INFINITY }), null);
    assert.equal(qiblaBearing({ latitude: 95, longitude: 30 }), null);
    assert.equal(qiblaBearing({ latitude: 40, longitude: 200 }), null);
  });
});

describe('isAligned', () => {
  it('tolerans sınırı dahildir', () => {
    assert.equal(isAligned(ALIGN_TOLERANCE), true);
    assert.equal(isAligned(-ALIGN_TOLERANCE), true);
    assert.equal(isAligned(ALIGN_TOLERANCE + 0.1), false);
  });

  it('bozuk girdide hizalanmış SAYMAZ', () => {
    assert.equal(isAligned(Number.NaN), false);
  });
});

describe('headingQuality', () => {
  it('düşük kalibrasyonu ayırır', () => {
    assert.equal(headingQuality(0), 'low');
    assert.equal(headingQuality(1), 'low');
    assert.equal(headingQuality(2), 'ok');
    assert.equal(headingQuality(3), 'ok');
  });

  it('ölçüm yokken uyarmaz', () => {
    assert.equal(headingQuality(null), 'unknown');
    assert.equal(headingQuality(Number.NaN), 'unknown');
  });
});

describe('shouldEmit', () => {
  it('ilk değeri her zaman geçirir', () => {
    assert.equal(shouldEmit(null, 12), true);
  });

  it('bir dereceden küçük değişimi eler', () => {
    assert.equal(shouldEmit(90, 90.4), false);
    assert.equal(shouldEmit(90, 91), true);
  });

  it('dikişte küçük değişimi eler — tam tur sanmaz', () => {
    assert.equal(shouldEmit(359.6, 0.1), false);
  });

  it('bozuk yeni değeri geçirmez', () => {
    assert.equal(shouldEmit(90, Number.NaN), false);
  });
});
