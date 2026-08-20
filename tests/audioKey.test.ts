import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  audioUrlFor,
  cacheFileNameFor,
  isValidAudioKey,
  partFileNameFor,
} from '@/features/learning/audioKey';

/**
 * Faz 2.5'in saf yarısı. `audio.ts` sınanmıyor (`expo-audio` ve
 * `expo-file-system` yerel modül, Node'da yüklenemez); karar mantığının tamamı
 * bu yüzden buraya itildi.
 */

const BASE = 'https://cdn.ornek.test/audio';

describe('isValidAudioKey', () => {
  it('sözleşmeye uyan anahtarları kabul eder', () => {
    assert.equal(isValidAudioKey('ornek/placeholder-01.m4a'), true);
    assert.equal(isValidAudioKey('temel-inanc/kelime-i-tevhid-01.m4a'), true);
    assert.equal(isValidAudioKey('islamin-sartlari/ezan-01.m4a'), true);
    assert.equal(isValidAudioKey('u1/a.m4a'), true);
  });

  it('Türkçe harf taşıyan anahtarı reddeder', () => {
    // iOS dosya sistemi NFD, sunucu NFC yazar; aynı anahtar iki farklı dosyaya
    // çözülür ve hata "bazen çalışıyor" diye görünür.
    assert.equal(isValidAudioKey('islamın-sartları/ezan-01.m4a'), false);
    assert.equal(isValidAudioKey('temel-inanç/şart-01.m4a'), false);
    assert.equal(isValidAudioKey('ünite/ses-01.m4a'), false);
  });

  it('büyük harfi reddeder', () => {
    // Çoğu CDN büyük-küçük harfe duyarlı, geliştirme makinesi değil.
    assert.equal(isValidAudioKey('Ornek/placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('ornek/Placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('ornek/placeholder-01.M4A'), false);
  });

  it('yanlış uzantıyı reddeder', () => {
    assert.equal(isValidAudioKey('ornek/placeholder-01.mp3'), false);
    assert.equal(isValidAudioKey('ornek/placeholder-01'), false);
    assert.equal(isValidAudioKey('ornek/placeholder-01.m4a.mp3'), false);
  });

  it('katman sayısını dayatır', () => {
    assert.equal(isValidAudioKey('placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('a/b/c.m4a'), false);
    assert.equal(isValidAudioKey('/ornek/placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('ornek//placeholder-01.m4a'), false);
  });

  it('dizin dışına çıkma denemesini reddeder', () => {
    assert.equal(isValidAudioKey('../gizli.m4a'), false);
    assert.equal(isValidAudioKey('ornek/../../etc.m4a'), false);
    assert.equal(isValidAudioKey('ornek/.m4a'), false);
  });

  it('boşluk ve tire kaçamaklarını reddeder', () => {
    assert.equal(isValidAudioKey('ornek/place holder-01.m4a'), false);
    assert.equal(isValidAudioKey('-ornek/placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('ornek-/placeholder-01.m4a'), false);
    assert.equal(isValidAudioKey('ornek/placeholder--01.m4a'), false);
    assert.equal(isValidAudioKey('ornek/placeholder-01-.m4a'), false);
    assert.equal(isValidAudioKey('ornek/place_holder-01.m4a'), false);
    assert.equal(isValidAudioKey(''), false);
  });
});

describe('audioUrlFor', () => {
  it('kökle anahtarı tek eğik çizgiyle birleştirir', () => {
    assert.equal(
      audioUrlFor('ornek/placeholder-01.m4a', BASE),
      'https://cdn.ornek.test/audio/ornek/placeholder-01.m4a',
    );
  });

  it('kökün sonundaki eğik çizgi(ler) fark etmez', () => {
    const expected = 'https://cdn.ornek.test/audio/ornek/placeholder-01.m4a';

    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', `${BASE}/`), expected);
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', `${BASE}///`), expected);
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', `  ${BASE}  `), expected);
  });

  it('kök boşsa null döner — bugünkü varsayılan durum', () => {
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', ''), null);
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', '   '), null);
  });

  it('http(s) olmayan kökü reddeder', () => {
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', 'cdn.ornek.test'), null);
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', 'ftp://cdn.ornek.test'), null);
    assert.equal(audioUrlFor('ornek/placeholder-01.m4a', 'https://'), null);
  });

  it('geçersiz anahtar için adres kurmaz', () => {
    assert.equal(audioUrlFor('../gizli.m4a', BASE), null);
    assert.equal(audioUrlFor('ünite/ses-01.m4a', BASE), null);
  });
});

describe('cacheFileNameFor', () => {
  it('eğik çizgiyi düzleştirir', () => {
    assert.equal(cacheFileNameFor('ornek/placeholder-01.m4a'), 'ornek__placeholder-01.m4a');
  });

  it('birebirdir — iki anahtar aynı dosyada buluşamaz', () => {
    // Anahtar alfabesinde `_` yok, dolayısıyla düzleştirme çakışma üretemez.
    const keys = [
      'ornek/placeholder-01.m4a',
      'ornek-placeholder/01.m4a',
      'temel-inanc/ezan-01.m4a',
      'temel/inanc-ezan-01.m4a',
    ];
    const names = new Set(keys.map(cacheFileNameFor));

    assert.equal(names.size, keys.length);
  });

  it('geçici ad son addan ayrışır', () => {
    const key = 'ornek/placeholder-01.m4a';

    assert.equal(partFileNameFor(key), `${cacheFileNameFor(key)}.part`);
    assert.notEqual(partFileNameFor(key), cacheFileNameFor(key));
    // Geçici ad geçerli bir anahtarın düzleştirilmişi olamaz — yarım dosya
    // hiçbir zaman bitmiş dosya sanılmaz.
    assert.equal(isValidAudioKey(partFileNameFor(key).replace('__', '/')), false);
  });
});
