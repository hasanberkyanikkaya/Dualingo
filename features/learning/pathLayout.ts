import { layout, spacing } from '@/constants/spacing';

import type { LevelId, Unit, UnitId } from '@/types';

/**
 * Seviye haritasının geometrisi — saf hesap.
 *
 * Bu dosyada React yok, tema yok, renk yok. Yalnızca "hangi düğüm nereye
 * düşer" ve "aralarındaki şerit hangi eğriyi çizer" soruları.
 *
 * Ölçüm (`onLayout`) bilerek kullanılmıyor: yerleşim ekran genişliğinden
 * hesaplandığı için ilk karede doğru çiziliyor, düğümler yerine oturmuyor.
 * Bunun ikinci kazancı, her düğümün mutlak `y`'sinin elde olması — Faz 2.4'te
 * "açılışta geçerli seviyeye kaydır" bir arama + `scrollTo`'ya iniyor.
 */

/** Düğüm çapı. Button'ın geleneği: ölçüler `minTouchTarget` etrafında aritmetik. */
export const NODE_SIZE = layout.minTouchTarget + spacing.xl; // 72

/** İki düğüm merkezi arasındaki dikey mesafe. */
const STEP_Y = spacing.huge * 2; // 128

/** Şeridin kalınlığı. */
export const TRAIL_WIDTH = spacing.xxl; // 32

/** Şeridin ilk ve son düğümü aşma payı — uçları kapakla bitmesin diye. */
const TRAIL_LEAD = spacing.xxl; // 32

/** Düğümün altındaki yıldız / "Şu an buradasın" satırına ayrılan yer. */
const CAPTION_BLOCK = spacing.xl; // 24

/** Genliğin oranı, alt ve mutlak üst sınırı. */
const AMPLITUDE_RATIO = 0.22;
const AMPLITUDE_MIN = spacing.xxl; // 32
const AMPLITUDE_MAX = spacing.huge + spacing.xxl; // 96

/**
 * Yatay kayma döngüsü: merkez → sağ → merkez → sol.
 *
 * Düz `+1 / -1` değişimi her düğümde köşeli bir testere dişi verirdi; dört
 * fazlı döngü gerçek bir sinüs çiziyor. Beş seviyeli ünitede ilk ve son düğüm
 * tam ortaya düşüyor, bu da üniteler arası geçişi doğal gösteriyor.
 */
const OFFSET_CYCLE = [0, 1, 0, -1] as const;

export type Point = { x: number; y: number };

export type NodePlacement = {
  levelId: LevelId;
  /** Düğümün MERKEZİ. Çizerken `NODE_SIZE / 2` çıkarılır. */
  x: number;
  y: number;
};

export type UnitLayout = {
  unitId: UnitId;
  width: number;
  height: number;
  nodes: NodePlacement[];
  /**
   * Düğüm aralığı başına bir SVG `d` dizgisi.
   *
   * Tek parça yerine dizi olmasının sebebi Faz 2.4: geçilmiş parçaları
   * renklendirmek tek prop değişimi olacak, geometri işi çıkmayacak. Aynı renk
   * ve opaklıkta yuvarlak kapaklı çizgiler üst üste bindiği için ek yerinde
   * dikiş görünmüyor.
   */
  trailSegments: string[];
};

export type MapLayout = { units: UnitLayout[] };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Zikzak genliği.
 *
 * İki uçtaki bozulmayı da bu kısıt engelliyor:
 * - Dar ekranda düğüm ya da 32px'lik şerit kenardan taşardı → `safeMax`.
 * - Tablette oransal genlik büyüyüp şeridi düz, geniş, neredeyse yatay bir
 *   yılana çevirirdi → mutlak `AMPLITUDE_MAX` tavanı.
 */
function getAmplitude(width: number): number {
  const safeMax = width / 2 - NODE_SIZE / 2 - TRAIL_WIDTH / 2;
  return clamp(width * AMPLITUDE_RATIO, AMPLITUDE_MIN, Math.min(AMPLITUDE_MAX, safeMax));
}

/**
 * Catmull-Rom eğrisini kübik Bézier parçalarına çevirir.
 *
 * ⚠️ Basit görünen "kontrol noktalarını dikey orta noktaya koy" yöntemi
 * KULLANILMIYOR: o yöntem her parçanın iki ucunda da teğeti dikeye zorluyor ve
 * sonuç, her düğümde görünür bir düzlük taşıyan, birbirinden bağımsız S'lerden
 * oluşan bir zincir oluyor. Catmull-Rom C1 sürekliliği veriyor — tek akan eğri.
 *
 * Uçlarda komşu nokta kendisiyle tekrarlanıyor (`p[-1] = p[0]`), böylece ilk ve
 * son parçanın teğeti de doğru çıkıyor. Bölen 6 gerginlik ayarıdır; eğri
 * genliği aşmadığı sürece dokunulmaz.
 */
function buildSegments(points: readonly Point[]): string[] {
  if (points.length < 2) {
    return [];
  }

  const at = (i: number): Point => points[clamp(i, 0, points.length - 1)];
  const segments: string[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    segments.push(`M ${p1.x} ${p1.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }

  return segments;
}

function buildUnitLayout(unit: Unit, width: number): UnitLayout {
  const amplitude = getAmplitude(width);
  const centerX = width / 2;

  const nodes: NodePlacement[] = unit.levels.map((level, index) => ({
    levelId: level.id,
    x: centerX + OFFSET_CYCLE[index % OFFSET_CYCLE.length] * amplitude,
    y: TRAIL_LEAD + NODE_SIZE / 2 + index * STEP_Y,
  }));

  // Şerit düğümlerin bir tık ötesinden başlayıp ötesinde bitiyor: yoksa ilk ve
  // son düğümün üstünde yuvarlak bir kapakla duruyor. Pay YALNIZCA patikaya
  // ait, düğüm yerleşimini değiştirmiyor.
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const trailPoints: Point[] =
    nodes.length === 0
      ? []
      : [
          { x: first.x, y: first.y - TRAIL_LEAD },
          ...nodes.map(({ x, y }) => ({ x, y })),
          { x: last.x, y: last.y + TRAIL_LEAD },
        ];

  return {
    unitId: unit.id,
    width,
    height: TRAIL_LEAD * 2 + NODE_SIZE + Math.max(unit.levels.length - 1, 0) * STEP_Y + CAPTION_BLOCK,
    nodes,
    trailSegments: buildSegments(trailPoints),
  };
}

/**
 * Bütün haritanın yerleşimi. `width`, ünite bloğunun kullanabileceği net
 * genişliktir — çağıran yatay güvenli alan payını ve ekran kenar boşluğunu
 * çıkarmış olmalı.
 */
export function buildMapLayout(units: readonly Unit[], width: number): MapLayout {
  if (width <= 0) {
    return { units: [] };
  }
  return { units: units.map((unit) => buildUnitLayout(unit, width)) };
}
