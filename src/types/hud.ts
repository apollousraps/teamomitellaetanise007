import type { DigimonClassification } from './classification';
import type { DigimonFormId, PartnerAIState, PartnerAttackKind } from './digimon';
import type { CardinalDirection, TamerMovementState } from '../sprites/tamerRealSheets';

export type InventoryCategory = 'all' | 'equip' | 'consumable' | 'other';

export type EquipmentSlotId =
  | 'head'
  | 'top'
  | 'gloves'
  | 'bottom'
  | 'shoes'
  | 'necklace'
  | 'ring'
  | 'digivice'
  | 'cape'
  | 'crest';

export interface EquipmentStatBonuses {
  hp?: number;
  ds?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  critRate?: number;
  accuracy?: number;
  evasion?: number;
}

export interface DigiEggItemMetadata {
  speciesName: string;
  rarity: string;
  hatchLevel?: number;
  maxHatchLevel?: number;
  hatchedFormId?: DigimonFormId;
  accentColor?: string;
  requiredMaterials?: Array<{
    itemKey: string;
    name: string;
    quantity: number;
  }>;
}

export interface EggReinforceItemMetadata {
  kind: 'egg-reinforce';
  targetEggKey?: string;
  levelStep?: number;
}

export interface InventoryItem {
  id: string;
  itemKey: string;
  name: string;
  category: Exclude<InventoryCategory, 'all'>;
  quantity: number;
  description: string;
  hpRestore?: number;
  dsRestore?: number;
  equipSlot?: EquipmentSlotId;
  statBonuses?: EquipmentStatBonuses;
  eggData?: DigiEggItemMetadata;
  reinforceMeta?: EggReinforceItemMetadata;
}

export type ChatChannel = 'all' | 'party' | 'guild' | 'whisper' | 'system';

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  sender?: string;
  isGmSender?: boolean;
  mapTag?: string;
  text: string;
  timestamp: string;
  tone?: 'info' | 'combat' | 'loot' | 'level' | 'warning';
}

export interface HudNotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
}

export interface TamerRuntimeStats {
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  ds: number;
  maxDs: number;
}

export interface ComputedTamerAttributes {
  hp: number;
  maxHp: number;
  ds: number;
  maxDs: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  accuracy: number;
  evasion: number;
}

export interface DigimonRuntimeStats {
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  ds: number;
  maxDs: number;
  activeFormId?: DigimonFormId;
  unlockedFormIds?: DigimonFormId[];
}

export interface ComputedDigimonAttributes {
  attack: number;
  defense: number;
  speed: number;
  attackSpeed: number;
  accuracy: number;
  evasion: number;
  blockRate: number;
  attackBonusFromTamer: number;
  defenseBonusFromTamer: number;
  critRateTotal: number;
  totalBasicDamage: number;
  totalSpecial1Damage: number;
  totalSpecial2Damage: number;
  combatPower: number;
  bondPct: number;
  bondLabel: string;
  starRank: number;
}

export interface AccountHudPersistence {
  accountUsername: string;
  tamer: TamerRuntimeStats;
  digimon: DigimonRuntimeStats;
  bits: number;
  dCoin: number;
  inventory: InventoryItem[];
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  guildName: string | null;
  defeatedEnemiesTotal: number;
  updatedAt: string;
}

export type HudWindowId =
  | 'character'
  | 'digimon'
  | 'incubator'
  | 'guild'
  | 'missions'
  | 'map'
  | 'settings'
  | 'shop'
  | 'messenger'
  | 'notifications'
  | 'friends'
  | 'admin'
  | 'exit-confirm'
  | null;

export interface LiveWorldHudSnapshot {
  mapId: 'dats-center' | 'hunting-plains' | 'data-forest';
  tamerX: number;
  tamerY: number;
  tamerDir: CardinalDirection;
  tamerMoveState: TamerMovementState;
  partnerX: number;
  partnerY: number;
  partnerState: PartnerAIState;
  inSafeZone: boolean;
  nearbyPointId: string | null;
  nearReturnPortal: boolean;
  discoveredZoneIds: string[];
  special1Cooldown: number;
  special1MaxCooldown: number;
  special2Cooldown: number;
  special2MaxCooldown: number;
  activeSkillBanner: string | null;
  targetEnemy: {
    id: string;
    species: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    classification: DigimonClassification;
    isBoss?: boolean;
  } | null;
  minimapEnemies: Array<{
    id: string;
    x: number;
    y: number;
    alive: boolean;
    isBoss?: boolean;
  }>;
  minimapPlayers?: Array<{
    uid: string;
    tamerName: string;
    x: number;
    y: number;
    isGm: boolean;
  }>;
  lastTriggeredSkill?: PartnerAttackKind;
}
