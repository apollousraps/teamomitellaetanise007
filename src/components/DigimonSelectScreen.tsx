import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Footprints,
  Pause,
  RotateCw,
  Ruler,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { saveStarterDigimonForAccount } from '../services/authService';
import {
  calcDigimonMaxDs,
  calcDigimonMaxHp,
  SKILL_F1_DS_COST,
  SKILL_F2_DS_COST,
} from '../services/hudGameService';
import {
  DIGIMON_FRAME_COUNT,
  drawDigimonPartnerFrame,
  preloadDigimonEvolutionLine,
} from '../sprites/digimonPartnerSprites';
import type {
  CardinalDirection,
  TamerMovementState,
} from '../sprites/tamerRealSheets';
import {
  getClassificationMetaByCategory,
  getDigimonAttributeMeta,
  getDigimonElementMeta,
  getDigimonFormClassification,
} from '../types/classification';
import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  getStarterDigimonById,
  STARTER_DIGIMONS,
  type DigimonFormId,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
  getDigimonSkillTheme,
} from '../utils/skillIcons';
import { playDigitalTone } from '../utils/soundFx';

interface DigimonSelectScreenProps {
  accountUsername: string;
  tamerName: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  onToggleSound?: () => void;
  onBackToCharacterSelect: () => void;
  onConfirmStarter: (savedStarter: SavedStarterDigimon) => void;
}

const DIRECTION_OPTIONS: ReadonlyArray<{
  dir: CardinalDirection;
  label: string;
}> = [
  { dir: 'S', label: 'Frente' },
  { dir: 'E', label: 'Direita' },
  { dir: 'N', label: 'Costas' },
  { dir: 'W', label: 'Esquerda' },
];

interface AnimatedDigimonCanvasProps {
  formId: DigimonFormId;
  direction: CardinalDirection;
  movementState: TamerMovementState;
  animate: boolean;
  size: 'hero' | 'card' | 'modal';
  spritesReadyTick: number;
}

function AnimatedDigimonCanvas({
  formId,
  direction,
  movementState,
  animate,
  size,
  spritesReadyTick,
}: AnimatedDigimonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const profile = getDigimonFormProfile(formId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let firstFrameChecked = false;
    const startTime = performance.now();
    const logicalW = size === 'hero' ? 300 : size === 'modal' ? 210 : 124;
    const logicalH = size === 'hero' ? 250 : size === 'modal' ? 185 : 108;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);

    // Normalize preview scale so Rookie, Champion, Ultimate & Mega all look heroic and fit neatly
    const targetH = size === 'hero' ? 168 : size === 'modal' ? 124 : 72;
    const targetW = size === 'hero' ? 216 : size === 'modal' ? 156 : 92;
    const rawH = Math.max(48, profile.worldDimensions.heightPx);
    const rawW = Math.max(36, profile.worldDimensions.widthPx);
    const previewScale = Math.min(targetH / rawH, targetW / rawW);

    const drawFrame = (now: number) => {
      const elapsedSec = animate ? (now - startTime) / 1000 : 0;
      const fps = movementState === 'walk' ? (size === 'hero' ? 6.0 : 5.0) : 3.2;
      const frameIndex = animate
        ? Math.floor(elapsedSec * fps) % DIGIMON_FRAME_COUNT
        : 0;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      const cx = logicalW / 2;
      const footY =
        size === 'hero'
          ? logicalH - 36
          : size === 'modal'
            ? logicalH - 28
            : logicalH - 16;

      // Vertical holographic aura beam + glowing pedestal disc
      ctx.save();
      const rx = size === 'hero' ? 96 : size === 'modal' ? 68 : 42;
      const ry = size === 'hero' ? 22 : size === 'modal' ? 16 : 10;

      const beamGrad = ctx.createLinearGradient(cx, 12, cx, footY);
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      beamGrad.addColorStop(
        0.5,
        profile.theme.glowRgba.replace(/[\d.]+\)\s*$/, '0.14)')
      );
      beamGrad.addColorStop(
        1,
        profile.theme.glowRgba.replace(/[\d.]+\)\s*$/, '0.35)')
      );
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.56, 8);
      ctx.lineTo(cx + rx * 0.56, 8);
      ctx.lineTo(cx + rx * 0.92, footY + 4);
      ctx.lineTo(cx - rx * 0.92, footY + 4);
      ctx.closePath();
      ctx.fill();

      const discGrad = ctx.createRadialGradient(cx, footY + 2, 4, cx, footY + 2, rx);
      discGrad.addColorStop(0, profile.theme.glowRgba);
      discGrad.addColorStop(
        0.55,
        profile.theme.glowRgba.replace(/[\d.]+\)\s*$/, '0.28)')
      );
      discGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = profile.theme.accentHex;
      ctx.globalAlpha = size === 'hero' ? 0.85 : 0.65;
      ctx.lineWidth = size === 'hero' ? 2 : 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 2, rx * 0.88, ry * 0.82, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (size === 'hero' || size === 'modal') {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = -elapsedSec * 22;
        ctx.beginPath();
        ctx.ellipse(cx, footY + 2, rx * 0.64, ry * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ground contact shadow
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(
        cx,
        footY + 1,
        Math.min(rx * 0.68, profile.worldDimensions.shadowRx * previewScale),
        Math.min(ry * 0.55, profile.worldDimensions.shadowRy * previewScale),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Render real animated Digimon spritesheet
      ctx.save();
      ctx.translate(cx, footY);
      ctx.scale(previewScale, previewScale);
      const drew = drawDigimonPartnerFrame(
        ctx,
        formId,
        movementState,
        direction,
        frameIndex,
        elapsedSec,
        0,
        0
      );
      ctx.restore();

      if (!firstFrameChecked) {
        firstFrameChecked = true;
        setFallbackVisible(!drew);
      } else if (drew) {
        setFallbackVisible(false);
      }

      if (animate) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    formId,
    direction,
    movementState,
    animate,
    size,
    spritesReadyTick,
    profile,
  ]);

  const sizeClass =
    size === 'hero'
      ? 'h-[215px] w-[258px] sm:h-[250px] sm:w-[300px]'
      : size === 'modal'
        ? 'h-[168px] w-[190px]'
        : 'h-[82px] w-[96px] sm:h-[98px] sm:w-[116px]';

  return (
    <div className={`relative flex items-center justify-center ${sizeClass}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full select-none"
        aria-hidden="true"
      />
      {fallbackVisible && (
        <img
          src={profile.portraitUrl}
          alt={profile.name}
          className="pointer-events-none absolute inset-2 m-auto max-h-[82%] max-w-[82%] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
        />
      )}
    </div>
  );
}

interface StatGaugeRowProps {
  label: string;
  valueText: string;
  subText?: string;
  percent: number;
  barColor: string;
}

function StatGaugeRow({
  label,
  valueText,
  subText,
  percent,
  barColor,
}: StatGaugeRowProps) {
  const clamped = Math.max(8, Math.min(100, Math.round(percent)));
  return (
    <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-200/90">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-black tabular-nums text-white sm:text-[13px]">
            {valueText}
          </span>
          {subText && (
            <span className="text-[9.5px] font-semibold tabular-nums text-sky-300/75">
              {subText}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/90">
        <div
          style={{ width: `${clamped}%`, backgroundColor: barColor }}
          className="h-full rounded-full transition-all duration-300"
        />
      </div>
    </div>
  );
}

export function DigimonSelectScreen({
  accountUsername,
  tamerName,
  soundEnabled,
  animationsEnabled,
  onToggleSound,
  onBackToCharacterSelect,
  onConfirmStarter,
}: DigimonSelectScreenProps) {
  const [selectedId, setSelectedId] = useState<StarterDigimonId>('agumon');
  const [previewFormId, setPreviewFormId] = useState<DigimonFormId>('agumon');
  const [direction, setDirection] = useState<CardinalDirection>('S');
  const [movementState, setMovementState] = useState<TamerMovementState>('walk');
  const [autoRotate, setAutoRotate] = useState(false);
  const [spritesReadyTick, setSpritesReadyTick] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Preload all 3 starter evolution lines so both Rookie cards and evolution previews animate smoothly
  useEffect(() => {
    let active = true;
    Promise.all([
      preloadDigimonEvolutionLine('agumon'),
      preloadDigimonEvolutionLine('gaomon'),
      preloadDigimonEvolutionLine('lalamon'),
    ]).then(() => {
      if (active) {
        setSpritesReadyTick((t) => t + 1);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Optional turntable rotation
  useEffect(() => {
    if (!autoRotate || !animationsEnabled) return;
    const order: CardinalDirection[] = ['S', 'E', 'N', 'W'];
    const timer = window.setInterval(() => {
      setDirection((prev) => {
        const idx = order.indexOf(prev);
        return order[(idx + 1) % order.length];
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [autoRotate, animationsEnabled]);

  const selectedDigimon = getStarterDigimonById(selectedId);
  const evolutionChain = useMemo(
    () => getEvolutionChainForStarter(selectedId),
    [selectedId]
  );
  const activeProfile = useMemo(
    () => getDigimonFormProfile(previewFormId),
    [previewFormId]
  );

  const classification = useMemo(
    () => getDigimonFormClassification(activeProfile.id),
    [activeProfile.id]
  );
  const attributeMeta = useMemo(
    () => getDigimonAttributeMeta(classification.attribute),
    [classification.attribute]
  );
  const elementMeta = useMemo(
    () => getDigimonElementMeta(classification.element),
    [classification.element]
  );
  const skillTheme = useMemo(
    () => getDigimonSkillTheme(activeProfile.id),
    [activeProfile.id]
  );

  // Real base stats computed at the form's unlock level (Lv. 1 for Rookie, Lv. 15/30/50 for evolutions)
  const displayStats = useMemo(() => {
    const lv = activeProfile.unlockLevel;
    const lvOffset = Math.max(0, lv - 1);
    const s = activeProfile.baseStats;
    const hp = calcDigimonMaxHp(lv, activeProfile.id);
    const ds = calcDigimonMaxDs(lv, activeProfile.id);
    const at = Math.round(s.atBase + lvOffset * s.atPerLv);
    const de = Math.round(s.deBase + lvOffset * s.dePerLv);
    const ct = Number((s.ctBase + lvOffset * s.ctPerLv).toFixed(1));
    const ht = Math.round(s.htBase + lvOffset * s.htPerLv);
    const ev = Number((s.evBase + lvOffset * s.evPerLv).toFixed(1));
    const bl = Number((s.blBase + lvOffset * s.blPerLv).toFixed(1));

    // Scale gauge reference cleanly per stage so Rookie comparisons are vivid & readable
    const isRookie = activeProfile.stage === 'Rookie';
    const maxRef = isRookie
      ? { hp: 280, ds: 170, at: 42, de: 18, ct: 7, ht: 120, ev: 6.5, bl: 4.5 }
      : activeProfile.stage === 'Champion'
        ? { hp: 900, ds: 450, at: 170, de: 75, ct: 9, ht: 230, ev: 9, bl: 6 }
        : activeProfile.stage === 'Ultimate'
          ? { hp: 1800, ds: 900, at: 360, de: 150, ct: 12, ht: 360, ev: 11, bl: 8 }
          : { hp: 3400, ds: 1600, at: 680, de: 280, ct: 16, ht: 560, ev: 15, bl: 10 };

    return {
      lv,
      hp,
      ds,
      at,
      de,
      asSec: s.asSec,
      ct,
      ht,
      ev,
      bl,
      skill1Pct: Math.round(s.skill1Ratio * 100),
      skill2Pct: Math.round(s.skill2Ratio * 100),
      hpPerLv: s.hpPerLv,
      dsPerLv: s.dsPerLv,
      atPerLv: s.atPerLv,
      dePerLv: s.dePerLv,
      maxRef,
    };
  }, [activeProfile]);

  function handleSelectStarter(id: StarterDigimonId) {
    playDigitalTone('click', soundEnabled);
    setSelectedId(id);
    setPreviewFormId(id);
  }

  function handleSelectEvolutionStage(formId: DigimonFormId) {
    playDigitalTone('click', soundEnabled);
    setPreviewFormId(formId);
  }

  function handleOpenModal() {
    playDigitalTone('click', soundEnabled);
    setIsConfirmModalOpen(true);
  }

  async function handleConfirmPartner() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await saveStarterDigimonForAccount({
        accountUsername,
        digimonId: selectedId,
      });
      playDigitalTone('confirm', soundEnabled);
      onConfirmStarter(result.saved);
    } finally {
      setIsSaving(false);
    }
  }

  const starterClassification = getDigimonFormClassification(selectedDigimon.id);
  const starterAttrMeta = getDigimonAttributeMeta(starterClassification.attribute);
  const starterElemMeta = getDigimonElementMeta(starterClassification.element);

  return (
    <section
      aria-label="Escolha do Digimon Inicial"
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-gradient-to-b from-[#031233] via-[#061f52] to-[#02091c] text-white"
    >
      {/* Dynamic DATS Partner Chamber Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          style={{
            background: `radial-gradient(ellipse at 28% 22%, ${activeProfile.theme.glowRgba}, transparent 58%)`,
          }}
          className="absolute inset-0 opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(ellipse_at_bottom,rgba(0,204,255,0.28),transparent_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 opacity-20 [background-image:linear-gradient(to_right,rgba(56,232,255,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,232,255,0.45)_1px,transparent_1px)] [background-size:36px_26px] [transform:perspective(360px)_rotateX(58deg)]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-cyan-400/25 bg-[#03102e]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              onBackToCharacterSelect();
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-[#082154]/90 px-3 text-xs font-extrabold tracking-wide text-cyan-100 transition-colors hover:border-cyan-300 hover:bg-[#0d3075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <ChevronLeft className="h-4 w-4 text-cyan-300" />
            <span>Sair</span>
          </button>

          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/90">
              Etapa 2 de 2 · Parceiro Oficial
            </span>
            <h1 className="truncate font-[family-name:var(--font-display)] text-sm tracking-wider text-white sm:text-lg">
              ESCOLHA SEU DIGIMON INICIAL
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[140px] truncate text-xs font-semibold text-sky-200/90 md:inline">
              Tamer: <strong className="text-white">{tamerName}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                playDigitalTone('click', !soundEnabled);
                onToggleSound?.();
              }}
              aria-label={soundEnabled ? 'Silenciar música' : 'Ativar música'}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-[#082154]/90 px-3 text-xs font-bold text-cyan-100 transition-colors hover:border-cyan-300 hover:bg-[#0d3075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-cyan-300" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
              <span className="hidden sm:inline">
                {soundEnabled ? 'Música Ativa' : 'Sem Som'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3.5 px-3 py-3 sm:px-5 sm:py-4">
        {/* Top Strip: 3 Animated Starter Digimon Cards */}
        <div
          role="radiogroup"
          aria-label="Digimons iniciais disponíveis"
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          {STARTER_DIGIMONS.map((starter) => {
            const isSelected = starter.id === selectedId;
            const cls = getDigimonFormClassification(starter.id);
            const attr = getDigimonAttributeMeta(cls.attribute);
            const elem = getDigimonElementMeta(cls.element);

            return (
              <button
                key={starter.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectStarter(starter.id)}
                style={{
                  background: starter.theme.cardBgGradient,
                  borderColor: isSelected
                    ? starter.theme.accentHex
                    : 'rgba(148, 163, 184, 0.25)',
                  boxShadow: isSelected
                    ? starter.theme.selectedGlowShadow
                    : '0 6px 18px rgba(0, 0, 0, 0.4)',
                }}
                className={`group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border-2 px-1.5 pb-2 pt-1.5 text-center transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex-row sm:gap-3 sm:px-3 sm:py-2 sm:text-left ${
                  isSelected
                    ? 'scale-[1.015] opacity-100'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                {isSelected && (
                  <span
                    style={{ backgroundColor: starter.theme.accentHex }}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-950 shadow"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                )}

                <AnimatedDigimonCanvas
                  formId={starter.id}
                  direction={isSelected ? direction : 'S'}
                  movementState="walk"
                  animate={animationsEnabled}
                  size="card"
                  spritesReadyTick={spritesReadyTick}
                />

                <div className="min-w-0 flex-1">
                  <div
                    style={{ color: starter.theme.accentHex }}
                    className="truncate font-[family-name:var(--font-display)] text-xs tracking-wide sm:text-base"
                  >
                    {starter.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1 text-[10px] font-bold text-sky-100/90 sm:justify-start sm:text-xs">
                    <img
                      src={attr.iconPath}
                      alt={attr.namePt}
                      className="h-3.5 w-3.5 object-contain"
                    />
                    <span>{attr.namePt}</span>
                    <span className="text-sky-300/50">·</span>
                    <img
                      src={elem.iconPath}
                      alt={elem.namePt}
                      className="h-3.5 w-3.5 object-contain"
                    />
                    <span className="truncate">{elem.namePt}</span>
                  </div>
                  <p className="mt-0.5 hidden text-[11px] font-medium text-sky-200/80 md:line-clamp-1">
                    {starter.cardCaption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-Column Fullscreen Stage: Animated Showcase + Complete Specs Dossier */}
        <div className="grid flex-1 grid-cols-1 gap-3.5 lg:grid-cols-12 lg:items-start lg:gap-5">
          {/* Left Column: Live Animated Digimon Stage & Interactive 4-Stage Evolution Preview */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <div
              style={{
                borderColor: `${activeProfile.theme.accentHex}70`,
                boxShadow:
                  '0 14px 36px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
              className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#071f52]/92 via-[#041438]/95 to-[#020a1f]/95 p-3 sm:p-4"
            >
              {/* Top Stage Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span
                    style={{ color: activeProfile.theme.accentHex }}
                    className="font-[family-name:var(--font-display)] tracking-wide"
                  >
                    {activeProfile.name}
                  </span>
                  <span className="text-sky-300/50">·</span>
                  <span className="text-sky-100">{activeProfile.stage}</span>
                  <span className="text-sky-300/50">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-amber-200">
                    <Ruler className="h-3 w-3" />
                    {activeProfile.worldDimensions.canonicalHeightMeters.toFixed(
                      1
                    )}
                    m
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setMovementState((prev) =>
                        prev === 'walk' ? 'idle' : 'walk'
                      );
                    }}
                    className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
                      movementState === 'walk'
                        ? 'border-cyan-300/80 bg-cyan-500/20 text-cyan-100'
                        : 'border-white/15 bg-white/5 text-sky-200 hover:bg-white/10'
                    }`}
                  >
                    {movementState === 'walk' ? (
                      <Footprints className="h-3.5 w-3.5 text-cyan-300" />
                    ) : (
                      <Pause className="h-3.5 w-3.5 text-sky-300" />
                    )}
                    <span>
                      {movementState === 'walk' ? 'Caminhando' : 'Parado'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setAutoRotate((prev) => !prev);
                    }}
                    aria-pressed={autoRotate}
                    title="Girar automaticamente"
                    className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
                      autoRotate
                        ? 'border-amber-300/80 bg-amber-400/20 text-amber-100'
                        : 'border-white/15 bg-white/5 text-sky-200 hover:bg-white/10'
                    }`}
                  >
                    <RotateCw
                      className={`h-3.5 w-3.5 ${
                        autoRotate && animationsEnabled ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Animated Holographic Pedestal */}
              <div className="flex items-center justify-center py-1">
                <AnimatedDigimonCanvas
                  formId={activeProfile.id}
                  direction={direction}
                  movementState={movementState}
                  animate={animationsEnabled}
                  size="hero"
                  spritesReadyTick={spritesReadyTick}
                />
              </div>

              {/* 4-Direction Controls */}
              <div
                role="group"
                aria-label="Direção do Digimon"
                className="grid grid-cols-4 gap-1.5"
              >
                {DIRECTION_OPTIONS.map((opt) => {
                  const isActive = direction === opt.dir;
                  return (
                    <button
                      key={opt.dir}
                      type="button"
                      onClick={() => {
                        playDigitalTone('click', soundEnabled);
                        setAutoRotate(false);
                        setDirection(opt.dir);
                      }}
                      className={`min-h-[36px] rounded-lg border text-[11px] font-bold transition-colors ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-500/25 text-white shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                          : 'border-white/10 bg-[#051538]/80 text-sky-200/80 hover:border-cyan-400/40 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Interactive 4-Stage Evolution Line Preview */}
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                    Linha Evolutiva Completa
                  </span>
                  <span className="text-[10.5px] font-semibold text-sky-300/80">
                    Toque para visualizar
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {evolutionChain.map((form) => {
                    const isPreviewed = form.id === activeProfile.id;
                    return (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => handleSelectEvolutionStage(form.id)}
                        style={{
                          borderColor: isPreviewed
                            ? form.theme.accentHex
                            : 'rgba(255,255,255,0.12)',
                        }}
                        className={`flex flex-col items-center rounded-xl border bg-[#04112e]/90 p-1.5 text-center transition-transform ${
                          isPreviewed
                            ? 'scale-[1.03] bg-[#0a2459]/95 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={form.portraitUrl}
                          alt={form.name}
                          className="h-10 w-10 object-contain drop-shadow"
                        />
                        <span className="mt-1 w-full truncate text-[9.5px] font-extrabold text-white">
                          {form.stage}
                        </span>
                        <span className="text-[9px] font-bold tabular-nums text-amber-300/90">
                          Nv. {form.unlockLevel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {activeProfile.id !== selectedDigimon.id && (
                  <p className="mt-2 text-center text-[11px] font-semibold text-amber-200/95">
                    Prévia de evolução desbloqueável no Nv.{' '}
                    {activeProfile.unlockLevel}. Sua jornada começa com{' '}
                    {selectedDigimon.name} (Rookie Nv. 1).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Complete Digimon Specifications Dossier */}
          <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/35 bg-gradient-to-b from-[#071f52]/94 via-[#05163b]/95 to-[#030d26]/95 p-3.5 shadow-[0_14px_38px_rgba(0,0,0,0.48)] sm:p-4 lg:col-span-7">
            {/* Bio & Identity Header */}
            <div className="border-b border-white/10 pb-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2
                    style={{ color: activeProfile.theme.accentHex }}
                    className="font-[family-name:var(--font-display)] text-lg tracking-wide sm:text-xl"
                  >
                    {activeProfile.name}
                  </h2>
                  <span className="text-xs font-bold text-sky-200/90">
                    {activeProfile.stage} · Nv. {displayStats.lv} · Altura{' '}
                    {activeProfile.worldDimensions.canonicalHeightMeters.toFixed(
                      1
                    )}
                    m
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-200">
                  {selectedDigimon.personality}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-sky-100/90">
                {selectedDigimon.description} {selectedDigimon.cardCaption}
              </p>
            </div>

            {/* Real Classification: Attribute + Element with Matchups */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Attribute Spec */}
              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 p-2.5">
                <div className="flex items-center gap-2">
                  <img
                    src={attributeMeta.iconPath}
                    alt={attributeMeta.namePt}
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                      Atributo
                    </div>
                    <div
                      style={{ color: attributeMeta.accentHex }}
                      className="truncate text-xs font-black sm:text-sm"
                    >
                      {attributeMeta.namePt} ({attributeMeta.code})
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-emerald-300">
                      Forte contra:
                    </span>
                    {attributeMeta.strongAgainst.length > 0 ? (
                      attributeMeta.strongAgainst.map((m) => {
                        const target = getClassificationMetaByCategory(
                          'attribute',
                          m.targetId
                        );
                        return (
                          <span
                            key={m.targetId}
                            className="inline-flex items-center gap-1 font-semibold text-white"
                          >
                            <img
                              src={target.iconPath}
                              alt={target.namePt}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {target.namePt}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sky-200/75">Equilibrado</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-rose-300">
                      Fraco contra:
                    </span>
                    {attributeMeta.weakAgainst.length > 0 ? (
                      attributeMeta.weakAgainst.map((m) => {
                        const target = getClassificationMetaByCategory(
                          'attribute',
                          m.targetId
                        );
                        return (
                          <span
                            key={m.targetId}
                            className="inline-flex items-center gap-1 font-semibold text-sky-100"
                          >
                            <img
                              src={target.iconPath}
                              alt={target.namePt}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {target.namePt}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sky-200/75">Nenhuma</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Element Spec */}
              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 p-2.5">
                <div className="flex items-center gap-2">
                  <img
                    src={elementMeta.iconPath}
                    alt={elementMeta.namePt}
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                      Elemento
                    </div>
                    <div
                      style={{ color: elementMeta.accentHex }}
                      className="truncate text-xs font-black sm:text-sm"
                    >
                      {elementMeta.namePt} · {elementMeta.roleLabelPt}
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-emerald-300">
                      Forte contra:
                    </span>
                    {elementMeta.strongAgainst.length > 0 ? (
                      elementMeta.strongAgainst.map((m) => {
                        const target = getClassificationMetaByCategory(
                          'element',
                          m.targetId
                        );
                        return (
                          <span
                            key={m.targetId}
                            className="inline-flex items-center gap-1 font-semibold text-white"
                          >
                            <img
                              src={target.iconPath}
                              alt={target.namePt}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {target.namePt}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sky-200/75">Neutro</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-rose-300">
                      Fraco contra:
                    </span>
                    {elementMeta.weakAgainst.length > 0 ? (
                      elementMeta.weakAgainst.map((m) => {
                        const target = getClassificationMetaByCategory(
                          'element',
                          m.targetId
                        );
                        return (
                          <span
                            key={m.targetId}
                            className="inline-flex items-center gap-1 font-semibold text-sky-100"
                          >
                            <img
                              src={target.iconPath}
                              alt={target.namePt}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {target.namePt}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sky-200/75">Nenhuma</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Real Base Stats Grid */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                  <Swords className="h-3.5 w-3.5 text-amber-300" />
                  <span>Especificações de Combate (Nv. {displayStats.lv})</span>
                </span>
                <span className="text-[10.5px] font-bold tabular-nums text-sky-300/85">
                  Vel. Ataque (AS): {displayStats.asSec.toFixed(2)}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatGaugeRow
                  label="HP"
                  valueText={`${displayStats.hp}`}
                  subText={`+${displayStats.hpPerLv}/nv`}
                  percent={(displayStats.hp / displayStats.maxRef.hp) * 100}
                  barColor="#34d399"
                />
                <StatGaugeRow
                  label="DS"
                  valueText={`${displayStats.ds}`}
                  subText={`+${displayStats.dsPerLv}/nv`}
                  percent={(displayStats.ds / displayStats.maxRef.ds) * 100}
                  barColor="#38bdf8"
                />
                <StatGaugeRow
                  label="AT"
                  valueText={`${displayStats.at}`}
                  subText={`+${displayStats.atPerLv}/nv`}
                  percent={(displayStats.at / displayStats.maxRef.at) * 100}
                  barColor="#fbbf24"
                />
                <StatGaugeRow
                  label="DE"
                  valueText={`${displayStats.de}`}
                  subText={`+${displayStats.dePerLv}/nv`}
                  percent={(displayStats.de / displayStats.maxRef.de) * 100}
                  barColor="#60a5fa"
                />
                <StatGaugeRow
                  label="Crítico (CT)"
                  valueText={`${displayStats.ct.toFixed(1)}%`}
                  percent={(displayStats.ct / displayStats.maxRef.ct) * 100}
                  barColor="#f472b6"
                />
                <StatGaugeRow
                  label="Acerto (HT)"
                  valueText={`${displayStats.ht}`}
                  percent={(displayStats.ht / displayStats.maxRef.ht) * 100}
                  barColor="#a78bfa"
                />
                <StatGaugeRow
                  label="Evasão (EV)"
                  valueText={`${displayStats.ev.toFixed(1)}%`}
                  percent={(displayStats.ev / displayStats.maxRef.ev) * 100}
                  barColor="#2dd4bf"
                />
                <StatGaugeRow
                  label="Bloqueio (BL)"
                  valueText={`${displayStats.bl.toFixed(1)}%`}
                  percent={(displayStats.bl / displayStats.maxRef.bl) * 100}
                  barColor="#fb923c"
                />
              </div>
            </div>

            {/* Real F1 & F2 Special Skills with Official Icons */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                  <Zap className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Habilidades Especiais</span>
                </span>
                <span className="text-[10.5px] font-semibold text-sky-300/80">
                  Teclas F1 e F2 em batalha
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {/* F1 Skill */}
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-[#04112e]/95 p-2.5 ${skillTheme.readyBorder}`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-[#02091c]">
                    <img
                      src={getDigimonSkillIconUrl(activeProfile.id, 'f1')}
                      alt={activeProfile.special1Name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = getDigimonSkillFallbackUrl(
                          activeProfile.id,
                          'f1'
                        );
                        if (!target.src.endsWith(fb)) target.src = fb;
                      }}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0.5 right-0.5 rounded bg-slate-950/90 px-1 text-[9px] font-black ${skillTheme.keycapText}`}
                    >
                      F1
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold text-white sm:text-[13px]">
                      {activeProfile.special1Name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-bold tabular-nums text-sky-200/90">
                      <span className="text-amber-300">
                        {displayStats.skill1Pct}% AT
                      </span>
                      <span className="text-sky-400/50">·</span>
                      <span className="text-cyan-300">
                        {SKILL_F1_DS_COST} DS
                      </span>
                      <span className="text-sky-400/50">·</span>
                      <span>
                        Recarga {activeProfile.special1CooldownSec.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* F2 Skill */}
                <div
                  className={`flex items-center gap-2.5 rounded-xl border bg-[#04112e]/95 p-2.5 ${skillTheme.readyBorder}`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-[#02091c]">
                    <img
                      src={getDigimonSkillIconUrl(activeProfile.id, 'f2')}
                      alt={activeProfile.special2Name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = getDigimonSkillFallbackUrl(
                          activeProfile.id,
                          'f2'
                        );
                        if (!target.src.endsWith(fb)) target.src = fb;
                      }}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0.5 right-0.5 rounded bg-slate-950/90 px-1 text-[9px] font-black ${skillTheme.keycapText}`}
                    >
                      F2
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold text-white sm:text-[13px]">
                      {activeProfile.special2Name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-bold tabular-nums text-sky-200/90">
                      <span className="text-amber-300">
                        {displayStats.skill2Pct}% AT
                      </span>
                      <span className="text-sky-400/50">·</span>
                      <span className="text-cyan-300">
                        {SKILL_F2_DS_COST} DS
                      </span>
                      <span className="text-sky-400/50">·</span>
                      <span>
                        Recarga {activeProfile.special2CooldownSec.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Confirm Partner Button */}
            <div className="mt-auto flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleOpenModal}
                className="clip-cyber-btn flex min-h-[54px] w-full items-center justify-center gap-2 border-2 border-cyan-200/85 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] px-6 py-3 font-[family-name:var(--font-display)] text-sm tracking-wider text-white shadow-[0_0_26px_rgba(14,165,233,0.7)] transition-transform duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
                <span>CONFIRMAR {selectedDigimon.name} COMO PARCEIRO</span>
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-sky-200/80">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span>
                  Escolha permanente vinculada à conta. Ao confirmar, você
                  entrará direto no DATS Center.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Starter Confirmation Modal with Live Animated Partner */}
      {isConfirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-partner-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/85 p-4 backdrop-blur-sm"
        >
          <div
            style={{ borderColor: selectedDigimon.theme.accentHex }}
            className="w-full max-w-[400px] rounded-3xl border-2 bg-gradient-to-b from-[#071c4a] via-[#051436] to-[#030b20] p-5 text-center shadow-[0_0_45px_rgba(0,180,255,0.45)]"
          >
            <div className="mx-auto flex items-center justify-center">
              <AnimatedDigimonCanvas
                formId={selectedDigimon.id}
                direction="S"
                movementState="walk"
                animate={animationsEnabled}
                size="modal"
                spritesReadyTick={spritesReadyTick}
              />
            </div>

            <div className="mt-1 flex items-center justify-center gap-2 text-xs font-bold text-sky-100">
              <span
                style={{ color: selectedDigimon.theme.accentHex }}
                className="font-[family-name:var(--font-display)] tracking-wide"
              >
                {selectedDigimon.name}
              </span>
              <span className="text-sky-400/50">·</span>
              <span className="inline-flex items-center gap-1">
                <img
                  src={starterAttrMeta.iconPath}
                  alt={starterAttrMeta.namePt}
                  className="h-3.5 w-3.5 object-contain"
                />
                {starterAttrMeta.namePt}
              </span>
              <span className="text-sky-400/50">·</span>
              <span className="inline-flex items-center gap-1">
                <img
                  src={starterElemMeta.iconPath}
                  alt={starterElemMeta.namePt}
                  className="h-3.5 w-3.5 object-contain"
                />
                {starterElemMeta.namePt}
              </span>
            </div>

            <h3
              id="confirm-partner-title"
              className="mt-2.5 text-balance font-[family-name:var(--font-display)] text-base leading-snug tracking-wide text-white"
            >
              INICIAR AVENTURA COM {selectedDigimon.name}?
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-sky-100/90">
              Ao confirmar, <strong>{selectedDigimon.name}</strong> será seu
              parceiro oficial no DATS Center ao lado de{' '}
              <strong>{tamerName}</strong>. Os outros dois iniciais não poderão
              ser escolhidos nesta conta.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  setIsConfirmModalOpen(false);
                }}
                className="min-h-[46px] rounded-xl border border-cyan-400/45 bg-[#082254] px-4 py-2.5 text-xs font-extrabold tracking-wide text-cyan-100 transition-colors hover:bg-[#0d337a] disabled:opacity-50"
              >
                VOLTAR
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmPartner}
                className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-4 py-2.5 text-xs font-extrabold tracking-wide text-white shadow-[0_0_18px_rgba(14,165,233,0.65)] transition-transform active:scale-95 disabled:opacity-60"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{isSaving ? 'ENTRANDO...' : 'CONFIRMAR'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
