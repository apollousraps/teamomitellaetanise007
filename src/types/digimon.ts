export type StarterDigimonId = 'agumon' | 'gaomon' | 'lalamon';

export type DigimonFormId =
  | 'agumon'
  | 'geogreymon'
  | 'rizegreymon'
  | 'shinegreymon'
  | 'gaomon'
  | 'gaogamon'
  | 'machgaogamon'
  | 'miragegaogamon'
  | 'lalamon'
  | 'sunflowmon'
  | 'lilamon'
  | 'rosemon';

export type DigimonEvolutionStage = 'Rookie' | 'Champion' | 'Ultimate' | 'Mega';

export type StarterDigimonElement = 'Fogo' | 'Velocidade' | 'Natureza';

export type PartnerAIState =
  | 'IDLE'
  | 'FOLLOW'
  | 'SEARCH'
  | 'CHASE'
  | 'ATTACK'
  | 'RETURN'
  | 'RECOVER';

export type PartnerAttackKind = 'basic' | 'special1' | 'special2';

export interface StarterDigimonTheme {
  accentHex: string;
  secondaryHex: string;
  glowRgba: string;
  borderClass: string;
  selectedGlowShadow: string;
  pedestalGradient: string;
  cardBgGradient: string;
  badgeBgClass: string;
}

export interface StarterDigimonProfile {
  id: StarterDigimonId;
  name: string;
  element: StarterDigimonElement;
  personality: string;
  description: string;
  cardCaption: string;
  portraitUrl: string;
  special1Name: string;
  special2Name: string;
  theme: StarterDigimonTheme;
}

export interface DigimonFormBaseStats {
  hpBase: number;
  hpPerLv: number;
  dsBase: number;
  dsPerLv: number;
  atBase: number;
  atPerLv: number;
  deBase: number;
  dePerLv: number;
  asSec: number;
  ctBase: number;
  ctPerLv: number;
  htBase: number;
  htPerLv: number;
  evBase: number;
  evPerLv: number;
  blBase: number;
  blPerLv: number;
  skill1Ratio: number;
  skill2Ratio: number;
}

export interface DigimonWorldDimensions {
  /** Studied rendered opaque height on the world map (px, relative to Tamer ~90px) */
  heightPx: number;
  /** Studied rendered opaque width on the world map (px) */
  widthPx: number;
  /** Ground contact shadow X-radius (px) */
  shadowRx: number;
  /** Ground contact shadow Y-radius (px) */
  shadowRy: number;
  /** Floating name tag offset above feet (px) */
  nameplateOffsetY: number;
  /** Target height for F1/F2/basic attack poses (px) */
  attackPoseHeight: number;
  /** Extra trailing separation from Tamer so larger evolutions never overlap */
  followGapBonus: number;
  /** Canonical reference stature in meters */
  canonicalHeightMeters: number;
}

export interface DigimonFormProfile {
  id: DigimonFormId;
  starterId: StarterDigimonId;
  name: string;
  stage: DigimonEvolutionStage;
  unlockLevel: number;
  element: StarterDigimonElement;
  portraitUrl: string;
  special1Name: string;
  special2Name: string;
  basicHitIntervalSec: number;
  special1CooldownSec: number;
  special2CooldownSec: number;
  hpMult: number;
  dsMult: number;
  atkMult: number;
  defMult: number;
  spdMult: number;
  skill1PowerMult: number;
  skill2PowerMult: number;
  baseStats: DigimonFormBaseStats;
  worldScale: number;
  worldDimensions: DigimonWorldDimensions;
  theme: StarterDigimonTheme;
}

export interface SavedStarterDigimon {
  accountUsername: string;
  digimonId: StarterDigimonId;
  digimonName: string;
  element: StarterDigimonElement;
  chosenAt: string;
}

export const PARTNER_AI_STATE_LABELS: Record<PartnerAIState, string> = {
  IDLE: 'Parado',
  FOLLOW: 'Seguindo',
  SEARCH: 'Procurando',
  CHASE: 'Perseguindo',
  ATTACK: 'Em Combate',
  RETURN: 'Retornando',
  RECOVER: 'Desviando',
};

const AGUMON_THEME: StarterDigimonTheme = {
  accentHex: '#fbbf24',
  secondaryHex: '#f97316',
  glowRgba: 'rgba(251, 191, 36, 0.72)',
  borderClass: 'border-amber-400',
  selectedGlowShadow: '0 0 28px rgba(251, 191, 36, 0.78)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(253,224,71,0.95) 0%, rgba(245,158,11,0.55) 48%, rgba(234,88,12,0.08) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(120,53,15,0.42) 0%, rgba(180,83,9,0.22) 48%, rgba(24,14,5,0.92) 100%)',
  badgeBgClass: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
};

const GEOGREYMON_THEME: StarterDigimonTheme = {
  accentHex: '#fb923c',
  secondaryHex: '#ef4444',
  glowRgba: 'rgba(249, 115, 22, 0.82)',
  borderClass: 'border-orange-400',
  selectedGlowShadow: '0 0 30px rgba(249, 115, 22, 0.85)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(251,146,60,0.95) 0%, rgba(234,88,12,0.6) 48%, rgba(185,28,28,0.12) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(154,52,18,0.48) 0%, rgba(194,65,12,0.25) 48%, rgba(30,10,5,0.94) 100%)',
  badgeBgClass: 'bg-orange-500/20 text-orange-200 border-orange-400/55',
};

const RIZEGREYMON_THEME: StarterDigimonTheme = {
  accentHex: '#f87171',
  secondaryHex: '#f59e0b',
  glowRgba: 'rgba(248, 113, 113, 0.85)',
  borderClass: 'border-rose-400',
  selectedGlowShadow: '0 0 32px rgba(244, 63, 94, 0.85)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(251,191,36,0.9) 0%, rgba(239,68,68,0.6) 48%, rgba(127,29,29,0.15) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(153,27,27,0.5) 0%, rgba(180,83,9,0.25) 48%, rgba(26,8,12,0.95) 100%)',
  badgeBgClass: 'bg-rose-500/20 text-rose-200 border-rose-400/55',
};

const SHINEGREYMON_THEME: StarterDigimonTheme = {
  accentHex: '#fde047',
  secondaryHex: '#ef4444',
  glowRgba: 'rgba(253, 224, 71, 0.92)',
  borderClass: 'border-yellow-300',
  selectedGlowShadow: '0 0 36px rgba(250, 204, 21, 0.92)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(254,240,138,0.98) 0%, rgba(251,191,36,0.68) 48%, rgba(220,38,38,0.16) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(180,83,9,0.55) 0%, rgba(220,38,38,0.26) 48%, rgba(28,12,4,0.95) 100%)',
  badgeBgClass: 'bg-yellow-400/25 text-yellow-200 border-yellow-300/65',
};

const GAOMON_THEME: StarterDigimonTheme = {
  accentHex: '#38bdf8',
  secondaryHex: '#0284c7',
  glowRgba: 'rgba(56, 189, 248, 0.72)',
  borderClass: 'border-cyan-400',
  selectedGlowShadow: '0 0 28px rgba(56, 189, 248, 0.82)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(125,211,252,0.95) 0%, rgba(14,165,233,0.55) 48%, rgba(2,132,199,0.08) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(12,74,110,0.48) 0%, rgba(7,89,133,0.24) 48%, rgba(4,16,38,0.94) 100%)',
  badgeBgClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
};

const GAOGAMON_THEME: StarterDigimonTheme = {
  accentHex: '#60a5fa',
  secondaryHex: '#ef4444',
  glowRgba: 'rgba(56, 189, 248, 0.86)',
  borderClass: 'border-sky-400',
  selectedGlowShadow: '0 0 32px rgba(56, 189, 248, 0.88)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(125,211,252,0.96) 0%, rgba(37,99,235,0.62) 48%, rgba(239,68,68,0.14) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(12,74,110,0.52) 0%, rgba(29,78,216,0.26) 48%, rgba(4,14,36,0.95) 100%)',
  badgeBgClass: 'bg-sky-500/25 text-sky-200 border-sky-400/60',
};

const MACHGAOGAMON_THEME: StarterDigimonTheme = {
  accentHex: '#38bdf8',
  secondaryHex: '#f43f5e',
  glowRgba: 'rgba(56, 189, 248, 0.9)',
  borderClass: 'border-cyan-300',
  selectedGlowShadow: '0 0 34px rgba(56, 189, 248, 0.92)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(186,230,253,0.98) 0%, rgba(14,165,233,0.68) 48%, rgba(244,63,94,0.16) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(8,47,73,0.58) 0%, rgba(30,64,175,0.28) 48%, rgba(4,12,32,0.96) 100%)',
  badgeBgClass: 'bg-cyan-400/25 text-cyan-100 border-cyan-300/65',
};

const MIRAGEGAOGAMON_THEME: StarterDigimonTheme = {
  accentHex: '#60a5fa',
  secondaryHex: '#facc15',
  glowRgba: 'rgba(96, 165, 250, 0.94)',
  borderClass: 'border-sky-300',
  selectedGlowShadow: '0 0 38px rgba(56, 189, 248, 0.95)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(254,240,138,0.96) 0%, rgba(56,189,248,0.72) 48%, rgba(37,99,235,0.18) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(23,37,84,0.62) 0%, rgba(3,105,161,0.3) 48%, rgba(4,10,28,0.96) 100%)',
  badgeBgClass: 'bg-sky-400/25 text-sky-100 border-yellow-300/70',
};

const LALAMON_THEME: StarterDigimonTheme = {
  accentHex: '#e879f9',
  secondaryHex: '#4ade80',
  glowRgba: 'rgba(232, 121, 249, 0.72)',
  borderClass: 'border-fuchsia-400',
  selectedGlowShadow: '0 0 28px rgba(232, 121, 249, 0.78)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(240,171,252,0.92) 0%, rgba(192,38,211,0.52) 48%, rgba(134,25,143,0.08) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(112,26,117,0.45) 0%, rgba(134,25,143,0.22) 48%, rgba(26,8,34,0.94) 100%)',
  badgeBgClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/50',
};

const SUNFLOWMON_THEME: StarterDigimonTheme = {
  accentHex: '#facc15',
  secondaryHex: '#22c55e',
  glowRgba: 'rgba(250, 204, 21, 0.84)',
  borderClass: 'border-lime-400',
  selectedGlowShadow: '0 0 32px rgba(163, 230, 53, 0.88)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(254,240,138,0.96) 0%, rgba(74,222,128,0.62) 48%, rgba(22,163,74,0.14) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(20,83,45,0.54) 0%, rgba(132,204,22,0.24) 48%, rgba(8,26,14,0.95) 100%)',
  badgeBgClass: 'bg-lime-500/25 text-lime-200 border-yellow-300/60',
};

const LILAMON_THEME: StarterDigimonTheme = {
  accentHex: '#f472b6',
  secondaryHex: '#fde047',
  glowRgba: 'rgba(244, 114, 182, 0.88)',
  borderClass: 'border-pink-400',
  selectedGlowShadow: '0 0 34px rgba(244, 114, 182, 0.9)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(251,207,232,0.96) 0%, rgba(236,72,153,0.64) 48%, rgba(250,204,21,0.16) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(131,24,67,0.56) 0%, rgba(190,24,93,0.26) 48%, rgba(28,8,24,0.95) 100%)',
  badgeBgClass: 'bg-pink-500/25 text-pink-100 border-pink-300/65',
};

const ROSEMON_THEME: StarterDigimonTheme = {
  accentHex: '#fb7185',
  secondaryHex: '#facc15',
  glowRgba: 'rgba(244, 63, 94, 0.94)',
  borderClass: 'border-rose-400',
  selectedGlowShadow: '0 0 38px rgba(244, 63, 94, 0.94)',
  pedestalGradient:
    'radial-gradient(ellipse at center, rgba(254,205,211,0.98) 0%, rgba(225,29,72,0.72) 48%, rgba(250,204,21,0.18) 78%, transparent 100%)',
  cardBgGradient:
    'linear-gradient(180deg, rgba(136,19,55,0.62) 0%, rgba(159,18,57,0.3) 48%, rgba(28,6,14,0.96) 100%)',
  badgeBgClass: 'bg-rose-500/25 text-rose-100 border-yellow-300/70',
};

export const STARTER_DIGIMONS: readonly StarterDigimonProfile[] = [
  {
    id: 'agumon',
    name: 'AGUMON',
    element: 'Fogo',
    personality: 'Corajoso e determinado',
    description: 'Um Digimon dinâmico e corajoso!',
    cardCaption: 'Fogo ardente e força de batalha!',
    portraitUrl: '/assets/digimon/agumon.png',
    special1Name: 'Garra de Fogo',
    special2Name: 'Rajada de Chamas',
    theme: AGUMON_THEME,
  },
  {
    id: 'gaomon',
    name: 'GAOMON',
    element: 'Velocidade',
    personality: 'Ágil e determinado',
    description: 'Um Digimon ágil, especializado em combate e velocidade!',
    cardCaption: 'Golpes velozes e reflexos rápidos!',
    portraitUrl: '/assets/digimon/gaomon.png',
    special1Name: 'Soco Veloz',
    special2Name: 'Onda de Impacto',
    theme: GAOMON_THEME,
  },
  {
    id: 'lalamon',
    name: 'LALAMON',
    element: 'Natureza',
    personality: 'Gentil e misterioso',
    description: 'Um Digimon conectado à natureza!',
    cardCaption: 'Energia pura das florestas digitais!',
    portraitUrl: '/assets/digimon/lalamon.png',
    special1Name: 'Rajada de Sementes',
    special2Name: 'Raiz Gigante',
    theme: LALAMON_THEME,
  },
] as const;

export const DIGIMON_FORM_PROFILES: Record<DigimonFormId, DigimonFormProfile> = {
  agumon: {
    id: 'agumon',
    starterId: 'agumon',
    name: 'AGUMON',
    stage: 'Rookie',
    unlockLevel: 1,
    element: 'Fogo',
    portraitUrl: '/assets/digimon/agumon.png',
    special1Name: 'Garra de Fogo',
    special2Name: 'Rajada de Chamas',
    basicHitIntervalSec: 1.05,
    special1CooldownSec: 4.5,
    special2CooldownSec: 9.0,
    hpMult: 1.0,
    dsMult: 1.0,
    atkMult: 1.0,
    defMult: 1.0,
    spdMult: 1.0,
    skill1PowerMult: 1.0,
    skill2PowerMult: 1.0,
    baseStats: {
      hpBase: 240,
      hpPerLv: 18,
      dsBase: 120,
      dsPerLv: 8,
      atBase: 35,
      atPerLv: 3.4,
      deBase: 12,
      dePerLv: 1.5,
      asSec: 2.1,
      ctBase: 3.5,
      ctPerLv: 0.06,
      htBase: 90,
      htPerLv: 3.5,
      evBase: 3.2,
      evPerLv: 0.05,
      blBase: 2.5,
      blPerLv: 0.05,
      skill1Ratio: 1.85,
      skill2Ratio: 2.85,
    },
    worldScale: 0.55,
    worldDimensions: {
      heightPx: 62,
      widthPx: 49,
      shadowRx: 17,
      shadowRy: 5.8,
      nameplateOffsetY: 72,
      attackPoseHeight: 66,
      followGapBonus: 0,
      canonicalHeightMeters: 1.1,
    },
    theme: AGUMON_THEME,
  },
  geogreymon: {
    id: 'geogreymon',
    starterId: 'agumon',
    name: 'GEOGREYMON',
    stage: 'Champion',
    unlockLevel: 15,
    element: 'Fogo',
    portraitUrl: '/assets/digimon/geogreymon.png?v=2',
    special1Name: 'Garra de Fogo',
    special2Name: 'Rajada de Chamas',
    basicHitIntervalSec: 1.1,
    special1CooldownSec: 5.0,
    special2CooldownSec: 10.5,
    hpMult: 1.45,
    dsMult: 1.35,
    atkMult: 1.48,
    defMult: 1.42,
    spdMult: 1.08,
    skill1PowerMult: 1.55,
    skill2PowerMult: 1.62,
    baseStats: {
      hpBase: 410,
      hpPerLv: 25,
      dsBase: 175,
      dsPerLv: 10,
      atBase: 68,
      atPerLv: 5.1,
      deBase: 24,
      dePerLv: 2.2,
      asSec: 2.2,
      ctBase: 4.5,
      ctPerLv: 0.07,
      htBase: 120,
      htPerLv: 4.0,
      evBase: 4.0,
      evPerLv: 0.06,
      blBase: 3.3,
      blPerLv: 0.06,
      skill1Ratio: 1.95,
      skill2Ratio: 3.0,
    },
    worldScale: 0.95,
    worldDimensions: {
      heightPx: 108,
      widthPx: 71,
      shadowRx: 26,
      shadowRy: 8.5,
      nameplateOffsetY: 118,
      attackPoseHeight: 114,
      followGapBonus: 10,
      canonicalHeightMeters: 2.3,
    },
    theme: GEOGREYMON_THEME,
  },
  rizegreymon: {
    id: 'rizegreymon',
    starterId: 'agumon',
    name: 'RIZEGREYMON',
    stage: 'Ultimate',
    unlockLevel: 30,
    element: 'Fogo',
    portraitUrl: '/assets/digimon/rizegreymon.png?v=2',
    special1Name: 'Rize Buster',
    special2Name: 'Rize Hammer',
    basicHitIntervalSec: 1.06,
    special1CooldownSec: 5.5,
    special2CooldownSec: 12.0,
    hpMult: 1.98,
    dsMult: 1.72,
    atkMult: 2.1,
    defMult: 1.88,
    spdMult: 1.16,
    skill1PowerMult: 2.25,
    skill2PowerMult: 2.4,
    baseStats: {
      hpBase: 660,
      hpPerLv: 31,
      dsBase: 265,
      dsPerLv: 12,
      atBase: 112,
      atPerLv: 6.5,
      deBase: 40,
      dePerLv: 2.6,
      asSec: 2.12,
      ctBase: 6.0,
      ctPerLv: 0.08,
      htBase: 165,
      htPerLv: 4.5,
      evBase: 5.0,
      evPerLv: 0.06,
      blBase: 4.0,
      blPerLv: 0.06,
      skill1Ratio: 2.05,
      skill2Ratio: 3.2,
    },
    worldScale: 1.16,
    worldDimensions: {
      heightPx: 138,
      widthPx: 96,
      shadowRx: 34,
      shadowRy: 11,
      nameplateOffsetY: 148,
      attackPoseHeight: 144,
      followGapBonus: 18,
      canonicalHeightMeters: 3.2,
    },
    theme: RIZEGREYMON_THEME,
  },
  shinegreymon: {
    id: 'shinegreymon',
    starterId: 'agumon',
    name: 'SHINEGREYMON',
    stage: 'Mega',
    unlockLevel: 50,
    element: 'Fogo',
    portraitUrl: '/assets/digimon/shinegreymon.png?v=2',
    special1Name: 'Shine Shot',
    special2Name: 'Shine Strike',
    basicHitIntervalSec: 0.99,
    special1CooldownSec: 6.0,
    special2CooldownSec: 14.0,
    hpMult: 2.7,
    dsMult: 2.2,
    atkMult: 2.9,
    defMult: 2.5,
    spdMult: 1.24,
    skill1PowerMult: 3.1,
    skill2PowerMult: 3.35,
    baseStats: {
      hpBase: 1120,
      hpPerLv: 40,
      dsBase: 410,
      dsPerLv: 15,
      atBase: 195,
      atPerLv: 8.6,
      deBase: 72,
      dePerLv: 3.2,
      asSec: 1.98,
      ctBase: 7.8,
      ctPerLv: 0.08,
      htBase: 220,
      htPerLv: 5.0,
      evBase: 6.5,
      evPerLv: 0.06,
      blBase: 5.0,
      blPerLv: 0.06,
      skill1Ratio: 2.2,
      skill2Ratio: 3.45,
    },
    worldScale: 1.33,
    worldDimensions: {
      heightPx: 166,
      widthPx: 128,
      shadowRx: 42,
      shadowRy: 13.5,
      nameplateOffsetY: 176,
      attackPoseHeight: 172,
      followGapBonus: 26,
      canonicalHeightMeters: 4.1,
    },
    theme: SHINEGREYMON_THEME,
  },
  gaomon: {
    id: 'gaomon',
    starterId: 'gaomon',
    name: 'GAOMON',
    stage: 'Rookie',
    unlockLevel: 1,
    element: 'Velocidade',
    portraitUrl: '/assets/digimon/gaomon.png',
    special1Name: 'Soco Veloz',
    special2Name: 'Onda de Impacto',
    basicHitIntervalSec: 0.92,
    special1CooldownSec: 4.0,
    special2CooldownSec: 8.5,
    hpMult: 1.0,
    dsMult: 1.0,
    atkMult: 1.0,
    defMult: 1.0,
    spdMult: 1.08,
    skill1PowerMult: 1.0,
    skill2PowerMult: 1.0,
    baseStats: {
      hpBase: 215,
      hpPerLv: 16,
      dsBase: 115,
      dsPerLv: 7.5,
      atBase: 33,
      atPerLv: 3.2,
      deBase: 10,
      dePerLv: 1.3,
      asSec: 1.85,
      ctBase: 4.8,
      ctPerLv: 0.08,
      htBase: 98,
      htPerLv: 4.0,
      evBase: 4.5,
      evPerLv: 0.08,
      blBase: 2.0,
      blPerLv: 0.04,
      skill1Ratio: 1.85,
      skill2Ratio: 2.8,
    },
    worldScale: 0.54,
    worldDimensions: {
      heightPx: 60,
      widthPx: 43,
      shadowRx: 16,
      shadowRy: 5.5,
      nameplateOffsetY: 70,
      attackPoseHeight: 64,
      followGapBonus: 0,
      canonicalHeightMeters: 1.1,
    },
    theme: GAOMON_THEME,
  },
  gaogamon: {
    id: 'gaogamon',
    starterId: 'gaomon',
    name: 'GAOGAMON',
    stage: 'Champion',
    unlockLevel: 15,
    element: 'Velocidade',
    portraitUrl: '/assets/digimon/gaogamon.png?v=1',
    special1Name: 'Garra Dupla Veloz',
    special2Name: 'Sopro Espiral',
    basicHitIntervalSec: 0.9,
    special1CooldownSec: 4.5,
    special2CooldownSec: 9.5,
    hpMult: 1.42,
    dsMult: 1.38,
    atkMult: 1.5,
    defMult: 1.36,
    spdMult: 1.18,
    skill1PowerMult: 1.58,
    skill2PowerMult: 1.65,
    baseStats: {
      hpBase: 375,
      hpPerLv: 22,
      dsBase: 165,
      dsPerLv: 9.5,
      atBase: 64,
      atPerLv: 4.9,
      deBase: 20,
      dePerLv: 1.9,
      asSec: 1.8,
      ctBase: 6.0,
      ctPerLv: 0.09,
      htBase: 132,
      htPerLv: 4.4,
      evBase: 5.6,
      evPerLv: 0.09,
      blBase: 2.6,
      blPerLv: 0.05,
      skill1Ratio: 1.95,
      skill2Ratio: 2.95,
    },
    worldScale: 0.83,
    worldDimensions: {
      heightPx: 105,
      widthPx: 101,
      shadowRx: 33,
      shadowRy: 10.5,
      nameplateOffsetY: 115,
      attackPoseHeight: 110,
      followGapBonus: 12,
      canonicalHeightMeters: 2.2,
    },
    theme: GAOGAMON_THEME,
  },
  machgaogamon: {
    id: 'machgaogamon',
    starterId: 'gaomon',
    name: 'MACHGAOGAMON',
    stage: 'Ultimate',
    unlockLevel: 30,
    element: 'Velocidade',
    portraitUrl: '/assets/digimon/machgaogamon.png?v=1',
    special1Name: 'Punho Vencedor',
    special2Name: 'Canhão Uivante',
    basicHitIntervalSec: 0.86,
    special1CooldownSec: 5.0,
    special2CooldownSec: 11.0,
    hpMult: 1.94,
    dsMult: 1.76,
    atkMult: 2.15,
    defMult: 1.82,
    spdMult: 1.28,
    skill1PowerMult: 2.3,
    skill2PowerMult: 2.45,
    baseStats: {
      hpBase: 600,
      hpPerLv: 28,
      dsBase: 255,
      dsPerLv: 11.5,
      atBase: 106,
      atPerLv: 6.3,
      deBase: 34,
      dePerLv: 2.2,
      asSec: 1.72,
      ctBase: 7.8,
      ctPerLv: 0.09,
      htBase: 180,
      htPerLv: 5.0,
      evBase: 7.0,
      evPerLv: 0.09,
      blBase: 3.3,
      blPerLv: 0.05,
      skill1Ratio: 2.08,
      skill2Ratio: 3.15,
    },
    worldScale: 1.08,
    worldDimensions: {
      heightPx: 134,
      widthPx: 107,
      shadowRx: 36,
      shadowRy: 11.5,
      nameplateOffsetY: 144,
      attackPoseHeight: 140,
      followGapBonus: 18,
      canonicalHeightMeters: 3.0,
    },
    theme: MACHGAOGAMON_THEME,
  },
  miragegaogamon: {
    id: 'miragegaogamon',
    starterId: 'gaomon',
    name: 'MIRAGEGAOGAMON',
    stage: 'Mega',
    unlockLevel: 50,
    element: 'Velocidade',
    portraitUrl: '/assets/digimon/miragegaogamon.png?v=1',
    special1Name: 'Miragem Crescente',
    special2Name: 'Canhão Lua Cheia',
    basicHitIntervalSec: 0.81,
    special1CooldownSec: 5.5,
    special2CooldownSec: 12.5,
    hpMult: 2.62,
    dsMult: 2.28,
    atkMult: 2.86,
    defMult: 2.42,
    spdMult: 1.38,
    skill1PowerMult: 3.12,
    skill2PowerMult: 3.38,
    baseStats: {
      hpBase: 1010,
      hpPerLv: 36,
      dsBase: 390,
      dsPerLv: 14,
      atBase: 185,
      atPerLv: 8.3,
      deBase: 62,
      dePerLv: 2.8,
      asSec: 1.62,
      ctBase: 9.8,
      ctPerLv: 0.1,
      htBase: 245,
      htPerLv: 5.5,
      evBase: 9.0,
      evPerLv: 0.09,
      blBase: 4.0,
      blPerLv: 0.05,
      skill1Ratio: 2.22,
      skill2Ratio: 3.4,
    },
    worldScale: 1.27,
    worldDimensions: {
      heightPx: 160,
      widthPx: 124,
      shadowRx: 40,
      shadowRy: 13,
      nameplateOffsetY: 170,
      attackPoseHeight: 166,
      followGapBonus: 26,
      canonicalHeightMeters: 3.9,
    },
    theme: MIRAGEGAOGAMON_THEME,
  },
  lalamon: {
    id: 'lalamon',
    starterId: 'lalamon',
    name: 'LALAMON',
    stage: 'Rookie',
    unlockLevel: 1,
    element: 'Natureza',
    portraitUrl: '/assets/digimon/lalamon.png',
    special1Name: 'Rajada de Sementes',
    special2Name: 'Raiz Gigante',
    basicHitIntervalSec: 0.99,
    special1CooldownSec: 4.5,
    special2CooldownSec: 9.5,
    hpMult: 1.0,
    dsMult: 1.0,
    atkMult: 1.0,
    defMult: 1.0,
    spdMult: 1.0,
    skill1PowerMult: 1.0,
    skill2PowerMult: 1.0,
    baseStats: {
      hpBase: 225,
      hpPerLv: 17,
      dsBase: 145,
      dsPerLv: 10,
      atBase: 31,
      atPerLv: 3.1,
      deBase: 13,
      dePerLv: 1.6,
      asSec: 1.98,
      ctBase: 3.8,
      ctPerLv: 0.07,
      htBase: 94,
      htPerLv: 3.8,
      evBase: 3.8,
      evPerLv: 0.06,
      blBase: 3.0,
      blPerLv: 0.06,
      skill1Ratio: 1.95,
      skill2Ratio: 3.0,
    },
    worldScale: 0.48,
    worldDimensions: {
      heightPx: 56,
      widthPx: 38,
      shadowRx: 14,
      shadowRy: 4.8,
      nameplateOffsetY: 66,
      attackPoseHeight: 60,
      followGapBonus: 0,
      canonicalHeightMeters: 1.0,
    },
    theme: LALAMON_THEME,
  },
  sunflowmon: {
    id: 'sunflowmon',
    starterId: 'lalamon',
    name: 'SUNFLOWMON',
    stage: 'Champion',
    unlockLevel: 15,
    element: 'Natureza',
    portraitUrl: '/assets/digimon/sunflowmon.png?v=1',
    special1Name: 'Raio Solar',
    special2Name: 'Cauda Espinhosa',
    basicHitIntervalSec: 0.97,
    special1CooldownSec: 5.0,
    special2CooldownSec: 11.0,
    hpMult: 1.44,
    dsMult: 1.46,
    atkMult: 1.44,
    defMult: 1.42,
    spdMult: 1.1,
    skill1PowerMult: 1.6,
    skill2PowerMult: 1.66,
    baseStats: {
      hpBase: 390,
      hpPerLv: 23.5,
      dsBase: 215,
      dsPerLv: 12,
      atBase: 60,
      atPerLv: 4.6,
      deBase: 26,
      dePerLv: 2.3,
      asSec: 1.94,
      ctBase: 4.8,
      ctPerLv: 0.08,
      htBase: 128,
      htPerLv: 4.2,
      evBase: 4.6,
      evPerLv: 0.07,
      blBase: 3.8,
      blPerLv: 0.07,
      skill1Ratio: 2.08,
      skill2Ratio: 3.18,
    },
    worldScale: 0.92,
    worldDimensions: {
      heightPx: 98,
      widthPx: 96,
      shadowRx: 30,
      shadowRy: 9.5,
      nameplateOffsetY: 108,
      attackPoseHeight: 104,
      followGapBonus: 10,
      canonicalHeightMeters: 2.1,
    },
    theme: SUNFLOWMON_THEME,
  },
  lilamon: {
    id: 'lilamon',
    starterId: 'lalamon',
    name: 'LILAMON',
    stage: 'Ultimate',
    unlockLevel: 30,
    element: 'Natureza',
    portraitUrl: '/assets/digimon/lilamon.png?v=1',
    special1Name: 'Chuva de Lilás',
    special2Name: 'Tapa da Beleza',
    basicHitIntervalSec: 0.93,
    special1CooldownSec: 5.5,
    special2CooldownSec: 12.5,
    hpMult: 1.92,
    dsMult: 1.94,
    atkMult: 2.08,
    defMult: 1.84,
    spdMult: 1.2,
    skill1PowerMult: 2.32,
    skill2PowerMult: 2.46,
    baseStats: {
      hpBase: 625,
      hpPerLv: 29.5,
      dsBase: 330,
      dsPerLv: 14.5,
      atBase: 100,
      atPerLv: 6.0,
      deBase: 42,
      dePerLv: 2.8,
      asSec: 1.86,
      ctBase: 6.4,
      ctPerLv: 0.08,
      htBase: 175,
      htPerLv: 4.8,
      evBase: 6.0,
      evPerLv: 0.07,
      blBase: 4.6,
      blPerLv: 0.07,
      skill1Ratio: 2.2,
      skill2Ratio: 3.35,
    },
    worldScale: 1.05,
    worldDimensions: {
      heightPx: 124,
      widthPx: 55,
      shadowRx: 22,
      shadowRy: 7.2,
      nameplateOffsetY: 136,
      attackPoseHeight: 130,
      followGapBonus: 16,
      canonicalHeightMeters: 2.7,
    },
    theme: LILAMON_THEME,
  },
  rosemon: {
    id: 'rosemon',
    starterId: 'lalamon',
    name: 'ROSEMON',
    stage: 'Mega',
    unlockLevel: 50,
    element: 'Natureza',
    portraitUrl: '/assets/digimon/rosemon.png?v=1',
    special1Name: 'Chicote de Espinhos',
    special2Name: 'Tentação Proibida',
    basicHitIntervalSec: 0.88,
    special1CooldownSec: 6.0,
    special2CooldownSec: 14.0,
    hpMult: 2.65,
    dsMult: 2.48,
    atkMult: 2.88,
    defMult: 2.46,
    spdMult: 1.3,
    skill1PowerMult: 3.14,
    skill2PowerMult: 3.42,
    baseStats: {
      hpBase: 1060,
      hpPerLv: 38,
      dsBase: 510,
      dsPerLv: 18,
      atBase: 175,
      atPerLv: 8.0,
      deBase: 76,
      dePerLv: 3.4,
      asSec: 1.75,
      ctBase: 8.2,
      ctPerLv: 0.08,
      htBase: 235,
      htPerLv: 5.2,
      evBase: 7.8,
      evPerLv: 0.07,
      blBase: 5.6,
      blPerLv: 0.07,
      skill1Ratio: 2.35,
      skill2Ratio: 3.6,
    },
    worldScale: 1.21,
    worldDimensions: {
      heightPx: 150,
      widthPx: 106,
      shadowRx: 35,
      shadowRy: 11.2,
      nameplateOffsetY: 160,
      attackPoseHeight: 156,
      followGapBonus: 22,
      canonicalHeightMeters: 3.5,
    },
    theme: ROSEMON_THEME,
  },
};

export const EVOLUTION_FORM_CHAINS: Record<
  StarterDigimonId,
  readonly DigimonFormProfile[]
> = {
  agumon: [
    DIGIMON_FORM_PROFILES.agumon,
    DIGIMON_FORM_PROFILES.geogreymon,
    DIGIMON_FORM_PROFILES.rizegreymon,
    DIGIMON_FORM_PROFILES.shinegreymon,
  ],
  gaomon: [
    DIGIMON_FORM_PROFILES.gaomon,
    DIGIMON_FORM_PROFILES.gaogamon,
    DIGIMON_FORM_PROFILES.machgaogamon,
    DIGIMON_FORM_PROFILES.miragegaogamon,
  ],
  lalamon: [
    DIGIMON_FORM_PROFILES.lalamon,
    DIGIMON_FORM_PROFILES.sunflowmon,
    DIGIMON_FORM_PROFILES.lilamon,
    DIGIMON_FORM_PROFILES.rosemon,
  ],
};

export function getStarterDigimonById(
  id: StarterDigimonId
): StarterDigimonProfile {
  return STARTER_DIGIMONS.find((d) => d.id === id) ?? STARTER_DIGIMONS[0];
}

export function getDigimonFormProfile(
  formId: DigimonFormId
): DigimonFormProfile {
  return DIGIMON_FORM_PROFILES[formId] ?? DIGIMON_FORM_PROFILES.agumon;
}

export function getEvolutionChainForStarter(
  starterId: StarterDigimonId
): readonly DigimonFormProfile[] {
  return EVOLUTION_FORM_CHAINS[starterId] ?? EVOLUTION_FORM_CHAINS.agumon;
}

export function resolveActiveFormProfile(
  starterId: StarterDigimonId,
  activeFormId?: DigimonFormId
): DigimonFormProfile {
  const chain = getEvolutionChainForStarter(starterId);
  if (activeFormId) {
    const match = chain.find((f) => f.id === activeFormId);
    if (match) return match;
  }
  return chain[0];
}
