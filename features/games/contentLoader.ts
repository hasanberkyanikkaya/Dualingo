import orderingRaceJson from '@/content/games/ordering-race.json';
import {
  countOrderingRaceIssues,
  validateOrderingRaceContent,
} from '@/features/games/orderingRaceValidation';

import type { OrderingRaceContent, OrderingRaceContentFile } from '@/types';

const EMPTY_CONTENT: OrderingRaceContent = {
  id: 'ordering-race',
  title: '',
  description: '',
  puzzles: [],
};

let cached: OrderingRaceContent | null = null;

function warn(message: string): void {
  if (__DEV__) {
    console.warn(`[games/contentLoader] ${message}`);
  }
}

export function getOrderingRaceContent(): OrderingRaceContent {
  if (cached !== null) {
    return cached;
  }

  const envelope = orderingRaceJson as unknown as OrderingRaceContentFile;
  if (envelope.schemaVersion !== 1 || envelope.data === undefined) {
    warn('ordering-race.json şema sürümü desteklenmiyor veya data alanı yok.');
    cached = EMPTY_CONTENT;
    return cached;
  }

  const issues = validateOrderingRaceContent(envelope.data);
  const { errors, warnings } = countOrderingRaceIssues(issues);
  if (issues.length > 0) {
    warn(`ordering-race.json: ${errors} hata, ${warnings} uyarı.`);
    for (const issue of issues) {
      warn(`${issue.path}: ${issue.message}`);
    }
  }

  cached = errors === 0 ? envelope.data : EMPTY_CONTENT;
  return cached;
}
