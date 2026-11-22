import {
  getOrBakeDataForestAtlas,
  isDataForestSpriteSpecies,
  type DataForestSpriteSpeciesId,
} from './dataForestSprites';

export type UploadedWildSpriteSpeciesId =
  | 'goblimon'
  | 'tsunomon'
  | 'gizamon'
  | 'koromon'
  | 'demidevimon'
  | 'palmon'
  | 'kunemon'
  | 'mushroomon'
  | 'woodmon'
  | 'kiwimon'
  | 'kuwagamon';

export type WildSpriteSpeciesId =
  | UploadedWildSpriteSpeciesId
  | DataForestSpriteSpeciesId;

type BackdropChromaMode = 'sky-blue' | 'magenta' | 'rgba';

interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface WildSpeciesSheetSpec {
  url: string;
  /** Backdrop color style of the source spritesheet. */
  backdropMode: BackdropChromaMode;
  /** True when the idle/attack sprite natively faces right (+X); false when it faces left (-X). */
  nativeFacingRight: boolean;
  /** Desired rendered height in world pixels (before 2.5D perspective depth scale). */
  worldHeightPx: number;
  /** Idle/patrol frame rate (frames per second). */
  idleFps: number;
  /** Ground shadow ellipse horizontal radius (px). */
  shadowRx: number;
  /** Optional flying height above ground shadow (px) for airborne species. */
  hoverOffsetPx?: number;
  /** True for towering Raid Boss Digimon with special floor seal & aura VFX. */
  isBoss?: boolean;
  /** Exact source pixel bounds measured directly from each horizontal 5-frame strip. */
  frames: {
    idle: readonly [SpriteRect, SpriteRect, SpriteRect];
    attack: SpriteRect;
    hit: SpriteRect;
  };
}

function makeHorizontalStripFrames(cellSize: number): WildSpeciesSheetSpec['frames'] {
  return {
    idle: [
      { x: 0, y: 0, w: cellSize, h: cellSize },
      { x: cellSize, y: 0, w: cellSize, h: cellSize },
      { x: cellSize * 2, y: 0, w: cellSize, h: cellSize },
    ],
    attack: { x: cellSize * 3, y: 0, w: cellSize, h: cellSize },
    hit: { x: cellSize * 4, y: 0, w: cellSize, h: cellSize },
  };
}

const STRIP_256_FRAMES = makeHorizontalStripFrames(256);
const STRIP_320_FRAMES = makeHorizontalStripFrames(320);

const WILD_SPECIES_SPECS: Record<UploadedWildSpriteSpeciesId, WildSpeciesSheetSpec> = {
  koromon: {
    url: '/assets/sprites/mobs/koromon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 46,
    idleFps: 5.0,
    shadowRx: 19,
    frames: STRIP_256_FRAMES,
  },
  tsunomon: {
    url: '/assets/sprites/mobs/tsunomon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 50,
    idleFps: 4.8,
    shadowRx: 18,
    frames: STRIP_256_FRAMES,
  },
  gizamon: {
    url: '/assets/sprites/mobs/gizamon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 64,
    idleFps: 4.4,
    shadowRx: 25,
    frames: STRIP_256_FRAMES,
  },
  goblimon: {
    url: '/assets/sprites/mobs/goblimon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 78,
    idleFps: 4.2,
    shadowRx: 25,
    frames: STRIP_256_FRAMES,
  },
  demidevimon: {
    url: '/assets/sprites/mobs/demidevimon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 66,
    idleFps: 5.6,
    shadowRx: 20,
    hoverOffsetPx: 14,
    frames: STRIP_256_FRAMES,
  },
  palmon: {
    url: '/assets/sprites/mobs/palmon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 72,
    idleFps: 4.4,
    shadowRx: 23,
    frames: STRIP_256_FRAMES,
  },
  kunemon: {
    url: '/assets/sprites/mobs/kunemon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 64,
    idleFps: 4.6,
    shadowRx: 24,
    frames: STRIP_256_FRAMES,
  },
  mushroomon: {
    url: '/assets/sprites/mobs/mushroomon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 70,
    idleFps: 4.5,
    shadowRx: 23,
    frames: STRIP_256_FRAMES,
  },
  woodmon: {
    url: '/assets/sprites/mobs/woodmon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 92,
    idleFps: 3.9,
    shadowRx: 29,
    frames: STRIP_256_FRAMES,
  },
  kiwimon: {
    url: '/assets/sprites/mobs/kiwimon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 82,
    idleFps: 4.5,
    shadowRx: 26,
    frames: STRIP_256_FRAMES,
  },
  kuwagamon: {
    url: '/assets/sprites/mobs/kuwagamon.png?v=dmo1',
    backdropMode: 'rgba',
    nativeFacingRight: false,
    worldHeightPx: 204,
    idleFps: 6.2,
    shadowRx: 68,
    hoverOffsetPx: 18,
    isBoss: true,
    frames: STRIP_320_FRAMES,
  },
};

const WILD_SPECIES_IDS: readonly UploadedWildSpriteSpeciesId[] = [
  'goblimon',
  'tsunomon',
  'gizamon',
  'koromon',
  'demidevimon',
  'palmon',
  'kunemon',
  'mushroomon',
  'woodmon',
  'kiwimon',
  'kuwagamon',
] as const;

interface BakedSpriteFrame {
  canvas: HTMLCanvasElement;
  flashCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}

interface BakedSpeciesAtlas {
  spec: WildSpeciesSheetSpec;
  idle: [BakedSpriteFrame, BakedSpriteFrame, BakedSpriteFrame];
  attack: BakedSpriteFrame;
  hit: BakedSpriteFrame;
  portraitDataUrl: string;
}

const bakedAtlasCache = new Map<UploadedWildSpriteSpeciesId, BakedSpeciesAtlas>();
const pendingLoadPromises = new Map<UploadedWildSpriteSpeciesId, Promise<void>>();

function isUploadedWildSpriteSpecies(
  species: string
): species is UploadedWildSpriteSpeciesId {
  return species in WILD_SPECIES_SPECS;
}

export function isWildSpriteSpecies(species: string): species is WildSpriteSpeciesId {
  return isUploadedWildSpriteSpecies(species) || isDataForestSpriteSpecies(species);
}

/**
 * Extracts a single sprite rectangle from an uploaded sheet, strips its chroma-key
 * backdrop (or keeps native RGBA alpha), trims transparent margins, and pre-bakes
 * a crisp white hit-flash silhouette canvas.
 */
function bakeTransparentFrame(
  img: HTMLImageElement,
  rect: SpriteRect,
  backdropMode: BackdropChromaMode,
  bgR: number,
  bgG: number,
  bgB: number
): BakedSpriteFrame {
  const work = document.createElement('canvas');
  work.width = rect.w;
  work.height = rect.h;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  if (!wctx) {
    return { canvas: work, flashCanvas: work, width: rect.w, height: rect.h };
  }

  wctx.imageSmoothingEnabled = true;
  wctx.imageSmoothingQuality = 'high';
  wctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);

  const imgData = wctx.getImageData(0, 0, rect.w, rect.h);
  const data = imgData.data;
  const totalPx = rect.w * rect.h;
  const isTransparent = new Uint8Array(totalPx);

  if (backdropMode === 'rgba') {
    for (let i = 0; i < totalPx; i++) {
      if (data[i * 4 + 3] <= 20) {
        data[i * 4 + 3] = 0;
        isTransparent[i] = 1;
      }
    }
  } else if (backdropMode === 'magenta') {
    // Lossless PNG with exact #FF00FF magenta cells & lime-green (116,236,96) grid lines
    for (let i = 0; i < totalPx; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isMagenta = r >= 232 && g <= 28 && b >= 232;
      const isGridLime = g >= 218 && r >= 98 && r <= 138 && b >= 78 && b <= 118;
      if (isMagenta || isGridLime) {
        data[idx + 3] = 0;
        isTransparent[i] = 1;
      }
    }
  } else {
    // Pass 1: Remove exact & near-exact sky-blue backdrop pixels (outer + enclosed limb pockets).
    for (let i = 0; i < totalPx; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      const isSkyBackdrop =
        dist <= 48 ||
        (b >= 198 && g >= 162 && b - r >= 70 && g - r >= 32 && r <= 178);
      if (isSkyBackdrop) {
        data[idx + 3] = 0;
        isTransparent[i] = 1;
      }
    }

    // Pass 2: 1-pixel anti-halo cleanup ONLY on opaque pixels touching transparent background,
    // eliminating lossy WebP light-blue fringe while keeping black pixel outlines razor-sharp.
    const rw = rect.w;
    const rh = rect.h;
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        const p = y * rw + x;
        if (isTransparent[p]) continue;
        const touchesBg =
          (x > 0 && isTransparent[p - 1]) ||
          (x + 1 < rw && isTransparent[p + 1]) ||
          (y > 0 && isTransparent[p - rw]) ||
          (y + 1 < rh && isTransparent[p + rw]);
        if (!touchesBg) continue;

        const idx = p * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (b >= 158 && b - r >= 40 && g - r >= 16 && r <= 175) {
          data[idx + 3] = 0;
          continue;
        }
        if (b >= 112 && b - r >= 24 && g - r >= 8 && r <= 145) {
          data[idx] = Math.round(r * 0.6);
          data[idx + 1] = Math.round(g * 0.52);
          data[idx + 2] = Math.round(b * 0.42);
        }
      }
    }
  }

  wctx.putImageData(imgData, 0, 0);

  // Trim empty outer pixels so foot-anchoring sits strictly on the sprite's feet/base
  const rw = rect.w;
  const rh = rect.h;
  let minX = rw;
  let minY = rh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      if (data[(y * rw + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const trimW = maxX >= minX ? maxX - minX + 1 : rw;
  const trimH = maxY >= minY ? maxY - minY + 1 : rh;
  const sx = maxX >= minX ? minX : 0;
  const sy = maxY >= minY ? minY : 0;

  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  const tctx = trimmed.getContext('2d');
  if (tctx) {
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(work, sx, sy, trimW, trimH, 0, 0, trimW, trimH);
  }

  // Pre-bake clean white silhouette hit-flash canvas
  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = trimW;
  flashCanvas.height = trimH;
  const fctx = flashCanvas.getContext('2d');
  if (fctx) {
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = 'high';
    fctx.drawImage(trimmed, 0, 0);
    fctx.globalCompositeOperation = 'source-atop';
    fctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    fctx.fillRect(0, 0, trimW, trimH);
  }

  return {
    canvas: trimmed,
    flashCanvas,
    width: trimW,
    height: trimH,
  };
}

function loadSingleWildSpecies(species: UploadedWildSpriteSpeciesId): Promise<void> {
  if (bakedAtlasCache.has(species)) return Promise.resolve();
  const existing = pendingLoadPromises.get(species);
  if (existing) return existing;

  const spec = WILD_SPECIES_SPECS[species];
  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        let bgR = spec.backdropMode === 'magenta' ? 255 : 124;
        let bgG = spec.backdropMode === 'magenta' ? 0 : 198;
        let bgB = spec.backdropMode === 'magenta' ? 255 : 254;

        if (spec.backdropMode === 'sky-blue') {
          const probe = document.createElement('canvas');
          probe.width = Math.min(8, img.naturalWidth);
          probe.height = Math.min(8, img.naturalHeight);
          const pctx = probe.getContext('2d', { willReadFrequently: true });
          if (pctx) {
            pctx.drawImage(img, 0, 0, probe.width, probe.height, 0, 0, probe.width, probe.height);
            const p = pctx.getImageData(0, 0, 1, 1).data;
            if (p[2] > 190 && p[2] - p[0] > 60) {
              bgR = p[0];
              bgG = p[1];
              bgB = p[2];
            }
          }
        }

        const idle0 = bakeTransparentFrame(img, spec.frames.idle[0], spec.backdropMode, bgR, bgG, bgB);
        const idle1 = bakeTransparentFrame(img, spec.frames.idle[1], spec.backdropMode, bgR, bgG, bgB);
        const idle2 = bakeTransparentFrame(img, spec.frames.idle[2], spec.backdropMode, bgR, bgG, bgB);
        const attack = bakeTransparentFrame(img, spec.frames.attack, spec.backdropMode, bgR, bgG, bgB);
        const hit = bakeTransparentFrame(img, spec.frames.hit, spec.backdropMode, bgR, bgG, bgB);

        const portraitDataUrl = idle0.canvas.toDataURL('image/png');
        bakedAtlasCache.set(species, {
          spec,
          idle: [idle0, idle1, idle2],
          attack,
          hit,
          portraitDataUrl,
        });
      } catch (err) {
        console.warn(`[WildDigimonSprites] Failed to process ${species}:`, err);
      }
      resolve();
    };
    img.onerror = () => {
      pendingLoadPromises.delete(species);
      resolve();
    };
    img.src = spec.url;
  });

  pendingLoadPromises.set(species, promise);
  return promise;
}

/**
 * Preloads & extracts all 11 uploaded wild Digimon spritesheets (Planície Digital + Floresta de Dados + Raid Boss Kuwagamon).
 */
export function preloadWildDigimonSprites(): Promise<void> {
  return Promise.all(WILD_SPECIES_IDS.map((sp) => loadSingleWildSpecies(sp))).then(
    () => undefined
  );
}

/**
 * Returns the crisp transparent portrait data URL for the Target Enemy HUD bar & World Map.
 */
export function getWildDigimonPortraitUrl(species: string): string | null {
  if (isUploadedWildSpriteSpecies(species)) {
    const cached = bakedAtlasCache.get(species);
    if (cached) return cached.portraitDataUrl;
    void loadSingleWildSpecies(species);
  }
  if (isDataForestSpriteSpecies(species)) {
    return getOrBakeDataForestAtlas(species).portraitDataUrl;
  }
  return null;
}

export interface DrawWildSpriteOptions {
  elapsed: number;
  phaseOffset: number;
  facingRight: boolean;
  isAttacking: boolean;
  attackProgress: number;
  isHitFlash: boolean;
  perspectiveScale: number;
  isTargeted: boolean;
}

export interface DrawWildSpriteResult {
  drawn: boolean;
  /** Unscaled height from ground anchor (0,0) to the top of the sprite, for HP bar positioning. */
  topOffsetPx: number;
}

const IDLE_PING_PONG = [0, 1, 2, 1] as const;

function drawBossFloorSealAndAura(
  ctx: CanvasRenderingContext2D,
  safeElapsed: number,
  shadowRx: number,
  shadowRy: number,
  pScale: number
): void {
  const bossPulse = 1 + Math.sin(safeElapsed * 4.2) * 0.06;
  const auraRx = Math.max(10, (shadowRx + 36) * bossPulse);
  const auraRy = Math.max(6, (shadowRy + 16) * bossPulse);

  // Outer radial crimson Raid Boss floor field
  ctx.save();
  ctx.scale(1, auraRy / auraRx);
  const floorGrad = ctx.createRadialGradient(0, 3, auraRx * 0.15, 0, 3, auraRx);
  floorGrad.addColorStop(0, 'rgba(239, 68, 68, 0.34)');
  floorGrad.addColorStop(0.65, 'rgba(220, 38, 38, 0.14)');
  floorGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.arc(0, 3, auraRx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Primary crimson Boss ring
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.82)';
  ctx.lineWidth = 3 * pScale;
  ctx.beginPath();
  ctx.ellipse(
    0,
    3,
    Math.max(1, (shadowRx + 16) * bossPulse),
    Math.max(1, (shadowRy + 7) * bossPulse),
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  // Rotating golden Raid rune dashed outer seal
  ctx.save();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = 2 * pScale;
  ctx.setLineDash([11, 7]);
  ctx.lineDashOffset = -safeElapsed * 26;
  ctx.beginPath();
  ctx.ellipse(
    0,
    3,
    Math.max(1, (shadowRx + 28) * bossPulse),
    Math.max(1, (shadowRy + 12) * bossPulse),
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

function drawBossAttackSlashVfx(
  ctx: CanvasRenderingContext2D,
  attackProgress: number,
  facingRight: boolean,
  pScale: number
): void {
  const clamped = Math.max(0, Math.min(1, attackProgress));
  if (clamped < 0.2 || clamped > 0.94) return;
  const slashAlpha = Math.sin(((clamped - 0.2) / 0.74) * Math.PI);
  const dir = facingRight ? 1 : -1;

  ctx.save();
  ctx.translate(dir * 72 * pScale, -92 * pScale);
  ctx.globalAlpha = Math.max(0, Math.min(1, slashAlpha));
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 14;

  // Dual glowing Scissor Claw X-slash arcs
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 5 * pScale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-28 * pScale, -36 * pScale);
  ctx.quadraticCurveTo(dir * 16 * pScale, 0, 32 * pScale, 34 * pScale);
  ctx.moveTo(30 * pScale, -36 * pScale);
  ctx.quadraticCurveTo(dir * 12 * pScale, 0, -28 * pScale, 34 * pScale);
  ctx.stroke();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.2 * pScale;
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders an animated wild Digimon directly from the user's uploaded spritesheet
 * with crisp pixel-art fidelity, directional flip, idle breathing/patrol bounce,
 * counterattack lunge pose, and damage recoil pose + flash.
 */
export function drawWildDigimonSprite(
  ctx: CanvasRenderingContext2D,
  species: string,
  opts: DrawWildSpriteOptions
): DrawWildSpriteResult {
  const safeElapsed = Number.isFinite(opts.elapsed) ? Math.max(0, opts.elapsed) : 0;
  const pScale = opts.perspectiveScale;

  if (isUploadedWildSpriteSpecies(species)) {
    const atlas = bakedAtlasCache.get(species);
    if (atlas) {
      const { spec } = atlas;
      let frame: BakedSpriteFrame;
      let lungeX = 0;
      let hopY = 0;
      let tilt = 0;

      if (opts.isHitFlash) {
        frame = atlas.hit;
        const recoilDir = opts.facingRight ? -1 : 1;
        lungeX = recoilDir * (spec.isBoss ? 8 : 5.5);
        hopY = -3.5;
        tilt = recoilDir * (spec.isBoss ? 0.05 : 0.07);
      } else if (opts.isAttacking) {
        frame = atlas.attack;
        const curve = Math.sin(Math.max(0, Math.min(1, opts.attackProgress)) * Math.PI);
        const atkDir = opts.facingRight ? 1 : -1;
        lungeX = atkDir * curve * (spec.isBoss ? 24 : 13);
        hopY = -curve * (spec.isBoss ? 10 : 6);
        tilt = atkDir * curve * (spec.isBoss ? 0.07 : 0.085);
      } else {
        const seqIdx = Math.floor(
          (safeElapsed * spec.idleFps + opts.phaseOffset * 2.1) % IDLE_PING_PONG.length
        );
        const frameIdx = IDLE_PING_PONG[Math.max(0, seqIdx)] ?? 0;
        frame = atlas.idle[frameIdx];

        if (spec.hoverOffsetPx) {
          hopY = -(spec.hoverOffsetPx + Math.sin(safeElapsed * 4.5 + opts.phaseOffset) * 5.4);
        } else {
          const bounceAmp = species === 'tsunomon' || species === 'koromon' ? 3.2 : 1.9;
          hopY = -Math.abs(Math.sin(safeElapsed * 3.8 + opts.phaseOffset)) * bounceAmp;
        }
      }

      if (spec.hoverOffsetPx && (opts.isHitFlash || opts.isAttacking)) {
        hopY -= spec.hoverOffsetPx * 0.85;
      }

      // Normalize height against idle[0] so attack/hit frames scale consistently without popping
      const baseUnitScale = spec.worldHeightPx / Math.max(1, atlas.idle[0].height);
      const drawW = frame.width * baseUnitScale * pScale;
      const drawH = frame.height * baseUnitScale * pScale;

      const altitudeFactor = spec.hoverOffsetPx
        ? Math.max(0.76, 1 - Math.abs(hopY) * 0.008)
        : 1;
      const shadowRx = Math.max(4, spec.shadowRx * pScale * altitudeFactor);
      const shadowRy = Math.max(4, shadowRx * 0.34);

      if (spec.isBoss) {
        drawBossFloorSealAndAura(ctx, safeElapsed, shadowRx, shadowRy, pScale);
      }

      if (opts.isTargeted) {
        const pulse = 1 + Math.sin(safeElapsed * 7) * 0.07;
        ctx.strokeStyle = spec.isBoss ? '#fde047' : '#f43f5e';
        ctx.lineWidth = spec.isBoss ? 3.4 : 2.5;
        ctx.beginPath();
        ctx.ellipse(
          0,
          2,
          Math.max(1, (shadowRx + (spec.isBoss ? 22 : 6)) * pulse),
          Math.max(1, (shadowRy + (spec.isBoss ? 9 : 3)) * pulse),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.fillStyle = spec.hoverOffsetPx ? 'rgba(0, 0, 0, 0.34)' : 'rgba(0, 0, 0, 0.40)';
      ctx.beginPath();
      ctx.ellipse(0, 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);
      ctx.fill();

      const shouldFlipX = opts.facingRight !== spec.nativeFacingRight;

      ctx.save();
      ctx.translate(lungeX * pScale, hopY * pScale);
      if (tilt !== 0) {
        ctx.rotate(tilt);
      }
      if (spec.isBoss) {
        // Subtle fiery scarlet aura around Boss Kuwagamon so he pops over forest terrain
        ctx.shadowColor = opts.isHitFlash
          ? 'rgba(255, 255, 255, 0.9)'
          : 'rgba(239, 68, 68, 0.78)';
        ctx.shadowBlur = opts.isHitFlash ? 18 : 14;
      }
      if (shouldFlipX) {
        ctx.scale(-1, 1);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sourceCanvas = opts.isHitFlash ? frame.flashCanvas : frame.canvas;
      ctx.drawImage(sourceCanvas, -drawW / 2, -drawH + 4 * pScale, drawW, drawH);
      ctx.restore();

      // Orbiting scarlet-gold Boss embers + Scissor Claw slash arc
      if (spec.isBoss) {
        for (let i = 0; i < 4; i++) {
          const phase = (safeElapsed * 0.75 + i * 0.25) % 1;
          const angle = safeElapsed * 2.2 + (i * Math.PI) / 2;
          const ex = Math.cos(angle) * 72 * pScale;
          const ey = -45 * pScale - phase * 125 * pScale;
          const eAlpha = Math.sin(phase * Math.PI) * 0.72;
          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(252, 165, 165, ${eAlpha.toFixed(3)})`
              : `rgba(253, 224, 71, ${eAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.8 * pScale, 0, Math.PI * 2);
          ctx.fill();
        }
        if (opts.isAttacking) {
          drawBossAttackSlashVfx(ctx, opts.attackProgress, opts.facingRight, pScale);
        }
      }

      return {
        drawn: true,
        topOffsetPx:
          (spec.worldHeightPx + (spec.hoverOffsetPx ?? 0)) * pScale + (spec.isBoss ? 14 : 8),
      };
    }

    void loadSingleWildSpecies(species);
  }

  // Instant zero-latency procedural fallback ONLY during the ~20ms initial decode window
  if (isDataForestSpriteSpecies(species)) {
    const atlas = getOrBakeDataForestAtlas(species);
    let frame = atlas.idle[0];
    let lungeX = 0;
    let hopY = 0;
    let tilt = 0;

    if (opts.isHitFlash) {
      frame = atlas.hit;
      const recoilDir = opts.facingRight ? -1 : 1;
      lungeX = recoilDir * (atlas.isBoss ? 6 : 4.5);
      hopY = -3;
      tilt = recoilDir * 0.05;
    } else if (opts.isAttacking) {
      frame = atlas.attack;
      const curve = Math.sin(Math.max(0, Math.min(1, opts.attackProgress)) * Math.PI);
      const atkDir = opts.facingRight ? 1 : -1;
      lungeX = atkDir * curve * (atlas.isBoss ? 15 : 10);
      hopY = -curve * (atlas.isBoss ? 7 : 5);
      tilt = atkDir * curve * 0.06;
    } else {
      const seqIdx = Math.floor(
        (safeElapsed * atlas.idleFps + opts.phaseOffset * 2.1) % IDLE_PING_PONG.length
      );
      frame = atlas.idle[IDLE_PING_PONG[Math.max(0, seqIdx)] ?? 0];
      if (atlas.hoverOffsetPx) {
        hopY = -(atlas.hoverOffsetPx + Math.sin(safeElapsed * 4.4 + opts.phaseOffset) * 5.2);
      } else {
        hopY = -Math.abs(Math.sin(safeElapsed * 3.6 + opts.phaseOffset)) * 1.8;
      }
    }

    if (atlas.hoverOffsetPx && (opts.isHitFlash || opts.isAttacking)) {
      hopY -= atlas.hoverOffsetPx * 0.85;
    }

    const baseUnitScale = atlas.worldHeightPx / Math.max(1, atlas.idle[0].height);
    const drawW = frame.width * baseUnitScale * pScale;
    const drawH = frame.height * baseUnitScale * pScale;
    const altitudeFactor = atlas.hoverOffsetPx
      ? Math.max(0.76, 1 - Math.abs(hopY) * 0.008)
      : 1;
    const shadowRx = Math.max(4, atlas.shadowRx * pScale * altitudeFactor);
    const shadowRy = Math.max(4, shadowRx * 0.34);

    if (atlas.isBoss) {
      drawBossFloorSealAndAura(ctx, safeElapsed, shadowRx, shadowRy, pScale);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();

    const shouldFlipX = !opts.facingRight && !atlas.isBoss;
    ctx.save();
    ctx.translate(lungeX * pScale, hopY * pScale);
    if (tilt !== 0) ctx.rotate(tilt);
    if (shouldFlipX) ctx.scale(-1, 1);
    const sourceCanvas = opts.isHitFlash ? frame.flashCanvas : frame.canvas;
    ctx.drawImage(sourceCanvas, -drawW / 2, -drawH + 5 * pScale, drawW, drawH);
    ctx.restore();

    return {
      drawn: true,
      topOffsetPx: (atlas.worldHeightPx + (atlas.hoverOffsetPx ?? 0)) * pScale + (atlas.isBoss ? 12 : 8),
    };
  }

  return { drawn: false, topOffsetPx: 48 };
}
