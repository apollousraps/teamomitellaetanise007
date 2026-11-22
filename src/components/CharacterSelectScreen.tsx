import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Loader2,
  Pause,
  RotateCw,
  Shield,
  Sparkles,
  Swords,
  User,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import {
  getSavedCharacterForAccount,
  saveCharacterForAccount,
  validateTamerName,
} from '../services/authService';
import { computeTamerAttributes } from '../services/hudGameService';
import {
  drawTamerMovementFrame,
  preloadTamerSheets,
  TAMER_FRAME_WRAP,
  type CardinalDirection,
  type TamerMovementState,
} from '../sprites/tamerRealSheets';
import { TAMER_CHARACTERS } from '../sprites/tamerSprites';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import { playDigitalTone } from '../utils/soundFx';

interface CharacterSelectScreenProps {
  accountUsername: string;
  soundEnabled: boolean;
  animationsEnabled?: boolean;
  onToggleSound?: () => void;
  onBackToLogin: () => void;
  onEnterWorld?: (selection: SavedCharacterSelection) => void;
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

interface AnimatedTamerCanvasProps {
  tamerId: TamerId;
  accentHex: string;
  glowRgba: string;
  direction: CardinalDirection;
  movementState: TamerMovementState;
  animate: boolean;
  size: 'hero' | 'card';
  sheetsReadyTick: number;
}

function AnimatedTamerCanvas({
  tamerId,
  accentHex,
  glowRgba,
  direction,
  movementState,
  animate,
  size,
  sheetsReadyTick,
}: AnimatedTamerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startTime = performance.now();
    const logicalW = size === 'hero' ? 280 : 120;
    const logicalH = size === 'hero' ? 260 : 126;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);

    const drawFrame = (now: number) => {
      const elapsedSec = animate ? (now - startTime) / 1000 : 0;
      const walkFps = size === 'hero' ? 9.5 : 7.5;
      const idleFps = 2.6;
      const fps = movementState === 'walk' ? walkFps : idleFps;
      const frameIndex = animate
        ? Math.floor(elapsedSec * fps) % TAMER_FRAME_WRAP
        : 0;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      const cx = logicalW / 2;
      const footY = size === 'hero' ? logicalH - 36 : logicalH - 18;

      // Holographic DATS pedestal glow & rings
      ctx.save();
      const beamGrad = ctx.createLinearGradient(cx, 12, cx, footY);
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      beamGrad.addColorStop(0.55, glowRgba.replace(/[\d.]+\)\s*$/, '0.12)'));
      beamGrad.addColorStop(1, glowRgba.replace(/[\d.]+\)\s*$/, '0.32)'));
      ctx.fillStyle = beamGrad;
      const beamHalfW = size === 'hero' ? 74 : 36;
      ctx.beginPath();
      ctx.moveTo(cx - beamHalfW * 0.65, 10);
      ctx.lineTo(cx + beamHalfW * 0.65, 10);
      ctx.lineTo(cx + beamHalfW, footY + 4);
      ctx.lineTo(cx - beamHalfW, footY + 4);
      ctx.closePath();
      ctx.fill();

      // Floor holographic disc
      const rx = size === 'hero' ? 86 : 38;
      const ry = size === 'hero' ? 21 : 10;
      const discGrad = ctx.createRadialGradient(cx, footY + 2, 4, cx, footY + 2, rx);
      discGrad.addColorStop(0, glowRgba);
      discGrad.addColorStop(0.55, glowRgba.replace(/[\d.]+\)\s*$/, '0.28)'));
      discGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crisp metallic outer ring
      ctx.strokeStyle = accentHex;
      ctx.globalAlpha = size === 'hero' ? 0.8 : 0.65;
      ctx.lineWidth = size === 'hero' ? 2 : 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 2, rx * 0.88, ry * 0.82, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Animated rotating tech arc on hero stage
      if (size === 'hero') {
        const rot = elapsedSec * 1.1;
        ctx.strokeStyle = '#e0f7ff';
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -rot * 24;
        ctx.beginPath();
        ctx.ellipse(cx, footY + 2, rx * 0.66, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ground contact shadow beneath feet
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(
        cx,
        footY + 1,
        size === 'hero' ? 32 : 16,
        size === 'hero' ? 8.5 : 4.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Draw real animated Tamer spritesheet scaled cleanly for showcase or card
      const spriteScale = size === 'hero' ? 2.08 : 0.98;
      ctx.save();
      ctx.translate(cx, footY);
      ctx.scale(spriteScale, spriteScale);
      const drew = drawTamerMovementFrame(
        ctx,
        tamerId,
        movementState,
        direction,
        frameIndex,
        elapsedSec,
        0,
        0
      );
      ctx.restore();

      if (!drew) {
        ctx.save();
        ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Carregando...', cx, footY - 40);
        ctx.restore();
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
    tamerId,
    accentHex,
    glowRgba,
    direction,
    movementState,
    animate,
    size,
    sheetsReadyTick,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={
        size === 'hero'
          ? 'h-[176px] w-[200px] select-none sm:h-[260px] sm:w-[280px]'
          : 'h-[72px] w-[68px] select-none sm:h-[110px] sm:w-[104px]'
      }
      aria-hidden="true"
    />
  );
}

export function CharacterSelectScreen({
  accountUsername,
  soundEnabled,
  animationsEnabled = true,
  onToggleSound,
  onBackToLogin,
  onEnterWorld,
}: CharacterSelectScreenProps) {
  const [selectedId, setSelectedId] = useState<TamerId>('kai');
  const [tamerName, setTamerName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [direction, setDirection] = useState<CardinalDirection>('S');
  const [movementState, setMovementState] = useState<TamerMovementState>('walk');
  const [autoRotate, setAutoRotate] = useState(false);
  const [sheetsReadyTick, setSheetsReadyTick] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load saved character selection if returning player
  useEffect(() => {
    const existing = getSavedCharacterForAccount(accountUsername);
    if (existing) {
      setSelectedId(existing.characterId);
      setTamerName(existing.tamerName);
    }
  }, [accountUsername]);

  // Preload all 4 Tamer movement spritesheets immediately so every card animates smoothly
  useEffect(() => {
    let active = true;
    Promise.all(TAMER_CHARACTERS.map((char) => preloadTamerSheets(char.id))).then(
      () => {
        if (active) {
          setSheetsReadyTick((t) => t + 1);
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Optional smooth turntable rotation across all 4 directions
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

  const selectedCharacter = useMemo(
    () =>
      TAMER_CHARACTERS.find((c) => c.id === selectedId) ?? TAMER_CHARACTERS[0],
    [selectedId]
  );

  // Real Level 1 Tamer base attributes from hudGameService
  const lv1Stats = useMemo(
    () =>
      computeTamerAttributes(
        {
          level: 1,
          exp: 0,
          expToNext: 100,
          hp: 160,
          maxHp: 160,
          ds: 100,
          maxDs: 100,
        },
        {}
      ),
    []
  );

  function handleSelectCharacter(id: TamerId) {
    playDigitalTone('click', soundEnabled);
    setSelectedId(id);
    setFeedback(null);
  }

  function handleCycleCharacter(delta: -1 | 1) {
    const idx = TAMER_CHARACTERS.findIndex((c) => c.id === selectedId);
    const nextIdx =
      (idx + delta + TAMER_CHARACTERS.length) % TAMER_CHARACTERS.length;
    handleSelectCharacter(TAMER_CHARACTERS[nextIdx].id);
  }

  function handleNameChange(value: string) {
    setTamerName(value);
    setFeedback(null);
    if (nameTouched) {
      setNameError(validateTamerName(value));
    }
  }

  function handleNameBlur() {
    setNameTouched(true);
    setNameError(validateTamerName(tamerName));
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tamerNameErr = validateTamerName(tamerName);
    setNameTouched(true);
    setNameError(tamerNameErr);

    if (tamerNameErr) {
      playDigitalTone('error', soundEnabled);
      setFeedback({
        type: 'error',
        text: tamerNameErr,
      });
      return;
    }

    playDigitalTone('click', soundEnabled);
    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await saveCharacterForAccount({
        accountUsername,
        characterId: selectedId,
        tamerName,
      });

      if (result.success && result.saved) {
        playDigitalTone('confirm', soundEnabled);
        setFeedback({ type: 'success', text: result.message });
        onEnterWorld?.(result.saved);
      } else {
        playDigitalTone('error', soundEnabled);
        setFeedback({ type: 'error', text: result.message });
      }
    } catch {
      playDigitalTone('error', soundEnabled);
      setFeedback({
        type: 'error',
        text: 'Erro ao salvar personagem na conta. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const validationMessage = feedback?.text ?? nameError ?? null;

  return (
    <section
      aria-label="Escolha de Tamer"
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-gradient-to-b from-[#041438] via-[#061d4d] to-[#02091c] text-white"
    >
      {/* Atmospheric DATS Hangar Digital Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          style={{
            background: `radial-gradient(ellipse at 35% 18%, ${selectedCharacter.theme.glowRgba}, transparent 58%)`,
          }}
          className="absolute inset-0 opacity-45 transition-opacity duration-300"
        />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.28),transparent_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 opacity-20 [background-image:linear-gradient(to_right,rgba(56,232,255,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,232,255,0.45)_1px,transparent_1px)] [background-size:36px_26px] [transform:perspective(360px)_rotateX(58deg)]" />
      </div>

      {/* Top Navigation & Progress Header */}
      <header className="relative z-10 w-full border-b border-cyan-400/25 bg-[#03102e]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              onBackToLogin();
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-[#082154]/90 px-3 text-xs font-extrabold tracking-wide text-cyan-100 transition-colors hover:border-cyan-300 hover:bg-[#0d3075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <ChevronLeft className="h-4 w-4 text-cyan-300" />
            <span>Voltar</span>
          </button>

          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/90">
              Etapa 1 de 2 · Cadastro DATS
            </span>
            <h1 className="truncate font-[family-name:var(--font-display)] text-sm tracking-wider text-white sm:text-lg">
              ESCOLHA SEU TAMER
            </h1>
          </div>

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
      </header>

      {/* Fullscreen Responsive Body */}
      <form
        onSubmit={handleConfirm}
        noValidate
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-3.5 px-3 py-3 pb-6 sm:gap-4 sm:px-5 sm:py-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-6"
      >
        {/* Left Column: Live Animated Holographic Showcase + 4 Moving Tamer Cards */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          {/* Live Animated Hero Stage */}
          <div
            style={{
              borderColor: `${selectedCharacter.theme.accentHex}66`,
              boxShadow: `0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14)`,
            }}
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#071f52]/90 via-[#041438]/95 to-[#020a1f]/95 p-3 sm:p-4"
          >
            {/* Stage Top Bar: Character Code + Motion Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-100">
                <span
                  style={{ color: selectedCharacter.theme.accentHex }}
                  className="font-[family-name:var(--font-display)] tracking-wider"
                >
                  {selectedCharacter.code}
                </span>
                <span className="text-sky-300/50">·</span>
                <span className="text-sky-100/90">
                  {selectedCharacter.gender}
                </span>
                <span className="text-sky-300/50">·</span>
                <span className="text-amber-200/95">
                  {selectedCharacter.shortLabel}
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
                  className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
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
                  className={`inline-flex min-h-[42px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
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
                  <span className="hidden xs:inline">Girar</span>
                </button>
              </div>
            </div>

            {/* Central Holographic Pedestal with Prev/Next Arrows */}
            <div className="relative flex items-center justify-center py-1">
              <button
                type="button"
                aria-label="Tamer anterior"
                onClick={() => handleCycleCharacter(-1)}
                className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/35 bg-[#061c48]/85 text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-[#0d3278] active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <AnimatedTamerCanvas
                tamerId={selectedCharacter.id}
                accentHex={selectedCharacter.theme.accentHex}
                glowRgba={selectedCharacter.theme.glowRgba}
                direction={direction}
                movementState={movementState}
                animate={animationsEnabled}
                size="hero"
                sheetsReadyTick={sheetsReadyTick}
              />

              <button
                type="button"
                aria-label="Próximo Tamer"
                onClick={() => handleCycleCharacter(1)}
                className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/35 bg-[#061c48]/85 text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-[#0d3278] active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* 4-Direction Turntable Selector */}
            <div
              role="group"
              aria-label="Direção do personagem"
              className="mt-1 grid grid-cols-4 gap-1.5"
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
                    className={`min-h-[42px] rounded-lg border text-[11px] font-bold transition-colors ${
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
          </div>

          {/* 4 Live Animated Tamer Selector Cards */}
          <div
            role="radiogroup"
            aria-label="Lista de Tamers disponíveis"
            className="grid grid-cols-4 gap-1.5 sm:gap-3"
          >
            {TAMER_CHARACTERS.map((char) => {
              const isSelected = char.id === selectedId;
              return (
                <button
                  key={char.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectCharacter(char.id)}
                  style={{
                    borderColor: isSelected
                      ? '#fde047'
                      : `${char.theme.accentHex}45`,
                    boxShadow: isSelected
                      ? `0 0 22px ${char.theme.glowRgba}, inset 0 0 14px ${char.theme.glowRgba}`
                      : '0 6px 16px rgba(0, 0, 0, 0.38)',
                  }}
                  className={`group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border-2 bg-gradient-to-b ${char.theme.cardBgGradient} px-1 pb-2 pt-1.5 text-center transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                    isSelected
                      ? 'scale-[1.03] opacity-100'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-slate-950 shadow">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}

                  <AnimatedTamerCanvas
                    tamerId={char.id}
                    accentHex={char.theme.accentHex}
                    glowRgba={char.theme.glowRgba}
                    direction={isSelected ? direction : 'S'}
                    movementState="walk"
                    animate={animationsEnabled}
                    size="card"
                    sheetsReadyTick={sheetsReadyTick}
                  />

                  <div className="mt-0.5 w-full px-0.5">
                    <div
                      style={{ color: char.theme.accentHex }}
                      className="truncate font-[family-name:var(--font-display)] text-[11px] tracking-wide sm:text-xs"
                    >
                      {char.shortLabel}
                    </div>
                    <div className="text-[10px] font-semibold text-sky-200/80">
                      {char.gender}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: DATS Tamer Dossier, Real Lv.1 Stats & Name Form */}
        <div className="flex flex-col gap-3.5 rounded-2xl border border-cyan-400/35 bg-gradient-to-b from-[#071f52]/95 via-[#05163b]/95 to-[#030d26]/95 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.5)] sm:p-5 lg:col-span-5">
          {/* Tamer Identity */}
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300/90">
              <span>Dossiê do Agente</span>
              <span className="tabular-nums text-sky-200/80">
                Conta: {accountUsername}
              </span>
            </div>
            <h2
              style={{ color: selectedCharacter.theme.accentHex }}
              className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight tracking-wide sm:text-xl"
            >
              {selectedCharacter.archetypeTitle}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-sky-100/90 sm:text-[13px]">
              {selectedCharacter.appearanceSummary}.
            </p>
          </div>

          {/* Real Level 1 Tamer Base Attributes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200">
                Atributos Iniciais do Tamer
              </span>
              <span className="text-[11px] font-bold tabular-nums text-amber-300">
                Nv. 1 · Base DATS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  <span>HP</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.maxHp}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-cyan-300">
                  <Zap className="h-3 w-3" />
                  <span>DS</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.maxDs}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-300">
                  <Swords className="h-3 w-3" />
                  <span>AT</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.attack}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-sky-300">
                  <Shield className="h-3 w-3" />
                  <span>DE</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.defense}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-teal-300">
                  <Wind className="h-3 w-3" />
                  <span>Velocidade</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.speed}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#04112e]/90 px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-fuchsia-300">
                  <User className="h-3 w-3" />
                  <span>Crítico</span>
                </div>
                <div className="mt-0.5 text-sm font-black tabular-nums text-white">
                  {lv1Stats.critRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Tamer Name Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tamer-name-input"
                className="text-xs font-extrabold uppercase tracking-wider text-cyan-100"
              >
                Nome do Tamer
              </label>
              <span className="text-[11px] font-semibold tabular-nums text-sky-300/80">
                {tamerName.trim().length}/16
              </span>
            </div>

            <input
              id="tamer-name-input"
              name="tamerName"
              type="text"
              maxLength={16}
              autoComplete="nickname"
              value={tamerName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Digite o nome do seu Tamer..."
              aria-invalid={Boolean(nameError)}
              className={`min-h-[48px] w-full rounded-xl border-2 bg-[#020c26] px-3.5 text-base font-bold text-white placeholder:font-medium placeholder:text-sky-300/45 focus:outline-none focus:ring-2 sm:text-sm ${
                nameError
                  ? 'border-rose-400/80 focus:ring-rose-300/60'
                  : 'border-cyan-400/45 focus:border-cyan-300 focus:ring-cyan-300/40'
              }`}
            />

            {validationMessage ? (
              <div
                role={feedback?.type === 'success' ? 'status' : 'alert'}
                aria-live="polite"
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  feedback?.type === 'success'
                    ? 'border-emerald-400/50 bg-[#06291e] text-emerald-100'
                    : 'border-rose-400/50 bg-[#2e0b16] text-rose-100'
                }`}
              >
                {feedback?.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                )}
                <span>{validationMessage}</span>
              </div>
            ) : (
              <p className="text-[11px] text-sky-200/75">
                Use de 3 a 16 caracteres (letras, números ou espaço). A escolha do Tamer e do nome é definitiva para esta conta.
              </p>
            )}
          </div>

          {/* Primary Confirm CTA */}
          <button
            type="submit"
            disabled={isSaving}
            className="clip-cyber-btn mt-1 flex min-h-[54px] w-full items-center justify-center gap-2 border-2 border-amber-200/90 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] px-5 py-3 font-[family-name:var(--font-display)] text-sm tracking-wider text-slate-950 shadow-[0_0_26px_rgba(245,158,11,0.55)] transition-transform duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-wait disabled:opacity-75 sm:text-base"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>SALVANDO TAMER...</span>
              </>
            ) : (
              <>
                <span>CONFIRMAR TAMER</span>
                <ChevronRight className="h-5 w-5 stroke-[2.6]" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
