import type {
  DataElementType,
  DigiEggItemMetadata,
  HatchQualityGrade,
  InventoryCategory,
  InventoryItem,
  ItemRarity,
} from '../types/hud';

export interface HatchQualityProfile {
  grade: HatchQualityGrade;
  label: '3/5' | '4/5' | '5/5';
  qualityName: string;
  sizeRangeLabel: string;
  defaultSizePct: number;
  statMultiplier: number;
  badgeColor: string;
  description: string;
}

export const MIN_HATCHABLE_LEVEL = 3;
export const MAX_HATCHABLE_LEVEL = 5;

export const DMO_HATCH_QUALITY_PROFILES: Record<
  HatchQualityGrade,
  HatchQualityProfile
> = {
  3: {
    grade: 3,
    label: '3/5',
    qualityName: 'Aceitável',
    sizeRangeLabel: '85%–100%',
    defaultSizePct: 100,
    statMultiplier: 1.0,
    badgeColor: '#38bdf8',
    description:
      'Digimon aceitável (padrão dos iniciais): atributos base equilibrados (1.00×).',
  },
  4: {
    grade: 4,
    label: '4/5',
    qualityName: 'Forte',
    sizeRangeLabel: '115%–125%',
    defaultSizePct: 120,
    statMultiplier: 1.18,
    badgeColor: '#c084fc',
    description:
      'Digimon mais ou menos forte: recebe +18% em HP, DS, AT, DE e Poder de Combate.',
  },
  5: {
    grade: 5,
    label: '5/5',
    qualityName: 'Muito Forte',
    sizeRangeLabel: '126%–140%',
    defaultSizePct: 135,
    statMultiplier: 1.35,
    badgeColor: '#fbbf24',
    description:
      'Qualidade máxima estilo DMO! Muito raro: +35% em HP, DS, AT, DE e Poder de Combate.',
  },
};

export function getHatchQualityProfile(grade?: number): HatchQualityProfile {
  if (grade === 5) return DMO_HATCH_QUALITY_PROFILES[5];
  if (grade === 4) return DMO_HATCH_QUALITY_PROFILES[4];
  return DMO_HATCH_QUALITY_PROFILES[3];
}

export interface DataInjectionStepConfig {
  fromLevel: number;
  toLevel: number;
  successChance: number;
  breakChanceOnFail: number;
  unlocksHatch: boolean;
  resultingGrade?: HatchQualityGrade;
}

/**
 * Probabilidades inspiradas no Digimon Masters Online (DMO):
 * - 0/5 -> 1/5 e 1/5 -> 2/5: apenas preparo (nao chocavel em 1/5 nem 2/5).
 * - 2/5 -> 3/5: 45% de sucesso (libera 3/5 Aceitavel).
 * - 3/5 -> 4/5: 22% de sucesso (libera 4/5 Forte).
 * - 4/5 -> 5/5: 7% de sucesso (muito dificil, libera 5/5 Muito Forte).
 */
export const DMO_DATA_INJECTION_STEPS: readonly DataInjectionStepConfig[] = [
  {
    fromLevel: 0,
    toLevel: 1,
    successChance: 0.85,
    breakChanceOnFail: 0.0,
    unlocksHatch: false,
  },
  {
    fromLevel: 1,
    toLevel: 2,
    successChance: 0.65,
    breakChanceOnFail: 0.0,
    unlocksHatch: false,
  },
  {
    fromLevel: 2,
    toLevel: 3,
    successChance: 0.45,
    breakChanceOnFail: 0.15,
    unlocksHatch: true,
    resultingGrade: 3,
  },
  {
    fromLevel: 3,
    toLevel: 4,
    successChance: 0.22,
    breakChanceOnFail: 0.3,
    unlocksHatch: true,
    resultingGrade: 4,
  },
  {
    fromLevel: 4,
    toLevel: 5,
    successChance: 0.07,
    breakChanceOnFail: 0.5,
    unlocksHatch: true,
    resultingGrade: 5,
  },
];

export function getNextInjectionStepInfo(
  currentLevel: number
): DataInjectionStepConfig | null {
  const safe = Math.max(0, Math.floor(currentLevel));
  return DMO_DATA_INJECTION_STEPS.find((s) => s.fromLevel === safe) ?? null;
}

export interface RarityVisualMeta {
  id: ItemRarity;
  label: string;
  badgeClass: string;
  borderHex: string;
  glowRgba: string;
  textHex: string;
}

export const ITEM_RARITY_META: Record<ItemRarity, RarityVisualMeta> = {
  comum: {
    id: 'comum',
    label: 'Comum',
    badgeClass: 'border-slate-400/70 bg-slate-800/85 text-slate-200',
    borderHex: '#94a3b8',
    glowRgba: 'rgba(148, 163, 184, 0.35)',
    textHex: '#e2e8f0',
  },
  incomum: {
    id: 'incomum',
    label: 'Incomum',
    badgeClass: 'border-emerald-400/80 bg-emerald-950/85 text-emerald-200',
    borderHex: '#34d399',
    glowRgba: 'rgba(52, 211, 153, 0.48)',
    textHex: '#6ee7b7',
  },
  raro: {
    id: 'raro',
    label: 'Raro',
    badgeClass: 'border-cyan-300/85 bg-cyan-950/90 text-cyan-200',
    borderHex: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.58)',
    textHex: '#7dd3fc',
  },
  epico: {
    id: 'epico',
    label: 'Épico',
    badgeClass: 'border-purple-300/85 bg-purple-950/90 text-purple-200',
    borderHex: '#c084fc',
    glowRgba: 'rgba(192, 132, 252, 0.65)',
    textHex: '#e9d5ff',
  },
  lendario: {
    id: 'lendario',
    label: 'Lendário',
    badgeClass: 'border-amber-300/90 bg-amber-950/90 text-amber-200',
    borderHex: '#fbbf24',
    glowRgba: 'rgba(251, 191, 36, 0.72)',
    textHex: '#fde68a',
  },
};

export interface CatalogItemDefinition {
  itemKey: string;
  name: string;
  category: Exclude<InventoryCategory, 'all'>;
  description: string;
  iconUrl?: string;
  rarity: ItemRarity;
  dataType?: DataElementType;
  usageInfo: string;
  accentColor: string;
  eggData?: DigiEggItemMetadata;
}

export interface DataItemConfigInput {
  dataType: DataElementType;
  itemKey: string;
  name: string;
  iconUrl: string;
  rarity: ItemRarity;
  accentColor: string;
  description: string;
  usageInfo: string;
}

export interface DigiEggConfigInput {
  dataType: DataElementType;
  itemKey: string;
  name: string;
  iconUrl: string;
  rarity: ItemRarity;
  accentColor: string;
  speciesLabel: string;
  description: string;
  usageRequirements: string;
}

/**
 * Configuracao central e ajustavel das receitas de injecao de DATA na Incubadora do DATS.
 * Cada tentativa de avancar um estagio (0/5 -> 5/5) consome `requiredDataQuantity` de DATA correspondente.
 */
export const DIGIEGG_HATCH_RECIPE_CONFIG: {
  defaultDataQuantity: number;
  defaultMaxReinforceLevel: number;
  byEggKey: Partial<
    Record<
      string,
      {
        requiredDataQuantity?: number;
        maxHatchLevel?: number;
        extraMaterials?: Array<{ itemKey: string; name: string; quantity: number }>;
      }
    >
  >;
} = {
  defaultDataQuantity: 5,
  defaultMaxReinforceLevel: 5,
  byEggKey: {
    digiegg_dragon: { requiredDataQuantity: 10 },
    digiegg_fire: { requiredDataQuantity: 5 },
    digiegg_bird: { requiredDataQuantity: 5 },
    digiegg_plant: { requiredDataQuantity: 5 },
    digiegg_rock: { requiredDataQuantity: 5 },
    digiegg_insect: { requiredDataQuantity: 5 },
    digiegg_aquatic: { requiredDataQuantity: 5 },
    digiegg_devil: { requiredDataQuantity: 8 },
    digiegg_beast: { requiredDataQuantity: 5 },
  },
};

/**
 * Os 9 tipos oficiais de DATA (colecao oficial fatiada em PNG individual).
 * Raridades, nomes e descricoes sao 100% configuraveis aqui.
 */
export const DATA_ITEMS_CONFIG: readonly DataItemConfigInput[] = [
  {
    dataType: 'dragon',
    itemKey: 'data_dragon',
    name: 'DATA DRAGON',
    iconUrl: '/assets/items/data/data_dragon.png',
    rarity: 'raro',
    accentColor: '#ef4444',
    description:
      'Fragmento de dados dracônicos de alta densidade energética extraído de Digimons da linhagem Dragon.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar DRAGON DIGIEGG.',
  },
  {
    dataType: 'fire',
    itemKey: 'data_fire',
    name: 'DATA FIRE',
    iconUrl: '/assets/items/data/data_fire.png',
    rarity: 'incomum',
    accentColor: '#f97316',
    description:
      'Pacote de dados térmicos condensados carregado com energia ígnea digital.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar FIRE DIGIEGG.',
  },
  {
    dataType: 'bird',
    itemKey: 'data_bird',
    name: 'DATA BIRD',
    iconUrl: '/assets/items/data/data_bird.png',
    rarity: 'incomum',
    accentColor: '#38bdf8',
    description:
      'Código aerodinâmico leve coletado de Digimons aviários e velozes do Mundo Digital.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar BIRD DIGIEGG.',
  },
  {
    dataType: 'plant',
    itemKey: 'data_plant',
    name: 'DATA PLANT',
    iconUrl: '/assets/items/data/data_plant.png',
    rarity: 'incomum',
    accentColor: '#22c55e',
    description:
      'Dados orgânicos botânicos sintetizados por Digimons vegetais e guardiões das florestas.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar PLANT DIGIEGG.',
  },
  {
    dataType: 'rock',
    itemKey: 'data_rock',
    name: 'DATA ROCK',
    iconUrl: '/assets/items/data/data_rock.png',
    rarity: 'incomum',
    accentColor: '#eab308',
    description:
      'Estrutura mineral compactada com alta resistência defensiva e estabilidade de código.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar ROCK DIGIEGG.',
  },
  {
    dataType: 'insect',
    itemKey: 'data_insect',
    name: 'DATA INSECT',
    iconUrl: '/assets/items/data/data_insect.png',
    rarity: 'incomum',
    accentColor: '#10b981',
    description:
      'Sequência de dados quitinosos e bioelétricos obtida de Digimons insetoides.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar INSECT DIGIEGG.',
  },
  {
    dataType: 'aquatic',
    itemKey: 'data_aquatic',
    name: 'DATA AQUATIC',
    iconUrl: '/assets/items/data/data_aquatic.png',
    rarity: 'incomum',
    accentColor: '#06b6d4',
    description:
      'Matriz fluida de dados marinhos presente em Digimons aquáticos e habitantes de lagos digitais.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar AQUATIC DIGIEGG.',
  },
  {
    dataType: 'devil',
    itemKey: 'data_devil',
    name: 'DATA DEVIL',
    iconUrl: '/assets/items/data/data_devil.png',
    rarity: 'raro',
    accentColor: '#c084fc',
    description:
      'Dados sombrios de polaridade abissal extraídos de Digimons demoníacos e noturnos.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar DEVIL DIGIEGG.',
  },
  {
    dataType: 'beast',
    itemKey: 'data_beast',
    name: 'DATA BEAST',
    iconUrl: '/assets/items/data/data_beast.png',
    rarity: 'incomum',
    accentColor: '#f59e0b',
    description:
      'Código feroz e instintivo obtido de Digimons feras e predadores ágeis das pradarias.',
    usageInfo:
      'Material de incubação utilizado no Chocador de DigiEgg do DATS para chocar BEAST DIGIEGG.',
  },
];

/**
 * Os 9 tipos oficiais de DIGIEGG correspondentes aos 9 tipos de DATA.
 * Cada DigiEgg vincula automaticamente seu tipo de DATA e receita configuravel.
 */
export const DIGIEGG_ITEMS_CONFIG: readonly DigiEggConfigInput[] = [
  {
    dataType: 'dragon',
    itemKey: 'digiegg_dragon',
    name: 'DRAGON DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_dragon.png',
    rarity: 'epico',
    accentColor: '#ef4444',
    speciesLabel: 'Linhagem Dragon',
    description:
      'DigiEgg dracônico envolto em escamas rubras e energia flamejante de alto potencial.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA DRAGON na quantidade configurada.',
  },
  {
    dataType: 'fire',
    itemKey: 'digiegg_fire',
    name: 'FIRE DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_fire.png',
    rarity: 'raro',
    accentColor: '#f97316',
    speciesLabel: 'Linhagem Fire',
    description:
      'DigiEgg incandescente com núcleo de chamas digitais prontas para eclosão.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA FIRE na quantidade configurada.',
  },
  {
    dataType: 'bird',
    itemKey: 'digiegg_bird',
    name: 'BIRD DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_bird.png',
    rarity: 'raro',
    accentColor: '#38bdf8',
    speciesLabel: 'Linhagem Bird',
    description:
      'DigiEgg celeste marcado por asas digitais e correntes de dados velozes.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA BIRD na quantidade configurada.',
  },
  {
    dataType: 'plant',
    itemKey: 'digiegg_plant',
    name: 'PLANT DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_plant.png',
    rarity: 'raro',
    accentColor: '#22c55e',
    speciesLabel: 'Linhagem Plant',
    description:
      'DigiEgg esmeralda repleto de seiva digital e códigos botânicos vitais.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA PLANT na quantidade configurada.',
  },
  {
    dataType: 'rock',
    itemKey: 'digiegg_rock',
    name: 'ROCK DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_rock.png',
    rarity: 'raro',
    accentColor: '#eab308',
    speciesLabel: 'Linhagem Rock',
    description:
      'DigiEgg blindado por placas minerais e filamentos dourados de energia telúrica.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA ROCK na quantidade configurada.',
  },
  {
    dataType: 'insect',
    itemKey: 'digiegg_insect',
    name: 'INSECT DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_insect.png',
    rarity: 'raro',
    accentColor: '#10b981',
    speciesLabel: 'Linhagem Insect',
    description:
      'DigiEgg bio-tecnológico protegido por carapaça verde-turquesa e sinais elétricos.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA INSECT na quantidade configurada.',
  },
  {
    dataType: 'aquatic',
    itemKey: 'digiegg_aquatic',
    name: 'AQUATIC DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_aquatic.png',
    rarity: 'raro',
    accentColor: '#06b6d4',
    speciesLabel: 'Linhagem Aquatic',
    description:
      'DigiEgg cristalino envolvido por espirais de água pura e energia marinha digital.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA AQUATIC na quantidade configurada.',
  },
  {
    dataType: 'devil',
    itemKey: 'digiegg_devil',
    name: 'DEVIL DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_devil.png',
    rarity: 'epico',
    accentColor: '#c084fc',
    speciesLabel: 'Linhagem Devil',
    description:
      'DigiEgg sombrio selado com runas violetas e energia abissal concentrada.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA DEVIL na quantidade configurada.',
  },
  {
    dataType: 'beast',
    itemKey: 'digiegg_beast',
    name: 'BEAST DIGIEGG',
    iconUrl: '/assets/items/digieggs/digiegg_beast.png',
    rarity: 'raro',
    accentColor: '#f59e0b',
    speciesLabel: 'Linhagem Beast',
    description:
      'DigiEgg dourado gravado com a marca da fera e energia primal selvagem.',
    usageRequirements:
      'Inserir na Incubadora do DATS junto com DATA BEAST na quantidade configurada.',
  },
];

const CATALOG_REGISTRY = new Map<string, CatalogItemDefinition>();
const DATA_BY_TYPE = new Map<DataElementType, CatalogItemDefinition>();
const EGG_BY_TYPE = new Map<DataElementType, CatalogItemDefinition>();

function buildDataEntry(cfg: DataItemConfigInput): CatalogItemDefinition {
  return {
    itemKey: cfg.itemKey,
    name: cfg.name,
    category: 'data',
    description: cfg.description,
    iconUrl: cfg.iconUrl,
    rarity: cfg.rarity,
    dataType: cfg.dataType,
    usageInfo: cfg.usageInfo,
    accentColor: cfg.accentColor,
  };
}

function buildDigiEggEntry(cfg: DigiEggConfigInput): CatalogItemDefinition {
  const dataDef = DATA_BY_TYPE.get(cfg.dataType);
  const recipeOverride = DIGIEGG_HATCH_RECIPE_CONFIG.byEggKey[cfg.itemKey];
  const requiredDataQuantity = Math.max(
    1,
    recipeOverride?.requiredDataQuantity ?? DIGIEGG_HATCH_RECIPE_CONFIG.defaultDataQuantity
  );
  const maxHatchLevel = Math.max(
    1,
    recipeOverride?.maxHatchLevel ?? DIGIEGG_HATCH_RECIPE_CONFIG.defaultMaxReinforceLevel
  );
  const dataItemKey = dataDef?.itemKey ?? `data_${cfg.dataType}`;
  const dataName = dataDef?.name ?? `DATA ${cfg.dataType.toUpperCase()}`;

  const requiredMaterials = [
    {
      itemKey: dataItemKey,
      name: dataName,
      quantity: requiredDataQuantity,
    },
    ...(recipeOverride?.extraMaterials ?? []),
  ];

  return {
    itemKey: cfg.itemKey,
    name: cfg.name,
    category: 'digiegg',
    description: cfg.description,
    iconUrl: cfg.iconUrl,
    rarity: cfg.rarity,
    dataType: cfg.dataType,
    usageInfo: cfg.usageRequirements,
    accentColor: cfg.accentColor,
    eggData: {
      speciesName: cfg.speciesLabel,
      rarity: ITEM_RARITY_META[cfg.rarity].label,
      dataType: cfg.dataType,
      requiredDataKey: dataItemKey,
      requiredDataQuantity,
      hatchLevel: 0,
      maxHatchLevel,
      accentColor: cfg.accentColor,
      usageRequirements: cfg.usageRequirements,
      requiredMaterials,
    },
  };
}

export function registerDataCatalogItem(cfg: DataItemConfigInput): CatalogItemDefinition {
  const entry = buildDataEntry(cfg);
  CATALOG_REGISTRY.set(entry.itemKey, entry);
  DATA_BY_TYPE.set(cfg.dataType, entry);
  return entry;
}

export function registerDigiEggCatalogItem(cfg: DigiEggConfigInput): CatalogItemDefinition {
  const entry = buildDigiEggEntry(cfg);
  CATALOG_REGISTRY.set(entry.itemKey, entry);
  EGG_BY_TYPE.set(cfg.dataType, entry);
  return entry;
}

// Initialize all 9 DATA + 9 DigiEggs
for (const d of DATA_ITEMS_CONFIG) {
  registerDataCatalogItem(d);
}
for (const egg of DIGIEGG_ITEMS_CONFIG) {
  registerDigiEggCatalogItem(egg);
}

export function getCatalogItemByKey(itemKey: string): CatalogItemDefinition | undefined {
  return CATALOG_REGISTRY.get(itemKey);
}

export function getDataItemDefinition(
  dataType: DataElementType
): CatalogItemDefinition | undefined {
  return DATA_BY_TYPE.get(dataType);
}

export function getDigiEggDefinition(
  dataType: DataElementType
): CatalogItemDefinition | undefined {
  return EGG_BY_TYPE.get(dataType);
}

export function listAllDataDefinitions(): readonly CatalogItemDefinition[] {
  return DATA_ITEMS_CONFIG.map((d) => CATALOG_REGISTRY.get(d.itemKey)!).filter(Boolean);
}

export function listAllDigiEggDefinitions(): readonly CatalogItemDefinition[] {
  return DIGIEGG_ITEMS_CONFIG.map((e) => CATALOG_REGISTRY.get(e.itemKey)!).filter(Boolean);
}

export function createInventoryPayloadFromCatalog(
  itemKey: string,
  quantity = 1
): Omit<InventoryItem, 'id'> | null {
  const def = CATALOG_REGISTRY.get(itemKey);
  if (!def) return null;
  return {
    itemKey: def.itemKey,
    name: def.name,
    category: def.category,
    quantity: Math.max(1, Math.round(quantity)),
    description: def.description,
    iconUrl: def.iconUrl,
    rarity: def.rarity,
    dataType: def.dataType,
    usageInfo: def.usageInfo,
    eggData: def.eggData
      ? {
          ...def.eggData,
          requiredMaterials: def.eggData.requiredMaterials?.map((m) => ({ ...m })),
        }
      : undefined,
  };
}

/**
 * Garante que itens antigos ou carregados da nuvem recebam icone oficial,
 * categoria correta, raridade e metadados atualizados do catalogo.
 */
export function enrichInventoryItem(item: InventoryItem): InventoryItem {
  const def = CATALOG_REGISTRY.get(item.itemKey);
  if (!def) {
    // Preserve existing items cleanly while ensuring sensible defaults
    return {
      ...item,
      rarity: item.rarity ?? (item.category === 'equip' ? 'incomum' : 'comum'),
    };
  }

  return {
    ...item,
    name: def.name,
    category: def.category,
    description: def.description,
    iconUrl: def.iconUrl,
    rarity: item.rarity ?? def.rarity,
    dataType: def.dataType,
    usageInfo: def.usageInfo,
    eggData: def.eggData
      ? {
          ...def.eggData,
          hatchLevel: item.eggData?.hatchLevel ?? def.eggData.hatchLevel ?? 0,
          maxHatchLevel: item.eggData?.maxHatchLevel ?? def.eggData.maxHatchLevel ?? 5,
          hatchedFormId: item.eggData?.hatchedFormId ?? def.eggData.hatchedFormId,
          requiredMaterials: def.eggData.requiredMaterials?.map((m) => ({ ...m })),
        }
      : item.eggData,
  };
}
