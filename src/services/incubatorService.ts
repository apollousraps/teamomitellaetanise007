import type { AccountHudPersistence, InventoryItem } from '../types/hud';

export const INCUBATOR_VISIBLE_EGG_SLOTS = 4;
export const INCUBATOR_TOTAL_TRAY_SLOTS = 5;

export interface DigiEggDisplayInfo {
  item: InventoryItem;
  speciesName: string;
  rarity: string;
  hatchLevel: number;
  maxHatchLevel: number;
  accentColor: string;
  requiredMaterials: Array<{
    itemKey: string;
    name: string;
    quantity: number;
    owned: number;
  }>;
  hasAllMaterials: boolean;
}

export interface IncubatorActionResult {
  ok: boolean;
  next: AccountHudPersistence;
  message: string;
  hatchedSpecies?: string;
  newReinforceLevel?: number;
}

export function isDigiEggInventoryItem(item: InventoryItem): boolean {
  return Boolean(item.eggData) || item.itemKey.startsWith('digiegg_');
}

export function isEggReinforceInventoryItem(item: InventoryItem): boolean {
  return (
    item.reinforceMeta?.kind === 'egg-reinforce' ||
    item.itemKey.startsWith('egg_reinforce_')
  );
}

export function getInventoryDigiEggs(
  inventory: readonly InventoryItem[]
): InventoryItem[] {
  return inventory.filter(
    (item) => item.quantity > 0 && isDigiEggInventoryItem(item)
  );
}

export function getInventoryReinforceMaterials(
  inventory: readonly InventoryItem[]
): InventoryItem[] {
  return inventory.filter(
    (item) => item.quantity > 0 && isEggReinforceInventoryItem(item)
  );
}

export function getDigiEggDisplayInfo(
  item: InventoryItem,
  inventory: readonly InventoryItem[]
): DigiEggDisplayInfo {
  const meta = item.eggData;
  const requiredMaterials = (meta?.requiredMaterials ?? []).map((req) => {
    const owned = inventory
      .filter((inv) => inv.itemKey === req.itemKey)
      .reduce((acc, inv) => acc + inv.quantity, 0);
    return {
      itemKey: req.itemKey,
      name: req.name,
      quantity: Math.max(1, req.quantity),
      owned,
    };
  });

  const hasAllMaterials = requiredMaterials.every((m) => m.owned >= m.quantity);

  return {
    item,
    speciesName: meta?.speciesName ?? item.name,
    rarity: meta?.rarity ?? 'Padrão',
    hatchLevel: Math.max(0, meta?.hatchLevel ?? 0),
    maxHatchLevel: Math.max(1, meta?.maxHatchLevel ?? 5),
    accentColor: meta?.accentColor ?? '#38e8ff',
    requiredMaterials,
    hasAllMaterials,
  };
}

function decrementInventoryEntries(
  inventory: readonly InventoryItem[],
  consumptions: Array<{ id?: string; itemKey?: string; quantity: number }>
): { ok: boolean; next: InventoryItem[]; error?: string } {
  const working = inventory.map((entry) => ({ ...entry }));

  for (const c of consumptions) {
    let remaining = Math.max(1, c.quantity);
    for (let i = 0; i < working.length && remaining > 0; i++) {
      const matches = c.id
        ? working[i].id === c.id
        : working[i].itemKey === c.itemKey;
      if (!matches || working[i].quantity <= 0) continue;

      const take = Math.min(working[i].quantity, remaining);
      working[i] = {
        ...working[i],
        quantity: working[i].quantity - take,
      };
      remaining -= take;
    }
    if (remaining > 0) {
      return {
        ok: false,
        next: [...inventory],
        error: 'Quantidade insuficiente de itens no inventário.',
      };
    }
  }

  return {
    ok: true,
    next: working.filter((entry) => entry.quantity > 0),
  };
}

export function validateDigiEggHatch(
  state: AccountHudPersistence,
  eggItemId: string | null
): { ok: boolean; info?: DigiEggDisplayInfo; error?: string } {
  if (!eggItemId) {
    return {
      ok: false,
      error: 'Selecione um DigiEgg disponível no inventário para chocar.',
    };
  }

  const eggItem = state.inventory.find(
    (item) =>
      item.id === eggItemId && item.quantity > 0 && isDigiEggInventoryItem(item)
  );
  if (!eggItem) {
    return {
      ok: false,
      error: 'Este DigiEgg não está mais disponível no seu inventário.',
    };
  }

  const info = getDigiEggDisplayInfo(eggItem, state.inventory);
  if (!info.hasAllMaterials) {
    const missing = info.requiredMaterials
      .filter((m) => m.owned < m.quantity)
      .map((m) => `${m.name} (${m.owned}/${m.quantity})`)
      .join(', ');
    return {
      ok: false,
      info,
      error: `Materiais insuficientes para chocar: ${missing}.`,
    };
  }

  return { ok: true, info };
}

export function executeDigiEggHatch(
  state: AccountHudPersistence,
  eggItemId: string | null
): IncubatorActionResult {
  const check = validateDigiEggHatch(state, eggItemId);
  if (!check.ok || !check.info) {
    return {
      ok: false,
      next: state,
      message: check.error ?? 'Ação inválida para chocagem.',
    };
  }

  const consumptions: Array<{ id?: string; itemKey?: string; quantity: number }> = [
    { id: check.info.item.id, quantity: 1 },
    ...check.info.requiredMaterials.map((m) => ({
      itemKey: m.itemKey,
      quantity: m.quantity,
    })),
  ];

  const consumed = decrementInventoryEntries(state.inventory, consumptions);
  if (!consumed.ok) {
    return {
      ok: false,
      next: state,
      message: consumed.error ?? 'Falha ao consumir os itens necessários.',
    };
  }

  const hatchedSpecies = check.info.speciesName;
  return {
    ok: true,
    next: {
      ...state,
      inventory: consumed.next,
      updatedAt: new Date().toISOString(),
    },
    hatchedSpecies,
    message: `Chocagem concluída com sucesso! ${check.info.item.name} (${hatchedSpecies}) foi processado pela Incubadora DATS.`,
  };
}

export function validateEggReinforce(
  state: AccountHudPersistence,
  eggItemId: string | null,
  materialItemId: string | null
): {
  ok: boolean;
  eggInfo?: DigiEggDisplayInfo;
  material?: InventoryItem;
  error?: string;
} {
  if (!eggItemId) {
    return {
      ok: false,
      error: 'Selecione um DigiEgg do seu inventário antes de aplicar reforço.',
    };
  }

  const eggItem = state.inventory.find(
    (item) =>
      item.id === eggItemId && item.quantity > 0 && isDigiEggInventoryItem(item)
  );
  if (!eggItem) {
    return {
      ok: false,
      error: 'O DigiEgg selecionado não está disponível no inventário.',
    };
  }

  const eggInfo = getDigiEggDisplayInfo(eggItem, state.inventory);
  if (eggInfo.hatchLevel >= eggInfo.maxHatchLevel) {
    return {
      ok: false,
      eggInfo,
      error: `${eggItem.name} já atingiu o nível máximo de reforço (${eggInfo.maxHatchLevel}/${eggInfo.maxHatchLevel}).`,
    };
  }

  const reinforceMaterials = getInventoryReinforceMaterials(state.inventory);
  if (reinforceMaterials.length === 0) {
    return {
      ok: false,
      eggInfo,
      error: 'Nenhum item de reforço disponível no inventário no momento.',
    };
  }

  const material = materialItemId
    ? reinforceMaterials.find((m) => m.id === materialItemId)
    : reinforceMaterials[0];
  if (!material || material.quantity <= 0) {
    return {
      ok: false,
      eggInfo,
      error: 'Selecione um item de reforço válido do inventário.',
    };
  }

  if (
    material.reinforceMeta?.targetEggKey &&
    material.reinforceMeta.targetEggKey !== eggItem.itemKey
  ) {
    return {
      ok: false,
      eggInfo,
      material,
      error: `${material.name} não é compatível com ${eggItem.name}.`,
    };
  }

  return { ok: true, eggInfo, material };
}

export function executeEggReinforce(
  state: AccountHudPersistence,
  eggItemId: string | null,
  materialItemId: string | null
): IncubatorActionResult {
  const check = validateEggReinforce(state, eggItemId, materialItemId);
  if (!check.ok || !check.eggInfo || !check.material) {
    return {
      ok: false,
      next: state,
      message: check.error ?? 'Não foi possível reforçar este DigiEgg.',
    };
  }

  const consumed = decrementInventoryEntries(state.inventory, [
    { id: check.material.id, quantity: 1 },
  ]);
  if (!consumed.ok) {
    return {
      ok: false,
      next: state,
      message: consumed.error ?? 'Item de reforço insuficiente no inventário.',
    };
  }

  const step = Math.max(1, check.material.reinforceMeta?.levelStep ?? 1);
  const nextLevel = Math.min(
    check.eggInfo.maxHatchLevel,
    check.eggInfo.hatchLevel + step
  );

  // If stacked > 1, split 1 reinforced egg instance safely without duplicating items
  const nextInventory: InventoryItem[] = [];
  for (const invItem of consumed.next) {
    if (invItem.id !== check.eggInfo.item.id) {
      nextInventory.push(invItem);
      continue;
    }
    const baseMeta = invItem.eggData ?? {
      speciesName: invItem.name,
      rarity: 'Padrão',
      hatchLevel: 0,
      maxHatchLevel: check.eggInfo.maxHatchLevel,
    };
    if (invItem.quantity > 1) {
      nextInventory.push({
        ...invItem,
        quantity: invItem.quantity - 1,
      });
      nextInventory.push({
        ...invItem,
        id: `${invItem.id}_rf_${nextLevel}_${Date.now()}`,
        quantity: 1,
        eggData: {
          ...baseMeta,
          hatchLevel: nextLevel,
        },
      });
    } else {
      nextInventory.push({
        ...invItem,
        eggData: {
          ...baseMeta,
          hatchLevel: nextLevel,
        },
      });
    }
  }

  return {
    ok: true,
    next: {
      ...state,
      inventory: nextInventory,
      updatedAt: new Date().toISOString(),
    },
    newReinforceLevel: nextLevel,
    message: `Reforço concluído! ${check.eggInfo.item.name} avançou para Nível ${nextLevel}/${check.eggInfo.maxHatchLevel}.`,
  };
}
