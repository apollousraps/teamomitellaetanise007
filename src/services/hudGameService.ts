import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  resolveActiveFormProfile,
  type DigimonEvolutionStage,
  type DigimonFormId,
  type DigimonFormProfile,
  type StarterDigimonId,
} from '../types/digimon';
import type {
  AccountHudPersistence,
  ComputedDigimonAttributes,
  ComputedTamerAttributes,
  DigimonRuntimeStats,
  EquipmentSlotId,
  HatchQualityGrade,
  InventoryItem,
  TamerRuntimeStats,
} from '../types/hud';
import { enrichInventoryItem, getHatchQualityProfile } from '../data/itemsCatalog';
import { scheduleHudStateSync } from './cloudSaveService';

const HUD_PERSISTENCE_PREFIX = 'dw_digital_war_hud_v1_';

export const INVENTORY_MAX_SLOTS = 48;
export const SKILL_F1_DS_COST = 12;
export const SKILL_F2_DS_COST = 20;
export const SKILL_F1_COOLDOWN_SEC = 4.5;
export const SKILL_F2_COOLDOWN_SEC = 9.0;

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlotId, string> = {
  head: 'Chapéu / Boné',
  top: 'Jaqueta / Camisa',
  gloves: 'Luvas',
  bottom: 'Calça / Bermudas',
  shoes: 'Botas / Tênis',
  necklace: 'Colar',
  ring: 'Anel',
  digivice: 'Digivice',
  cape: 'Capa',
  crest: 'Brasão',
};

export function calcTamerExpToNext(level: number): number {
  return Math.round(480 * Math.pow(1.38, Math.max(0, level - 1)));
}

export function calcDigimonExpToNext(level: number): number {
  return Math.round(320 * Math.pow(1.36, Math.max(0, level - 1)));
}

/**
 * Authentic Digimon Masters Online (DMO) level-difference EXP scaling:
 * - Hunting stronger mobs (+1 to +3+ Lv) grants a modest bonus (1.06x - 1.20x).
 * - Hunting mobs at your level (-1 to 0) gives 100% base EXP.
 * - Hunting much weaker mobs (-2 to -6+ Lv) suffers steep diminishing returns
 *   so players naturally advance across the 5 habitats (Lv. 1 -> 10).
 */
export function calcDmoKillExp(
  baseExp: number,
  actorLevel: number,
  mobLevel: number
): number {
  const diff = mobLevel - actorLevel;
  let multiplier = 1.0;
  if (diff >= 3) multiplier = 1.2;
  else if (diff === 2) multiplier = 1.12;
  else if (diff === 1) multiplier = 1.06;
  else if (diff >= -1) multiplier = 1.0;
  else if (diff === -2) multiplier = 0.8;
  else if (diff === -3) multiplier = 0.55;
  else if (diff === -4) multiplier = 0.32;
  else if (diff === -5) multiplier = 0.15;
  else multiplier = 0.05;

  return Math.max(1, Math.round(baseExp * multiplier));
}

export function calcTamerMaxHp(level: number): number {
  return 160 + (level - 1) * 14;
}

export function calcTamerMaxDs(level: number): number {
  return 100 + (level - 1) * 10;
}

export function calcDigimonMaxHp(
  level: number,
  formId: DigimonFormId = 'agumon',
  hatchGrade: HatchQualityGrade = 3
): number {
  const s = getDigimonFormProfile(formId).baseStats;
  const lvOffset = Math.max(0, level - 1);
  const mult = getHatchQualityProfile(hatchGrade).statMultiplier;
  return Math.round((s.hpBase + lvOffset * s.hpPerLv) * mult);
}

export function calcDigimonMaxDs(
  level: number,
  formId: DigimonFormId = 'agumon',
  hatchGrade: HatchQualityGrade = 3
): number {
  const s = getDigimonFormProfile(formId).baseStats;
  const lvOffset = Math.max(0, level - 1);
  const mult = getHatchQualityProfile(hatchGrade).statMultiplier;
  return Math.round((s.dsBase + lvOffset * s.dsPerLv) * mult);
}

/**
 * Computes real unified Tamer attributes from Tamer level + equipped gear in `equippedItems`.
 * Grounded early-launch progression leaving clean room for future accessories and upgrades.
 */
export function computeTamerAttributes(
  tamer: TamerRuntimeStats,
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>
): ComputedTamerAttributes {
  let bonusHp = 0;
  let bonusDs = 0;
  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusSpd = 0;
  let bonusCrit = 0;
  let bonusAcc = 0;
  let bonusEva = 0;

  for (const item of Object.values(equippedItems)) {
    if (!item?.statBonuses) continue;
    bonusHp += item.statBonuses.hp ?? 0;
    bonusDs += item.statBonuses.ds ?? 0;
    bonusAtk += item.statBonuses.attack ?? 0;
    bonusDef += item.statBonuses.defense ?? 0;
    bonusSpd += item.statBonuses.speed ?? 0;
    bonusCrit += item.statBonuses.critRate ?? 0;
    bonusAcc += item.statBonuses.accuracy ?? 0;
    bonusEva += item.statBonuses.evasion ?? 0;
  }

  const lvOffset = Math.max(0, tamer.level - 1);
  const maxHp = calcTamerMaxHp(tamer.level) + bonusHp;
  const maxDs = calcTamerMaxDs(tamer.level) + bonusDs;

  return {
    hp: Math.min(maxHp, tamer.hp),
    maxHp,
    ds: Math.min(maxDs, tamer.ds),
    maxDs,
    attack: Math.round(12 + lvOffset * 2 + bonusAtk),
    defense: Math.round(8 + lvOffset * 1.5 + bonusDef),
    speed: Math.round(165 + lvOffset * 1 + bonusSpd),
    critRate: Number(Math.min(45, 2.0 + lvOffset * 0.05 + bonusCrit).toFixed(1)),
    accuracy: Math.round(65 + lvOffset * 2.5 + bonusAcc),
    evasion: Number(Math.min(40, 2.0 + lvOffset * 0.05 + bonusEva).toFixed(1)),
  };
}

export interface DigimonEvolutionStageSpec {
  formId?: DigimonFormId;
  stage: DigimonEvolutionStage;
  name: string;
  unlockLevel: number;
  playable: boolean;
}

export const DIGIMON_EVOLUTION_CHAINS: Record<
  StarterDigimonId,
  readonly DigimonEvolutionStageSpec[]
> = {
  agumon: [
    { formId: 'agumon', stage: 'Rookie', name: 'Agumon', unlockLevel: 1, playable: true },
    { formId: 'geogreymon', stage: 'Champion', name: 'GeoGreymon', unlockLevel: 15, playable: true },
    { formId: 'rizegreymon', stage: 'Ultimate', name: 'RizeGreymon', unlockLevel: 30, playable: true },
    { formId: 'shinegreymon', stage: 'Mega', name: 'ShineGreymon', unlockLevel: 50, playable: true },
  ],
  gaomon: [
    { formId: 'gaomon', stage: 'Rookie', name: 'Gaomon', unlockLevel: 1, playable: true },
    { formId: 'gaogamon', stage: 'Champion', name: 'Gaogamon', unlockLevel: 15, playable: true },
    { formId: 'machgaogamon', stage: 'Ultimate', name: 'MachGaogamon', unlockLevel: 30, playable: true },
    { formId: 'miragegaogamon', stage: 'Mega', name: 'MirageGaogamon', unlockLevel: 50, playable: true },
  ],
  lalamon: [
    { formId: 'lalamon', stage: 'Rookie', name: 'Lalamon', unlockLevel: 1, playable: true },
    { formId: 'sunflowmon', stage: 'Champion', name: 'Sunflowmon', unlockLevel: 15, playable: true },
    { formId: 'lilamon', stage: 'Ultimate', name: 'Lilamon', unlockLevel: 30, playable: true },
    { formId: 'rosemon', stage: 'Mega', name: 'Rosemon', unlockLevel: 50, playable: true },
  ],
  guilmon: [
    { formId: 'guilmon', stage: 'Rookie', name: 'Guilmon', unlockLevel: 1, playable: true },
    { formId: 'growlmon', stage: 'Champion', name: 'Growlmon', unlockLevel: 15, playable: true },
    { formId: 'megalogrowlmon', stage: 'Ultimate', name: 'WarGrowlmon', unlockLevel: 30, playable: true },
    { formId: 'dukemon', stage: 'Mega', name: 'Dukemon', unlockLevel: 50, playable: true },
  ],
};

/**
 * Derives balanced Digimon Masters-inspired base attributes directly from the active species curve,
 * Digimon level, modest Tamer synergy, and defeated enemies bond.
 * Intentionally grounded for a freshly launched RPG (Rookie Lv.1 ~300 CP -> Mega Lv.50 ~5,200 CP)
 * so future Accessories, Clones, Seals, and Chips have meaningful progression room.
 */
export function computeDerivedDigimonAttributes(
  tamerAttrs: ComputedTamerAttributes,
  digimon: DigimonRuntimeStats,
  defeatedEnemiesTotal = 0,
  formId?: DigimonFormId
): ComputedDigimonAttributes {
  const effectiveForm = getDigimonFormProfile(
    formId ?? digimon.activeFormId ?? 'agumon'
  );
  const s = effectiveForm.baseStats;
  const digiLvOffset = Math.max(0, digimon.level - 1);
  const qualityProfile = getHatchQualityProfile(digimon.hatchGrade);
  const qualityMult = qualityProfile.statMultiplier;

  // Modest Tamer synergy (25% of Tamer AT/DE + Tamer gear bonuses above base)
  const attackBonusFromTamer = Math.round(tamerAttrs.attack * 0.25);
  const defenseBonusFromTamer = Math.round(tamerAttrs.defense * 0.25);
  const tamerGearCritBonus = Math.max(0, tamerAttrs.critRate - 2.0);
  const tamerGearEvaBonus = Math.max(0, tamerAttrs.evasion - 2.0);
  const tamerGearHitBonus = Math.max(0, tamerAttrs.accuracy - 65);

  const attack = Math.round(
    (s.atBase + digiLvOffset * s.atPerLv) * qualityMult + attackBonusFromTamer
  );
  const defense = Math.round(
    (s.deBase + digiLvOffset * s.dePerLv) * qualityMult + defenseBonusFromTamer
  );
  const speed = Math.round(
    (168 + digiLvOffset * 1.2 + Math.max(0, tamerAttrs.speed - 165) * 0.4) *
      effectiveForm.spdMult
  );
  const attackSpeed = Number(s.asSec.toFixed(2));

  const critRateTotal = Number(
    Math.min(60, s.ctBase + digiLvOffset * s.ctPerLv + tamerGearCritBonus * 0.65).toFixed(1)
  );
  const accuracy = Math.round(
    s.htBase + digiLvOffset * s.htPerLv + tamerGearHitBonus * 0.6
  );
  const evasion = Number(
    Math.min(50, s.evBase + digiLvOffset * s.evPerLv + tamerGearEvaBonus * 0.65).toFixed(1)
  );
  const blockRate = Number(
    Math.min(45, s.blBase + digiLvOffset * s.blPerLv).toFixed(1)
  );

  // Grounded damage curves proportional to AT & skill ratios
  const totalBasicDamage = Math.max(12, Math.round(attack * 1.0));
  const totalSpecial1Damage = Math.max(24, Math.round(attack * s.skill1Ratio));
  const totalSpecial2Damage = Math.max(38, Math.round(attack * s.skill2Ratio));

  // Grounded Combat Power (Rookie Lv.1 ~310 · Champion Lv.15 ~1,120 · Ultimate Lv.30 ~2,480 · Mega Lv.50 ~5,250)
  const expectedMaxHp = calcDigimonMaxHp(
    digimon.level,
    effectiveForm.id,
    qualityProfile.grade
  );
  const expectedMaxDs = calcDigimonMaxDs(
    digimon.level,
    effectiveForm.id,
    qualityProfile.grade
  );
  const combatPower = Math.round(
    expectedMaxHp * 0.45 +
      expectedMaxDs * 0.25 +
      attack * 3.8 +
      defense * 2.8 +
      accuracy * 0.45 +
      critRateTotal * 4.5 +
      evasion * 3.5 +
      blockRate * 3.0
  );

  // Bond scales organically from real partner level & battles won together
  const bondPct = Math.min(100, 10 + digiLvOffset * 6 + defeatedEnemiesTotal * 4);
  const bondLabel =
    bondPct >= 100
      ? 'Afinidade Máxima!'
      : bondPct >= 65
        ? 'Forte Conexão!'
        : bondPct >= 35
          ? 'Parceiros em Sintonia'
          : 'Vínculo Inicial';
  const starRank = Math.max(1, Math.min(5, Math.ceil(bondPct / 20)));

  return {
    attack,
    defense,
    speed,
    attackSpeed,
    accuracy,
    evasion,
    blockRate,
    attackBonusFromTamer,
    defenseBonusFromTamer,
    critRateTotal,
    totalBasicDamage,
    totalSpecial1Damage,
    totalSpecial2Damage,
    combatPower,
    bondPct,
    bondLabel,
    starRank,
  };
}

export function getUnlockedEvolutionForms(
  starterId: StarterDigimonId,
  level: number
): DigimonFormProfile[] {
  return getEvolutionChainForStarter(starterId).filter(
    (form) => level >= form.unlockLevel
  );
}

/**
 * Returns the next locked/ready evolution target relative to the Digimon's current active form.
 */
export function getNextEvolutionInfo(
  starterId: StarterDigimonId,
  digimon: DigimonRuntimeStats
): {
  activeForm: DigimonFormProfile;
  nextForm: DigimonFormProfile | null;
  readyToEvolve: DigimonFormProfile | null;
} {
  const chain = getEvolutionChainForStarter(starterId);
  const activeForm = resolveActiveFormProfile(starterId, digimon.activeFormId);
  const activeIdx = chain.findIndex((f) => f.id === activeForm.id);
  const nextForm =
    activeIdx >= 0 && activeIdx + 1 < chain.length ? chain[activeIdx + 1] : null;
  const readyToEvolve =
    nextForm && digimon.level >= nextForm.unlockLevel ? nextForm : null;
  return { activeForm, nextForm, readyToEvolve };
}

export function evolveDigimonAccountState(
  state: AccountHudPersistence,
  starterId: StarterDigimonId,
  targetFormId: DigimonFormId
): { next: AccountHudPersistence; evolvedForm?: DigimonFormProfile; error?: string } {
  const chain = getEvolutionChainForStarter(starterId);
  const targetForm = chain.find((f) => f.id === targetFormId);
  if (!targetForm) {
    return {
      next: state,
      error: 'Esta forma evolutiva não pertence ao seu Digimon parceiro.',
    };
  }
  if (state.digimon.level < targetForm.unlockLevel) {
    return {
      next: state,
      error: `Nível insuficiente! ${targetForm.name} é desbloqueado no Nível ${targetForm.unlockLevel}.`,
    };
  }
  const currentForm = resolveActiveFormProfile(starterId, state.digimon.activeFormId);
  if (currentForm.id === targetForm.id) {
    return { next: state, evolvedForm: targetForm };
  }

  const qualityGrade = getHatchQualityProfile(state.digimon.hatchGrade).grade;
  const nextMaxHp = calcDigimonMaxHp(state.digimon.level, targetForm.id, qualityGrade);
  const nextMaxDs = calcDigimonMaxDs(state.digimon.level, targetForm.id, qualityGrade);
  const unlockedIds = chain
    .filter((f) => state.digimon.level >= f.unlockLevel)
    .map((f) => f.id);

  return {
    next: {
      ...state,
      digimon: {
        ...state.digimon,
        activeFormId: targetForm.id,
        unlockedFormIds: unlockedIds,
        maxHp: nextMaxHp,
        maxDs: nextMaxDs,
        // Evolution refills partner vitality cleanly without changing level/EXP
        hp: nextMaxHp,
        ds: nextMaxDs,
      },
      updatedAt: new Date().toISOString(),
    },
    evolvedForm: targetForm,
  };
}

export function createDefaultAccountHudState(
  accountUsername: string
): AccountHudPersistence {
  const tamerLevel = 1;
  const digimonLevel = 1;
  const starterGrade: HatchQualityGrade = 3;
  return {
    accountUsername: accountUsername.trim() || 'tamer_local',
    tamer: {
      level: tamerLevel,
      exp: 0,
      expToNext: calcTamerExpToNext(tamerLevel),
      hp: calcTamerMaxHp(tamerLevel),
      maxHp: calcTamerMaxHp(tamerLevel),
      ds: calcTamerMaxDs(tamerLevel),
      maxDs: calcTamerMaxDs(tamerLevel),
    },
    digimon: {
      level: digimonLevel,
      exp: 0,
      expToNext: calcDigimonExpToNext(digimonLevel),
      hp: calcDigimonMaxHp(digimonLevel, 'agumon', starterGrade),
      maxHp: calcDigimonMaxHp(digimonLevel, 'agumon', starterGrade),
      ds: calcDigimonMaxDs(digimonLevel, 'agumon', starterGrade),
      maxDs: calcDigimonMaxDs(digimonLevel, 'agumon', starterGrade),
      hatchGrade: starterGrade,
      hatchSizePct: 100,
    },
    bits: 0,
    dCoin: 0,
    inventory: [],
    equippedItems: {},
    guildName: null,
    defeatedEnemiesTotal: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function loadAccountHudState(
  accountUsername: string,
  starterId: StarterDigimonId = 'agumon'
): AccountHudPersistence {
  const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
  try {
    const raw = window.localStorage.getItem(`${HUD_PERSISTENCE_PREFIX}${cleanUser}`);
    if (!raw) return createDefaultAccountHudState(accountUsername);
    const parsed = JSON.parse(raw) as Partial<AccountHudPersistence>;
    const fallback = createDefaultAccountHudState(accountUsername);
    const equippedItems =
      parsed.equippedItems && typeof parsed.equippedItems === 'object'
        ? parsed.equippedItems
        : {};
    const mergedTamer: TamerRuntimeStats = {
      ...fallback.tamer,
      ...(parsed.tamer ?? {}),
    };
    const computed = computeTamerAttributes(mergedTamer, equippedItems);
    mergedTamer.expToNext = calcTamerExpToNext(mergedTamer.level);
    mergedTamer.exp = Math.max(0, Math.min(mergedTamer.expToNext - 1, mergedTamer.exp));
    mergedTamer.maxHp = computed.maxHp;
    mergedTamer.maxDs = computed.maxDs;
    mergedTamer.hp = Math.min(computed.maxHp, mergedTamer.hp);
    mergedTamer.ds = Math.min(computed.maxDs, mergedTamer.ds);

    const mergedDigi: DigimonRuntimeStats = {
      ...fallback.digimon,
      ...(parsed.digimon ?? {}),
    };
    const qualityProfile = getHatchQualityProfile(mergedDigi.hatchGrade);
    mergedDigi.hatchGrade = qualityProfile.grade;
    mergedDigi.hatchSizePct =
      mergedDigi.hatchSizePct ?? qualityProfile.defaultSizePct;

    const activeForm = resolveActiveFormProfile(starterId, mergedDigi.activeFormId);
    // Strict safety check: never allow a higher form if account level is below unlock requirement
    const safeForm =
      mergedDigi.level >= activeForm.unlockLevel
        ? activeForm
        : getEvolutionChainForStarter(starterId)[0];
    const digiMaxHp = calcDigimonMaxHp(
      mergedDigi.level,
      safeForm.id,
      qualityProfile.grade
    );
    const digiMaxDs = calcDigimonMaxDs(
      mergedDigi.level,
      safeForm.id,
      qualityProfile.grade
    );
    mergedDigi.activeFormId = safeForm.id;
    mergedDigi.unlockedFormIds = getUnlockedEvolutionForms(
      starterId,
      mergedDigi.level
    ).map((f) => f.id);
    mergedDigi.expToNext = calcDigimonExpToNext(mergedDigi.level);
    mergedDigi.exp = Math.max(0, Math.min(mergedDigi.expToNext - 1, mergedDigi.exp));
    mergedDigi.maxHp = digiMaxHp;
    mergedDigi.maxDs = digiMaxDs;
    mergedDigi.hp = Math.min(digiMaxHp, mergedDigi.hp);
    mergedDigi.ds = Math.min(digiMaxDs, mergedDigi.ds);

    return {
      accountUsername: parsed.accountUsername ?? fallback.accountUsername,
      tamer: mergedTamer,
      digimon: mergedDigi,
      bits: typeof parsed.bits === 'number' && parsed.bits >= 0 ? parsed.bits : 0,
      dCoin: typeof parsed.dCoin === 'number' && parsed.dCoin >= 0 ? parsed.dCoin : 0,
      inventory: Array.isArray(parsed.inventory)
        ? parsed.inventory.map(enrichInventoryItem)
        : [],
      equippedItems,
      guildName: typeof parsed.guildName === 'string' ? parsed.guildName : null,
      defeatedEnemiesTotal:
        typeof parsed.defeatedEnemiesTotal === 'number' && parsed.defeatedEnemiesTotal >= 0
          ? parsed.defeatedEnemiesTotal
          : 0,
      updatedAt: parsed.updatedAt ?? fallback.updatedAt,
    };
  } catch {
    return createDefaultAccountHudState(accountUsername);
  }
}

export function saveAccountHudState(state: AccountHudPersistence): void {
  const stamped: AccountHudPersistence = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  try {
    const cleanUser = (state.accountUsername.trim() || 'tamer_local').toLowerCase();
    window.localStorage.setItem(
      `${HUD_PERSISTENCE_PREFIX}${cleanUser}`,
      JSON.stringify(stamped)
    );
  } catch {
    // Ignore private storage quota errors cleanly
  }
  scheduleHudStateSync(stamped);
}

export function applyExpToTamer(
  stats: TamerRuntimeStats,
  gainedExp: number,
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>> = {}
): { next: TamerRuntimeStats; leveledUp: boolean } {
  let { level, exp, expToNext, hp, maxHp, ds, maxDs } = stats;
  exp += gainedExp;
  let leveledUp = false;
  while (exp >= expToNext) {
    exp -= expToNext;
    level += 1;
    leveledUp = true;
    expToNext = calcTamerExpToNext(level);
    const recomputed = computeTamerAttributes(
      { level, exp, expToNext, hp, maxHp, ds, maxDs },
      equippedItems
    );
    maxHp = recomputed.maxHp;
    maxDs = recomputed.maxDs;
    hp = maxHp;
    ds = maxDs;
  }
  return {
    next: { level, exp, expToNext, hp, maxHp, ds, maxDs },
    leveledUp,
  };
}

export function applyExpToDigimon(
  stats: DigimonRuntimeStats,
  gainedExp: number,
  starterId: StarterDigimonId = 'agumon'
): {
  next: DigimonRuntimeStats;
  leveledUp: boolean;
  newlyUnlockedForms: DigimonFormProfile[];
} {
  let { level, exp, expToNext, hp, maxHp, ds, maxDs } = stats;
  const qualityProfile = getHatchQualityProfile(stats.hatchGrade);
  const activeForm = resolveActiveFormProfile(starterId, stats.activeFormId);
  const prevLevel = level;
  exp += gainedExp;
  let leveledUp = false;
  while (exp >= expToNext) {
    exp -= expToNext;
    level += 1;
    leveledUp = true;
    expToNext = calcDigimonExpToNext(level);
    maxHp = calcDigimonMaxHp(level, activeForm.id, qualityProfile.grade);
    maxDs = calcDigimonMaxDs(level, activeForm.id, qualityProfile.grade);
    hp = maxHp;
    ds = maxDs;
  }
  const chain = getEvolutionChainForStarter(starterId);
  const unlockedForms = chain.filter((f) => level >= f.unlockLevel);
  const newlyUnlockedForms = unlockedForms.filter(
    (f) => f.unlockLevel > prevLevel && f.unlockLevel <= level
  );

  return {
    next: {
      level,
      exp,
      expToNext,
      hp,
      maxHp,
      ds,
      maxDs,
      activeFormId: activeForm.id,
      unlockedFormIds: unlockedForms.map((f) => f.id),
      hatchGrade: qualityProfile.grade,
      hatchSizePct: stats.hatchSizePct ?? qualityProfile.defaultSizePct,
    },
    leveledUp,
    newlyUnlockedForms,
  };
}

export function setDigimonLevelForTesting(
  stats: DigimonRuntimeStats,
  starterId: StarterDigimonId,
  targetLevel: number
): {
  next: DigimonRuntimeStats;
  newlyUnlockedForms: DigimonFormProfile[];
  revertedForm: boolean;
} {
  const clampedLevel = Math.max(1, Math.min(99, Math.round(targetLevel)));
  const prevLevel = stats.level;
  const qualityProfile = getHatchQualityProfile(stats.hatchGrade);
  const chain = getEvolutionChainForStarter(starterId);
  const currentForm = resolveActiveFormProfile(starterId, stats.activeFormId);

  const unlockedForms = chain.filter((f) => clampedLevel >= f.unlockLevel);
  const validCurrent = clampedLevel >= currentForm.unlockLevel;
  const effectiveForm = validCurrent
    ? currentForm
    : unlockedForms[unlockedForms.length - 1] ?? chain[0];

  const maxHp = calcDigimonMaxHp(clampedLevel, effectiveForm.id, qualityProfile.grade);
  const maxDs = calcDigimonMaxDs(clampedLevel, effectiveForm.id, qualityProfile.grade);
  const newlyUnlockedForms =
    clampedLevel > prevLevel
      ? unlockedForms.filter(
          (f) => f.unlockLevel > prevLevel && f.unlockLevel <= clampedLevel
        )
      : [];

  return {
    next: {
      level: clampedLevel,
      exp: 0,
      expToNext: calcDigimonExpToNext(clampedLevel),
      hp: maxHp,
      maxHp,
      ds: maxDs,
      maxDs,
      activeFormId: effectiveForm.id,
      unlockedFormIds: unlockedForms.map((f) => f.id),
      hatchGrade: qualityProfile.grade,
      hatchSizePct: stats.hatchSizePct ?? qualityProfile.defaultSizePct,
    },
    newlyUnlockedForms,
    revertedForm: !validCurrent,
  };
}

export function switchActiveDigimonForAdmin(
  state: AccountHudPersistence,
  targetFormId: DigimonFormId,
  targetGrade?: HatchQualityGrade,
  explicitLevel?: number
): { next: AccountHudPersistence; form: DigimonFormProfile; grade: HatchQualityGrade } {
  const form = getDigimonFormProfile(targetFormId);
  const qualityProfile = getHatchQualityProfile(targetGrade ?? state.digimon.hatchGrade);
  const nextLevel = Math.max(
    1,
    Math.min(99, Math.round(explicitLevel ?? Math.max(state.digimon.level, form.unlockLevel)))
  );
  const maxHp = calcDigimonMaxHp(nextLevel, form.id, qualityProfile.grade);
  const maxDs = calcDigimonMaxDs(nextLevel, form.id, qualityProfile.grade);
  const unlockedFormIds = getUnlockedEvolutionForms(form.starterId, nextLevel).map(
    (f) => f.id
  );

  return {
    next: {
      ...state,
      digimon: {
        level: nextLevel,
        exp: 0,
        expToNext: calcDigimonExpToNext(nextLevel),
        hp: maxHp,
        maxHp,
        ds: maxDs,
        maxDs,
        activeFormId: form.id,
        unlockedFormIds,
        hatchGrade: qualityProfile.grade,
        hatchSizePct: qualityProfile.defaultSizePct,
      },
      updatedAt: new Date().toISOString(),
    },
    form,
    grade: qualityProfile.grade,
  };
}

export function applyQuickTestDigimonFormToHudState(
  accountUsername: string,
  formId: DigimonFormId
): AccountHudPersistence {
  const cleanAccount = accountUsername.trim() || 'TamerTeste';
  const cleanUser = cleanAccount.toLowerCase();
  const formProfile = getDigimonFormProfile(formId);
  const starterId = formProfile.starterId;
  const targetLevel = Math.max(1, formProfile.unlockLevel);

  const baseState = loadAccountHudState(cleanAccount, starterId);
  const qualityProfile = getHatchQualityProfile(baseState.digimon.hatchGrade);
  const unlockedFormIds = getUnlockedEvolutionForms(starterId, targetLevel).map(
    (f) => f.id
  );
  const digiMaxHp = calcDigimonMaxHp(
    targetLevel,
    formProfile.id,
    qualityProfile.grade
  );
  const digiMaxDs = calcDigimonMaxDs(
    targetLevel,
    formProfile.id,
    qualityProfile.grade
  );

  const nextTamerBase: TamerRuntimeStats = {
    ...baseState.tamer,
    level: targetLevel,
    exp: 0,
    expToNext: calcTamerExpToNext(targetLevel),
  };
  const tamerComputed = computeTamerAttributes(
    nextTamerBase,
    baseState.equippedItems
  );

  const nextState: AccountHudPersistence = {
    ...baseState,
    accountUsername: cleanAccount,
    tamer: {
      ...nextTamerBase,
      maxHp: tamerComputed.maxHp,
      maxDs: tamerComputed.maxDs,
      hp: tamerComputed.maxHp,
      ds: tamerComputed.maxDs,
    },
    digimon: {
      level: targetLevel,
      exp: 0,
      expToNext: calcDigimonExpToNext(targetLevel),
      hp: digiMaxHp,
      maxHp: digiMaxHp,
      ds: digiMaxDs,
      maxDs: digiMaxDs,
      activeFormId: formProfile.id,
      unlockedFormIds,
      hatchGrade: qualityProfile.grade,
      hatchSizePct: baseState.digimon.hatchSizePct ?? qualityProfile.defaultSizePct,
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      `${HUD_PERSISTENCE_PREFIX}${cleanUser}`,
      JSON.stringify(nextState)
    );
  } catch {
    // Ignore storage quota restrictions cleanly
  }

  return nextState;
}

export function addInventoryItem(
  current: InventoryItem[],
  item: Omit<InventoryItem, 'id'>
): { next: InventoryItem[]; added: boolean } {
  const enriched = enrichInventoryItem({
    ...item,
    id: `inv_${item.itemKey}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
  });

  const incomingEggLevel = enriched.eggData?.hatchLevel ?? 0;
  // Stack items with matching itemKey (keeping reinforced eggs separate from base eggs)
  const existingIdx = current.findIndex(
    (i) =>
      i.itemKey === enriched.itemKey &&
      (i.eggData?.hatchLevel ?? 0) === incomingEggLevel
  );
  if (existingIdx >= 0) {
    const updated = [...current];
    updated[existingIdx] = {
      ...enrichInventoryItem(updated[existingIdx]),
      quantity: updated[existingIdx].quantity + enriched.quantity,
    };
    return { next: updated, added: true };
  }
  if (current.length >= INVENTORY_MAX_SLOTS) {
    return { next: current, added: false };
  }
  return {
    next: [...current, enriched],
    added: true,
  };
}

export function equipInventoryItem(
  state: AccountHudPersistence,
  inventoryItemId: string
): { next: AccountHudPersistence; equippedItem?: InventoryItem; error?: string } {
  const idx = state.inventory.findIndex((i) => i.id === inventoryItemId);
  if (idx < 0) return { next: state, error: 'Item não encontrado no inventário.' };

  const target = state.inventory[idx];
  if (target.category !== 'equip' || !target.equipSlot) {
    return { next: state, error: 'Este item não é um equipamento.' };
  }

  const slot = target.equipSlot;
  const previouslyEquipped = state.equippedItems[slot];

  const updatedInv = [...state.inventory];
  if (target.quantity > 1) {
    updatedInv[idx] = { ...target, quantity: target.quantity - 1 };
  } else {
    updatedInv.splice(idx, 1);
  }

  let nextInv = updatedInv;
  if (previouslyEquipped) {
    const returnRes = addInventoryItem(updatedInv, {
      itemKey: previouslyEquipped.itemKey,
      name: previouslyEquipped.name,
      category: previouslyEquipped.category,
      quantity: 1,
      description: previouslyEquipped.description,
      equipSlot: previouslyEquipped.equipSlot,
      statBonuses: previouslyEquipped.statBonuses,
    });
    if (!returnRes.added) {
      return {
        next: state,
        error: 'Inventário cheio para trocar de equipamento.',
      };
    }
    nextInv = returnRes.next;
  }

  const equippedSingle: InventoryItem = {
    ...target,
    quantity: 1,
    id: `eq_${slot}_${target.itemKey}_${Date.now()}`,
  };
  const nextEquipped = {
    ...state.equippedItems,
    [slot]: equippedSingle,
  };

  const recomputed = computeTamerAttributes(state.tamer, nextEquipped);

  return {
    next: {
      ...state,
      inventory: nextInv,
      equippedItems: nextEquipped,
      tamer: {
        ...state.tamer,
        maxHp: recomputed.maxHp,
        maxDs: recomputed.maxDs,
        hp: Math.min(recomputed.maxHp, state.tamer.hp),
        ds: Math.min(recomputed.maxDs, state.tamer.ds),
      },
      updatedAt: new Date().toISOString(),
    },
    equippedItem: equippedSingle,
  };
}

export function unequipSlotItem(
  state: AccountHudPersistence,
  slot: EquipmentSlotId
): { next: AccountHudPersistence; unequippedItem?: InventoryItem; error?: string } {
  const item = state.equippedItems[slot];
  if (!item) return { next: state };

  const addRes = addInventoryItem(state.inventory, {
    itemKey: item.itemKey,
    name: item.name,
    category: 'equip',
    quantity: 1,
    description: item.description,
    equipSlot: slot,
    statBonuses: item.statBonuses,
  });

  if (!addRes.added) {
    return {
      next: state,
      error: `Inventário cheio (${INVENTORY_MAX_SLOTS}/${INVENTORY_MAX_SLOTS}). Libere espaço antes de remover.`,
    };
  }

  const nextEquipped = { ...state.equippedItems };
  delete nextEquipped[slot];

  const recomputed = computeTamerAttributes(state.tamer, nextEquipped);

  return {
    next: {
      ...state,
      inventory: addRes.next,
      equippedItems: nextEquipped,
      tamer: {
        ...state.tamer,
        maxHp: recomputed.maxHp,
        maxDs: recomputed.maxDs,
        hp: Math.min(recomputed.maxHp, state.tamer.hp),
        ds: Math.min(recomputed.maxDs, state.tamer.ds),
      },
      updatedAt: new Date().toISOString(),
    },
    unequippedItem: item,
  };
}

export const BASIC_BITS_SHOP_ITEMS: ReadonlyArray<{
  itemKey: string;
  name: string;
  category: 'consumable' | 'other' | 'equip';
  priceBits: number;
  description: string;
  hpRestore?: number;
  dsRestore?: number;
  equipSlot?: EquipmentSlotId;
  statBonuses?: InventoryItem['statBonuses'];
}> = [
  {
    itemKey: 'chip_hp_small',
    name: 'Chip de Cura Pequeno',
    category: 'consumable',
    priceBits: 45,
    description: 'Recupera +90 de HP do Digimon ativo instantaneamente.',
    hpRestore: 90,
  },
  {
    itemKey: 'disk_ds_small',
    name: 'Disco DS Básico',
    category: 'consumable',
    priceBits: 40,
    description: 'Restaura +60 de DS do Digimon ativo para usar F1 e F2.',
    dsRestore: 60,
  },
  {
    itemKey: 'equip_cap_dats',
    name: 'Boné Tático DATS',
    category: 'equip',
    priceBits: 85,
    equipSlot: 'head',
    statBonuses: { hp: 20, accuracy: 12 },
    description: 'Equipamento de Tamer (Cabeça): +20 HP e +12 HT.',
  },
  {
    itemKey: 'equip_jacket_dats',
    name: 'Jaqueta Operacional DATS',
    category: 'equip',
    priceBits: 125,
    equipSlot: 'top',
    statBonuses: { hp: 35, defense: 7 },
    description: 'Equipamento de Tamer (Superior): +35 HP e +7 DE.',
  },
  {
    itemKey: 'equip_gloves_dats',
    name: 'Luvas Táticas DATS',
    category: 'equip',
    priceBits: 90,
    equipSlot: 'gloves',
    statBonuses: { attack: 8, critRate: 1.0 },
    description: 'Equipamento de Tamer (Luvas): +8 AT e +1.0% CT.',
  },
  {
    itemKey: 'equip_ring_digital',
    name: 'Anel de Dados DATS',
    category: 'equip',
    priceBits: 110,
    equipSlot: 'ring',
    statBonuses: { hp: 30, ds: 20, defense: 5 },
    description: 'Equipamento de Tamer (Anel): +30 HP, +20 DS e +5 DE.',
  },
  {
    itemKey: 'equip_digivice_proto',
    name: 'Digivice Protótipo v1',
    category: 'equip',
    priceBits: 140,
    equipSlot: 'digivice',
    statBonuses: { attack: 10, accuracy: 25, ds: 25 },
    description: 'Equipamento de Tamer (Digivice): +10 AT, +25 HT e +25 DS.',
  },
];

