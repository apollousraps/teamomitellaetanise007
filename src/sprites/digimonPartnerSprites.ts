import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  type DigimonFormId,
  type PartnerAttackKind,
  type StarterDigimonId,
} from '../types/digimon';
import type { CardinalDirection, TamerMovementState } from './tamerRealSheets';

export const DIGIMON_SHEET_CELL = 128;
export const DIGIMON_FRAME_COUNT = 4;

type DigimonAssetKey =
  | 'basic_sheet'
  | 'atk1_pose'
  | 'atk1_fx'
  | 'atk2_pose'
  | 'atk2_fx';

const ASSET_KEYS: readonly DigimonAssetKey[] = [
  'basic_sheet',
  'atk1_pose',
  'atk1_fx',
  'atk2_pose',
  'atk2_fx',
] as const;

const digimonImageCache = new Map<
  DigimonFormId,
  Map<DigimonAssetKey, HTMLImageElement>
>();
const preloadPromises = new Map<DigimonFormId, Promise<void>>();

export function preloadDigimonPartnerAssets(
  formId: DigimonFormId
): Promise<void> {
  const existing = preloadPromises.get(formId);
  const existingBucket = digimonImageCache.get(formId);
  if (existing && existingBucket?.has('basic_sheet')) return existing;

  const bucket = existingBucket ?? new Map<DigimonAssetKey, HTMLImageElement>();
  digimonImageCache.set(formId, bucket);

  const p = Promise.all(
    ASSET_KEYS.map(
      (key) =>
        new Promise<void>((resolve) => {
          if (bucket.get(key)?.complete && (bucket.get(key)?.naturalWidth ?? 0) > 0) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            bucket.set(key, img);
            resolve();
          };
          img.onerror = () => resolve();
          const isFxAsset = key === 'atk1_fx' || key === 'atk2_fx';
          const cacheBust = isFxAsset
            ? '?v=fx3'
            : formId === 'geogreymon' ||
                formId === 'rizegreymon' ||
                formId === 'shinegreymon' ||
                formId === 'gaogamon' ||
                formId === 'machgaogamon' ||
                formId === 'miragegaogamon' ||
                formId === 'sunflowmon' ||
                formId === 'lilamon' ||
                formId === 'rosemon'
              ? '?v=back2'
              : '';
          img.src = `/assets/sprites/digimon/${formId}/${key}.png${cacheBust}`;
        })
    )
  ).then(() => {
    if (!bucket.has('basic_sheet')) {
      preloadPromises.delete(formId);
    }
  });

  preloadPromises.set(formId, p);
  return p;
}

export function preloadDigimonEvolutionLine(
  starterId: StarterDigimonId
): Promise<void> {
  const chain = getEvolutionChainForStarter(starterId);
  return Promise.all(chain.map((f) => preloadDigimonPartnerAssets(f.id))).then(
    () => undefined
  );
}

interface CellSpec {
  col: number;
  row: number;
  flipX?: boolean;
}

/**
 * Exact frame mapping extracted from the user's reference spritesheets:
 * Preserves original faces, eyes, horns, wings, armor, cannons & proportions.
 */
const DIRECTION_CELL_MAP: Record<
  DigimonFormId,
  Record<
    CardinalDirection,
    {
      idle: CellSpec;
      walk: readonly [CellSpec, CellSpec, CellSpec, CellSpec];
    }
  >
> = {
  agumon: {
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 0 },
        { col: 1, row: 0, flipX: true },
      ],
    },
    W: {
      idle: { col: 2, row: 0 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
    E: {
      idle: { col: 2, row: 0, flipX: true },
      walk: [
        { col: 0, row: 1, flipX: true },
        { col: 1, row: 1, flipX: true },
        { col: 2, row: 1, flipX: true },
        { col: 3, row: 1, flipX: true },
      ],
    },
    N: {
      idle: { col: 3, row: 0 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
      ],
    },
  },
  geogreymon: {
    // 4 cols x 1 row extracted from geogre10: feet-aligned full-detail stances facing W (flipped for E)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  rizegreymon: {
    // 4 cols x 1 row extracted from RizeGreymon DS sheet: feet-aligned full-detail stances facing W (flipped for E)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  shinegreymon: {
    // 4 cols x 1 row extracted from ShineGreymon_vg animated sprite (natively faces W; flipX for E)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  gaomon: {
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 0 },
        { col: 1, row: 0, flipX: true },
      ],
    },
    W: {
      idle: { col: 2, row: 0 },
      walk: [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 1, row: 2 },
      ],
    },
    E: {
      idle: { col: 2, row: 0, flipX: true },
      walk: [
        { col: 0, row: 2, flipX: true },
        { col: 1, row: 2, flipX: true },
        { col: 2, row: 2, flipX: true },
        { col: 1, row: 2, flipX: true },
      ],
    },
    N: {
      idle: { col: 3, row: 0 },
      walk: [
        { col: 3, row: 1 },
        { col: 3, row: 0 },
        { col: 3, row: 2 },
        { col: 3, row: 0 },
      ],
    },
  },
  gaogamon: {
    // 4 cols x 2 rows: Row 0 = Gaogamon_vg animated stances (natively W, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  machgaogamon: {
    // 4 cols x 2 rows: Row 0 = MachGaogamon_vg animated stances (natively W, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  miragegaogamon: {
    // 4 cols x 2 rows: Row 0 = MirageGaogamon_vg animated stances (natively W, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  lalamon: {
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 0 },
        { col: 1, row: 0, flipX: true },
      ],
    },
    W: {
      idle: { col: 1, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 0, row: 2 },
        { col: 1, row: 2 },
      ],
    },
    E: {
      idle: { col: 1, row: 1, flipX: true },
      walk: [
        { col: 0, row: 1, flipX: true },
        { col: 1, row: 1, flipX: true },
        { col: 0, row: 2, flipX: true },
        { col: 1, row: 2, flipX: true },
      ],
    },
    N: {
      idle: { col: 2, row: 0 },
      walk: [
        { col: 2, row: 0 },
        { col: 3, row: 0 },
        { col: 2, row: 1 },
        { col: 3, row: 2 },
      ],
    },
  },
  sunflowmon: {
    // 4 cols x 2 rows: Row 0 = animated wing-flap stances (W native, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  lilamon: {
    // 4 cols x 2 rows: Row 0 = graceful hovering stances (W native, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
  rosemon: {
    // 4 cols x 2 rows: Row 0 = Rosemon_vg animated stances (W native, flipX for E), Row 1 = back-view walk (N)
    S: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    W: {
      idle: { col: 0, row: 0 },
      walk: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
    },
    E: {
      idle: { col: 0, row: 0, flipX: true },
      walk: [
        { col: 0, row: 0, flipX: true },
        { col: 1, row: 0, flipX: true },
        { col: 2, row: 0, flipX: true },
        { col: 3, row: 0, flipX: true },
      ],
    },
    N: {
      idle: { col: 0, row: 1 },
      walk: [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
      ],
    },
  },
};

function getPartnerScale(formId: DigimonFormId): number {
  return getDigimonFormProfile(formId).worldScale;
}

/**
 * Draws the companion partner Digimon using its untouched reference spritesheet
 * in Idle or 4-Direction Walk states.
 */
export function drawDigimonPartnerFrame(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  state: TamerMovementState,
  direction: CardinalDirection,
  frameIndex: number,
  elapsedSec: number,
  footX: number,
  footY: number
): boolean {
  const img = digimonImageCache.get(formId)?.get('basic_sheet');
  if (!img || !img.complete || img.naturalWidth === 0) {
    return false;
  }

  const dirEntry = DIRECTION_CELL_MAP[formId][direction];
  const hasAnimatedIdle =
    direction !== 'N' &&
    (formId === 'geogreymon' ||
      formId === 'rizegreymon' ||
      formId === 'shinegreymon' ||
      formId === 'gaogamon' ||
      formId === 'machgaogamon' ||
      formId === 'miragegaogamon' ||
      formId === 'sunflowmon' ||
      formId === 'lilamon' ||
      formId === 'rosemon');
  const idleFps =
    formId === 'shinegreymon' || formId === 'miragegaogamon' || formId === 'rosemon'
      ? 3.8
      : formId === 'gaogamon' ||
          formId === 'machgaogamon' ||
          formId === 'sunflowmon' ||
          formId === 'lilamon'
        ? 3.6
        : 2.8;
  const rawIdleIdx = Math.floor(Math.max(0, elapsedSec) * idleFps);
  const safeIdleIdx =
    ((rawIdleIdx % DIGIMON_FRAME_COUNT) + DIGIMON_FRAME_COUNT) %
    DIGIMON_FRAME_COUNT;
  const safeWalkIdx =
    ((frameIndex % DIGIMON_FRAME_COUNT) + DIGIMON_FRAME_COUNT) %
    DIGIMON_FRAME_COUNT;
  const cell =
    state === 'idle'
      ? hasAnimatedIdle
        ? (dirEntry.walk[safeIdleIdx] ?? dirEntry.idle)
        : dirEntry.idle
      : (dirEntry.walk[safeWalkIdx] ?? dirEntry.idle);

  const backViewBoost =
    direction === 'N' &&
    (formId === 'gaogamon' || formId === 'rosemon')
      ? 1.1
      : 1;
  const baseScale = getPartnerScale(formId) * backViewBoost;
  const breath = state === 'idle' ? Math.sin(elapsedSec * 3.4) : 0;
  // Uniform gentle breathing — zero aspect distortion
  const uniformScale = baseScale * (1 + breath * 0.012);
  const isSideWalkBounce = state === 'walk' && direction !== 'N';
  const floatY =
    formId === 'lalamon'
      ? Math.sin(elapsedSec * 3.6 + (state === 'walk' ? 1.2 : 0)) * 2.2
      : formId === 'sunflowmon'
        ? Math.sin(elapsedSec * 4.4 + (state === 'walk' ? 1.4 : 0)) * 3.2 - 1.5
        : formId === 'lilamon'
          ? Math.sin(elapsedSec * 4.0 + (state === 'walk' ? 1.4 : 0)) * 3.8 - 2.2
          : formId === 'shinegreymon' && isSideWalkBounce
            ? -Math.abs(Math.sin(elapsedSec * 8.2)) * 5.0 - 1.5
            : formId === 'miragegaogamon' && isSideWalkBounce
              ? -Math.abs(Math.sin(elapsedSec * 9.8)) * 5.4 - 1.5
              : formId === 'rosemon' && isSideWalkBounce
                ? -Math.abs(Math.sin(elapsedSec * 9.0)) * 4.4 - 1.0
                : formId === 'machgaogamon' && isSideWalkBounce
                  ? -Math.abs(Math.sin(elapsedSec * 10.2)) * 5.2 - 1.2
                  : formId === 'gaogamon' && isSideWalkBounce
                    ? -Math.abs(Math.sin(elapsedSec * 10.6)) * 4.8
                    : formId === 'geogreymon' && isSideWalkBounce
                      ? -Math.abs(Math.sin(elapsedSec * 9.2)) * 4.0
                      : formId === 'rizegreymon' && isSideWalkBounce
                        ? -Math.abs(Math.sin(elapsedSec * 8.6)) * 4.5
                        : 0;
  const walkTilt =
    formId === 'geogreymon' && isSideWalkBounce
      ? Math.sin(elapsedSec * 9.2) * 0.032
      : formId === 'gaogamon' && isSideWalkBounce
        ? Math.sin(elapsedSec * 10.6) * 0.04
        : formId === 'machgaogamon' && isSideWalkBounce
          ? Math.sin(elapsedSec * 10.2) * 0.036
          : formId === 'miragegaogamon' && isSideWalkBounce
            ? Math.sin(elapsedSec * 9.8) * 0.035
            : formId === 'rosemon' && isSideWalkBounce
              ? Math.sin(elapsedSec * 9.0) * 0.032
              : formId === 'lilamon' && isSideWalkBounce
                ? Math.sin(elapsedSec * 7.6) * 0.04
                : formId === 'sunflowmon' && isSideWalkBounce
                  ? Math.sin(elapsedSec * 8.4) * 0.038
                  : formId === 'rizegreymon' && isSideWalkBounce
                    ? Math.sin(elapsedSec * 8.6) * 0.03
                    : formId === 'shinegreymon' && isSideWalkBounce
                      ? Math.sin(elapsedSec * 8.2) * 0.034
                      : 0;

  const sx = cell.col * DIGIMON_SHEET_CELL;
  const sy = cell.row * DIGIMON_SHEET_CELL;
  const dw = DIGIMON_SHEET_CELL * uniformScale;
  const dh = DIGIMON_SHEET_CELL * uniformScale;
  const feetPad = 4 * uniformScale;

  ctx.save();
  ctx.translate(footX, footY + floatY);
  if (cell.flipX) {
    ctx.scale(-1, 1);
  }
  if (walkTilt !== 0) {
    ctx.rotate(walkTilt);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    sx,
    sy,
    DIGIMON_SHEET_CELL,
    DIGIMON_SHEET_CELL,
    -dw / 2,
    -dh + feetPad,
    dw,
    dh
  );
  ctx.restore();

  return true;
}

/**
 * Draws the exact Combat Attack Pose sprite (Special 1 / Special 2 / Basic lunge)
 * scaled faithfully per evolution stage.
 */
export function drawDigimonAttackPoseFrame(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  attackKind: PartnerAttackKind,
  facingRight: boolean,
  progress: number,
  footX: number,
  footY: number
): boolean {
  const bucket = digimonImageCache.get(formId);
  const poseKey: DigimonAssetKey =
    attackKind === 'special2' ? 'atk2_pose' : 'atk1_pose';
  const poseImg = bucket?.get(poseKey);

  if (!poseImg || !poseImg.complete || poseImg.naturalWidth === 0) {
    return drawDigimonPartnerFrame(
      ctx,
      formId,
      'idle',
      facingRight ? 'E' : 'W',
      0,
      progress,
      footX,
      footY
    );
  }

  const baseLungeDist =
    formId === 'miragegaogamon'
      ? 18
      : formId === 'shinegreymon' || formId === 'machgaogamon' || formId === 'rosemon'
        ? 16
        : formId === 'rizegreymon' || formId === 'gaogamon' || formId === 'lilamon'
          ? 14
          : formId === 'geogreymon' || formId === 'sunflowmon'
            ? 12
            : 10;
  // Physical melee basic hits step closer into the enemy with a snappy strike arc
  const lungeDist = attackKind === 'basic' ? baseLungeDist * 1.48 : baseLungeDist;
  const strikeCurve =
    attackKind === 'basic'
      ? Math.sin(Math.pow(Math.min(1, progress), 0.72) * Math.PI)
      : Math.sin(Math.min(1, progress) * Math.PI);
  const lungeOffset = strikeCurve * (facingRight ? lungeDist : -lungeDist);

  const formProfile = getDigimonFormProfile(formId);
  const targetH = formProfile.worldDimensions.attackPoseHeight;

  const ratio = poseImg.naturalWidth / Math.max(1, poseImg.naturalHeight);
  const dh = targetH;
  const dw = targetH * ratio;
  const atkPulse = Math.sin(Math.min(1, progress) * Math.PI);

  ctx.save();
  ctx.translate(
    footX + lungeOffset,
    footY -
      (formId === 'shinegreymon' || formId === 'miragegaogamon' || formId === 'rosemon'
        ? atkPulse * 5
        : formId === 'lilamon' || formId === 'sunflowmon'
          ? atkPulse * 6 + 3
          : formId === 'machgaogamon' && attackKind === 'special1'
            ? atkPulse * 6
            : 0)
  );
  if (!facingRight) {
    ctx.scale(-1, 1);
  }
  if (attackKind === 'basic') {
    // Crisp physical melee strike lean for every Digimon
    ctx.rotate(strikeCurve * 0.09);
  } else if (formId === 'shinegreymon') {
    ctx.rotate(atkPulse * (attackKind === 'special2' ? 0.09 : 0.055));
    ctx.shadowColor =
      attackKind === 'special2'
        ? 'rgba(253, 224, 71, 0.92)'
        : 'rgba(251, 146, 60, 0.88)';
    ctx.shadowBlur = 18 * atkPulse;
  } else if (formId === 'miragegaogamon') {
    ctx.rotate(atkPulse * (attackKind === 'special2' ? 0.07 : 0.05));
    ctx.shadowColor =
      attackKind === 'special2'
        ? 'rgba(250, 204, 21, 0.92)'
        : 'rgba(96, 165, 250, 0.92)';
    ctx.shadowBlur = 18 * atkPulse;
  } else if (formId === 'rosemon') {
    ctx.rotate(atkPulse * (attackKind === 'special2' ? 0.065 : 0.045));
    ctx.shadowColor =
      attackKind === 'special2'
        ? 'rgba(244, 63, 94, 0.94)'
        : 'rgba(250, 204, 21, 0.9)';
    ctx.shadowBlur = 18 * atkPulse;
  } else if (formId === 'lilamon') {
    ctx.shadowColor = 'rgba(244, 114, 182, 0.9)';
    ctx.shadowBlur = 16 * atkPulse;
  } else if (formId === 'sunflowmon') {
    ctx.shadowColor = 'rgba(250, 204, 21, 0.88)';
    ctx.shadowBlur = 14 * atkPulse;
  } else if (formId === 'machgaogamon') {
    ctx.shadowColor = 'rgba(56, 189, 248, 0.88)';
    ctx.shadowBlur = 16 * atkPulse;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(poseImg, -dw / 2, -dh + 3, dw, dh);
  ctx.restore();

  return true;
}

type SkillVfxArchetype =
  | 'projectile'
  | 'beam'
  | 'slash'
  | 'hammer'
  | 'tornado'
  | 'eruption'
  | 'burst';

type SkillParticleMotif =
  | 'embers'
  | 'lightning'
  | 'sparks'
  | 'stars'
  | 'leaves'
  | 'petals'
  | 'hearts';

interface SkillVfxSpec {
  archetype: SkillVfxArchetype;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
  motif: SkillParticleMotif;
  baseSize: number;
  particleCount: number;
}

const SKILL_VFX_SPECS: Record<
  DigimonFormId,
  { special1: SkillVfxSpec; special2: SkillVfxSpec }
> = {
  agumon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#fb923c',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.78)',
      motif: 'embers',
      baseSize: 94,
      particleCount: 10,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#f97316',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(249, 115, 22, 0.84)',
      motif: 'embers',
      baseSize: 64,
      particleCount: 12,
    },
  },
  geogreymon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#ef4444',
      secondaryHex: '#fdba74',
      glowRgba: 'rgba(239, 68, 68, 0.85)',
      motif: 'embers',
      baseSize: 112,
      particleCount: 12,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(249, 115, 22, 0.9)',
      motif: 'embers',
      baseSize: 124,
      particleCount: 16,
    },
  },
  rizegreymon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#f97316',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(251, 146, 60, 0.9)',
      motif: 'sparks',
      baseSize: 66,
      particleCount: 14,
    },
    special2: {
      archetype: 'hammer',
      primaryHex: '#ef4444',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(250, 204, 21, 0.92)',
      motif: 'lightning',
      baseSize: 126,
      particleCount: 14,
    },
  },
  shinegreymon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#fef9c3',
      glowRgba: 'rgba(253, 224, 71, 0.95)',
      motif: 'stars',
      baseSize: 78,
      particleCount: 16,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#fbbf24',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(251, 191, 36, 0.95)',
      motif: 'embers',
      baseSize: 144,
      particleCount: 18,
    },
  },
  gaomon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#ef4444',
      glowRgba: 'rgba(56, 189, 248, 0.85)',
      motif: 'sparks',
      baseSize: 64,
      particleCount: 10,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#0ea5e9',
      secondaryHex: '#bae6fd',
      glowRgba: 'rgba(14, 165, 233, 0.88)',
      motif: 'sparks',
      baseSize: 76,
      particleCount: 14,
    },
  },
  gaogamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#38bdf8',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(56, 189, 248, 0.9)',
      motif: 'sparks',
      baseSize: 112,
      particleCount: 12,
    },
    special2: {
      archetype: 'tornado',
      primaryHex: '#22d3ee',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(34, 211, 238, 0.92)',
      motif: 'sparks',
      baseSize: 118,
      particleCount: 16,
    },
  },
  machgaogamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#facc15',
      secondaryHex: '#38bdf8',
      glowRgba: 'rgba(56, 189, 248, 0.92)',
      motif: 'sparks',
      baseSize: 82,
      particleCount: 14,
    },
    special2: {
      archetype: 'beam',
      primaryHex: '#22d3ee',
      secondaryHex: '#f0f9ff',
      glowRgba: 'rgba(34, 211, 238, 0.94)',
      motif: 'sparks',
      baseSize: 96,
      particleCount: 16,
    },
  },
  miragegaogamon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#60a5fa',
      secondaryHex: '#e0f2fe',
      glowRgba: 'rgba(96, 165, 250, 0.95)',
      motif: 'stars',
      baseSize: 132,
      particleCount: 16,
    },
    special2: {
      archetype: 'projectile',
      primaryHex: '#38bdf8',
      secondaryHex: '#fde047',
      glowRgba: 'rgba(56, 189, 248, 0.96)',
      motif: 'stars',
      baseSize: 96,
      particleCount: 18,
    },
  },
  lalamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#4ade80',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(74, 222, 128, 0.85)',
      motif: 'leaves',
      baseSize: 70,
      particleCount: 12,
    },
    special2: {
      archetype: 'eruption',
      primaryHex: '#22c55e',
      secondaryHex: '#86efac',
      glowRgba: 'rgba(34, 197, 94, 0.88)',
      motif: 'leaves',
      baseSize: 102,
      particleCount: 14,
    },
  },
  sunflowmon: {
    special1: {
      archetype: 'beam',
      primaryHex: '#facc15',
      secondaryHex: '#fef08a',
      glowRgba: 'rgba(250, 204, 21, 0.9)',
      motif: 'stars',
      baseSize: 82,
      particleCount: 14,
    },
    special2: {
      archetype: 'slash',
      primaryHex: '#22c55e',
      secondaryHex: '#bef264',
      glowRgba: 'rgba(74, 222, 128, 0.9)',
      motif: 'leaves',
      baseSize: 112,
      particleCount: 14,
    },
  },
  lilamon: {
    special1: {
      archetype: 'projectile',
      primaryHex: '#e879f9',
      secondaryHex: '#fbcfe8',
      glowRgba: 'rgba(232, 121, 249, 0.92)',
      motif: 'petals',
      baseSize: 84,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#f472b6',
      secondaryHex: '#fdf2f8',
      glowRgba: 'rgba(244, 114, 182, 0.95)',
      motif: 'petals',
      baseSize: 132,
      particleCount: 18,
    },
  },
  rosemon: {
    special1: {
      archetype: 'slash',
      primaryHex: '#f43f5e',
      secondaryHex: '#fecdd3',
      glowRgba: 'rgba(244, 63, 94, 0.94)',
      motif: 'lightning',
      baseSize: 128,
      particleCount: 16,
    },
    special2: {
      archetype: 'burst',
      primaryHex: '#ec4899',
      secondaryHex: '#fb7185',
      glowRgba: 'rgba(236, 72, 153, 0.96)',
      motif: 'hearts',
      baseSize: 138,
      particleCount: 18,
    },
  },
};

function seededUnit(seed: number, idx: number, salt: number): number {
  const n = Math.sin(seed * 12.9898 + idx * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
}

function drawMiniHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.38);
  ctx.bezierCurveTo(
    -size * 0.9,
    -size * 0.25,
    -size * 0.45,
    -size * 0.9,
    0,
    -size * 0.3
  );
  ctx.bezierCurveTo(
    size * 0.45,
    -size * 0.9,
    size * 0.9,
    -size * 0.25,
    0,
    size * 0.38
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSkillParticles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spec: SkillVfxSpec,
  localP: number,
  spreadRadius: number,
  seed: number
): void {
  if (localP <= 0 || localP >= 1) return;
  const fade =
    localP < 0.18
      ? localP / 0.18
      : localP > 0.72
        ? Math.max(0, (1 - localP) / 0.28)
        : 1;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < spec.particleCount; i++) {
    const angle =
      (i / spec.particleCount) * Math.PI * 2 +
      (seededUnit(seed, i, 1) - 0.5) * 0.45;
    const speedMult = 0.58 + seededUnit(seed, i, 2) * 0.65;
    const dist = spreadRadius * (0.22 + localP * 0.95) * speedMult;
    const px = cx + Math.cos(angle) * dist;
    const liftY =
      spec.motif === 'embers' || spec.motif === 'petals' || spec.motif === 'hearts'
        ? -localP * 16 * seededUnit(seed, i, 3)
        : 0;
    const py = cy + Math.sin(angle) * dist * 0.82 + liftY;
    const pSize = (2.8 + seededUnit(seed, i, 4) * 3.8) * (1 - localP * 0.35);

    ctx.globalAlpha = fade * (0.6 + seededUnit(seed, i, 5) * 0.4);
    ctx.fillStyle = i % 2 === 0 ? spec.secondaryHex : spec.primaryHex;
    ctx.strokeStyle = spec.secondaryHex;

    if (spec.motif === 'stars') {
      drawFourPointStar(ctx, px, py, pSize * 1.45);
    } else if (spec.motif === 'hearts') {
      drawMiniHeart(ctx, px, py, pSize * 1.55);
    } else if (spec.motif === 'petals' || spec.motif === 'leaves') {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + localP * 2.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, pSize * 1.35, pSize * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (spec.motif === 'lightning') {
      ctx.lineWidth = 1.8;
      const lx = px + Math.cos(angle) * 8;
      const ly = py + Math.sin(angle) * 8;
      const midX = (px + lx) / 2 + (seededUnit(seed, i, 6) - 0.5) * 8;
      const midY = (py + ly) / 2 + (seededUnit(seed, i, 7) - 0.5) * 8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX, midY);
      ctx.lineTo(lx, ly);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, pSize * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRadialGlowHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  spec: SkillVfxSpec,
  alpha: number
): void {
  if (radius <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.28, spec.secondaryHex);
  grad.addColorStop(0.62, spec.glowRgba);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShockwaveRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  lineWidth: number,
  alpha: number
): void {
  if (rx <= 1 || ry <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the faithful individual Skill VFX sprite matching each skill icon,
 * enhanced with dynamic trajectory, additive blooms, shockwaves, and themed particles.
 */
export function drawDigimonSpecialVfx(
  ctx: CanvasRenderingContext2D,
  formId: DigimonFormId,
  attackKind: PartnerAttackKind,
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number,
  progress: number,
  seed = 1
): void {
  const bucket = digimonImageCache.get(formId);
  const profile = getDigimonFormProfile(formId);
  const p = Math.max(0, Math.min(1, progress));
  const facingRight = targetX >= attackerX;
  const alpha =
    p < 0.12 ? p / 0.12 : p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1;

  if (attackKind === 'basic') {
    const bp = Math.min(1, p * 1.35);
    const ix = targetX + (facingRight ? -4 : 4);
    const iy = targetY - 26;
    const hitScale =
      formId === 'shinegreymon' || formId === 'miragegaogamon' || formId === 'rosemon'
        ? 1.32
        : formId === 'rizegreymon' || formId === 'machgaogamon' || formId === 'lilamon'
          ? 1.18
          : formId === 'geogreymon' || formId === 'gaogamon' || formId === 'sunflowmon'
            ? 1.08
            : 0.95;

    ctx.save();
    ctx.translate(ix, iy);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.96));

    ctx.strokeStyle = profile.theme.accentHex;
    ctx.lineWidth = 2.4 * hitScale;
    ctx.beginPath();
    ctx.arc(0, 0, (10 + bp * 18) * hitScale, 0, Math.PI * 2);
    ctx.stroke();

    const dirSign = facingRight ? 1 : -1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.2 * hitScale;
    ctx.beginPath();
    ctx.moveTo(-14 * dirSign * hitScale, -12 * hitScale);
    ctx.lineTo(15 * dirSign * hitScale, 12 * hitScale);
    ctx.moveTo(-10 * dirSign * hitScale, 11 * hitScale);
    ctx.lineTo(12 * dirSign * hitScale, -11 * hitScale);
    ctx.stroke();

    ctx.strokeStyle = profile.theme.accentHex;
    ctx.lineWidth = 3.8 * hitScale;
    ctx.beginPath();
    ctx.arc(0, 0, (14 + bp * 10) * hitScale, -0.95, 1.15);
    ctx.stroke();

    const coreR = Math.max(1, 9 * (1 - bp * 0.65) * hitScale);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.55, profile.theme.glowRgba);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  const fxKey: DigimonAssetKey =
    attackKind === 'special2' ? 'atk2_fx' : 'atk1_fx';
  const fxImg = bucket?.get(fxKey);
  if (!fxImg || !fxImg.complete || fxImg.naturalWidth === 0) return;

  const spec =
    SKILL_VFX_SPECS[formId][
      attackKind === 'special2' ? 'special2' : 'special1'
    ];
  const fxRatio = fxImg.naturalWidth / Math.max(1, fxImg.naturalHeight);
  const castOriginY =
    attackerY - Math.round(profile.worldDimensions.heightPx * 0.45);
  const impactX = targetX;
  const impactY = targetY - 26;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Cast origin flash aura during wind-up
  if (p < 0.36) {
    const castP = p / 0.36;
    const castFade = Math.sin(castP * Math.PI);
    drawRadialGlowHalo(
      ctx,
      attackerX + (facingRight ? 12 : -12),
      castOriginY,
      26 + castP * 18,
      spec,
      castFade * 0.55
    );
    drawShockwaveRing(
      ctx,
      attackerX + (facingRight ? 12 : -12),
      castOriginY,
      10 + castP * 24,
      10 + castP * 24,
      spec.secondaryHex,
      2.2,
      castFade * 0.72
    );
  }

  if (spec.archetype === 'projectile') {
    const flightP = Math.min(1, p / 0.62);
    const easedFlight = 1 - Math.pow(1 - flightP, 2.1);
    const startX = attackerX + (facingRight ? 18 : -18);
    const startY = castOriginY;
    const curX = startX + (impactX - startX) * easedFlight;
    const curY = startY + (impactY - startY) * easedFlight;
    const dx = impactX - startX;
    const dy = impactY - startY;

    const drawH = spec.baseSize;
    const drawW = drawH * fxRatio;
    const scalePop =
      flightP < 1
        ? 0.82 + Math.sin(flightP * Math.PI) * 0.28
        : 1.0 + (p - 0.62) * 0.32;
    const projAlpha = p > 0.72 ? Math.max(0, (1 - p) / 0.28) : Math.min(1, p / 0.1);

    // Subtle glowing motion afterimage while traveling
    if (flightP > 0.08 && flightP < 0.98) {
      const ghostT = Math.max(0, easedFlight - 0.16);
      const gx = startX + dx * ghostT;
      const gy = startY + dy * ghostT;
      drawRadialGlowHalo(ctx, gx, gy, drawH * 0.52, spec, projAlpha * 0.35);
      ctx.save();
      ctx.globalAlpha = projAlpha * 0.32;
      ctx.translate(gx, gy);
      if (dx < 0) {
        ctx.scale(-1, 1);
        ctx.rotate(Math.atan2(dy, -dx));
      } else {
        ctx.rotate(Math.atan2(dy, dx));
      }
      ctx.scale(scalePop * 0.9, scalePop * 0.9);
      ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Traveling bloom + crisp projectile sprite (never upside down)
    drawRadialGlowHalo(ctx, curX, curY, drawH * 0.68, spec, projAlpha * 0.45);
    ctx.save();
    ctx.globalAlpha = projAlpha;
    ctx.translate(curX, curY);
    if (dx < 0) {
      ctx.scale(-1, 1);
      ctx.rotate(Math.atan2(dy, -dx));
    } else {
      ctx.rotate(Math.atan2(dy, dx));
    }
    ctx.scale(scalePop, scalePop);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Impact detonation flash + shockwave + particles
    if (p >= 0.44) {
      const impP = Math.min(1, (p - 0.44) / 0.56);
      const impFade = impP < 0.25 ? impP / 0.25 : Math.max(0, (1 - impP) / 0.75);
      drawRadialGlowHalo(ctx, impactX, impactY, 44 + impP * 28, spec, impFade * 0.72);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        16 + impP * 48,
        10 + impP * 28,
        spec.secondaryHex,
        2.8,
        impFade * 0.85
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 54, seed);
    }
  } else if (spec.archetype === 'beam') {
    const startX = attackerX + (facingRight ? 20 : -20);
    const startY = castOriginY;
    const dx = impactX - startX;
    const dy = impactY - startY;
    const dist = Math.max(48, Math.hypot(dx, dy));
    const extendP = Math.min(1, p / 0.24);
    const pulse = 1 + Math.sin(p * Math.PI * 5) * 0.06;

    const beamDrawH = spec.baseSize * pulse;
    const naturalW = beamDrawH * fxRatio;
    const bridgeW = Math.max(naturalW, Math.min(260, dist + 34)) * extendP;
    const anchorX = startX + dx * 0.48 * extendP;
    const anchorY = startY + dy * 0.48 * extendP;

    drawRadialGlowHalo(
      ctx,
      startX,
      startY,
      38,
      spec,
      alpha * 0.55
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(anchorX, anchorY);
    if (dx < 0) {
      ctx.scale(-1, 1);
      ctx.rotate(Math.atan2(dy, -dx));
    } else {
      ctx.rotate(Math.atan2(dy, dx));
    }
    // Soft bloom pass under sharp sprite pass
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.42;
    ctx.drawImage(
      fxImg,
      -bridgeW / 2,
      -(beamDrawH * 1.18) / 2,
      bridgeW,
      beamDrawH * 1.18
    );
    ctx.restore();
    ctx.drawImage(fxImg, -bridgeW / 2, -beamDrawH / 2, bridgeW, beamDrawH);
    ctx.restore();

    if (p >= 0.2) {
      const impP = Math.min(1, (p - 0.2) / 0.8);
      drawRadialGlowHalo(ctx, impactX, impactY, 46 + impP * 22, spec, alpha * 0.65);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        14 + impP * 44,
        14 + impP * 44,
        spec.secondaryHex,
        2.5,
        alpha * 0.78
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 52, seed);
    }
  } else if (spec.archetype === 'hammer') {
    const dropP = Math.min(1, p / 0.34);
    const slamEase = Math.pow(dropP, 2.2);
    const dropOffsetY = (1 - slamEase) * -86;
    const rebound =
      p >= 0.34 && p < 0.52
        ? -Math.sin(((p - 0.34) / 0.18) * Math.PI) * 10
        : 0;

    const drawH = spec.baseSize;
    const drawW = drawH * fxRatio;
    const tilt =
      p < 0.34 ? -0.35 + dropP * 0.42 : 0.07;

    drawRadialGlowHalo(
      ctx,
      impactX,
      impactY + dropOffsetY,
      drawH * 0.56,
      spec,
      alpha * 0.48
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY + dropOffsetY + rebound);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate(tilt);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (p >= 0.3) {
      const impP = Math.min(1, (p - 0.3) / 0.7);
      const impFade = impP < 0.2 ? impP / 0.2 : Math.max(0, (1 - impP) / 0.8);
      drawRadialGlowHalo(ctx, impactX, targetY - 6, 56 + impP * 34, spec, impFade * 0.75);
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        18 + impP * 74,
        7 + impP * 24,
        spec.secondaryHex,
        3.2,
        impFade * 0.92
      );
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        10 + impP * 48,
        4 + impP * 16,
        spec.primaryHex,
        2.0,
        impFade * 0.75
      );
      drawSkillParticles(ctx, impactX, impactY + 4, spec, impP, 68, seed);
    }
  } else if (spec.archetype === 'tornado') {
    const spinP = Math.sin(p * Math.PI * 4);
    const pop = 0.76 + Math.sin(p * Math.PI) * 0.34;
    const drawH = spec.baseSize * pop;
    const drawW = drawH * fxRatio;
    const swayX = spinP * 5;

    drawRadialGlowHalo(ctx, impactX + swayX, impactY - 6, drawH * 0.58, spec, alpha * 0.46);

    // Ground wind vortex rings
    for (let rIdx = 0; rIdx < 2; rIdx++) {
      const rp = (p * 1.8 + rIdx * 0.5) % 1;
      drawShockwaveRing(
        ctx,
        impactX,
        targetY - 4,
        14 + rp * 44,
        5 + rp * 14,
        rIdx === 0 ? spec.secondaryHex : spec.primaryHex,
        2.2,
        alpha * (1 - rp) * 0.85
      );
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX + swayX, impactY - 6);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.scale(1 + Math.sin(p * Math.PI * 6) * 0.06, 1);
    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    drawSkillParticles(ctx, impactX, impactY - 8, spec, p, 56, seed);
  } else if (spec.archetype === 'eruption') {
    const eruptEase = 1 - Math.pow(1 - Math.min(1, p * 2.3), 2.2);
    const targetW = spec.baseSize;
    const targetH = targetW / Math.max(0.5, fxRatio);

    drawShockwaveRing(
      ctx,
      targetX,
      targetY + 2,
      14 + p * 54,
      5 + p * 18,
      spec.secondaryHex,
      2.6,
      alpha * 0.82
    );
    drawRadialGlowHalo(ctx, targetX, targetY - 18, 48 * eruptEase, spec, alpha * 0.45);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(targetX, targetY + 6);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.drawImage(
      fxImg,
      -targetW / 2,
      -targetH * eruptEase,
      targetW,
      targetH * eruptEase
    );
    ctx.restore();

    drawSkillParticles(ctx, targetX, targetY - 26, spec, p, 52, seed);
  } else if (spec.archetype === 'slash') {
    const slashP = Math.min(1, p / 0.45);
    const sweepRot = -0.34 + (1 - Math.pow(1 - slashP, 2)) * 0.44;
    const pop = 0.78 + Math.sin(p * Math.PI) * 0.34;
    const drawH = spec.baseSize * pop;
    const drawW = drawH * fxRatio;

    drawRadialGlowHalo(ctx, impactX, impactY, drawH * 0.56, spec, alpha * 0.52);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate(sweepRot);

    // Subtle additive rim behind crisp slash artwork
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.36;
    ctx.drawImage(
      fxImg,
      -(drawW * 1.1) / 2,
      -(drawH * 1.1) / 2,
      drawW * 1.1,
      drawH * 1.1
    );
    ctx.restore();

    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (p >= 0.14) {
      const impP = Math.min(1, (p - 0.14) / 0.86);
      drawShockwaveRing(
        ctx,
        impactX,
        impactY,
        12 + impP * 54,
        12 + impP * 54,
        spec.secondaryHex,
        2.4,
        alpha * 0.78
      );
      drawSkillParticles(ctx, impactX, impactY, spec, impP, 60, seed);
    }
  } else {
    // 'burst' — radial nova / floral bloom / heart surge / magma explosion
    const popEase = 1 - Math.pow(1 - Math.min(1, p * 2.1), 2.3);
    const pulse = popEase * (0.94 + Math.sin(p * Math.PI * 3) * 0.08);
    const drawH = spec.baseSize * pulse;
    const drawW = drawH * fxRatio;

    drawRadialGlowHalo(ctx, impactX, impactY, drawH * 0.68, spec, alpha * 0.58);
    drawShockwaveRing(
      ctx,
      impactX,
      impactY,
      14 + p * 68,
      14 + p * 68,
      spec.secondaryHex,
      2.8,
      alpha * 0.86
    );
    drawShockwaveRing(
      ctx,
      impactX,
      impactY,
      8 + p * 44,
      8 + p * 44,
      spec.primaryHex,
      2.0,
      alpha * 0.72
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(impactX, impactY);
    if (!facingRight) ctx.scale(-1, 1);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.42;
    ctx.drawImage(
      fxImg,
      -(drawW * 1.12) / 2,
      -(drawH * 1.12) / 2,
      drawW * 1.12,
      drawH * 1.12
    );
    ctx.restore();

    ctx.drawImage(fxImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    drawSkillParticles(ctx, impactX, impactY, spec, p, 68, seed);
  }

  ctx.restore();
}

