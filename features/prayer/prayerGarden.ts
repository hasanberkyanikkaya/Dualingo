export type GardenStage = 'start' | 'sprout' | 'growing' | 'blooming' | 'flourishing';

export type GardenProgress = {
  stage: GardenStage;
  stageIndex: number;
  totalPrayers: number;
  activeDays: number;
  growthPoints: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progressPercent: number;
  plantCount: number;
  flowerCount: number;
  treeCount: number;
};

const STAGES: readonly { stage: GardenStage; threshold: number }[] = [
  { stage: 'start', threshold: 0 },
  { stage: 'sprout', threshold: 8 },
  { stage: 'growing', threshold: 30 },
  { stage: 'blooming', threshold: 80 },
  { stage: 'flourishing', threshold: 180 },
];

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Toplam kayıt ve kayıt tutulan gün sayısından kalıcı bahçe görünümü üretir. */
export function calculateGardenProgress(
  prayerCount: number,
  activeDayCount: number,
): GardenProgress {
  const totalPrayers = nonNegativeInteger(prayerCount);
  const activeDays = Math.min(nonNegativeInteger(activeDayCount), totalPrayers);
  const growthPoints = totalPrayers + activeDays * 2;

  let stageIndex = 0;
  for (let index = 1; index < STAGES.length; index += 1) {
    if (growthPoints >= STAGES[index].threshold) {
      stageIndex = index;
    }
  }

  const current = STAGES[stageIndex];
  const next = STAGES[stageIndex + 1] ?? null;
  const progressPercent =
    next === null
      ? 100
      : Math.round(
          ((growthPoints - current.threshold) / (next.threshold - current.threshold)) * 100,
        );

  return {
    stage: current.stage,
    stageIndex,
    totalPrayers,
    activeDays,
    growthPoints,
    currentThreshold: current.threshold,
    nextThreshold: next?.threshold ?? null,
    progressPercent,
    plantCount: totalPrayers === 0 ? 0 : Math.min(7, 1 + Math.floor(growthPoints / 12)),
    flowerCount: stageIndex < 2 ? 0 : Math.min(12, 2 + Math.floor((growthPoints - 30) / 12)),
    treeCount: stageIndex < 3 ? 0 : Math.min(3, 1 + Math.floor((growthPoints - 80) / 70)),
  };
}
