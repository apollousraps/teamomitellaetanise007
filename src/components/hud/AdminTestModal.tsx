import { useState } from 'react';
import {
  ArrowUpCircle,
  HeartPulse,
  Lock,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Wrench,
  X,
} from 'lucide-react';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import { DATA_FOREST_MAP_ID } from '../../maps/dataForestMap';
import { DATS_MAP_ID } from '../../maps/datsCenterMap';
import { HUNTING_MAP_ID } from '../../maps/huntingFieldMap';
import { DIGIMON_EVOLUTION_CHAINS } from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
} from '../../types/digimon';
import type { DigimonRuntimeStats } from '../../types/hud';

interface AdminTestModalProps {
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  currentMapId: PlayableMapId;
  onSetDigimonLevel: (level: number) => void;
  onAddDigimonExp: (expAmount: number) => void;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onRestoreVitals: () => void;
  onTravelToMap: (mapId: PlayableMapId) => void;
  onClose: () => void;
}

export function AdminTestModal({
  digimon,
  digimonStats,
  currentMapId,
  onSetDigimonLevel,
  onAddDigimonExp,
  onEvolveForm,
  onRestoreVitals,
  onTravelToMap,
  onClose,
}: AdminTestModalProps) {
  const [customLevel, setCustomLevel] = useState(String(digimonStats.level));
  const evoChain = DIGIMON_EVOLUTION_CHAINS[digimon.starterId];

  const handleApplyCustomLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(customLevel, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(1, Math.min(99, parsed));
    setCustomLevel(String(clamped));
    onSetDigimonLevel(clamped);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Painel Administrativo de Testes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/68 p-2 sm:p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/85 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_38px_rgba(0,174,255,0.58)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-400/40 bg-[#082d7a] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300/70 bg-amber-500/20 text-amber-300">
              <Wrench className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white">
                Painel Administrativo (GM)
              </h2>
              <p className="text-[10px] font-semibold text-cyan-200/85">
                Teste rápido de Nível & Evoluções · Atalho [F9]
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel administrativo"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/70 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-3 overflow-y-auto p-3.5 text-xs text-sky-100 sm:p-4">
          {/* Current Digimon Summary */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/35 bg-[#041232] p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={digimon.portraitUrl}
                alt={digimon.name}
                className="h-11 w-11 shrink-0 rounded-lg border border-cyan-300/40 bg-[#072056] object-contain p-0.5"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate text-sm font-black"
                    style={{ color: digimon.theme.accentHex }}
                  >
                    {digimon.name}
                  </span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-cyan-200">
                    {digimon.stage}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-amber-300">
                  Nível {digimonStats.level} · HP {Math.round(digimonStats.hp)}/
                  {digimonStats.maxHp} · DS {Math.round(digimonStats.ds)}/
                  {digimonStats.maxDs}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCustomLevel('1');
                onSetDigimonLevel(1);
              }}
              title="Resetar Digimon para o Nível 1"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-400/50 bg-rose-950/70 px-2 py-1.5 text-[10px] font-extrabold text-rose-200 hover:bg-rose-900 active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Nv. 1</span>
            </button>
          </div>

          {/* 1. Level Controls */}
          <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wide text-cyan-200">
                <ArrowUpCircle className="h-4 w-4 text-amber-300" />
                Controle de Nível do Digimon
              </span>
              <span className="text-[10px] font-bold tabular-nums text-slate-300">
                EXP {digimonStats.exp}/{digimonStats.expToNext}
              </span>
            </div>

            {/* Increment Buttons */}
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(99, digimonStats.level + 1);
                  setCustomLevel(String(next));
                  onSetDigimonLevel(next);
                }}
                className="min-h-[34px] rounded-lg border border-cyan-300/50 bg-[#082c74] font-black text-white hover:bg-sky-700 active:scale-95"
              >
                +1 Nv.
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(99, digimonStats.level + 5);
                  setCustomLevel(String(next));
                  onSetDigimonLevel(next);
                }}
                className="min-h-[34px] rounded-lg border border-cyan-300/50 bg-[#082c74] font-black text-white hover:bg-sky-700 active:scale-95"
              >
                +5 Nv.
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(99, digimonStats.level + 10);
                  setCustomLevel(String(next));
                  onSetDigimonLevel(next);
                }}
                className="min-h-[34px] rounded-lg border border-cyan-300/50 bg-[#082c74] font-black text-white hover:bg-sky-700 active:scale-95"
              >
                +10 Nv.
              </button>
              <button
                type="button"
                onClick={() => onAddDigimonExp(600)}
                className="min-h-[34px] rounded-lg border border-emerald-400/55 bg-emerald-900/60 font-black text-emerald-200 hover:bg-emerald-800 active:scale-95"
              >
                +600 EXP
              </button>
            </div>

            {/* Evolution Milestone Presets */}
            <p className="mt-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300/85">
              Atalhos de Nível para Evolução:
            </p>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {[
                { lv: 1, label: 'Nv. 1' },
                { lv: 15, label: 'Nv. 15' },
                { lv: 30, label: 'Nv. 30' },
                { lv: 50, label: 'Nv. 50' },
              ].map((preset) => {
                const active = digimonStats.level === preset.lv;
                return (
                  <button
                    key={preset.lv}
                    type="button"
                    onClick={() => {
                      setCustomLevel(String(preset.lv));
                      onSetDigimonLevel(preset.lv);
                    }}
                    className={`min-h-[32px] rounded-lg border text-[11px] font-black transition active:scale-95 ${
                      active
                        ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                        : 'border-cyan-400/40 bg-[#061d52] text-cyan-100 hover:bg-[#0b3185]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Exact Level Form */}
            <form
              onSubmit={handleApplyCustomLevel}
              className="mt-2.5 flex items-center gap-2"
            >
              <label
                htmlFor="admin-custom-level"
                className="shrink-0 text-[11px] font-bold text-slate-200"
              >
                Nível exato (1–99):
              </label>
              <input
                id="admin-custom-level"
                type="number"
                min={1}
                max={99}
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value)}
                className="h-8 w-20 rounded-lg border border-cyan-400/50 bg-[#020b22] px-2 text-center font-black tabular-nums text-white outline-none focus:border-amber-300"
              />
              <button
                type="submit"
                className="h-8 flex-1 rounded-lg border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[11px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
              >
                Definir Nível
              </button>
            </form>
          </div>

          {/* 2. Evolution Line Tester */}
          <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wide text-cyan-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Testar Evoluções ({digimon.starterId.toUpperCase()})
              </span>
              <span className="text-[10px] font-semibold text-slate-300">
                Trava de nível ativa
              </span>
            </div>

            <div className="mt-2 space-y-1.5">
              {evoChain.map((step) => {
                const isActive = step.formId === digimon.id;
                const unlocked = digimonStats.level >= step.unlockLevel;
                const formProfile = step.formId
                  ? getDigimonFormProfile(step.formId)
                  : null;

                return (
                  <div
                    key={step.name}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2 ${
                      isActive
                        ? 'border-amber-300/80 bg-[#0a2f7d]/70'
                        : unlocked
                          ? 'border-emerald-400/40 bg-[#06224b]/80'
                          : 'border-cyan-400/20 bg-[#030d26]/85'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {formProfile ? (
                        <img
                          src={formProfile.portraitUrl}
                          alt={step.name}
                          loading="eager"
                          referrerPolicy="no-referrer"
                          className={`h-10 w-10 shrink-0 rounded-lg border border-cyan-300/50 bg-[#061f5c] object-contain p-0.5 ${
                            !unlocked ? 'opacity-85' : ''
                          }`}
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-[#031030]">
                          <Lock className="h-4 w-4 text-cyan-300/60" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-extrabold text-white">
                            {step.name}
                          </span>
                          <span className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[8.5px] font-bold text-cyan-200">
                            {step.stage}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-300">
                          Requisito: Nível {step.unlockLevel}
                          {formProfile
                            ? ` · ${formProfile.special1Name} / ${formProfile.special2Name}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-300/60 bg-amber-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Ativa
                      </span>
                    ) : step.playable && step.formId ? (
                      <button
                        type="button"
                        onClick={() => onEvolveForm(step.formId!)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase transition active:scale-95 ${
                          unlocked
                            ? 'border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow hover:brightness-110'
                            : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {unlocked ? 'Evoluir' : `Req. Nv.${step.unlockLevel}`}
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[9.5px] font-bold text-slate-400">
                        Em breve
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Quick Utility Actions & Direct Map Teleporter */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onRestoreVitals}
              className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-950/75 px-3 font-extrabold text-emerald-200 hover:bg-emerald-900 active:scale-95"
            >
              <HeartPulse className="h-4 w-4" />
              <span>Restaurar 100% HP / DS</span>
            </button>

            <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                <MapPin className="h-3.5 w-3.5 text-amber-300" />
                Teleporte Rápido GM
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: DATS_MAP_ID as PlayableMapId, label: 'DATS Center', sub: 'Safe' },
                  { id: HUNTING_MAP_ID as PlayableMapId, label: 'Planície', sub: 'Lv. 1–10' },
                  { id: DATA_FOREST_MAP_ID as PlayableMapId, label: 'Floresta', sub: 'Lv. 10–20' },
                ].map((dest) => {
                  const isHere = currentMapId === dest.id;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      disabled={isHere}
                      onClick={() => {
                        onTravelToMap(dest.id);
                        onClose();
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center transition active:scale-95 ${
                        isHere
                          ? 'border-amber-300/80 bg-amber-500/20 text-amber-200'
                          : 'border-cyan-400/45 bg-[#082c74] text-white hover:bg-sky-700'
                      }`}
                    >
                      <span className="flex items-center gap-1 text-[10.5px] font-black leading-tight">
                        {dest.id !== DATS_MAP_ID && <Swords className="h-3 w-3 text-amber-300" />}
                        {dest.label}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold text-cyan-200/85">
                        {isHere ? 'Atual' : dest.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
