import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  matchCity,
  matchDistrict,
  matchLocation,
  normalizePlaceName,
} from '@/features/prayer/districtMatch';

import type { PrayerCity, PrayerDistrict } from '@/types';

/** Diyanet listeleri BÜYÜK HARF geliyor — testin gerçekçi olması buna bağlı. */
const CITIES: PrayerCity[] = [
  { cityId: '539', name: 'İSTANBUL' },
  { cityId: '540', name: 'ISPARTA' },
  { cityId: '541', name: 'GAZİANTEP' },
];

const ISTANBUL_DISTRICTS: PrayerDistrict[] = [
  { districtId: '9541', name: 'KADIKÖY' },
  { districtId: '9542', name: 'BEŞİKTAŞ' },
  { districtId: '9543', name: 'MERKEZ' },
];

const GAZIANTEP_DISTRICTS: PrayerDistrict[] = [
  { districtId: '9600', name: 'ŞEHİTKAMİL' },
  { districtId: '9601', name: 'ŞAHİNBEY' },
];

describe('normalizePlaceName', () => {
  it('Türkçe büyük harf tuzağını çözer', () => {
    assert.equal(normalizePlaceName('ISPARTA'), normalizePlaceName('Isparta'));
    assert.equal(normalizePlaceName('İSTANBUL'), normalizePlaceName('İstanbul'));
  });

  it('noktalama ve fazla boşluğu sadeleştirir', () => {
    assert.equal(normalizePlaceName("  Şehit'kamil  "), 'şehit kamil');
    assert.equal(normalizePlaceName('Ağrı-Merkez'), 'ağrı merkez');
  });
});

describe('matchCity', () => {
  it('ISPARTA ile Isparta eşleşir — naif toLowerCase burada kaçırırdı', () => {
    assert.equal(matchCity(['Isparta'], CITIES)?.cityId, '540');
  });

  it('İSTANBUL ile İstanbul eşleşir', () => {
    assert.equal(matchCity(['İstanbul'], CITIES)?.cityId, '539');
  });

  it('adaylar sırayla denenir, ilk tutan kazanır', () => {
    assert.equal(matchCity(['Marmara Bölgesi', 'İstanbul'], CITIES)?.cityId, '539');
  });

  it('hiçbiri tutmazsa null', () => {
    assert.equal(matchCity(['Berlin'], CITIES), null);
  });

  it('boş aday listesinde null', () => {
    assert.equal(matchCity([], CITIES), null);
    assert.equal(matchCity([''], CITIES), null);
  });
});

describe('matchDistrict', () => {
  it('KADIKÖY ile Kadıköy eşleşir', () => {
    assert.equal(matchDistrict(['Kadıköy'], ISTANBUL_DISTRICTS)?.districtId, '9541');
  });

  it('ŞEHİTKAMİL ile "Şehit Kamil" ikinci geçişte (boşluksuz) eşleşir', () => {
    assert.equal(matchDistrict(['Şehit Kamil'], GAZIANTEP_DISTRICTS)?.districtId, '9600');
  });

  it('iki kayıt aynı normale düşerse eşleşme YOK — ilki seçilmez', () => {
    // Yanlış ilçe = yanlış vakit; belirsizlikte tahmin edilmez.
    const ambiguous: PrayerDistrict[] = [
      { districtId: '1', name: 'MERKEZ' },
      { districtId: '2', name: 'Merkez' },
    ];
    assert.equal(matchDistrict(['Merkez'], ambiguous), null);
  });

  it('MERKEZ listede olsa bile kendiliğinden seçilmez', () => {
    assert.equal(matchDistrict(['Üsküdar'], ISTANBUL_DISTRICTS), null);
  });
});

describe('matchLocation', () => {
  function input(overrides: Record<string, unknown> = {}) {
    return {
      countryCode: 'TR',
      cityCandidates: ['İstanbul'],
      districtCandidates: ['Kadıköy'],
      cities: CITIES,
      districts: ISTANBUL_DISTRICTS,
      ...overrides,
    };
  }

  it('il ve ilçe tuttuğunda district döner', () => {
    const result = matchLocation(input());

    assert.equal(result.kind, 'district');
    if (result.kind === 'district') {
      assert.equal(result.city.cityId, '539');
      assert.equal(result.district.districtId, '9541');
    }
  });

  it('il tuttu ilçe tutmadıysa city döner — asla district', () => {
    const result = matchLocation(input({ districtCandidates: ['Üsküdar'] }));

    assert.equal(result.kind, 'city');
    if (result.kind === 'city') {
      assert.equal(result.city.cityId, '539');
    }
  });

  it('ilçe listesi henüz boşken city döner', () => {
    assert.equal(matchLocation(input({ districts: [] })).kind, 'city');
  });

  it('il tutmazsa none', () => {
    assert.equal(matchLocation(input({ cityCandidates: ['Bremen'] })).kind, 'none');
  });

  it('Türkiye dışında eşleme HİÇ denenmez', () => {
    // Yabancı bir şehir adının Türkiye listesinde rastlantısal eşleşmesi
    // kullanıcıyı bambaşka bir ülkenin vakitlerinde bırakırdı.
    const result = matchLocation(
      input({ countryCode: 'DE', cityCandidates: ['İstanbul'], districtCandidates: ['Kadıköy'] }),
    );

    assert.equal(result.kind, 'outsideTurkey');
  });

  it('ülke kodu küçük harf gelse de tanınır', () => {
    assert.equal(matchLocation(input({ countryCode: 'tr' })).kind, 'district');
  });

  it('ülke kodu bilinmiyorsa eşleme yine denenir', () => {
    // Bazı cihazlarda `isoCountryCode` boş dönüyor; bu tek başına Türkiye
    // dışında olmanın kanıtı değil.
    assert.equal(matchLocation(input({ countryCode: null })).kind, 'district');
  });
});
