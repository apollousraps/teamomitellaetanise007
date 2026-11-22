import { useMemo, useState } from 'react';
import {
  Cpu,
  HeartPulse,
  Package,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  enrichInventoryItem,
  getDataItemDefinition,
  getDigiEggDefinition,
  getHatchQualityProfile,
  ITEM_RARITY_META,
  MIN_HATCHABLE_LEVEL,
} from '../../data/itemsCatalog';
import { INVENTORY_MAX_SLOTS } from '../../services/hudGameService';
import type { InventoryCategory, InventoryItem } from '../../types/hud';

interface InventoryHudWindowProps {
  open: boolean;
  items: InventoryItem[];
  bits: number;
  dCoin: number;
  onClose: () => void;
  onUseItem: (item: InventoryItem) => void;
  onEquipItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem) => void;
}

const TABS: ReadonlyArray<{ id: InventoryCategory; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'data', label: 'DATA' },
  { id: 'digiegg', label: 'DigiEggs' },
  { id: 'other', label: 'Outros Mat.' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'equip', label: 'Equip.' },
] as const;

const CATEGORY_LABELS: Record<Exclude<InventoryCategory, 'all'>, string> = {
  data: 'DATA',
  digiegg: 'DigiEgg',
  other: 'Outros Materiais',
  consumable: 'Consumível',
  equip: 'Equipamento',
};

function renderItemIcon(item: InventoryItem, large = false) {
  if (item.iconUrl) {
    return (
      <img
        src={item.iconUrl}
        alt={item.name}
        draggable={false}
        className={`${
          large ? 'h-14 w-14' : 'h-[88%] w-[88%]'
        } object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]`}
      />
    );
  }
  const iconSize = large ? 'h-8 w-8' : 'h-5 w-5';
  if (item.hpRestore) return <HeartPulse className={`${iconSize} text-emerald-300`} />;
  if (item.dsRestore) return <Zap className={`${iconSize} text-cyan-300`} />;
  if (item.category === 'equip') return <Cpu className={`${iconSize} text-amber-300`} />;
  return <Package className={`${iconSize} text-sky-300`} />;
}

export function InventoryHudWindow({
  open,
  items,
  bits,
  dCoin,
  onClose,
  onUseItem,
  onEquipItem,
  onDiscardItem,
}: InventoryHudWindowProps) {
  const [activeTab, setActiveTab] = useState<InventoryCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enrichedItems = useMemo(
    () => items.map(enrichInventoryItem),
    [items]
  );

  if (!open) return null;

  const filteredItems = enrichedItems.filter((item) =>
    activeTab === 'all' ? true : item.category === activeTab
  );
  const selectedItem =
    filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null;

  const slots = Array.from({ length: INVENTORY_MAX_SLOTS }, (_, idx) => {
    return filteredItems[idx] ?? null;
  });

  const selectedRarity = selectedItem
    ? ITEM_RARITY_META[selectedItem.rarity ?? 'comum']
    : null;

  const selectedMatchingData =
    selectedItem?.category === 'digiegg' && selectedItem.dataType
      ? getDataItemDefinition(selectedItem.dataType)
      : null;

  const selectedMatchingEgg =
    selectedItem?.category === 'data' && selectedItem.dataType
      ? getDigiEggDefinition(selectedItem.dataType)
      : null;

  const ownedMatchingDataQty = selectedMatchingData
    ? enrichedItems
        .filter((i) => i.itemKey === selectedMatchingData.itemKey)
        .reduce((acc, i) => acc + i.quantity, 0)
    : 0;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Inventário do Tamer"
      className="pointer-events-auto dmo-frame w-[306px] overflow-hidden rounded-2xl sm:w-[342px] select-none"
    >
      {/* Header */}
      <div className="relative flex items-center justify-center border-b border-cyan-300/45 bg-gradient-to-b from-[#135ee3] to-[#083082] px-3 py-1.5">
        <span className="text-sm font-extrabold tracking-wide text-white drop-shadow">
          Inventário
        </span>
        <span className="ml-1.5 rounded bg-[#020a24]/70 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-cyan-200">
          {items.length}/{INVENTORY_MAX_SLOTS}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar inventário"
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-200 bg-gradient-to-b from-[#23b6ff] to-[#0447b0] text-white shadow hover:brightness-110"
        >
          <X className="h-3.5 w-3.5 stroke-[2.8]" />
        </button>
      </div>

      {/* Organized Category Filter Tabs (DATA, DigiEggs, Outros Materiais, Consumíveis, Equip.) */}
      <div className="grid grid-cols-3 gap-1 px-2 pt-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count =
            tab.id === 'all'
              ? enrichedItems.length
              : enrichedItems.filter((i) => i.category === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[9.5px] font-extrabold transition-all ${
                active
                  ? 'border-[#8befff] bg-gradient-to-b from-[#2eb8ff] to-[#0b68e6] text-white shadow-[0_0_8px_rgba(56,232,255,0.5)]'
                  : 'border-cyan-400/50 bg-gradient-to-b from-[#0b42a3] to-[#05205c] text-cyan-100/90 hover:text-white'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {count > 0 && (
                <span className="rounded bg-[#020a24]/65 px-1 text-[8px] font-black tabular-nums text-cyan-200">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 36-Slot Grid (6 columns, clean scrollable body for compact height) */}
      <div className="grid max-h-[192px] grid-cols-6 gap-1.5 overflow-y-auto p-2.5">
        {slots.map((item, idx) => {
          const isSelected = item && selectedItem?.id === item.id;
          const rarityMeta = item ? ITEM_RARITY_META[item.rarity ?? 'comum'] : null;
          return (
            <button
              key={item ? item.id : `empty-${idx}`}
              type="button"
              onClick={() => item && setSelectedId(item.id)}
              disabled={!item}
              title={item ? `${item.name} (x${item.quantity})` : 'Slot vazio'}
              style={
                item && !isSelected && rarityMeta
                  ? { borderColor: `${rarityMeta.borderHex}99` }
                  : undefined
              }
              className={`dmo-well relative flex aspect-square items-center justify-center overflow-hidden rounded-md p-0.5 transition-all ${
                item
                  ? isSelected
                    ? 'border-amber-300 shadow-[0_0_10px_rgba(255,212,59,0.7)]'
                    : 'hover:border-cyan-200'
                  : 'opacity-75'
              }`}
            >
              {item ? (
                <>
                  {renderItemIcon(item)}
                  {item.category === 'digiegg' && (
                    <span
                      className={`absolute left-0.5 top-0.5 rounded px-1 text-[7.5px] font-black leading-tight tabular-nums ${
                        (item.eggData?.hatchLevel ?? 0) >= 5
                          ? 'bg-amber-950/95 text-amber-200'
                          : (item.eggData?.hatchLevel ?? 0) === 4
                            ? 'bg-purple-950/95 text-purple-200'
                            : (item.eggData?.hatchLevel ?? 0) === 3
                              ? 'bg-emerald-950/95 text-emerald-200'
                              : 'bg-[#020816]/92 text-slate-300'
                      }`}
                    >
                      {item.eggData?.hatchLevel ?? 0}/5
                    </span>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-[#020816]/92 px-1 text-[8.5px] font-black leading-tight tabular-nums text-white">
                    {item.quantity}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Detailed Selected Item Inspector Panel */}
      {selectedItem ? (
        <div className="dmo-well mx-2.5 mb-2 rounded-xl p-2.5 text-[10.5px]">
          <div className="flex items-start gap-2.5">
            {/* Enlarged Official Item Preview */}
            <div
              style={
                selectedRarity
                  ? {
                      borderColor: selectedRarity.borderHex,
                      boxShadow: `0 0 14px ${selectedRarity.glowRgba}`,
                    }
                  : undefined
              }
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border bg-[#030e2b] p-1"
            >
              {renderItemIcon(selectedItem, true)}
            </div>

            {/* Name, Type, Rarity, Quantity */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1">
                <p className="truncate text-[11.5px] font-black text-amber-200">
                  {selectedItem.name}
                </p>
                {selectedRarity && (
                  <span
                    className={`rounded border px-1.5 py-0.2 text-[8.5px] font-extrabold uppercase ${selectedRarity.badgeClass}`}
                  >
                    {selectedRarity.label}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[9.5px] font-bold text-cyan-200">
                <span>Tipo: {CATEGORY_LABELS[selectedItem.category]}</span>
                <span>·</span>
                <span className="tabular-nums text-white">
                  Qtd: x{selectedItem.quantity}
                </span>
                {selectedItem.category === 'digiegg' && (
                  <>
                    <span>·</span>
                    <span className="tabular-nums text-amber-200">
                      Estágio: {selectedItem.eggData?.hatchLevel ?? 0}/5
                      {(selectedItem.eggData?.hatchLevel ?? 0) >= MIN_HATCHABLE_LEVEL
                        ? ` (${
                            getHatchQualityProfile(selectedItem.eggData?.hatchLevel)
                              .qualityName
                          })`
                        : ' (Chocagem ≥ 3/5)'}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-1 leading-snug text-[9.5px] text-sky-100/90">
                {selectedItem.description}
              </p>
            </div>
          </div>

          {/* Usage & Compatibility Details */}
          {(selectedItem.usageInfo ||
            selectedMatchingData ||
            selectedMatchingEgg ||
            selectedItem.eggData?.usageRequirements) && (
            <div className="mt-2 rounded-lg border border-cyan-400/25 bg-[#031033]/90 px-2 py-1.5 text-[9.5px]">
              <p className="font-extrabold uppercase tracking-wide text-cyan-300">
                Informações de Utilização
              </p>
              <p className="mt-0.5 leading-snug text-slate-200">
                {selectedItem.eggData?.usageRequirements ?? selectedItem.usageInfo}
              </p>

              {selectedMatchingData && selectedItem.eggData?.requiredDataQuantity && (
                <div className="mt-1.5 flex items-center justify-between gap-2 rounded border border-cyan-400/25 bg-[#051a4a] px-2 py-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <img
                      src={selectedMatchingData.iconUrl}
                      alt={selectedMatchingData.name}
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span className="truncate font-bold text-cyan-100">
                      {selectedMatchingData.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 font-black tabular-nums ${
                      ownedMatchingDataQty >= selectedItem.eggData.requiredDataQuantity
                        ? 'text-emerald-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {ownedMatchingDataQty}/{selectedItem.eggData.requiredDataQuantity}
                  </span>
                </div>
              )}

              {selectedMatchingEgg && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded border border-cyan-400/25 bg-[#051a4a] px-2 py-1">
                  <img
                    src={selectedMatchingEgg.iconUrl}
                    alt={selectedMatchingEgg.name}
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span className="truncate font-bold text-amber-200">
                    Compatível com {selectedMatchingEgg.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="mt-2 flex items-center justify-end gap-1.5">
            {(selectedItem.hpRestore || selectedItem.dsRestore) && (
              <button
                type="button"
                onClick={() => onUseItem(selectedItem)}
                className="rounded border border-emerald-300/70 bg-emerald-600 px-2.5 py-1 text-[9.5px] font-extrabold text-white hover:bg-emerald-500"
              >
                Usar
              </button>
            )}
            {selectedItem.category === 'equip' && selectedItem.equipSlot && (
              <button
                type="button"
                onClick={() => onEquipItem(selectedItem)}
                className="rounded border border-cyan-300/80 bg-cyan-600 px-2.5 py-1 text-[9.5px] font-extrabold text-white hover:bg-cyan-500"
              >
                Equipar
              </button>
            )}
            <button
              type="button"
              onClick={() => onDiscardItem(selectedItem)}
              title="Descartar 1 unidade"
              className="flex items-center gap-1 rounded border border-rose-400/50 bg-rose-900/75 px-2 py-1 text-[9.5px] font-bold text-rose-200 hover:bg-rose-700"
            >
              <Trash2 className="h-3 w-3" />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="dmo-well mx-2.5 mb-2 rounded-lg px-3 py-2 text-center text-[10px] font-semibold text-cyan-200/75">
          Nenhum item nesta categoria. Derrote Digimons para obter DATA, DigiEggs e consumíveis.
        </div>
      )}

      {/* Dual Currency Bar */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-cyan-400/40 bg-[#04184a] px-2.5 py-2">
        <div
          title="Bits: moeda obtida em combates e missões"
          className="dmo-well flex items-center justify-between rounded-lg px-2 py-1"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
            <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="7" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            <circle cx="10" cy="9" r="2" fill="#fffbeb" opacity="0.7" />
          </svg>
          <span className="text-xs font-black tabular-nums text-white drop-shadow">
            {bits.toLocaleString('pt-BR')}
          </span>
        </div>

        <div
          title="D-Coin: moeda premium da conta"
          className="dmo-well flex items-center justify-between rounded-lg px-2 py-1"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
            <rect x="5" y="7" width="14" height="14" rx="4" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.4" />
            <path d="M8 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="#bae6fd" strokeWidth="1.6" />
            <circle cx="12" cy="14" r="2.2" fill="#38e8ff" />
          </svg>
          <div className="text-right leading-tight">
            <p className="text-[9.5px] font-black text-amber-300">D-Coin</p>
            <p className="text-[11px] font-black tabular-nums text-amber-200">
              {dCoin.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
