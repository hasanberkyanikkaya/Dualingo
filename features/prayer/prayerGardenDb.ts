import { getActiveOwnerId } from '@/features/sync/localSyncDb';
import { getDatabase } from '@/lib/database';

export type PrayerGardenStats = {
  totalPrayers: number;
  activeDays: number;
};

export function readPrayerGardenStats(): PrayerGardenStats {
  const database = getDatabase();
  if (database === null) {
    return { totalPrayers: 0, activeDays: 0 };
  }

  const row = database.getFirstSync<{ total_prayers: number; active_days: number }>(
    `SELECT COUNT(*) AS total_prayers, COUNT(DISTINCT date) AS active_days
       FROM prayer_log
      WHERE owner_id = ?
        AND prayer IN ('imsak', 'ogle', 'ikindi', 'aksam', 'yatsi')
        AND deleted_at IS NULL;`,
    [getActiveOwnerId(database)],
  );

  return {
    totalPrayers: row?.total_prayers ?? 0,
    activeDays: row?.active_days ?? 0,
  };
}
