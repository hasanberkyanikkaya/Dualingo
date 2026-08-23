export type OrderingRaceContentIssue = {
  severity: 'error' | 'warning';
  path: string;
  message: string;
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function error(path: string, message: string): OrderingRaceContentIssue {
  return { severity: 'error', path, message };
}

function validatePuzzle(value: unknown, index: number): OrderingRaceContentIssue[] {
  const path = `puzzles[${index}]`;
  const puzzle = record(value);
  if (puzzle === null) {
    return [error(path, 'bulmaca nesne olmalı.')];
  }

  const issues: OrderingRaceContentIssue[] = [];
  if (!nonEmptyString(puzzle.id)) {
    issues.push(error(`${path}.id`, 'bulmaca kimliği boş olamaz.'));
  }
  if (!nonEmptyString(puzzle.prompt)) {
    issues.push(error(`${path}.prompt`, 'bulmaca yönergesi boş olamaz.'));
  }

  if (!Array.isArray(puzzle.items) || puzzle.items.length < 2) {
    issues.push(error(`${path}.items`, 'en az iki öğe bulunmalı.'));
    return issues;
  }

  const itemIds: string[] = [];
  puzzle.items.forEach((value, itemIndex) => {
    const itemPath = `${path}.items[${itemIndex}]`;
    const item = record(value);
    if (item === null) {
      issues.push(error(itemPath, 'öğe nesne olmalı.'));
      return;
    }
    if (!nonEmptyString(item.id)) {
      issues.push(error(`${itemPath}.id`, 'öğe kimliği boş olamaz.'));
    } else {
      itemIds.push(item.id);
    }
    if (!nonEmptyString(item.text)) {
      issues.push(error(`${itemPath}.text`, 'öğe metni boş olamaz.'));
    }
  });

  if (new Set(itemIds).size !== itemIds.length) {
    issues.push(error(`${path}.items`, 'öğe kimlikleri benzersiz olmalı.'));
  }

  if (!Array.isArray(puzzle.correctOrder)) {
    issues.push(error(`${path}.correctOrder`, 'doğru sıra bir dizi olmalı.'));
    return issues;
  }

  const correctOrder = puzzle.correctOrder.filter(nonEmptyString);
  const sameLength = correctOrder.length === itemIds.length;
  const sameIds =
    sameLength &&
    new Set(correctOrder).size === correctOrder.length &&
    correctOrder.every((id) => itemIds.includes(id));
  if (!sameIds) {
    issues.push(error(`${path}.correctOrder`, 'doğru sıra öğe kimliklerinin permütasyonu olmalı.'));
  }

  return issues;
}

export function validateOrderingRaceContent(value: unknown): OrderingRaceContentIssue[] {
  const content = record(value);
  if (content === null) {
    return [error('data', 'oyun içeriği nesne olmalı.')];
  }

  const issues: OrderingRaceContentIssue[] = [];
  if (content.id !== 'ordering-race') {
    issues.push(error('data.id', 'oyun kimliği "ordering-race" olmalı.'));
  }
  if (!nonEmptyString(content.title)) {
    issues.push(error('data.title', 'oyun başlığı boş olamaz.'));
  }
  if (!nonEmptyString(content.description)) {
    issues.push(error('data.description', 'oyun açıklaması boş olamaz.'));
  }
  if (!Array.isArray(content.puzzles) || content.puzzles.length === 0) {
    issues.push(error('data.puzzles', 'en az bir bulmaca bulunmalı.'));
    return issues;
  }

  content.puzzles.forEach((puzzle, index) => {
    issues.push(...validatePuzzle(puzzle, index));
  });

  const puzzleIds = content.puzzles
    .map((puzzle) => record(puzzle)?.id)
    .filter(nonEmptyString);
  if (new Set(puzzleIds).size !== puzzleIds.length) {
    issues.push(error('data.puzzles', 'bulmaca kimlikleri benzersiz olmalı.'));
  }

  return issues;
}

export function countOrderingRaceIssues(
  issues: readonly OrderingRaceContentIssue[],
): { errors: number; warnings: number } {
  return issues.reduce(
    (count, issue) => ({
      errors: count.errors + (issue.severity === 'error' ? 1 : 0),
      warnings: count.warnings + (issue.severity === 'warning' ? 1 : 0),
    }),
    { errors: 0, warnings: 0 },
  );
}
