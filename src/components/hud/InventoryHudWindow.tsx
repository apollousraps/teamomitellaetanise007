import { useState } from 'react';
import {
  Cpu,
  HeartPulse,
  Package,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
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
  { id: 'equip', label: 'Equip.' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'other', label: 'Outros' },
] as const;

function renderItemIcon(item: InventoryItem) {
  if (item.hpRestore) return <HeartPulse className="h-5 w-5 text-emerald-300" />;
  if (item.dsRestore) return <Zap className="h-5 w-5 text-cyan-300" />;
  if (item.category === 'equip') return <Cpu className="h-5 w-5 text-amber-300" />;
  return <Package className="h-5 w-5 text-sky-300" />;
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

  if (!open) return null;

  const filteredItems = items.filter((item) =>
    activeTab === 'all' ? true : item.category === activeTab
  );
  const selectedItem =
    filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null;

  const slots = Array.from({ length: INVENTORY_MAX_SLOTS }, (_, idx) => {
    return filteredItems[idx] ?? null;
  });

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Inventário do Tamer"
      className="pointer-events-auto dmo-frame w-[288px] overflow-hidden rounded-2xl sm:w-[310px] select-none"
    >
      {/* Centered Title + Circular Cyan X Button matching Reference */}
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

      {/* 4 Category Filter Buttons */}
      <div className="grid grid-cols-4 gap-1 px-2 pt-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md border px-1 py-1 text-[9.5px] font-extrabold transition-all ${
                active
                  ? 'border-[#8befff] bg-gradient-to-b from-[#2eb8ff] to-[#0b68e6] text-white shadow-[0_0_8px_rgba(56,232,255,0.5)]'
                  : 'border-cyan-400/50 bg-gradient-to-b from-[#0b42a3] to-[#05205c] text-cyan-100/90 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 24-Slot Recessed Grid (6x4) */}
      <div className="grid grid-cols-6 gap-1.5 p-2.5">
        {slots.map((item, idx) => {
          const isSelected = item && selectedItem?.id === item.id;
          return (
            <button
              key={item ? item.id : `empty-${idx}`}
              type="button"
              onClick={() => item && setSelectedId(item.id)}
              disabled={!item}
              title={item ? `${item.name} (x${item.quantity})` : 'Slot vazio'}
              className={`dmo-well relative flex aspect-square items-center justify-center rounded-md transition-all ${
                item
                  ? isSelected
                    ? 'border-amber-300 shadow-[0_0_10px_rgba(255,212,59,0.65)]'
                    : 'hover:border-cyan-200'
                  : ''
              }`}
            >
              {item ? (
                <>
                  {renderItemIcon(item)}
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-[#020816]/90 px-1 text-[8.5px] font-black tabular-nums text-white">
                    {item.quantity}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Item Action Strip (only when items exist) */}
      {selectedItem && (
        <div className="dmo-well mx-2.5 mb-2 flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[10px]">
          <div className="min-w-0">
            <p className="truncate font-extrabold text-amber-200">
              {selectedItem.name} (x{selectedItem.quantity})
            </p>
            <p className="truncate text-[9.5px] text-sky-100/80">
              {selectedItem.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(selectedItem.hpRestore || selectedItem.dsRestore) && (
              <button
                type="button"
                onClick={() => onUseItem(selectedItem)}
                className="rounded border border-emerald-300/70 bg-emerald-600 px-2 py-1 text-[9.5px] font-extrabold text-white hover:bg-emerald-500"
              >
                Usar
              </button>
            )}
            {selectedItem.category === 'equip' && selectedItem.equipSlot && (
              <button
                type="button"
                onClick={() => onEquipItem(selectedItem)}
                className="rounded border border-cyan-300/80 bg-cyan-600 px-2 py-1 text-[9.5px] font-extrabold text-white hover:bg-cyan-500"
              >
                Equipar
              </button>
            )}
            <button
              type="button"
              onClick={() => onDiscardItem(selectedItem)}
              title="Descartar 1 unidade"
              className="flex h-6 w-6 items-center justify-center rounded border border-rose-400/50 bg-rose-900/75 text-rose-200 hover:bg-rose-700"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Dual Currency Bar matching Exact Gold Coin + Blue Pouch D-Coin */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-cyan-400/40 bg-[#04184a] px-2.5 py-2">
        {/* Bits */}
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

        {/* D-Coin */}
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
