import { useState } from 'react';
import {
  ArrowUpCircle,
  Check,
  Coins,
  Database,
  Egg,
  Gem,
  HeartPulse,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import {
  DMO_HATCH_QUALITY_PROFILES,
  getHatchQualityProfile,
  listAllDataDefinitions,
  listAllDigiEggDefinitions,
} from '../../data/itemsCatalog';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import { DATA_FOREST_MAP_ID } from '../../maps/dataForestMap';
import { DATS_MAP_ID } from '../../maps/datsCenterMap';
import { HUNTING_MAP_ID } from '../../maps/huntingFieldMap';
import {
  BASIC_BITS_SHOP_ITEMS,
  DIGIMON_EVOLUTION_CHAINS,
  INVENTORY_MAX_SLOTS,
} from '../../services/hudGameService';
import { TAMER_CHARACTERS } from '../../sprites/tamerSprites';
import type { TamerId } from '../../types/character';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
  type StarterDigimonId,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  HatchQualityGrade,
  InventoryItem,
} from '../../types/hud';

type AdminPanelTab = 'digimons' | 'datas' | 'eggs' | 'itens';

interface AdminTestModalProps {
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  currentMapId: PlayableMapId;
  currentTamerId: TamerId;
  bits: number;
  dCoin: number;
  inventory: InventoryItem[];
  onSetDigimonLevel: (level: number) => void;
  onAddDigimonExp: (expAmount: number) => void;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onPullAnyDigimon: (formId: DigimonFormId, grade: HatchQualityGrade) => void;
  onSetHatchGrade: (grade: HatchQualityGrade) => void;
  onGrantItem: (itemKey: string, quantity: number, eggHatchLevel?: number) => void;
  onGrantAllDatas: (quantityEach: number) => void;
  onGrantAllEggs: (eggHatchLevel: number) => void;
  onGrantCurrency: (bitsDelta: number, dCoinDelta: number) => void;
  onClearInventory: () => void;
  onSwitchTamer?: (tamerId: TamerId) => void;
  onOpenSelectionFlow?: (screen: 'character-select' | 'digimon-select') => void;
  onRestoreVitals: () => void;
  onTravelToMap: (mapId: PlayableMapId) => void;
  onClose: () => void;
}

const STARTER_LINE_META: ReadonlyArray<{
  id: StarterDigimonId;
  label: string;
  dotClass: string;
}> = [
  { id: 'agumon', label: 'Linha Fogo (Agumon)', dotClass: 'bg-amber-400' },
  { id: 'gaomon', label: 'Linha Velocidade (Gaomon)', dotClass: 'bg-sky-400' },
  { id: 'lalamon', label: 'Linha Natureza (Lalamon)', dotClass: 'bg-emerald-400' },
  { id: 'guilmon', label: 'Linha Vírus (Guilmon)', dotClass: 'bg-rose-500' },
];

export function AdminTestModal({
  digimon,
  digimonStats,
  currentMapId,
  currentTamerId,
  bits,
  dCoin,
  inventory,
  onSetDigimonLevel,
  onAddDigimonExp,
  onPullAnyDigimon,
  onSetHatchGrade,
  onGrantItem,
  onGrantAllDatas,
  onGrantAllEggs,
  onGrantCurrency,
  onClearInventory,
  onSwitchTamer,
  onOpenSelectionFlow,
  onRestoreVitals,
  onTravelToMap,
  onClose,
}: AdminTestModalProps) {
  const [activeTab, setActiveTab] = useState<AdminPanelTab>('digimons');
  const [customLevel, setCustomLevel] = useState(String(digimonStats.level));
  const [selectedEggLevel, setSelectedEggLevel] = useState<0 | 3 | 4 | 5>(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const activeQuality = getHatchQualityProfile(digimonStats.hatchGrade);
  const allDatas = listAllDataDefinitions();
  const allEggs = listAllDigiEggDefinitions();

  const handleApplyCustomLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(customLevel, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(1, Math.min(99, parsed));
    setCustomLevel(String(clamped));
    onSetDigimonLevel(clamped);
  };

  function getOwnedQty(itemKey: string, eggHatchLevel?: number): number {
    return inventory
      .filter(
        (item) =>
          item.itemKey === itemKey &&
          (eggHatchLevel === undefined ||
            (item.eggData?.hatchLevel ?? 0) === eggHatchLevel)
      )
      .reduce((acc, i) => acc + i.quantity, 0);
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Painel Mestre de Tudo do Jogo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/72 p-2 backdrop-blur-xs sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/85 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_38px_rgba(0,174,255,0.58)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-400/40 bg-[#082d7a] px-3.5 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/70 bg-amber-500/20 text-amber-300">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black tracking-wide text-white">
                Painel Mestre · Tudo do Jogo
              </h2>
              <p className="truncate text-[10px] font-semibold text-cyan-200/85">
                Puxe qualquer Digimon, Egg, DATA, Item ou Mapa · [F9]
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel mestre"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/70 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/25 bg-[#041232] px-3.5 py-1.5 text-[10.5px] font-bold">
          <div className="flex items-center gap-1.5">
            <span style={{ color: digimon.theme.accentHex }} className="font-black">
              {digimon.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums text-white">Nv.{digimonStats.level}</span>
            <span
              style={{ color: activeQuality.badgeColor }}
              className="rounded border border-white/15 bg-slate-900/80 px-1.5 py-0.5 text-[9.5px] font-black"
            >
              {activeQuality.label}
            </span>
          </div>
          <div className="flex items-center gap-2.5 tabular-nums">
            <span className="text-amber-300">{bits.toLocaleString('pt-BR')} Bits</span>
            <span className="text-cyan-300">{dCoin.toLocaleString('pt-BR')} D-Coin</span>
            <span className="text-slate-300">
              Mochila {inventory.length}/{INVENTORY_MAX_SLOTS}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Categorias do painel mestre"
          className="grid grid-cols-4 gap-1 border-b border-cyan-400/30 bg-[#051946] p-1.5"
        >
          {(
            [
              { id: 'digimons', label: 'Digimons', icon: Sparkles },
              { id: 'datas', label: 'DATAs', icon: Database },
              { id: 'eggs', label: 'DigiEggs', icon: Egg },
              { id: 'itens', label: 'Itens/Mapas', icon: Package },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[42px] items-center justify-center gap-1 rounded-xl border px-1.5 text-[11px] font-black transition active:scale-95 sm:text-xs ${
                  active
                    ? 'border-amber-300 bg-gradient-to-b from-amber-400/25 to-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                    : 'border-cyan-400/20 bg-[#041232]/85 text-sky-200 hover:border-cyan-300/45 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs text-sky-100 sm:p-4">
          {activeTab === 'digimons' && (
            <>
              {/* Active Quality Selector (3/5, 4/5, 5/5) */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    Qualidade do Digimon (DMO)
                  </span>
                  <span
                    style={{ color: activeQuality.badgeColor }}
                    className="text-[11px] font-black"
                  >
                    {activeQuality.label} · {activeQuality.qualityName}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {([3, 4, 5] as const).map((grade) => {
                    const prof = DMO_HATCH_QUALITY_PROFILES[grade];
                    const selected = activeQuality.grade === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => onSetHatchGrade(grade)}
                        style={
                          selected
                            ? { borderColor: prof.badgeColor }
                            : undefined
                        }
                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-2 py-1 text-center transition active:scale-95 ${
                          selected
                            ? 'bg-[#0a2f7d]/80 text-white shadow'
                            : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                        }`}
                      >
                        <span
                          style={{ color: prof.badgeColor }}
                          className="text-xs font-black"
                        >
                          {prof.label}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-200">
                          {prof.qualityName} ({prof.statMultiplier.toFixed(2)}×)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All 16 Playable Digimons across all 4 lines */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Puxar Qualquer Digimon (16 Formas)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    Usa {activeQuality.label}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2.5">
                  {STARTER_LINE_META.map((line) => {
                    const chain = DIGIMON_EVOLUTION_CHAINS[line.id];
                    return (
                      <div key={line.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-0.5">
                          <span className={`h-2 w-2 rounded-full ${line.dotClass}`} />
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-200">
                            {line.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          {chain.map((step) => {
                            if (!step.formId) return null;
                            const form = getDigimonFormProfile(step.formId);
                            const isActive = form.id === digimon.id;
                            return (
                              <button
                                key={form.id}
                                type="button"
                                onClick={() =>
                                  onPullAnyDigimon(form.id, activeQuality.grade)
                                }
                                style={
                                  isActive
                                    ? {
                                        borderColor: form.theme.accentHex,
                                        boxShadow: `0 0 12px ${form.theme.glowRgba}`,
                                      }
                                    : undefined
                                }
                                className={`relative flex min-h-[84px] flex-col items-center justify-between rounded-xl border p-1.5 text-center transition active:scale-95 ${
                                  isActive
                                    ? 'bg-[#0a2f7d]/80 text-white'
                                    : 'border-cyan-400/20 bg-[#061844]/90 text-slate-200 hover:border-cyan-300/60 hover:bg-[#09245e]'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-slate-950">
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  </span>
                                )}
                                <img
                                  src={form.portraitUrl}
                                  alt={form.name}
                                  referrerPolicy="no-referrer"
                                  className="h-10 w-10 object-contain drop-shadow"
                                />
                                <div className="w-full">
                                  <p className="truncate text-[10px] font-black text-white">
                                    {form.name}
                                  </p>
                                  <p className="text-[9px] font-bold text-amber-300/90">
                                    {form.stage} · Nv.{form.unlockLevel}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Level & Vitals Controls */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <ArrowUpCircle className="h-4 w-4 text-amber-300" />
                    Nível, EXP e Vitais
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLevel('1');
                      onSetDigimonLevel(1);
                    }}
                    className="flex min-h-[30px] items-center gap-1 rounded-lg border border-rose-400/50 bg-rose-950/70 px-2 text-[10px] font-extrabold text-rose-200 hover:bg-rose-900"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Nv.1</span>
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[
                    { label: '+1 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 1)) },
                    { label: '+5 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 5)) },
                    { label: '+10 Nv.', fn: () => onSetDigimonLevel(Math.min(99, digimonStats.level + 10)) },
                    { label: '+600 EXP', fn: () => onAddDigimonExp(600), emerald: true },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={btn.fn}
                      className={`min-h-[40px] rounded-lg border font-black active:scale-95 ${
                        btn.emerald
                          ? 'border-emerald-400/55 bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                          : 'border-cyan-300/50 bg-[#082c74] text-white hover:bg-sky-700'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[1, 15, 30, 50].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => {
                        setCustomLevel(String(lv));
                        onSetDigimonLevel(lv);
                      }}
                      className={`min-h-[38px] rounded-lg border text-[11px] font-black transition active:scale-95 ${
                        digimonStats.level === lv
                          ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                          : 'border-cyan-400/40 bg-[#061d52] text-cyan-100 hover:bg-[#0b3185]'
                      }`}
                    >
                      Nv. {lv}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleApplyCustomLevel}
                  className="mt-2 flex items-center gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    aria-label="Nível exato"
                    className="h-10 w-20 rounded-lg border border-cyan-400/50 bg-[#020b22] px-2 text-center text-base font-black tabular-nums text-white outline-none focus:border-amber-300 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="h-10 flex-1 rounded-lg border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[11px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                  >
                    Definir Nível
                  </button>
                </form>

                <button
                  type="button"
                  onClick={onRestoreVitals}
                  className="mt-2 flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-950/75 px-3 font-extrabold text-emerald-200 hover:bg-emerald-900 active:scale-95"
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>Restaurar 100% HP / DS & Recargas</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'datas' && (
            <>
              <div className="flex flex-col gap-2 rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-white">
                      Todas as 9 DATAs Oficiais
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Puxe quantas DATAs quiser para testar a Incubadora do DATS.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onGrantAllDatas(50)}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
                >
                  <Database className="h-4 w-4" />
                  <span>Puxar Todas as 9 DATAs (+50 cada)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allDatas.map((dataItem) => {
                  const owned = getOwnedQty(dataItem.itemKey);
                  return (
                    <div
                      key={dataItem.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={dataItem.iconUrl}
                          alt={dataItem.name}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-white/15 bg-[#02091c] object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p
                            style={{ color: dataItem.accentColor }}
                            className="truncate text-xs font-black"
                          >
                            {dataItem.name}
                          </p>
                          <p className="text-[10px] font-bold tabular-nums text-slate-300">
                            Na mochila: {owned}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {[1, 10, 50].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => onGrantItem(dataItem.itemKey, qty)}
                            className="min-h-[38px] min-w-[36px] rounded-lg border border-cyan-300/50 bg-[#082c74] px-1.5 text-[10.5px] font-black text-white hover:bg-sky-700 active:scale-95"
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'eggs' && (
            <>
              {/* Target Egg Stage Selector */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    Estágio ao Puxar DigiEgg
                  </span>
                  <span className="text-[10.5px] font-bold text-amber-300">
                    {selectedEggLevel === 0
                      ? '0/5 Base (Para injetar DATA)'
                      : `${selectedEggLevel}/5 Pronto para Chocar`}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {([0, 3, 4, 5] as const).map((lv) => {
                    const active = selectedEggLevel === lv;
                    const label = lv === 0 ? '0/5 Base' : `${lv}/5`;
                    const sub =
                      lv === 0
                        ? 'Injetar'
                        : lv === 3
                          ? 'Aceitável'
                          : lv === 4
                            ? 'Forte'
                            : 'Muito Forte';
                    return (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setSelectedEggLevel(lv)}
                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-1 text-center transition active:scale-95 ${
                          active
                            ? 'border-amber-300 bg-amber-500/25 text-amber-100'
                            : 'border-cyan-400/25 bg-[#061844] text-slate-300 hover:border-cyan-300/55'
                        }`}
                      >
                        <span className="text-[11px] font-black">{label}</span>
                        <span className="text-[9px] font-bold opacity-85">{sub}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onGrantAllEggs(selectedEggLevel)}
                  className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/75 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-3 text-xs font-black uppercase text-white shadow hover:brightness-110 active:scale-95"
                >
                  <Egg className="h-4 w-4" />
                  <span>
                    Puxar Todos os 9 DigiEggs ({selectedEggLevel}/5)
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allEggs.map((eggItem) => {
                  const ownedAtGrade = getOwnedQty(eggItem.itemKey, selectedEggLevel);
                  const reqQty = eggItem.eggData?.requiredDataQuantity ?? 5;
                  return (
                    <div
                      key={eggItem.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={eggItem.iconUrl}
                          alt={eggItem.name}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 shrink-0 rounded-lg border border-white/15 bg-[#02091c] object-contain p-0.5"
                        />
                        <div className="min-w-0">
                          <p
                            style={{ color: eggItem.accentColor }}
                            className="truncate text-xs font-black"
                          >
                            {eggItem.name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-300">
                            Usa DATA {eggItem.dataType?.toUpperCase()} (×{reqQty}) · Possui:{' '}
                            <strong className="text-white">{ownedAtGrade}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onGrantItem(eggItem.itemKey, 1, selectedEggLevel)
                        }
                        className="min-h-[40px] shrink-0 rounded-lg border border-amber-300/75 bg-amber-500/20 px-2.5 text-[11px] font-black text-amber-200 hover:bg-amber-500/35 active:scale-95"
                      >
                        +1 ({selectedEggLevel}/5)
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'itens' && (
            <>
              {/* Currency Spawner */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                  <Coins className="h-4 w-4 text-amber-300" />
                  <span>Moedas & Economia</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(1000, 0)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-amber-300/60 bg-amber-500/20 px-2 text-[11px] font-black text-amber-200 hover:bg-amber-500/30 active:scale-95"
                  >
                    <Coins className="h-3.5 w-3.5 shrink-0" />
                    <span>+1k Bits</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(50000, 0)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-amber-300/75 bg-amber-500/25 px-2 text-[11px] font-black text-amber-100 hover:bg-amber-500/35 active:scale-95"
                  >
                    <Coins className="h-3.5 w-3.5 shrink-0" />
                    <span>+50k Bits</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGrantCurrency(0, 500)}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-cyan-300/75 bg-cyan-500/20 px-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-500/30 active:scale-95"
                  >
                    <Gem className="h-3.5 w-3.5 shrink-0" />
                    <span>+500 D-Coin</span>
                  </button>
                </div>
              </div>

              {/* Shop & Equipment Items */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>Consumíveis & Equipamentos</span>
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-slate-300">
                    {inventory.length}/{INVENTORY_MAX_SLOTS} slots
                  </span>
                </div>

                <div className="space-y-1.5">
                  {BASIC_BITS_SHOP_ITEMS.map((item) => (
                    <div
                      key={item.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-[#061844] px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-white">
                          {item.name}
                        </p>
                        <p className="truncate text-[10px] text-slate-300">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onGrantItem(item.itemKey, 1)}
                          className="min-h-[38px] rounded-lg border border-cyan-300/55 bg-[#082c74] px-2.5 text-[10.5px] font-black text-white hover:bg-sky-700 active:scale-95"
                        >
                          +1
                        </button>
                        {item.category === 'consumable' && (
                          <button
                            type="button"
                            onClick={() => onGrantItem(item.itemKey, 10)}
                            className="min-h-[38px] rounded-lg border border-emerald-400/55 bg-emerald-900/60 px-2.5 text-[10.5px] font-black text-emerald-200 hover:bg-emerald-800 active:scale-95"
                          >
                            +10
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {inventory.length > 0 && (
                  <div className="mt-2.5">
                    {!confirmClear ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-950/60 px-3 text-[11px] font-extrabold text-rose-200 hover:bg-rose-900/75"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Esvaziar Mochila ({inventory.length} itens)</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="min-h-[40px] rounded-xl border border-cyan-400/40 bg-[#072158] font-bold text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClearInventory();
                            setConfirmClear(false);
                          }}
                          className="min-h-[40px] rounded-xl border border-rose-300 bg-rose-600 font-black text-white"
                        >
                          Confirmar Limpeza
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tamer Switcher & Selection Screens Preview */}
              {(onSwitchTamer || onOpenSelectionFlow) && (
                <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                  {onSwitchTamer && (
                    <>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                        <UserCheck className="h-4 w-4 text-sky-300" />
                        <span>Trocar Tamer</span>
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TAMER_CHARACTERS.map((t) => {
                          const active = t.id === currentTamerId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onSwitchTamer(t.id)}
                              className={`min-h-[40px] rounded-lg border px-1 text-[11px] font-black transition active:scale-95 ${
                                active
                                  ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                                  : 'border-cyan-400/30 bg-[#061844] text-sky-100 hover:bg-[#0b2a6b]'
                              }`}
                            >
                              {t.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {onOpenSelectionFlow && (
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSelectionFlow('character-select');
                        }}
                        className="min-h-[40px] rounded-lg border border-cyan-400/40 bg-[#061844] px-2 text-[10.5px] font-extrabold text-cyan-100 hover:bg-[#0b2a6b]"
                      >
                        Tela Escolha de Tamer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSelectionFlow('digimon-select');
                        }}
                        className="min-h-[40px] rounded-lg border border-cyan-400/40 bg-[#061844] px-2 text-[10.5px] font-extrabold text-cyan-100 hover:bg-[#0b2a6b]"
                      >
                        Tela Escolha de Inicial
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Map Teleporter */}
              <div className="rounded-xl border border-cyan-400/35 bg-[#041232] p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  <span>Teleporte Rápido GM</span>
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
                        className={`flex min-h-[46px] flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center transition active:scale-95 ${
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
