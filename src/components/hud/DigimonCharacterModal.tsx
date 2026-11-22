import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Sparkles, X } from 'lucide-react';
import { getHatchQualityProfile } from '../../data/itemsCatalog';
import {
  computeDerivedDigimonAttributes,
  computeTamerAttributes,
  DIGIMON_EVOLUTION_CHAINS,
  getNextEvolutionInfo,
  SKILL_F1_DS_COST,
  SKILL_F2_DS_COST,
} from '../../services/hudGameService';
import {
  drawDigimonPartnerFrame,
  preloadDigimonPartnerAssets,
} from '../../sprites/digimonPartnerSprites';
import type { CardinalDirection } from '../../sprites/tamerRealSheets';
import { getDigimonFormClassification } from '../../types/classification';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  EquipmentSlotId,
  InventoryItem,
  TamerRuntimeStats,
} from '../../types/hud';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
} from '../../utils/skillIcons';
import { DigimonClassificationBadges } from './DigimonClassificationBadges';

interface DigimonCharacterModalProps {
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  tamerStats: TamerRuntimeStats;
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  defeatedTotal: number;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onClose: () => void;
}

const ROTATION_DIRS: readonly CardinalDirection[] = ['S', 'E', 'N', 'W'] as const;

function StatRowIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'HP':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M12 21.2C12 21.2 3 15.2 3 8.8 3 5.7 5.4 3.5 8.2 3.5c1.7 0 3.1.9 3.8 2.2.7-1.3 2.1-2.2 3.8-2.2 2.8 0 5.2 2.2 5.2 5.3 0 6.4-9 12.4-9 12.4z"
            fill="#ef1d2e"
            stroke="#fecdd3"
            strokeWidth="1"
          />
        </svg>
      );
    case 'DS':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M13.5 2L5 13.2h6.2L9.8 22 19 10.6h-6.4L13.5 2z"
            fill="#fde047"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Ataque':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M19.5 3.5L9.2 13.8l2 2L21.5 5.5l-2-2z"
            fill="#bae6fd"
            stroke="#38bdf8"
            strokeWidth="1.1"
          />
          <path
            d="M7.5 12.5l4 4-1.8 1.8-1.4-1.4-2.6 2.6-2.2-2.2 2.6-2.6-1.4-1.4 1.8-1.8z"
            fill="#0284c7"
            stroke="#e0f2fe"
            strokeWidth="1"
          />
        </svg>
      );
    case 'Defesa':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M12 2.5l8 3.2v6.4c0 5.2-3.4 8.6-8 10.2-4.6-1.6-8-5-8-10.2V5.7l8-3.2z"
            fill="#0ea5e9"
            stroke="#e0f2fe"
            strokeWidth="1.3"
          />
          <path d="M12 5.2l5.2 2.1v4.7c0 3.7-2.2 6.2-5.2 7.5V5.2z" fill="#0369a1" />
        </svg>
      );
    case 'Velocidade':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M6.5 4.5h6.5v8.2l5 2c1.4.6 2 1.6 2 3.1v2H5.5v-15.3h1z"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M2.5 9h4M1.5 12.5h5M3 16h3.5" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Crítico':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <circle cx="12" cy="12" r="8" fill="none" stroke="#facc15" strokeWidth="2.1" />
          <circle cx="12" cy="12" r="3.4" fill="#fde047" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fef08a" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'Precisão':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <circle cx="12" cy="12" r="8" fill="none" stroke="#f43f5e" strokeWidth="2.1" />
          <circle cx="12" cy="12" r="3.2" fill="#fb7185" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fda4af" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'Bloqueio':
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M12 2.4l7.5 3v6.2c0 4.9-3.1 8.3-7.5 9.8-4.4-1.5-7.5-4.9-7.5-9.8V5.4l7.5-3z"
            fill="#f59e0b"
            stroke="#fef3c7"
            strokeWidth="1.3"
          />
          <path
            d="M9 11.5h6M12 8.5v6"
            stroke="#fffbeb"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 drop-shadow sm:h-5 sm:w-5">
          <path
            d="M3 10c4.2-4.8 9.2-5 13-1.5-2.6 0-4.8 1-6.5 2.7 3.2-.6 6.2.1 8.5 2.3-3 .2-5.5 1.4-7.4 3.5-3.2-1.4-5.9-3.9-7.6-7z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function DigimonPreviewStage({
  digimon,
  direction,
}: {
  digimon: DigimonFormProfile;
  direction: CardinalDirection;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirRef = useRef(direction);

  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let elapsed = 0;
    let lastTs: number | null = null;

    const fallbackPortrait = new Image();
    fallbackPortrait.src = digimon.portraitUrl;

    void preloadDigimonPartnerAssets(digimon.id);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      if (cancelled) return;
      if (lastTs === null) {
        lastTs = now;
      }
      const dt = Math.max(0, Math.min(0.05, (now - lastTs) / 1000));
      lastTs = now;
      elapsed += dt;

      const w = 220;
      const h = 236;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const footY = 196;

      // 1. Radial digital radar rings behind Digimon
      ctx.save();
      const bgGlow = ctx.createRadialGradient(cx, 112, 10, cx, 112, 104);
      bgGlow.addColorStop(0, 'rgba(34, 197, 255, 0.25)');
      bgGlow.addColorStop(0.65, 'rgba(10, 82, 214, 0.14)');
      bgGlow.addColorStop(1, 'rgba(2, 14, 52, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, 112, 104, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(62, 212, 255, 0.22)';
      ctx.lineWidth = 1.2;
      for (const r of [40, 66, 92]) {
        ctx.beginPath();
        ctx.arc(cx, 112, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Vertical light rays & 3-ring glowing cyan cyber pedestal
      ctx.save();
      const beamGrad = ctx.createLinearGradient(0, footY - 140, 0, footY + 6);
      beamGrad.addColorStop(0, 'rgba(56, 224, 255, 0)');
      beamGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.18)');
      beamGrad.addColorStop(1, 'rgba(56, 232, 255, 0.42)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 50, footY - 135);
      ctx.lineTo(cx + 50, footY - 135);
      ctx.lineTo(cx + 72, footY + 6);
      ctx.lineTo(cx - 72, footY + 6);
      ctx.closePath();
      ctx.fill();

      const pulse = 1 + Math.sin(elapsed * 3) * 0.025;
      ctx.fillStyle = 'rgba(2, 22, 74, 0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, footY + 6, 86, 21, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38e8ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 5, 82 * pulse, 19 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125, 240, 255, 0.78)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([11, 6]);
      ctx.lineDashOffset = -elapsed * 22;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 4, 62, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(56, 214, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 3, 40, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, footY + 2, 28, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Draw real active Digimon spritesheet (with subtle stage presence & zero clipping)
      const stageBoost =
        digimon.stage === 'Mega'
          ? 1.13
          : digimon.stage === 'Ultimate'
            ? 1.07
            : digimon.stage === 'Champion'
              ? 1.02
              : 0.94;
      const targetPreviewH = 148 * stageBoost;
      const previewScale = Math.min(
        targetPreviewH / Math.max(48, digimon.worldDimensions.heightPx),
        186 / Math.max(36, digimon.worldDimensions.widthPx)
      );
      ctx.save();
      ctx.translate(cx, footY);
      ctx.scale(previewScale, previewScale);
      const drewSprite = drawDigimonPartnerFrame(
        ctx,
        digimon.id,
        'idle',
        dirRef.current,
        0,
        elapsed,
        0,
        0
      );
      ctx.restore();

      if (
        !drewSprite &&
        fallbackPortrait.complete &&
        fallbackPortrait.naturalWidth > 0
      ) {
        const maxSide = 148;
        const sc = Math.min(
          maxSide / fallbackPortrait.naturalWidth,
          maxSide / fallbackPortrait.naturalHeight
        );
        const pw = fallbackPortrait.naturalWidth * sc;
        const ph = fallbackPortrait.naturalHeight * sc;
        const bob = Math.sin(elapsed * 3.2) * 3;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          fallbackPortrait,
          cx - pw / 2,
          footY - ph + 4 + bob,
          pw,
          ph
        );
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [
    digimon.id,
    digimon.portraitUrl,
    digimon.stage,
    digimon.worldDimensions.heightPx,
    digimon.worldDimensions.widthPx,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Prévia animada de ${digimon.name}`}
      className="mx-auto h-[96px] w-[90px] sm:h-[164px] sm:w-[152px] md:h-[192px] md:w-[178px] lg:h-[212px] lg:w-[196px] [@media(max-height:500px)]:h-[112px] [@media(max-height:500px)]:w-[104px]"
    />
  );
}

export function DigimonCharacterModal({
  digimon,
  digimonStats,
  tamerStats,
  equippedItems,
  defeatedTotal,
  onEvolveForm,
  onClose,
}: DigimonCharacterModalProps) {
  const [dirIndex, setDirIndex] = useState(0);

  const tamerAttrs = useMemo(
    () => computeTamerAttributes(tamerStats, equippedItems),
    [tamerStats, equippedItems]
  );

  const derived = useMemo(
    () =>
      computeDerivedDigimonAttributes(
        tamerAttrs,
        digimonStats,
        defeatedTotal,
        digimon.id
      ),
    [tamerAttrs, digimonStats, defeatedTotal, digimon.id]
  );

  const qualityProfile = useMemo(
    () => getHatchQualityProfile(digimonStats.hatchGrade),
    [digimonStats.hatchGrade]
  );
  const effectiveSizePct =
    digimonStats.hatchSizePct ?? qualityProfile.defaultSizePct;

  const evoChain = DIGIMON_EVOLUTION_CHAINS[digimon.starterId];
  const { readyToEvolve } = useMemo(
    () => getNextEvolutionInfo(digimon.starterId, digimonStats),
    [digimon.starterId, digimonStats]
  );
  const activeDirection = ROTATION_DIRS[dirIndex];
  const digiExpPct = Math.min(
    100,
    (digimonStats.exp / Math.max(1, digimonStats.expToNext)) * 100
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Janela Digimon — ${digimon.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/55 p-1 sm:p-4 [@media(max-height:500px)]:p-1"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[97dvh] w-full max-w-[900px] flex-col"
      >
        {/* Top-Right Extruded Metallic Red-White X Button matching reference */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela Digimon"
          className="absolute -right-0.5 -top-0.5 z-30 flex h-8 w-8 items-center justify-center rounded-xl border-[2px] border-[#8ef2ff] bg-gradient-to-b from-[#ef4444] via-[#b91c1c] to-[#7f1d1d] text-white shadow-[0_0_16px_rgba(56,232,255,0.7),inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:brightness-115 active:scale-95 sm:-right-1 sm:-top-1 sm:h-11 sm:w-11 sm:border-[2.5px] lg:h-12 lg:w-12 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:w-8"
        >
          <X className="h-4.5 w-4.5 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:h-6 sm:w-6 [@media(max-height:500px)]:h-4.5 [@media(max-height:500px)]:w-4.5" />
        </button>

        {/* Chamfered Outer Neon Rim + Inner Panel */}
        <div className="clip-cyber-panel relative flex flex-1 flex-col bg-gradient-to-b from-[#7af2ff] via-[#26b6ff] to-[#56e4ff] p-[2px] shadow-[0_0_40px_rgba(0,174,255,0.65)] sm:p-[2.5px]">
          <div className="clip-cyber-panel relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_24%_54%,rgba(14,79,198,0.9)_0%,rgba(6,28,92,0.95)_52%,rgba(3,14,52,0.97)_100%)] backdrop-blur-md">
            {/* Stepped Top Metallic Header Strip */}
            <div className="relative flex h-8 items-center justify-between border-b-2 border-[#3ad5ff] bg-gradient-to-r from-[#062a78] via-[#0c4ec9] to-[#062a78] px-2.5 pr-10 shadow-[0_3px_14px_rgba(0,145,255,0.45)] sm:h-11 sm:px-5 sm:pr-14 lg:h-[52px] [@media(max-height:500px)]:h-8">
              <div
                aria-hidden="true"
                className="hidden h-3 w-28 skew-x-[-28deg] border-b border-r border-[#52e3ff]/65 bg-[#07266e]/50 sm:block [@media(max-height:500px)]:hidden"
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="clip-cyber-input flex h-5.5 w-7 items-center justify-center border border-[#72f0ff] bg-gradient-to-b from-[#0c3f9e] to-[#04194d] shadow-[0_0_10px_rgba(56,232,255,0.5)] sm:h-9 sm:w-11 [@media(max-height:500px)]:h-5.5 [@media(max-height:500px)]:w-7">
                  <svg viewBox="0 0 32 32" className="h-4 w-4 fill-[#38f0ff] drop-shadow-[0_0_4px_rgba(56,240,255,0.8)] sm:h-6 sm:w-6 [@media(max-height:500px)]:h-4 [@media(max-height:500px)]:w-4">
                    <path d="M8 19c0-5.2 3.8-9.5 9.2-9.5 2.9 0 5.4 1.5 6.8 3.6l2.5 1.2-2 1.8c.2 1 0 2.1-.4 3l1.6 2.2-3.8-.4c-1.5 1.3-3.6 2.1-6 2.1-4.5 0-7.9-1.8-7.9-4z" />
                  </svg>
                </div>
                <h2 className="text-sm font-black italic tracking-wide text-white drop-shadow-[0_2px_6px_rgba(56,232,255,0.7)] sm:text-xl lg:text-[23px] [@media(max-height:500px)]:text-sm">
                  Digimon
                </h2>
              </div>

              <div
                aria-hidden="true"
                className="hidden h-3 w-28 skew-x-[28deg] border-b border-l border-[#52e3ff]/65 bg-[#07266e]/50 sm:block [@media(max-height:500px)]:hidden"
              />
            </div>

            {/* Main Responsive 12-Col Body:
                - Mobile Portrait (<640px): Top row (5 cols Preview + 7 cols Atributos) + Bottom row (Evolução + Skills/Vínculo)
                - Mobile Landscape & Desktop (sm+): 3 columns (4 + 4 + 4) matching reference */}
            <div className="overflow-y-auto px-2 py-1.5 sm:px-3.5 sm:py-2.5 lg:px-5 lg:py-4 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1.5">
              <div className="grid grid-cols-12 items-stretch gap-1.5 sm:gap-2.5 lg:gap-4 [@media(max-height:500px)]:gap-2">
                {/* ZONE 1 (Left): Name + Lv. + Stars + Digimon Stage + Compact Classification + Poder de Combate */}
                <div className="col-span-5 flex flex-col justify-between gap-1 sm:col-span-4 sm:gap-2">
                  {/* Clean Header: Digimon Name + Level + 5 Stars */}
                  <div className="flex flex-col px-0.5 leading-tight">
                    <p className="truncate text-[13px] font-black tracking-wide text-white drop-shadow sm:text-[18px] lg:text-[20px] [@media(max-height:500px)]:text-[14px]">
                      {digimon.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <span className="text-[11px] font-black tabular-nums text-[#ffd43b] drop-shadow sm:text-base lg:text-lg [@media(max-height:500px)]:text-[12.5px]">
                        Lv.{digimonStats.level}
                      </span>
                      <span
                        title={`${qualityProfile.description} Tamanho: ${effectiveSizePct}%`}
                        className="rounded border px-1.5 py-[1px] text-[8.5px] font-black tabular-nums sm:text-[10px]"
                        style={{
                          borderColor: qualityProfile.badgeColor,
                          color: qualityProfile.badgeColor,
                          backgroundColor: 'rgba(4, 18, 56, 0.9)',
                        }}
                      >
                        {qualityProfile.label} · {qualityProfile.qualityName} ({effectiveSizePct}%)
                      </span>
                      <div className="flex items-center gap-0.5" aria-label={`Classificação ${derived.starRank} de 5 estrelas`}>
                        {[1, 2, 3, 4, 5].map((starIdx) => (
                          <svg
                            key={starIdx}
                            viewBox="0 0 20 20"
                            className={`h-2.5 w-2.5 sm:h-4 sm:w-4 [@media(max-height:500px)]:h-3 [@media(max-height:500px)]:w-3 ${
                              starIdx <= derived.starRank
                                ? 'fill-amber-400 stroke-amber-200 drop-shadow-[0_0_4px_rgba(251,191,36,0.75)]'
                                : 'fill-slate-800/80 stroke-slate-500/70'
                            }`}
                            strokeWidth="1.2"
                          >
                            <path d="M10 1.8l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8L10 1.8z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Independent Digimon Animation Stage */}
                  <div className="relative flex flex-col items-center justify-center">
                    <DigimonPreviewStage digimon={digimon} direction={activeDirection} />
                    <div className="absolute bottom-0 flex items-center gap-16 sm:bottom-0.5 sm:gap-28 [@media(max-height:500px)]:gap-20">
                      <button
                        type="button"
                        onClick={() =>
                          setDirIndex(
                            (d) => (d - 1 + ROTATION_DIRS.length) % ROTATION_DIRS.length
                          )
                        }
                        aria-label="Girar Digimon para esquerda"
                        className="flex h-4.5 w-4.5 items-center justify-center rounded-full border border-cyan-300/60 bg-[#04184a]/80 text-cyan-200 hover:bg-cyan-600/50 sm:h-6 sm:w-6"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDirIndex((d) => (d + 1) % ROTATION_DIRS.length)
                        }
                        aria-label="Girar Digimon para direita"
                        className="flex h-4.5 w-4.5 items-center justify-center rounded-full border border-cyan-300/60 bg-[#04184a]/80 text-cyan-200 hover:bg-cyan-600/50 sm:h-6 sm:w-6"
                      >
                        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sleek Interactive DMO Classification Bar (Atr | Elem | Famílias) */}
                  <DigimonClassificationBadges
                    classification={getDigimonFormClassification(digimon.id)}
                    variant="sheet"
                  />

                  {/* Bottom-Left: Poder de Combate */}
                  <div className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[#38c4ff] bg-[#041238]/92 px-2 py-1 shadow-[inset_0_0_16px_rgba(0,40,120,0.65),0_0_12px_rgba(0,162,255,0.28)] sm:gap-2.5 sm:rounded-xl sm:px-3 sm:py-2 [@media(max-height:500px)]:py-1">
                    <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:h-9 sm:w-9 [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:w-6">
                      <path
                        d="M7 24l15-15 3 3-15 15-3-3z"
                        fill="#e2e8f0"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M25 24L10 9l-3 3 15 15 3-3z"
                        fill="#f8fafc"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                      <path d="M5 21l6 6M21 27l6-6" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[8.5px] font-bold text-white/90 sm:text-[12.5px] [@media(max-height:500px)]:text-[10px]">
                        Poder de Combate
                      </p>
                      <p className="text-[13px] font-black tabular-nums tracking-wide text-[#ffd43b] drop-shadow sm:text-[22px] [@media(max-height:500px)]:text-[15px]">
                        {derived.combatPower.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ZONE 2 (Center): Atributos Principais (9 atributos autênticos de base) */}
                <div className="col-span-7 flex flex-col sm:col-span-4">
                  <div className="flex flex-1 flex-col rounded-lg border-[1.5px] border-[#38c4ff] bg-[#041238]/92 px-2 py-1.5 shadow-[inset_0_0_18px_rgba(0,40,120,0.65),0_0_12px_rgba(0,162,255,0.28)] sm:rounded-xl sm:px-3 sm:py-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1">
                    <div className="border-b border-cyan-400/35 pb-0.5 text-center text-[10.5px] font-extrabold tracking-wide text-white sm:pb-1 sm:text-[13px] [@media(max-height:500px)]:text-[10.5px]">
                      Atributos Principais
                    </div>

                    <div className="mt-1 grid flex-1 grid-cols-1 gap-y-[2px] sm:mt-1.5 sm:gap-y-1 md:justify-between [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:gap-y-[1px]">
                      {/* 1. HP */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="HP" /></span>
                          <span className="text-[9px] font-black tracking-wide text-rose-300/95 sm:text-[10.5px]">HP</span>
                          <span className="hidden text-white/85 md:inline">Vida</span>
                        </span>
                        <span className="font-bold tabular-nums">
                          <span className="text-white">{Math.round(digimonStats.hp)}</span>
                          <span className="text-[#38e8ff]">/{digimonStats.maxHp}</span>
                        </span>
                      </div>

                      {/* 2. DS */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="DS" /></span>
                          <span className="text-[9px] font-black tracking-wide text-amber-300/95 sm:text-[10.5px]">DS</span>
                          <span className="hidden text-white/85 md:inline">DigiSoul</span>
                        </span>
                        <span className="font-bold tabular-nums">
                          <span className="text-white">{Math.round(digimonStats.ds)}</span>
                          <span className="text-[#38e8ff]">/{digimonStats.maxDs}</span>
                        </span>
                      </div>

                      {/* 3. AT · Ataque */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Ataque" /></span>
                          <span className="text-[9px] font-black tracking-wide text-cyan-300/95 sm:text-[10.5px]">AT</span>
                          <span className="truncate">Ataque</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.attack}
                        </span>
                      </div>

                      {/* 4. DE · Defesa */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Defesa" /></span>
                          <span className="text-[9px] font-black tracking-wide text-cyan-300/95 sm:text-[10.5px]">DE</span>
                          <span className="truncate">Defesa</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.defense}
                        </span>
                      </div>

                      {/* 5. AS · Vel. Atq */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Velocidade" /></span>
                          <span className="text-[9px] font-black tracking-wide text-cyan-300/95 sm:text-[10.5px]">AS</span>
                          <span className="truncate">Vel. Atq</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.attackSpeed.toFixed(2)}s
                        </span>
                      </div>

                      {/* 6. CT · Crítico */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Crítico" /></span>
                          <span className="text-[9px] font-black tracking-wide text-yellow-300/95 sm:text-[10.5px]">CT</span>
                          <span className="truncate">Crítico</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.critRateTotal.toFixed(1)}%
                        </span>
                      </div>

                      {/* 7. HT · Acerto */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Precisão" /></span>
                          <span className="text-[9px] font-black tracking-wide text-rose-300/95 sm:text-[10.5px]">HT</span>
                          <span className="truncate">Acerto</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.accuracy}
                        </span>
                      </div>

                      {/* 8. EV · Evasão */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Evasão" /></span>
                          <span className="text-[9px] font-black tracking-wide text-sky-300/95 sm:text-[10.5px]">EV</span>
                          <span className="truncate">Evasão</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.evasion.toFixed(1)}%
                        </span>
                      </div>

                      {/* 9. BL · Bloqueio */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[12px] md:text-[12.5px] [@media(max-height:500px)]:text-[9.5px]">
                        <span className="flex items-center gap-1 font-semibold text-white sm:gap-1.5">
                          <span className="scale-[0.75] sm:scale-95 [@media(max-height:500px)]:scale-[0.75]"><StatRowIcon kind="Bloqueio" /></span>
                          <span className="text-[9px] font-black tracking-wide text-amber-300/95 sm:text-[10.5px]">BL</span>
                          <span className="truncate">Bloqueio</span>
                        </span>
                        <span className="font-bold tabular-nums text-white">
                          {derived.blockRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p className="mt-1 hidden border-t border-cyan-400/20 pt-1 text-center text-[9.5px] font-semibold text-cyan-200/85 sm:block [@media(max-height:500px)]:hidden">
                      Sinergia Tamer: +{derived.attackBonusFromTamer} AT · +{derived.defenseBonusFromTamer} DE
                    </p>
                  </div>
                </div>

                {/* ZONE 3 (Right on sm+, Bottom strip on Mobile Portrait): Linha de Evolução + Habilidades Ativas + Vínculo */}
                <div className="col-span-12 flex flex-col justify-between gap-1.5 sm:col-span-4 sm:gap-2 lg:gap-2.5 [@media(max-height:500px)]:gap-1">
                  {/* 1. Linha de Evolução (Agumon -> GeoGreymon Lv.15 -> RizeGreymon Lv.30 -> ShineGreymon Lv.50) */}
                  <div className="rounded-lg border-[1.5px] border-[#38c4ff] bg-[#041238]/92 px-1.5 py-1.5 shadow-[inset_0_0_16px_rgba(0,40,120,0.65),0_0_12px_rgba(0,162,255,0.28)] sm:rounded-xl sm:px-2 sm:py-2 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:py-1">
                    <div className="flex items-center justify-between border-b border-cyan-400/35 pb-0.5 sm:pb-1">
                      <span className="text-[10.5px] font-extrabold tracking-wide text-white sm:text-[13px] [@media(max-height:500px)]:text-[10.5px]">
                        Linha de Evolução
                      </span>
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-cyan-200 sm:text-[9px]">
                        {digimon.stage}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-0.5 sm:mt-2 [@media(max-height:500px)]:mt-1">
                      {evoChain.map((step, idx) => {
                        const isActiveStage = step.formId === digimon.id;
                        const unlockedByLevel = digimonStats.level >= step.unlockLevel;
                        const canClickStage =
                          step.playable &&
                          Boolean(step.formId) &&
                          unlockedByLevel &&
                          !isActiveStage;
                        const portraitSrc = step.formId
                          ? getDigimonFormProfile(step.formId).portraitUrl
                          : null;

                        return (
                          <div key={step.name} className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
                            <button
                              type="button"
                              disabled={!canClickStage}
                              onClick={() => {
                                if (canClickStage && step.formId) {
                                  onEvolveForm(step.formId);
                                }
                              }}
                              title={
                                isActiveStage
                                  ? `${step.name} (${step.stage} · Forma Ativa)`
                                  : !step.playable
                                    ? `${step.name} (${step.stage} · Nv. ${step.unlockLevel} — Em breve)`
                                    : unlockedByLevel
                                      ? `Clique para transformar em ${step.name} (${step.stage})`
                                      : `Bloqueado · Requer Nível ${step.unlockLevel} para evoluir`
                              }
                              className="group flex min-w-0 flex-col items-center disabled:cursor-default"
                            >
                              <div
                                className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border-[1.5px] transition sm:h-12 sm:w-12 lg:h-14 lg:w-14 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-9 ${
                                  isActiveStage
                                    ? 'border-amber-300 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.38)_0%,rgba(11,53,143,0.95)_100%)] shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                                    : canClickStage
                                      ? 'border-emerald-300 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.35)_0%,rgba(8,62,84,0.95)_100%)] shadow-[0_0_10px_rgba(52,211,153,0.55)] group-hover:scale-105'
                                      : 'border-cyan-400/55 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22)_0%,rgba(6,29,86,0.92)_100%)]'
                                }`}
                              >
                                {portraitSrc ? (
                                  <>
                                    <img
                                      src={portraitSrc}
                                      alt={step.name}
                                      loading="eager"
                                      referrerPolicy="no-referrer"
                                      className={`block h-full w-full object-contain p-0.5 ${
                                        !unlockedByLevel ? 'opacity-85' : ''
                                      }`}
                                    />
                                    {!unlockedByLevel && (
                                      <span className="absolute bottom-0 right-0 flex items-center gap-0.5 rounded-tl-md bg-[#020a24]/90 px-1 py-[1px] text-[6.5px] font-black tabular-nums text-cyan-200 sm:text-[7.5px]">
                                        <Lock className="h-2 w-2 shrink-0 text-amber-300" />
                                        {step.unlockLevel}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-cyan-200/75">
                                    <Lock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                                    <span className="mt-0.5 text-[7px] font-extrabold tabular-nums sm:text-[7.5px]">
                                      Nv.{step.unlockLevel}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span
                                className={`mt-0.5 max-w-[58px] truncate text-[8px] font-bold sm:max-w-[64px] sm:text-[9px] [@media(max-height:500px)]:text-[7.5px] ${
                                  isActiveStage
                                    ? 'text-amber-200'
                                    : canClickStage
                                      ? 'text-emerald-300'
                                      : 'text-sky-100/90'
                                }`}
                              >
                                {step.name}
                              </span>
                            </button>

                            {idx < evoChain.length - 1 && (
                              <ChevronRight className="mb-3 h-2.5 w-2.5 shrink-0 text-cyan-300 sm:mb-3.5 sm:h-3 sm:w-3" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {readyToEvolve && (
                      <button
                        type="button"
                        onClick={() => onEvolveForm(readyToEvolve.id)}
                        className="mt-1.5 flex w-full animate-pulse items-center justify-center gap-1 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-1 text-[9.5px] font-black uppercase tracking-wide text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.75)] hover:brightness-110 active:scale-[0.98] sm:text-[10.5px]"
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span>Evoluir para {readyToEvolve.name}!</span>
                      </button>
                    )}
                  </div>

                  {/* Mobile Portrait puts Habilidades Ativas + Vínculo side-by-side (2 cols) so ZERO overflow happens; sm+ stacks vertically */}
                  <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-col sm:gap-2 lg:gap-2.5 [@media(max-height:500px)]:gap-1">
                    {/* 2. Habilidades Ativas (F1 & F2 with bespoke MMORPG skill icons) */}
                    <div className="rounded-lg border-[1.5px] border-[#38c4ff] bg-[#041238]/92 px-1.5 py-1.5 shadow-[inset_0_0_16px_rgba(0,40,120,0.65),0_0_12px_rgba(0,162,255,0.28)] sm:rounded-xl sm:px-2.5 sm:py-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1">
                      <div className="border-b border-cyan-400/35 pb-0.5 text-center text-[10px] font-extrabold tracking-wide text-white sm:pb-1 sm:text-[13px] [@media(max-height:500px)]:text-[10.5px]">
                        Habilidades Ativas
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:mt-2 sm:gap-2.5 [@media(max-height:500px)]:mt-1">
                        {/* F1 Skill */}
                        <div className="flex flex-col items-center text-center">
                          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] border border-amber-300/85 bg-[#040c24] shadow-[0_0_14px_rgba(251,191,36,0.45)] sm:h-16 sm:w-16 sm:border-[1.5px] [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-9">
                            <img
                              src={getDigimonSkillIconUrl(digimon.id, 'f1')}
                              alt={digimon.special1Name}
                              draggable={false}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.fallbackApplied) {
                                  img.dataset.fallbackApplied = '1';
                                  img.src = getDigimonSkillFallbackUrl(digimon.id, 'f1');
                                }
                              }}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 rounded border border-amber-300/80 bg-[#020816]/90 px-1 py-[1px] font-display text-[7px] font-bold leading-none text-amber-200 shadow sm:text-[8.5px]">
                              F1
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-[8.5px] font-extrabold text-white sm:text-[11px] [@media(max-height:500px)]:text-[8.5px]">
                            {digimon.special1Name}
                          </p>
                          <p className="text-[7.5px] font-bold tabular-nums text-cyan-300 sm:text-[9px] [@media(max-height:500px)]:text-[8px]">
                            {SKILL_F1_DS_COST} DS · {derived.totalSpecial1Damage}
                          </p>
                        </div>

                        {/* F2 Skill */}
                        <div className="flex flex-col items-center text-center">
                          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] border border-cyan-300/85 bg-[#040c24] shadow-[0_0_14px_rgba(56,232,255,0.48)] sm:h-16 sm:w-16 sm:border-[1.5px] [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-9">
                            <img
                              src={getDigimonSkillIconUrl(digimon.id, 'f2')}
                              alt={digimon.special2Name}
                              draggable={false}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.fallbackApplied) {
                                  img.dataset.fallbackApplied = '1';
                                  img.src = getDigimonSkillFallbackUrl(digimon.id, 'f2');
                                }
                              }}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 rounded border border-cyan-300/80 bg-[#020816]/90 px-1 py-[1px] font-display text-[7px] font-bold leading-none text-cyan-200 shadow sm:text-[8.5px]">
                              F2
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-[8.5px] font-extrabold text-white sm:text-[11px] [@media(max-height:500px)]:text-[8.5px]">
                            {digimon.special2Name}
                          </p>
                          <p className="text-[7.5px] font-bold tabular-nums text-cyan-300 sm:text-[9px] [@media(max-height:500px)]:text-[8px]">
                            {SKILL_F2_DS_COST} DS · {derived.totalSpecial2Damage}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Vínculo & Progresso */}
                    <div className="flex flex-col justify-between rounded-lg border-[1.5px] border-[#38c4ff] bg-[#041238]/92 px-2 py-1.5 shadow-[inset_0_0_16px_rgba(0,40,120,0.65),0_0_12px_rgba(0,162,255,0.28)] sm:rounded-xl sm:px-3 sm:py-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1">
                      <div className="flex items-center justify-between border-b border-cyan-400/35 pb-0.5 sm:pb-1">
                        <span className="text-[10px] font-extrabold tracking-wide text-white sm:text-[13px] [@media(max-height:500px)]:text-[10.5px]">
                          Vínculo
                        </span>
                        <span className="text-[8.5px] font-bold tabular-nums text-cyan-200 sm:text-[10px]">
                          EXP {digiExpPct.toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 sm:mt-1.5 sm:gap-2.5 [@media(max-height:500px)]:mt-1">
                        {/* Cyan Glowing Handshake SVG */}
                        <svg viewBox="0 0 32 32" className="h-6 w-6 shrink-0 drop-shadow-[0_0_8px_rgba(56,232,255,0.6)] sm:h-8 sm:w-8 [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:w-6">
                          <path
                            d="M4 15l5-5 5 3 4-3 5 5-3 4-4-2-3 3-3-3-3 2-3-4z"
                            fill="#7dd3fc"
                            stroke="#e0f2fe"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M11 20l3 3 3-3"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="min-w-0 flex-1">
                          <p className="text-center text-[12px] font-black tabular-nums text-white sm:text-[16px] [@media(max-height:500px)]:text-[12.5px]">
                            {derived.bondPct}%
                          </p>
                          <div className="mt-0.5 h-2.5 overflow-hidden rounded-full border border-[#36c4ff] bg-[#02081b] sm:h-3">
                            <div
                              className="h-full rounded-full bg-gradient-to-b from-[#66eeff] via-[#1395ff] to-[#0552c7] transition-[width] duration-300"
                              style={{ width: `${derived.bondPct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 truncate text-center text-[9px] font-extrabold text-[#ffd43b] sm:mt-1 sm:text-[11.5px] [@media(max-height:500px)]:text-[9.5px]">
                            {derived.bondLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
