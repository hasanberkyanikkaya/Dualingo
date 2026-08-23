import { addDays, dayDifference } from '@/features/progress/streak';

import type {
  IsoDate,
  QuranGoal,
  QuranGoalInput,
  QuranGoalProgress,
  QuranGoalRead,
  QuranJuzProgress,
} from '@/types';

export type QuranGoalValidationIssue =
  | 'invalid_start_date'
  | 'future_start_date'
  | 'invalid_target_value'
  | 'invalid_target_date'
  | 'invalid_reminder_time';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const JUZ_COUNT = 30;

function parseCalendarDate(value: IsoDate): number | null {
  const match = ISO_DATE.exec(value ?? '');
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const resolved = new Date(Date.UTC(year, month - 1, day));

  return resolved.getUTCFullYear() === year &&
    resolved.getUTCMonth() === month - 1 &&
    resolved.getUTCDate() === day
    ? resolved.getTime()
    : null;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value >= 1 ? 1 : value;
}

export function isQuranGoalDate(value: IsoDate): boolean {
  return parseCalendarDate(value) !== null;
}

export function quranGoalMonthRange(
  anchor: IsoDate,
): { from: IsoDate; to: IsoDate } | null {
  const epoch = parseCalendarDate(anchor);
  if (epoch === null) {
    return null;
  }

  const date = new Date(epoch);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return {
    from: `${year}-${pad(monthIndex + 1)}-01`,
    to: `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`,
  };
}

export function validateQuranGoalInput(
  input: QuranGoalInput,
  today: IsoDate,
): QuranGoalValidationIssue[] {
  const issues: QuranGoalValidationIssue[] = [];

  if (!isQuranGoalDate(input.startDate)) {
    issues.push('invalid_start_date');
  } else if (input.startDate > today) {
    issues.push('future_start_date');
  }

  const maxTarget = input.type === 'monthly_juz' ? JUZ_COUNT : 604;
  if (
    !Number.isInteger(input.targetValue) ||
    input.targetValue < 1 ||
    input.targetValue > maxTarget
  ) {
    issues.push('invalid_target_value');
  }

  if (
    input.type === 'finish_by_date' &&
    (input.targetDate === null ||
      !isQuranGoalDate(input.targetDate) ||
      input.targetDate < input.startDate)
  ) {
    issues.push('invalid_target_date');
  }

  if (
    !Number.isInteger(input.reminderHour) ||
    input.reminderHour < 0 ||
    input.reminderHour > 23 ||
    !Number.isInteger(input.reminderMinute) ||
    input.reminderMinute < 0 ||
    input.reminderMinute > 59
  ) {
    issues.push('invalid_reminder_time');
  }

  return issues;
}

function liveReads(
  reads: readonly QuranGoalRead[],
  goal: QuranGoal,
  today: IsoDate,
  pageCount: number,
): QuranGoalRead[] {
  return reads.filter(
    (read) =>
      read.deletedAt === null &&
      isQuranGoalDate(read.date) &&
      read.date >= goal.startDate &&
      read.date <= today &&
      Number.isInteger(read.pageNumber) &&
      read.pageNumber >= 1 &&
      read.pageNumber <= pageCount &&
      Number.isInteger(read.juzNumber) &&
      read.juzNumber >= 1 &&
      read.juzNumber <= JUZ_COUNT &&
      read.verseKey.length > 0,
  );
}

function uniquePages(reads: readonly QuranGoalRead[]): Set<number> {
  return new Set(reads.map((read) => read.pageNumber));
}

function buildJuzProgress(
  reads: readonly QuranGoalRead[],
  verseCountsByJuz: readonly number[],
): QuranJuzProgress[] {
  const readKeys = Array.from({ length: JUZ_COUNT }, () => new Set<string>());
  for (const read of reads) {
    readKeys[read.juzNumber - 1].add(read.verseKey);
  }

  return Array.from({ length: JUZ_COUNT }, (_, index) => {
    const totalVerseCount = Math.max(0, verseCountsByJuz[index] ?? 0);
    const readVerseCount = Math.min(readKeys[index].size, totalVerseCount);
    return {
      juzNumber: index + 1,
      readVerseCount,
      totalVerseCount,
      ratio: totalVerseCount === 0 ? 0 : readVerseCount / totalVerseCount,
    };
  });
}

export function buildQuranGoalProgress(
  goal: QuranGoal,
  reads: readonly QuranGoalRead[],
  pageCount: number,
  verseCountsByJuz: readonly number[],
  today: IsoDate,
): QuranGoalProgress {
  const safePageCount = Number.isInteger(pageCount) && pageCount > 0 ? pageCount : 0;
  const allReads = liveReads(reads, goal, today, safePageCount);
  const overallCompletedPages = uniquePages(allReads).size;
  const month = quranGoalMonthRange(today);

  let periodStart = goal.startDate;
  let periodEnd = goal.targetDate ?? today;
  let periodReads = allReads;
  let targetPages = safePageCount;

  if (goal.type === 'daily_pages') {
    periodStart = today;
    periodEnd = today;
    periodReads = allReads.filter((read) => read.date === today);
    targetPages = goal.targetValue;
  } else if (goal.type === 'monthly_juz') {
    periodStart = month === null || goal.startDate > month.from ? goal.startDate : month.from;
    periodEnd = month?.to ?? today;
    periodReads = allReads.filter((read) => read.date >= periodStart && read.date <= periodEnd);
    targetPages = (goal.targetValue * safePageCount) / JUZ_COUNT;
  }

  const completedPages = uniquePages(periodReads).size;
  const ratio = clampRatio(targetPages === 0 ? 0 : completedPages / targetPages);
  const elapsed = dayDifference(goal.startDate, today);
  const elapsedDays = elapsed === null || elapsed < 0 ? 0 : elapsed + 1;
  const dailyAveragePages = elapsedDays === 0 ? 0 : overallCompletedPages / elapsedDays;
  const pagesToFinish = Math.max(0, safePageCount - overallCompletedPages);
  const daysToFinish =
    dailyAveragePages <= 0 ? null : Math.ceil(pagesToFinish / dailyAveragePages);
  const estimatedCompletionDate =
    daysToFinish === null ? null : addDays(today, daysToFinish);
  const complete = ratio >= 1;
  const overdue =
    goal.type === 'finish_by_date' &&
    goal.targetDate !== null &&
    goal.targetDate < today &&
    !complete;

  return {
    status: complete ? 'complete' : overdue ? 'overdue' : 'active',
    periodStart,
    periodEnd,
    completedPages,
    targetPages,
    remainingPages: Math.max(0, targetPages - completedPages),
    ratio,
    percent: Math.round(ratio * 100),
    overallCompletedPages,
    dailyAveragePages,
    estimatedCompletionDate,
    juzProgress: buildJuzProgress(allReads, verseCountsByJuz),
  };
}
