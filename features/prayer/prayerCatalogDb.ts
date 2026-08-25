import { getDatabase } from '@/lib/database';

import type { PrayerCity, PrayerDistrict, Timestamp } from '@/types';

type CatalogRow = {
  payload_json: string;
};

function readPayload(key: string): unknown {
  const database = getDatabase();
  if (database === null) {
    return null;
  }

  const row = database.getFirstSync<CatalogRow>(
    `SELECT payload_json FROM prayer_catalog_cache
      WHERE cache_key = ? AND deleted_at IS NULL;`,
    [key],
  );

  if (row === null) {
    return null;
  }

  try {
    return JSON.parse(row.payload_json) as unknown;
  } catch {
    return null;
  }
}

function writePayload(key: string, payload: unknown, now: Timestamp): void {
  const database = getDatabase();
  if (database === null) {
    return;
  }

  database.runSync(
    `INSERT INTO prayer_catalog_cache
       (cache_key, payload_json, fetched_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT(cache_key) DO UPDATE SET
       payload_json = excluded.payload_json,
       fetched_at = excluded.fetched_at,
       updated_at = excluded.updated_at,
       deleted_at = NULL;`,
    [key, JSON.stringify(payload), now, now],
  );
}

function isCity(value: unknown): value is PrayerCity {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.cityId === 'string' && typeof record.name === 'string';
}

function isDistrict(value: unknown): value is PrayerDistrict {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.districtId === 'string' && typeof record.name === 'string';
}

export function readCachedCities(): PrayerCity[] {
  const payload = readPayload('cities:tr');
  return Array.isArray(payload) ? payload.filter(isCity) : [];
}

export function writeCachedCities(cities: readonly PrayerCity[], now: Timestamp): void {
  writePayload('cities:tr', cities, now);
}

export function readCachedDistricts(cityId: string): PrayerDistrict[] {
  const payload = readPayload(`districts:${cityId}`);
  return Array.isArray(payload) ? payload.filter(isDistrict) : [];
}

export function writeCachedDistricts(
  cityId: string,
  districts: readonly PrayerDistrict[],
  now: Timestamp,
): void {
  writePayload(`districts:${cityId}`, districts, now);
}
