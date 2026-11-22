import { createInventoryPayloadFromCatalog } from '../data/itemsCatalog';
import {
  addInventoryItem,
  BASIC_BITS_SHOP_ITEMS,
} from './hudGameService';
import type { InventoryItem, ItemRarity } from '../types/hud';

export interface DigimonDropEntry {
  /** Identificador unico do item (DATA, DigiEgg ou item existente do jogo) */
  itemKey: string;
  /** Chance individual entre 0.0 e 1.0 (ex: 0.05 = 5%) */
  chance: number;
  minQuantity: number;
  maxQuantity: number;
  /** Grupo opcional para evitar drops simultaneos redundantes */
  rollGroup?: 'consumable' | 'data' | 'egg';
  /** Permite manter o drop do DigiEgg mapeado para quando o Digimon se tornar jogavel */
  enabled?: boolean;
}

export interface DigimonDropTableConfig {
  species: string;
  displayName: string;
  /** Quantidade maxima de entradas diferentes que podem cair em um unico abate */
  maxDropsPerKill?: number;
  entries: DigimonDropEntry[];
}

export interface RolledDropReward {
  itemKey: string;
  name: string;
  quantity: number;
  iconUrl?: string;
  rarity: ItemRarity;
  category: InventoryItem['category'];
  payload: Omit<InventoryItem, 'id'>;
}

export interface ApplyDropsResult {
  nextInventory: InventoryItem[];
  grantedDrops: RolledDropReward[];
  skippedFullDrops: RolledDropReward[];
}

/**
 * Configuracao individual e editavel das tabelas de drop de cada Digimon.
 *
 * Regras atuais:
 * - Cada Digimon dropa exclusivamente a DATA correspondente a sua especie/familia
 *   (ex.: Woodmon/Palmon/Mushroomon -> DATA PLANT; Kunemon/Kuwagamon -> DATA INSECT; etc.).
 * - Taxas de DATA calibradas para progressao estilo MMORPG/DMO (4.5% a 7.5% em mobs de campo).
 * - Drops de DigiEggs estao mapeados por especie com `enabled: false` e NAO dropam
 *   enquanto os respectivos Digimons ainda nao forem jogaveis no jogo.
 */
export const DIGIMON_DROP_TABLES: Record<string, DigimonDropTableConfig> = {
  // === PLANICIE DIGITAL (Nv. 1-10) ===
  koromon: {
    species: 'koromon',
    displayName: 'Koromon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_dragon', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_dragon', chance: 0.015, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.11, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  tsunomon: {
    species: 'tsunomon',
    displayName: 'Tsunomon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_beast', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_beast', chance: 0.015, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.11, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  gizamon: {
    species: 'gizamon',
    displayName: 'Gizamon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_aquatic', chance: 0.05, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_aquatic', chance: 0.018, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.12, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  goblimon: {
    species: 'goblimon',
    displayName: 'Goblimon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_fire', chance: 0.05, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_fire', chance: 0.018, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.12, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  demidevimon: {
    species: 'demidevimon',
    displayName: 'DemiDevimon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_devil', chance: 0.055, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_devil', chance: 0.02, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === FLORESTA DE DADOS (Nv. 10-20) ===
  palmon: {
    species: 'palmon',
    displayName: 'Palmon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_plant', chance: 0.06, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_plant', chance: 0.02, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.13, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  kunemon: {
    species: 'kunemon',
    displayName: 'Kunemon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_insect', chance: 0.065, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_insect', chance: 0.022, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  mushroomon: {
    species: 'mushroomon',
    displayName: 'Mushroomon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_plant', chance: 0.065, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_plant', chance: 0.022, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.14, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  woodmon: {
    species: 'woodmon',
    displayName: 'Woodmon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_plant', chance: 0.07, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_plant', chance: 0.025, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  kiwimon: {
    species: 'kiwimon',
    displayName: 'Kiwimon',
    maxDropsPerKill: 2,
    entries: [
      { itemKey: 'data_bird', chance: 0.075, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_bird', chance: 0.028, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
      { itemKey: 'chip_hp_small', chance: 0.15, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'disk_ds_small', chance: 0.16, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === RAID BOSS: KUWAGAMON (Nv. 20 · Respawn 1h) ===
  kuwagamon: {
    species: 'kuwagamon',
    displayName: 'Kuwagamon (Boss Raid)',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'chip_hp_small', chance: 1.0, minQuantity: 1, maxQuantity: 1, enabled: true },
      { itemKey: 'disk_ds_small', chance: 1.0, minQuantity: 1, maxQuantity: 1, enabled: true },
      { itemKey: 'data_insect', chance: 0.65, minQuantity: 1, maxQuantity: 2, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_insect', chance: 0.18, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: false },
    ],
  },
};

export function registerDigimonDropTable(config: DigimonDropTableConfig): void {
  DIGIMON_DROP_TABLES[config.species.toLowerCase()] = config;
}

export function getDigimonDropTable(species: string): DigimonDropTableConfig | null {
  return DIGIMON_DROP_TABLES[species.toLowerCase()] ?? null;
}

function buildPayloadForDropKey(
  itemKey: string,
  quantity: number
): Omit<InventoryItem, 'id'> | null {
  const catalogPayload = createInventoryPayloadFromCatalog(itemKey, quantity);
  if (catalogPayload) return catalogPayload;

  const shopTpl = BASIC_BITS_SHOP_ITEMS.find((i) => i.itemKey === itemKey);
  if (shopTpl) {
    return {
      itemKey: shopTpl.itemKey,
      name: shopTpl.name,
      category: shopTpl.category,
      quantity,
      description: shopTpl.description,
      rarity: shopTpl.category === 'equip' ? 'incomum' : 'comum',
      hpRestore: shopTpl.hpRestore,
      dsRestore: shopTpl.dsRestore,
      equipSlot: shopTpl.equipSlot,
      statBonuses: shopTpl.statBonuses,
    };
  }

  return null;
}

function rollInt(min: number, max: number, rng: () => number): number {
  const lo = Math.max(1, Math.round(min));
  const hi = Math.max(lo, Math.round(max));
  if (lo === hi) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Executa uma rolagem unica e livre de duplicacoes para a tabela de drop de um Digimon.
 */
export function rollDropsForSpecies(
  species: string,
  rng: () => number = Math.random
): RolledDropReward[] {
  const table = getDigimonDropTable(species);
  if (!table) return [];

  const maxDrops = table.maxDropsPerKill ?? table.entries.length;
  const usedGroups = new Set<string>();
  const rewardsByKey = new Map<string, RolledDropReward>();

  for (const entry of table.entries) {
    if (entry.enabled === false) continue;
    if (rewardsByKey.size >= maxDrops) break;
    if (entry.rollGroup && usedGroups.has(entry.rollGroup)) continue;

    const clampedChance = Math.max(0, Math.min(1, entry.chance));
    if (clampedChance <= 0 || rng() >= clampedChance) continue;

    const qty = rollInt(entry.minQuantity, entry.maxQuantity, rng);
    const payload = buildPayloadForDropKey(entry.itemKey, qty);
    if (!payload) continue;

    if (entry.rollGroup) {
      usedGroups.add(entry.rollGroup);
    }

    const existing = rewardsByKey.get(entry.itemKey);
    if (existing) {
      existing.quantity += qty;
      existing.payload = {
        ...existing.payload,
        quantity: existing.quantity,
      };
    } else {
      rewardsByKey.set(entry.itemKey, {
        itemKey: payload.itemKey,
        name: payload.name,
        quantity: qty,
        iconUrl: payload.iconUrl,
        rarity: payload.rarity ?? 'comum',
        category: payload.category,
        payload,
      });
    }
  }

  return Array.from(rewardsByKey.values());
}

/**
 * Rola e aplica os drops de um Digimon derrotado diretamente no inventario do jogador.
 */
export function rollAndApplyDigimonDrops(
  currentInventory: InventoryItem[],
  species: string,
  rng: () => number = Math.random
): ApplyDropsResult {
  const rolled = rollDropsForSpecies(species, rng);
  let nextInventory = currentInventory;
  const grantedDrops: RolledDropReward[] = [];
  const skippedFullDrops: RolledDropReward[] = [];

  for (const drop of rolled) {
    const res = addInventoryItem(nextInventory, drop.payload);
    if (res.added) {
      nextInventory = res.next;
      grantedDrops.push(drop);
    } else {
      skippedFullDrops.push(drop);
    }
  }

  return {
    nextInventory,
    grantedDrops,
    skippedFullDrops,
  };
}
