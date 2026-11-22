import { ITEM_RARITY_META } from '../../data/itemsCatalog';
import type { ItemRarity } from '../../types/hud';
import { HeartPulse, Package, Sparkles, Zap } from 'lucide-react';

export interface DropToastItem {
  id: string;
  itemKey: string;
  name: string;
  quantity: number;
  iconUrl?: string;
  rarity: ItemRarity;
  sourceName?: string;
}

interface DropRewardToastStackProps {
  toasts: readonly DropToastItem[];
}

export function DropRewardToastStack({ toasts }: DropRewardToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute right-2 top-[128px] z-30 flex w-[210px] flex-col gap-1.5 sm:right-4 sm:top-[168px] sm:w-[242px]"
    >
      {toasts.map((toast) => {
        const rarity = ITEM_RARITY_META[toast.rarity ?? 'comum'];
        return (
          <div
            key={toast.id}
            style={{
              borderColor: rarity.borderHex,
              boxShadow: `0 0 20px ${rarity.glowRgba}`,
            }}
            className="animate-dmo-window flex items-center gap-2 rounded-xl border-2 bg-[#041438]/94 px-2.5 py-1.5 backdrop-blur-sm"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/45 bg-[#020a24] p-0.5">
              {toast.iconUrl ? (
                <img
                  src={toast.iconUrl}
                  alt={toast.name}
                  className="h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(56,232,255,0.55)]"
                />
              ) : toast.itemKey.includes('hp') ? (
                <HeartPulse className="h-5 w-5 text-emerald-300" />
              ) : toast.itemKey.includes('ds') ? (
                <Zap className="h-5 w-5 text-cyan-300" />
              ) : (
                <Package className="h-5 w-5 text-sky-300" />
              )}
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 animate-pulse text-amber-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[8.5px] font-black uppercase tracking-wider text-amber-300">
                  Item Obtido · {rarity.label}
                </span>
                <span className="shrink-0 rounded bg-emerald-500/25 px-1.5 py-0.2 text-[9.5px] font-black tabular-nums text-emerald-200">
                  +{toast.quantity}
                </span>
              </div>
              <p className="truncate text-[11px] font-extrabold text-white">
                {toast.name}
              </p>
              {toast.sourceName && (
                <p className="truncate text-[8.5px] font-semibold text-cyan-200/80">
                  Drop de {toast.sourceName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
