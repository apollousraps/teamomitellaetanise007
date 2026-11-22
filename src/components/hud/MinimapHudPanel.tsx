import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Minus, Plus, Search } from 'lucide-react';
import {
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_IMAGE_URL,
  DATA_FOREST_INTERACTION_POINTS,
  DATA_FOREST_MAP_ID,
  DATA_FOREST_RETURN_PORTAL,
  DATA_FOREST_SAFE_ZONE,
  DATA_FOREST_WORLD_H,
  DATA_FOREST_WORLD_W,
  getDataForestZoneAtPoint,
} from '../../maps/dataForestMap';
import {
  DATS_COLLIDERS,
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
  DATS_PLAZA_CENTER,
  DATS_WORLD_H,
  DATS_WORLD_W,
} from '../../maps/datsCenterMap';
import {
  FRIENDLY_FIELD_NPCS,
  getHuntingZoneAtPoint,
  HUNTING_INTERACTION_POINTS,
  HUNTING_MAP_BANNER_URL,
  HUNTING_MAP_ID,
  HUNTING_RETURN_PORTAL,
  HUNTING_SAFE_ZONE,
  HUNTING_WORLD_H,
  HUNTING_WORLD_W,
} from '../../maps/huntingFieldMap';
import type { LiveWorldHudSnapshot } from '../../types/hud';

interface MinimapHudPanelProps {
  snapshot: LiveWorldHudSnapshot;
  onOpenFullMap: () => void;
}

export function MinimapHudPanel({
  snapshot,
  onOpenFullMap,
}: MinimapHudPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const huntingBgImgRef = useRef<HTMLImageElement | null>(null);
  const forestBgImgRef = useRef<HTMLImageElement | null>(null);
  const [huntingImgLoaded, setHuntingImgLoaded] = useState(false);
  const [forestImgLoaded, setForestImgLoaded] = useState(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [minimized, setMinimized] = useState(false);

  const isHunting = snapshot.mapId === HUNTING_MAP_ID;
  const isDataForest = snapshot.mapId === DATA_FOREST_MAP_ID;
  const isCombatMap = isHunting || isDataForest;
  const regionLabel = isDataForest
    ? 'Floresta de Dados'
    : isHunting
      ? 'Planície Digital'
      : 'DATS Center';
  const activeSubZone = isDataForest
    ? getDataForestZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
    : isHunting
      ? getHuntingZoneAtPoint(snapshot.tamerX, snapshot.tamerY)
      : null;

  useEffect(() => {
    const img = new Image();
    img.src = HUNTING_MAP_BANNER_URL;
    img.onload = () => {
      huntingBgImgRef.current = img;
      setHuntingImgLoaded(true);
    };
    const fImg = new Image();
    fImg.src = DATA_FOREST_IMAGE_URL;
    fImg.onload = () => {
      forestBgImgRef.current = fImg;
      setForestImgLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (minimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const worldW = isDataForest
      ? DATA_FOREST_WORLD_W
      : isHunting
        ? HUNTING_WORLD_W
        : DATS_WORLD_W;
    const worldH = isDataForest
      ? DATA_FOREST_WORLD_H
      : isHunting
        ? HUNTING_WORLD_H
        : DATS_WORLD_H;

    ctx.clearRect(0, 0, w, h);

    // Cyber map backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(
      0,
      isDataForest ? '#064e3b' : isHunting ? '#06335e' : '#062c7a'
    );
    bgGrad.addColorStop(
      1,
      isDataForest ? '#022c22' : isHunting ? '#031730' : '#03133d'
    );
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 232, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += 18) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const baseScale = Math.min(w / worldW, h / worldH);
    const scale = baseScale * zoom;

    ctx.save();
    if (zoom <= 1.05) {
      ctx.translate((w - worldW * scale) / 2, (h - worldH * scale) / 2);
    } else {
      ctx.translate(w / 2 - snapshot.tamerX * scale, h / 2 - snapshot.tamerY * scale);
    }

    if (isDataForest && forestBgImgRef.current && forestImgLoaded) {
      ctx.drawImage(forestBgImgRef.current, 0, 0, worldW * scale, worldH * scale);
      ctx.fillStyle = 'rgba(4, 26, 28, 0.24)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else if (isHunting && huntingBgImgRef.current && huntingImgLoaded) {
      ctx.drawImage(huntingBgImgRef.current, 0, 0, worldW * scale, worldH * scale);
      // Subtle cool veil so map markers stay ultra-legible
      ctx.fillStyle = 'rgba(4, 22, 54, 0.22)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    } else {
      ctx.fillStyle = isCombatMap ? 'rgba(13, 72, 66, 0.7)' : 'rgba(12, 62, 158, 0.65)';
      ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    }

    ctx.strokeStyle = 'rgba(56, 232, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, worldW * scale, worldH * scale);

    if (!isCombatMap) {
      ctx.fillStyle = 'rgba(56, 232, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(
        DATS_PLAZA_CENTER.x * scale,
        DATS_PLAZA_CENTER.y * scale,
        185 * scale,
        118 * scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      for (const c of DATS_COLLIDERS) {
        ctx.fillStyle =
          c.kind === 'building' || c.kind === 'wall'
            ? '#020f36'
            : c.kind === 'tree'
              ? '#15803d'
              : '#1e3a8a';
        ctx.fillRect(c.x * scale, c.y * scale, c.w * scale, c.h * scale);
      }

      for (const pt of DATS_INTERACTION_POINTS) {
        ctx.fillStyle = pt.kind === 'world-portal' ? '#ffd43b' : '#38e8ff';
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const safeZone = isDataForest ? DATA_FOREST_SAFE_ZONE : HUNTING_SAFE_ZONE;
      const returnPortal = isDataForest
        ? DATA_FOREST_RETURN_PORTAL
        : HUNTING_RETURN_PORTAL;
      const points = isDataForest
        ? DATA_FOREST_INTERACTION_POINTS
        : HUNTING_INTERACTION_POINTS;
      const npcs = isDataForest ? DATA_FOREST_FRIENDLY_NPCS : FRIENDLY_FIELD_NPCS;

      // Safe Sanctuary ring
      ctx.strokeStyle = 'rgba(56, 232, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.fillStyle = 'rgba(56, 232, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(
        safeZone.x * scale,
        safeZone.y * scale,
        safeZone.radius * scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Return Portal to DATS Center
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(
        returnPortal.x * scale,
        returnPortal.y * scale,
        3.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Interactive Landmarks
      for (const pt of points) {
        ctx.fillStyle = pt.accentColor || '#38e8ff';
        ctx.beginPath();
        ctx.arc(pt.x * scale, pt.y * scale, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Friendly Field NPCs
      for (const npc of npcs) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(npc.x * scale, npc.y * scale, 2.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Active Wild Digimons + Prominent Crimson-Gold Raid Boss Beacon
      for (const en of snapshot.minimapEnemies) {
        if (!en.alive) continue;
        if (en.isBoss) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(en.x * scale, en.y * scale, 7.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(en.x * scale, en.y * scale, 4.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(en.x * scale, en.y * scale, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Other Online Players on the same map (Emerald pin, Gold crown pin for GM)
    for (const remote of snapshot.minimapPlayers ?? []) {
      ctx.fillStyle = remote.isGm ? '#facc15' : '#34d399';
      ctx.beginPath();
      ctx.arc(remote.x * scale, remote.y * scale, remote.isGm ? 3.8 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // Partner Dot
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(snapshot.partnerX * scale, snapshot.partnerY * scale, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Tamer Cyan Pin
    ctx.fillStyle = '#38e8ff';
    ctx.beginPath();
    ctx.arc(snapshot.tamerX * scale, snapshot.tamerY * scale, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }, [
    snapshot,
    zoom,
    isHunting,
    isDataForest,
    isCombatMap,
    minimized,
    huntingImgLoaded,
    forestImgLoaded,
  ]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-end select-none"
    >
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="dmo-frame flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold text-white"
        >
          <MapIcon className="h-3.5 w-3.5 text-cyan-300" />
          <span>{regionLabel}</span>
        </button>
      ) : (
        <div className="dmo-frame w-[136px] overflow-hidden rounded-xl min-[390px]:w-[150px] sm:w-[162px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-300/45 bg-gradient-to-b from-[#1159d6] to-[#083287] px-2 py-0.5 sm:px-2.5 sm:py-1">
            <span className="truncate text-[10px] font-extrabold tracking-wide text-white drop-shadow sm:text-[11px]">
              {regionLabel}
            </span>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              title="Minimizar minimapa"
              className="ml-1 rounded px-1 text-[10px] font-bold text-cyan-100 hover:bg-white/10"
            >
              _
            </button>
          </div>

          {/* Radar Viewport */}
          <div className="relative h-[110px] w-full sm:h-[138px]">
            <canvas
              ref={canvasRef}
              width={162}
              height={138}
              className="block h-full w-full"
            />

            {/* Top-Left Gold Search Button */}
            <button
              type="button"
              onClick={onOpenFullMap}
              title="Abrir Mapa Completo"
              className="dmo-gold-circle absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
            >
              <Search className="h-3 w-3 stroke-[2.5]" />
            </button>

            {/* Top-Right Gold - / + Zoom Buttons */}
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.35).toFixed(2))))}
                aria-label="Diminuir zoom do minimapa"
                className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
              >
                <Minus className="h-3 w-3 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.35).toFixed(2))))}
                aria-label="Aumentar zoom do minimapa"
                className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[#3b1b04] active:scale-95"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
              </button>
            </div>

            {/* Area / Sub-region Label */}
            <span className="pointer-events-none absolute left-1.5 top-7 max-w-[118px] truncate rounded bg-[#031438]/82 px-1.5 py-0.5 text-[8.5px] font-extrabold leading-tight text-cyan-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {snapshot.mapId === DATS_MAP_ID
                ? 'Praça DATS'
                : activeSubZone
                  ? activeSubZone.speciesLabel
                    ? `${activeSubZone.name} · ${activeSubZone.speciesLabel}`
                    : activeSubZone.name
                  : regionLabel}
            </span>

            {/* Bottom-Left Gold N Compass + Star Badge */}
            <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1">
              <span className="dmo-gold-circle flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-[#3b1b04]">
                N
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-[#082b78] text-[9px] font-black text-amber-300 shadow">
                ✦
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
