export type ReadEventMergeInput = {
  firstReadAt: number;
  lastReadAt: number;
};

export type ActivityMergeInput = {
  firstAt: number;
  lastAt: number;
  lessonCount: number;
  xpEarned: number;
};

export function shouldApplyRemote(localVersion: number, remoteVersion: number): boolean {
  return remoteVersion > localVersion;
}

export function mergeReadEvent(
  local: ReadEventMergeInput,
  remote: ReadEventMergeInput,
): ReadEventMergeInput {
  return {
    firstReadAt: Math.min(local.firstReadAt, remote.firstReadAt),
    lastReadAt: Math.max(local.lastReadAt, remote.lastReadAt),
  };
}

export function mergeActivity(
  local: ActivityMergeInput,
  remote: ActivityMergeInput,
): ActivityMergeInput {
  return {
    firstAt: Math.min(local.firstAt, remote.firstAt),
    lastAt: Math.max(local.lastAt, remote.lastAt),
    // Yeni dersler `learning_attempt` ile kayıpsız birleşir. Bu iki alan eski
    // kurulumların toplu başlangıç görüntüsünde çift saymayı engelleyen tabandır.
    lessonCount: Math.max(local.lessonCount, remote.lessonCount),
    xpEarned: Math.max(local.xpEarned, remote.xpEarned),
  };
}

export function earliestTimestamp(left: number, right: number): number {
  return Math.min(left, right);
}

