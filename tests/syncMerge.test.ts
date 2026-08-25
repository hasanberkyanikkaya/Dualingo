import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  earliestTimestamp,
  mergeActivity,
  mergeReadEvent,
  shouldApplyRemote,
} from '@/features/sync/merge';

describe('sync conflict rules', () => {
  it('only applies a newer server version', () => {
    assert.equal(shouldApplyRemote(4, 5), true);
    assert.equal(shouldApplyRemote(5, 5), false);
    assert.equal(shouldApplyRemote(6, 5), false);
  });

  it('unions a Quran read event without shrinking its time range', () => {
    assert.deepEqual(
      mergeReadEvent(
        { firstReadAt: 20, lastReadAt: 40 },
        { firstReadAt: 10, lastReadAt: 30 },
      ),
      { firstReadAt: 10, lastReadAt: 40 },
    );
  });

  it('keeps the broad activity range and avoids double-counting snapshots', () => {
    assert.deepEqual(
      mergeActivity(
        { firstAt: 20, lastAt: 30, lessonCount: 2, xpEarned: 20 },
        { firstAt: 10, lastAt: 40, lessonCount: 1, xpEarned: 10 },
      ),
      { firstAt: 10, lastAt: 40, lessonCount: 2, xpEarned: 20 },
    );
  });

  it('keeps the first badge unlock time', () => {
    assert.equal(earliestTimestamp(50, 30), 30);
  });
});

