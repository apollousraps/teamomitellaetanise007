import type { DigimonFormId } from '../types/digimon';

export type SkillSlotKey = 'f1' | 'f2';

export interface SkillSlotVisualTheme {
  readyBorder: string;
  readyShadow: string;
  keycapBorder: string;
  keycapText: string;
}

const FIRE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-amber-300/85 hover:border-amber-200',
  readyShadow: 'shadow-[0_0_14px_rgba(251,146,60,0.52)] hover:shadow-[0_0_20px_rgba(251,191,36,0.78)]',
  keycapBorder: 'border-amber-300/75',
  keycapText: 'text-amber-200',
};

const SPEED_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-cyan-300/85 hover:border-sky-100',
  readyShadow: 'shadow-[0_0_14px_rgba(56,214,255,0.52)] hover:shadow-[0_0_20px_rgba(56,232,255,0.82)]',
  keycapBorder: 'border-cyan-300/75',
  keycapText: 'text-cyan-200',
};

const NATURE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-emerald-300/85 hover:border-lime-200',
  readyShadow: 'shadow-[0_0_14px_rgba(52,211,153,0.52)] hover:shadow-[0_0_20px_rgba(74,222,128,0.8)]',
  keycapBorder: 'border-emerald-300/75',
  keycapText: 'text-emerald-200',
};

const BLOSSOM_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-fuchsia-300/85 hover:border-pink-200',
  readyShadow: 'shadow-[0_0_14px_rgba(232,121,249,0.55)] hover:shadow-[0_0_20px_rgba(244,114,182,0.82)]',
  keycapBorder: 'border-fuchsia-300/75',
  keycapText: 'text-fuchsia-200',
};

const ROSE_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-rose-400/90 hover:border-rose-200',
  readyShadow: 'shadow-[0_0_14px_rgba(244,63,94,0.58)] hover:shadow-[0_0_20px_rgba(251,113,133,0.85)]',
  keycapBorder: 'border-rose-300/80',
  keycapText: 'text-rose-200',
};

const CRIMSON_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-red-400/90 hover:border-rose-200',
  readyShadow: 'shadow-[0_0_14px_rgba(239,68,68,0.6)] hover:shadow-[0_0_20px_rgba(248,113,113,0.88)]',
  keycapBorder: 'border-red-300/80',
  keycapText: 'text-red-200',
};

const ROYAL_KNIGHT_THEME: SkillSlotVisualTheme = {
  readyBorder: 'border-amber-300/95 hover:border-yellow-100',
  readyShadow: 'shadow-[0_0_16px_rgba(250,204,21,0.65)] hover:shadow-[0_0_22px_rgba(253,224,71,0.92)]',
  keycapBorder: 'border-yellow-300/85',
  keycapText: 'text-yellow-200',
};

const FORM_SKILL_THEMES: Record<DigimonFormId, SkillSlotVisualTheme> = {
  agumon: FIRE_THEME,
  geogreymon: FIRE_THEME,
  rizegreymon: FIRE_THEME,
  shinegreymon: FIRE_THEME,
  gaomon: SPEED_THEME,
  gaogamon: SPEED_THEME,
  machgaogamon: SPEED_THEME,
  miragegaogamon: SPEED_THEME,
  lalamon: NATURE_THEME,
  sunflowmon: NATURE_THEME,
  lilamon: BLOSSOM_THEME,
  rosemon: ROSE_THEME,
  guilmon: CRIMSON_THEME,
  growlmon: CRIMSON_THEME,
  megalogrowlmon: CRIMSON_THEME,
  dukemon: ROYAL_KNIGHT_THEME,
};

/**
 * Returns the individual 256x256 MMORPG combat skill icon path for any Digimon form (F1 or F2).
 */
export function getDigimonSkillIconUrl(
  formId: DigimonFormId,
  slot: SkillSlotKey
): string {
  return `/assets/skills/${formId}_${slot}.png`;
}

/**
 * Fallback sprite FX path in case an asset fails to load.
 */
export function getDigimonSkillFallbackUrl(
  formId: DigimonFormId,
  slot: SkillSlotKey
): string {
  return `/assets/sprites/digimon/${formId}/${slot === 'f1' ? 'atk1_fx' : 'atk2_fx'}.png?v=fx3`;
}

export function getDigimonSkillTheme(formId: DigimonFormId): SkillSlotVisualTheme {
  return FORM_SKILL_THEMES[formId] ?? SPEED_THEME;
}
