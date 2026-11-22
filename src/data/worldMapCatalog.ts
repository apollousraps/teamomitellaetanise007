import {
  DATA_FOREST_BOSS_TEMPLATE,
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_HABITAT_PACKS,
  DATA_FOREST_IMAGE_URL,
  DATA_FOREST_MAP_ID,
} from '../maps/dataForestMap';
import {
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
} from '../maps/datsCenterMap';
import {
  FRIENDLY_FIELD_NPCS,
  HUNTING_HABITAT_PACKS,
  HUNTING_MAP_ID,
  type WildMonsterSpecies,
} from '../maps/huntingFieldMap';
import { RICHARD_SAMPSON_NPC } from '../sprites/npcSprites';

export type PlayableMapId =
  | typeof DATS_MAP_ID
  | typeof HUNTING_MAP_ID
  | typeof DATA_FOREST_MAP_ID;

export type WorldMapCategory = 'mundo' | 'regioes' | 'eventos';

export type RewardIconKind = 'bits' | 'exp' | 'item' | 'crystal';

export interface WorldMapReward {
  id: string;
  label: string;
  detail: string;
  kind: RewardIconKind;
  iconUrl: string;
}

export interface WorldMapNpcInfo {
  name: string;
  role: string;
}

export interface WorldMapEnemyInfo {
  name: string;
  levelLabel: string;
  species?: WildMonsterSpecies;
  habitat?: string;
  packSize?: number;
}

export interface WorldMapMissionSummary {
  id: string;
  title: string;
  summary: string;
  progressText?: string;
  completed?: boolean;
}

export interface WorldMapRegion {
  id: string;
  /** Present only for real maps currently playable in the game */
  playableMapId: PlayableMapId | null;
  implemented: boolean;
  bannerUrl: string;
  thumbUrl: string;
  name: string;
  subtitle: string;
  zoneType: 'Zona Segura' | 'Área de Caça' | 'Região Futura' | 'Evento Especial';
  minLevel: number;
  maxLevel: number;
  /** Empty for non-combat safe hubs like DATS Center */
  recommendedLevel: string;
  description: string;
  categories: readonly WorldMapCategory[];
  /** Exact percentage coordinates (0-100) aligned to /assets/map/world_map_base.png landmarks */
  mapCoords: { x: number; y: number };
  npcs: readonly WorldMapNpcInfo[];
  enemies: readonly WorldMapEnemyInfo[];
  rewards: readonly WorldMapReward[];
  staticMissions: readonly WorldMapMissionSummary[];
}

export type RegionAccessState =
  | 'current'
  | 'available'
  | 'level-locked'
  | 'upcoming';

const REWARD_ICONS: Record<RewardIconKind, string> = {
  bits: '/assets/map/reward_bits.png',
  exp: '/assets/map/reward_exp.png',
  item: '/assets/map/reward_item.png',
  crystal: '/assets/map/reward_crystal.png',
};

/**
 * Derives all 5 wild Digimon habitat packs (8 mobs each) directly from huntingFieldMap.ts
 */
function buildRealHuntingEnemies(): WorldMapEnemyInfo[] {
  return HUNTING_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));
}

const REAL_DATS_NPCS: WorldMapNpcInfo[] = [
  { name: RICHARD_SAMPSON_NPC.name, role: RICHARD_SAMPSON_NPC.title },
  { name: 'Posto de Missões DATS', role: 'Oficiais de Missão' },
  { name: 'Balcão de Informações', role: 'Guia Digital' },
  { name: 'Terminal dos Tamers', role: 'Gestão e Registros' },
];

const REAL_HUNTING_NPCS: WorldMapNpcInfo[] = FRIENDLY_FIELD_NPCS.map((npc) => ({
  name: npc.name,
  role: npc.role,
}));

const REAL_HUNTING_ENEMIES: WorldMapEnemyInfo[] = buildRealHuntingEnemies();

const REAL_DATA_FOREST_NPCS: WorldMapNpcInfo[] = DATA_FOREST_FRIENDLY_NPCS.map(
  (npc) => ({
    name: npc.name,
    role: npc.role,
  })
);

const REAL_DATA_FOREST_ENEMIES: WorldMapEnemyInfo[] = [
  ...DATA_FOREST_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  })),
  {
    name: `${DATA_FOREST_BOSS_TEMPLATE.name} (Boss de Raid)`,
    species: DATA_FOREST_BOSS_TEMPLATE.species,
    habitat: 'Altar da Grande Árvore · Cooperativo',
    packSize: 1,
    levelLabel: `BOSS Lv. ${DATA_FOREST_BOSS_TEMPLATE.level}`,
  },
];

export const WORLD_MAP_REGIONS: readonly WorldMapRegion[] = [
  // =========================================================================
  // REAL PLAYABLE MAPS REGISTERED IN THE GAME
  // =========================================================================
  {
    id: DATS_MAP_ID,
    playableMapId: DATS_MAP_ID,
    implemented: true,
    bannerUrl: '/assets/map/region_dats_center.png',
    thumbUrl: '/assets/map/region_dats_center.png',
    name: 'DATS Center',
    subtitle: 'Cidade Segura · Base dos Tamers',
    zoneType: 'Zona Segura',
    minLevel: 1,
    maxLevel: 1,
    recommendedLevel: '',
    description:
      'A base central dos Tamers. Cidade segura sem combates, com recuperação natural de HP e DS, oficiais da DATS, loja de suprimentos e portal direto para a Planície Digital onde começa a caça.',
    categories: ['mundo', 'regioes'],
    mapCoords: { x: 50.0, y: 40.2 },
    npcs: REAL_DATS_NPCS,
    enemies: [],
    rewards: [
      {
        id: 'dats-bits',
        label: 'Loja por Bits',
        detail: 'Equipamentos e suprimentos iniciais disponíveis na Loja',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dats-exp',
        label: 'Orientação',
        detail: 'Treinamento inicial e preparo para evolução',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dats-missions',
        label: 'Missões DATS',
        detail: `${DATS_INTERACTION_POINTS.length} pontos de reconhecimento na praça`,
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dats-heal',
        label: 'Cura HP/DS',
        detail: 'Recuperação automática de HP e DS na zona segura',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: HUNTING_MAP_ID,
    playableMapId: HUNTING_MAP_ID,
    implemented: true,
    bannerUrl: '/assets/map/planicie_digital_banner.webp',
    thumbUrl: '/assets/map/planicie_digital_banner.webp',
    name: 'Planície Digital',
    subtitle: 'Início de Up · Nv. 1 ~ 10 · 5 Bandos (40 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 1,
    maxLevel: 10,
    recommendedLevel: 'Lv. 1 ~ 10',
    description:
      'Onde começa a sua jornada de caça! Ilha digital com Área Segura central e 5 territórios progressivos (8 Digimons em cada): Koromon (Nv. 1–2), Tsunomon (Nv. 3–4), Gizamon (Nv. 5–6), Goblimon (Nv. 7–8) e DemiDevimon (Nv. 9–10).',
    categories: ['mundo', 'regioes'],
    mapCoords: { x: 64.5, y: 55.8 },
    npcs: REAL_HUNTING_NPCS,
    enemies: REAL_HUNTING_ENEMIES,
    rewards: [
      {
        id: 'hunt-bits',
        label: 'Bits',
        detail: '15 a 60 Bits por Digimon derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'hunt-exp',
        label: 'EXP Estilo DMO',
        detail: '24 a 166 EXP base (escala conforme diferença de nível)',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'hunt-items',
        label: 'Chips & Discos',
        detail: 'Drop de Chip de HP (+90) e Disco de DS (+60)',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'hunt-safe',
        label: 'Portal Seguro',
        detail: 'Círculo de proteção com regeneração próximo ao portal',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },

  // =========================================================================
  // LOCKED / PLANNED EXPANSION REGIONS (EXPLICITLY NOT YET PLAYABLE)
  // =========================================================================
  {
    id: DATA_FOREST_MAP_ID,
    playableMapId: DATA_FOREST_MAP_ID,
    implemented: true,
    bannerUrl: DATA_FOREST_IMAGE_URL,
    thumbUrl: DATA_FOREST_IMAGE_URL,
    name: 'Floresta de Dados',
    subtitle: 'Nv. 10 ~ 20 · 5 Bandos + Raid Boss Kuwagamon',
    zoneType: 'Área de Caça',
    minLevel: 10,
    maxLevel: 20,
    recommendedLevel: 'Lv. 10 ~ 20',
    description:
      'Floresta antiga repleta de pontes de madeira, cachoeiras e cristais de dados. Possui 5 territórios de caça (Palmon, Kunemon, Mushroomon, Woodmon e Kiwimon) e o temível Raid Boss Kuwagamon (Nv. 20) na Grande Árvore Sagrada — reúna outros jogadores para derrotá-lo!',
    categories: ['mundo', 'regioes'],
    mapCoords: { x: 8.8, y: 43.2 },
    npcs: REAL_DATA_FOREST_NPCS,
    enemies: REAL_DATA_FOREST_ENEMIES,
    rewards: [
      {
        id: 'forest-bits',
        label: 'Bits Elevados',
        detail: '65 a 450 Bits por Digimon e bônus de Raid Boss',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'forest-exp',
        label: 'EXP Lv. 10–20',
        detail: '175 a 611 EXP por mob + 1.500 EXP no Boss Kuwagamon',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'forest-item',
        label: 'Suprimentos',
        detail: 'Chips de HP, Discos de DS e drops futuros do Boss',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'forest-crystal',
        label: 'Raid Boss',
        detail: 'Kuwagamon (Nv. 20) com HP compartilhado entre jogadores',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: 'digi-mountain',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_digi_mountain.png',
    thumbUrl: '/assets/map/region_digi_mountain.png',
    name: 'Montanha Digi',
    subtitle: 'Setor Nordeste · Em desenvolvimento',
    zoneType: 'Região Futura',
    minLevel: 20,
    maxLevel: 30,
    recommendedLevel: 'Lv. 20 ~ 30',
    description:
      'Picos congelados de alta altitude previstos para futuras atualizações. Região planejada para caçadas avançadas rumo ao estágio Ultimate.',
    categories: ['mundo'],
    mapCoords: { x: 71.5, y: 15.2 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'mtn-bits',
        label: 'Bits',
        detail: 'Recompensas previstas para Lv. 20+',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'mtn-exp',
        label: 'EXP Avançada',
        detail: 'Treinamento previsto para Lv. 20 ~ 30',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'mtn-item',
        label: 'Itens',
        detail: 'Equipamentos futuros de gelo e montanha',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'mtn-crystal',
        label: 'Cristais',
        detail: 'Materiais planejados para melhorias futuras',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'mtn-soon',
        title: 'Região em preparação',
        summary: 'Esta área ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
  {
    id: 'digital-desert',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_digital_desert.png',
    thumbUrl: '/assets/map/region_digital_desert.png',
    name: 'Deserto Digital',
    subtitle: 'Setor Sudoeste · Em desenvolvimento',
    zoneType: 'Região Futura',
    minLevel: 30,
    maxLevel: 40,
    recommendedLevel: 'Lv. 30 ~ 40',
    description:
      'Cidadela desértica cercada por tempestades de dados, planejada para Digimons Ultimate em futuras atualizações do servidor.',
    categories: ['mundo'],
    mapCoords: { x: 20.5, y: 60.5 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'des-bits',
        label: 'Bits',
        detail: 'Recompensas planejadas para Lv. 30+',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'des-exp',
        label: 'EXP Ultimate',
        detail: 'Treinamento previsto para Lv. 30 ~ 40',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'des-item',
        label: 'Acessórios',
        detail: 'Sistema de acessórios planejado em breve',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'des-crystal',
        label: 'Núcleos',
        detail: 'Recursos futuros do Deserto Digital',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'des-soon',
        title: 'Região em preparação',
        summary: 'Esta área ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
  {
    id: 'data-sea',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_data_sea.png',
    thumbUrl: '/assets/map/region_data_sea.png',
    name: 'Mar de Dados',
    subtitle: 'Setor Leste · Em desenvolvimento',
    zoneType: 'Região Futura',
    minLevel: 40,
    maxLevel: 50,
    recommendedLevel: 'Lv. 40 ~ 50',
    description:
      'Arquipélago cristalino cercado por correntes digitais. Bloqueado até o lançamento das áreas intermediárias de alto nível.',
    categories: ['mundo'],
    mapCoords: { x: 87.5, y: 29.8 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'sea-bits',
        label: 'Bits',
        detail: 'Recompensas previstas para Lv. 40+',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'sea-exp',
        label: 'EXP',
        detail: 'Treinamento previsto para Lv. 40 ~ 50',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'sea-item',
        label: 'Chips',
        detail: 'Chips de aprimoramento planejados',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'sea-crystal',
        label: 'Cristais',
        detail: 'Fragmentos digitais de futuras atualizações',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'sea-soon',
        title: 'Região em preparação',
        summary: 'Esta área ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
  {
    id: 'dark-area',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_dark_area.png',
    thumbUrl: '/assets/map/region_dark_area.png',
    name: 'Área Sombria',
    subtitle: 'Setor Noroeste · Em desenvolvimento',
    zoneType: 'Região Futura',
    minLevel: 50,
    maxLevel: 60,
    recommendedLevel: 'Lv. 50 ~ 60',
    description:
      'Fortaleza corrompida reservada para Digimons de nível Mega. Será inaugurada junto aos futuros chefes e missões avançadas.',
    categories: ['mundo'],
    mapCoords: { x: 20.8, y: 21.8 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'dark-bits',
        label: 'Bits',
        detail: 'Recompensas previstas para nível Mega',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dark-exp',
        label: 'EXP Mega',
        detail: 'Desafios previstos para Lv. 50+',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dark-item',
        label: 'Relíquias',
        detail: 'Itens avançados previstos em futuras versões',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dark-crystal',
        label: 'Núcleos',
        detail: 'Recursos avançados da Área Sombria',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'dark-soon',
        title: 'Região em preparação',
        summary: 'Esta área ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
  {
    id: 'virtual-world',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_virtual_world.png',
    thumbUrl: '/assets/map/region_virtual_world.png',
    name: 'Mundo Virtual',
    subtitle: 'Setor Sul · Em desenvolvimento',
    zoneType: 'Região Futura',
    minLevel: 60,
    maxLevel: 70,
    recommendedLevel: 'Lv. 60 ~ 70',
    description:
      'Núcleo de dados de alta densidade planejado para o conteúdo de final de jogo. Bloqueado até futuras expansões.',
    categories: ['mundo'],
    mapCoords: { x: 55.6, y: 79.5 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'vw-bits',
        label: 'Bits',
        detail: 'Recompensas previstas para conteúdo avançado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'vw-exp',
        label: 'EXP',
        detail: 'Treinamento previsto para Lv. 60 ~ 70',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'vw-item',
        label: 'Módulos',
        detail: 'Módulos futuros de aprimoramento',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'vw-crystal',
        label: 'Cristais',
        detail: 'Cristais raros de expansões futuras',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'vw-soon',
        title: 'Região em preparação',
        summary: 'Esta área ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },

  // =========================================================================
  // EVENTS TAB (HONESTLY MARKED AS SCHEDULED / LOCKED)
  // =========================================================================
  {
    id: 'plains-invasion',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_dark_area.png',
    thumbUrl: '/assets/map/region_dark_area.png',
    name: 'Cratera de Invasão',
    subtitle: 'Evento Sazonal · Em breve',
    zoneType: 'Evento Especial',
    minLevel: 15,
    maxLevel: 30,
    recommendedLevel: 'Lv. 15 ~ 30',
    description:
      'Zona vulcânica reservada para futuros eventos temporários e invasões de chefes. Nenhum evento está ativo no momento.',
    categories: ['eventos'],
    mapCoords: { x: 82.0, y: 66.5 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'evt-bits',
        label: 'Bits Bônus',
        detail: 'Recompensa prevista durante eventos ativos',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'evt-exp',
        label: 'EXP Bônus',
        detail: 'Bônus de experiência previsto em eventos',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'evt-item',
        label: 'Caixas',
        detail: 'Itens comemorativos planejados',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'evt-crystal',
        label: 'Cristais',
        detail: 'Prêmios especiais de invasão',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'evt-none',
        title: 'Nenhum evento ativo no momento',
        summary: 'Novos eventos sazonais aparecerão aqui quando ativados.',
      },
    ],
  },
] as const;

export function getRegionAccessState(
  region: WorldMapRegion,
  currentMapId: PlayableMapId,
  playerLevel: number,
  isGM = false
): RegionAccessState {
  if (region.implemented && region.playableMapId === currentMapId) {
    return 'current';
  }
  if (!region.implemented || !region.playableMapId) {
    return playerLevel < region.minLevel && !isGM ? 'level-locked' : 'upcoming';
  }
  if (playerLevel < region.minLevel && !isGM) {
    return 'level-locked';
  }
  return 'available';
}

export function getRegionLiveMissions(
  region: WorldMapRegion,
  discoveredZoneCount: number,
  defeatedTotal: number
): WorldMapMissionSummary[] {
  if (region.playableMapId === DATS_MAP_ID) {
    const total = DATS_INTERACTION_POINTS.length;
    const completed = discoveredZoneCount >= total;
    return [
      {
        id: 'dats-recon',
        title: 'Reconhecimento do DATS Center',
        summary: 'Visite os pontos luminosos da praça para registrá-los.',
        progressText: `${discoveredZoneCount}/${total} pontos`,
        completed,
      },
    ];
  }

  if (region.playableMapId === HUNTING_MAP_ID) {
    return [
      {
        id: 'plains-patrol',
        title: 'Patrulha na Planície Digital',
        summary: 'Derrote Digimons selvagens fora da Área Segura.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 10,
      },
    ];
  }

  if (region.playableMapId === DATA_FOREST_MAP_ID) {
    return [
      {
        id: 'forest-raid',
        title: 'Cerco à Grande Árvore · Boss Kuwagamon',
        summary:
          'Upe nos 5 bandos da Floresta (Nv. 10–20) e junte-se a outros Tamers para derrotar o Raid Boss Kuwagamon.',
        progressText: 'Raid Aberta',
        completed: false,
      },
    ];
  }

  return [...region.staticMissions];
}
