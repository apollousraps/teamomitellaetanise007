import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  DoorOpen,
  Egg,
  Info,
  Monitor,
  ScrollText,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  createInitialPartnerRuntime,
  triggerPartnerManualSkill,
  updatePartnerAI,
  type ActiveCombatEffect,
  type FloatingDamageText,
  type PartnerRuntimeState,
} from '../ai/partnerAI';
import {
  buildDatsCenterStaticLayer,
  buildDatsDepthProps,
  DATS_COLLIDERS,
  DATS_INCUBATOR_STATION,
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
  DATS_WORLD_H,
  DATS_WORLD_W,
  drawDatsGroundAnimations,
  getSpawnSlotForAccount,
  type DatsCollider,
  type DatsInteractionPoint,
} from '../maps/datsCenterMap';
import {
  buildHuntingDepthProps,
  buildHuntingFieldStaticLayer,
  createInitialWildMonsters,
  drawEnemyMonster,
  drawHuntingGroundAnimations,
  ensureSafeHuntingSpawn,
  fieldNpcToDialogueModel,
  FRIENDLY_FIELD_NPCS,
  getHuntingPerspectiveScale,
  getHuntingZoneAtPoint,
  HUNTING_COLLIDERS,
  HUNTING_INTERACTION_POINTS,
  HUNTING_MAP_ID,
  HUNTING_RETURN_PORTAL,
  HUNTING_SPAWN_POINT,
  HUNTING_WORLD_H,
  HUNTING_WORLD_W,
  isPointInHuntingSafeZone,
  type EnemyMonsterInstance,
} from '../maps/huntingFieldMap';
import {
  buildDataForestDepthProps,
  buildDataForestStaticLayer,
  createInitialDataForestMonsters,
  DATA_FOREST_BOSS_ARENA,
  DATA_FOREST_COLLIDERS,
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_INTERACTION_POINTS,
  DATA_FOREST_MAP_ID,
  DATA_FOREST_RETURN_PORTAL,
  DATA_FOREST_SPAWN_POINT,
  DATA_FOREST_WORLD_H,
  DATA_FOREST_WORLD_W,
  drawDataForestGroundAnimations,
  ensureSafeDataForestSpawn,
  getDataForestPerspectiveScale,
  getDataForestZoneAtPoint,
  isPointInDataForestSafeZone,
} from '../maps/dataForestMap';
import {
  enqueueWorldBossDamage,
  KUWAGAMON_BOSS_ID,
  subscribeWorldBoss,
  tryRespawnWorldBoss,
  type WorldBossLiveState,
} from '../services/worldBossService';
import {
  getAdventureProgressForAccount,
  saveAdventureProgressForAccount,
} from '../services/authService';
import {
  addInventoryItem,
  applyExpToDigimon,
  applyExpToTamer,
  BASIC_BITS_SHOP_ITEMS,
  calcDmoKillExp,
  computeDerivedDigimonAttributes,
  computeTamerAttributes,
  EQUIPMENT_SLOT_LABELS,
  equipInventoryItem,
  evolveDigimonAccountState,
  getNextEvolutionInfo,
  loadAccountHudState,
  saveAccountHudState,
  setDigimonLevelForTesting,
  SKILL_F1_DS_COST,
  SKILL_F2_DS_COST,
  unequipSlotItem,
} from '../services/hudGameService';
import {
  executeDigiEggHatch,
  executeEggReinforce,
} from '../services/incubatorService';
import { createIncubatorWorldSpriteRenderer } from '../three/digimonIncubator3D';
import {
  DIGIMON_FRAME_COUNT,
  drawDigimonAttackPoseFrame,
  drawDigimonPartnerFrame,
  drawDigimonSpecialVfx,
  preloadDigimonEvolutionLine,
  preloadDigimonPartnerAssets,
} from '../sprites/digimonPartnerSprites';
import {
  drawTamerMovementFrame,
  preloadTamerSheets,
  TAMER_FRAME_COUNT,
  type CardinalDirection,
  type TamerMovementState,
} from '../sprites/tamerRealSheets';
import {
  drawFixedWorldNpc,
  isPointInsideNpcHitbox,
  preloadFixedNpcSprite,
  RICHARD_SAMPSON_NPC,
  type FixedWorldNpc,
} from '../sprites/npcSprites';
import {
  getWildDigimonPortraitUrl,
  preloadWildDigimonSprites,
} from '../sprites/wildDigimonSprites';
import { TAMER_CHARACTERS } from '../sprites/tamerSprites';
import {
  broadcastWorldChatBubble,
  bumpPresenceSessionEpoch,
  markLocalWorldPresenceOffline,
  publishLocalWorldPresence,
  subscribeOnlineWorldPlayers,
  type LocalPresenceState,
  type RemoteWorldPlayer,
} from '../services/worldPresenceService';
import type { AppPreferences } from '../types/auth';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import { getWildDigimonClassification } from '../types/classification';
import {
  getDigimonFormProfile,
  resolveActiveFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
  type PartnerAttackKind,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import type {
  AccountHudPersistence,
  ChatChannel,
  ChatMessage,
  ComputedDigimonAttributes,
  EquipmentSlotId,
  HudNotificationItem,
  HudWindowId,
  InventoryItem,
  LiveWorldHudSnapshot,
} from '../types/hud';
import {
  playDigitalTone,
  preloadAndUnlockEvolutionAudio,
} from '../utils/soundFx';
import { ActiveDigimonHudPanel } from './hud/ActiveDigimonHudPanel';
import { BottomHudDock } from './hud/BottomHudDock';
import { ChatHudPanel } from './hud/ChatHudPanel';
import { DigimonClassificationBadges } from './hud/DigimonClassificationBadges';
import { DigimonSwitcherList } from './hud/DigimonSwitcherList';
import { EvolutionCinematicOverlay } from './hud/EvolutionCinematicOverlay';
import { HudWindowsOverlay } from './hud/HudWindowsOverlay';
import { InventoryHudWindow } from './hud/InventoryHudWindow';
import { MinimapHudPanel } from './hud/MinimapHudPanel';
import { NpcDialogueModal } from './hud/NpcDialogueModal';
import { RemotePlayerInspectorCard } from './hud/OnlinePlayersPanel';
import { TamerHudPanel } from './hud/TamerHudPanel';
import {
  WorldBossGlobalBanner,
  WorldBossHudCard,
  type WorldBossAnnouncement,
} from './hud/WorldBossHudPanel';

type ActiveWorldMapId =
  | typeof DATS_MAP_ID
  | typeof HUNTING_MAP_ID
  | typeof DATA_FOREST_MAP_ID;

interface TamerWorldCanvasProps {
  selection: SavedCharacterSelection;
  starterDigimon: SavedStarterDigimon;
  preferences: AppPreferences;
  isGM: boolean;
  cloudIsGm?: boolean;
  onUpdatePreferences: (next: AppPreferences) => void;
  onOpenFeedback?: (screenContext?: string) => void;
  onExitToLogin: () => void;
}

const PLAYER_RADIUS = 18;

function isCombatWorldMap(mapId: ActiveWorldMapId): boolean {
  return mapId === HUNTING_MAP_ID || mapId === DATA_FOREST_MAP_ID;
}

function getMapDimensions(mapId: ActiveWorldMapId): {
  worldW: number;
  worldH: number;
  minY: number;
} {
  if (mapId === DATA_FOREST_MAP_ID) {
    return {
      worldW: DATA_FOREST_WORLD_W,
      worldH: DATA_FOREST_WORLD_H,
      minY: 374,
    };
  }
  if (mapId === HUNTING_MAP_ID) {
    return {
      worldW: HUNTING_WORLD_W,
      worldH: HUNTING_WORLD_H,
      minY: 348,
    };
  }
  return {
    worldW: DATS_WORLD_W,
    worldH: DATS_WORLD_H,
    minY: 334,
  };
}

function getMapPerspectiveScale(mapId: ActiveWorldMapId, worldY: number): number {
  if (mapId === DATA_FOREST_MAP_ID) return getDataForestPerspectiveScale(worldY);
  if (mapId === HUNTING_MAP_ID) return getHuntingPerspectiveScale(worldY);
  return 1;
}

function isPointInMapSafeZone(
  mapId: ActiveWorldMapId,
  x: number,
  y: number
): boolean {
  if (mapId === DATA_FOREST_MAP_ID) return isPointInDataForestSafeZone(x, y);
  if (mapId === HUNTING_MAP_ID) return isPointInHuntingSafeZone(x, y);
  return true;
}

function getMapDisplayLabel(mapId: ActiveWorldMapId, short = false): string {
  if (mapId === DATA_FOREST_MAP_ID) {
    return short ? 'Floresta' : 'Floresta de Dados';
  }
  if (mapId === HUNTING_MAP_ID) {
    return short ? 'Planície' : 'Planície Digital';
  }
  return short ? 'DATS' : 'DATS Center';
}

/**
 * Mobile-first camera framing on Combat Maps (Planície Digital & Floresta de Dados):
 * widens FOV and renders the terrain near 1:1 native sharpness on narrow phone displays
 * while keeping desktop at 1.0x.
 */
function getWorldCameraZoom(viewWidth: number, isCombatMap: boolean): number {
  if (!isCombatMap) return 1;
  if (viewWidth < 520) return 0.9;
  if (viewWidth < 768) return 0.92;
  if (viewWidth < 1024) return 0.96;
  return 1;
}

function nowTimeStamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function snapToCardinalVector(dx: number, dy: number): {
  vx: number;
  vy: number;
  dir: CardinalDirection;
} {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { vx: 1, vy: 0, dir: 'E' }
      : { vx: -1, vy: 0, dir: 'W' };
  }
  return dy >= 0
    ? { vx: 0, vy: 1, dir: 'S' }
    : { vx: 0, vy: -1, dir: 'N' };
}

function resolveCircleRect(
  cx: number,
  cy: number,
  radius: number,
  rect: DatsCollider
): [number, number] {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) return [cx, cy];

  const dist = Math.sqrt(distSq);
  if (dist > 0.0001) {
    const overlap = radius - dist;
    return [cx + (dx / dist) * overlap, cy + (dy / dist) * overlap];
  }

  const leftPen = cx - rect.x;
  const rightPen = rect.x + rect.w - cx;
  const topPen = cy - rect.y;
  const bottomPen = rect.y + rect.h - cy;
  const m = Math.min(leftPen, rightPen, topPen, bottomPen);
  if (m === leftPen) return [rect.x - radius, cy];
  if (m === rightPen) return [rect.x + rect.w + radius, cy];
  if (m === topPen) return [cx, rect.y - radius];
  return [cx, rect.y + rect.h + radius];
}

function resolveCircleCircle(
  cx: number,
  cy: number,
  cRadius: number,
  ox: number,
  oy: number,
  oRadius: number
): [number, number] {
  const dx = cx - ox;
  const dy = cy - oy;
  const minDist = cRadius + oRadius;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minDist * minDist) return [cx, cy];
  const dist = Math.sqrt(distSq);
  if (dist < 0.0001) return [ox, oy + minDist];
  return [ox + (dx / dist) * minDist, oy + (dy / dist) * minDist];
}

function renderInteractionIcon(kind: DatsInteractionPoint['kind']) {
  if (kind === 'main-entrance') return <DoorOpen className="h-4 w-4 text-cyan-300" />;
  if (kind === 'mission-npc') return <ScrollText className="h-4 w-4 text-sky-300" />;
  if (kind === 'info-npc') return <Info className="h-4 w-4 text-emerald-300" />;
  if (kind === 'tamer-terminal') return <Monitor className="h-4 w-4 text-cyan-300" />;
  if (kind === 'digimon-incubator') return <Egg className="h-4 w-4 text-cyan-300" />;
  return <Sparkles className="h-4 w-4 text-amber-300" />;
}

interface SmoothedRemotePlayer {
  player: RemoteWorldPlayer;
  renderX: number;
  renderY: number;
  partnerRenderX: number;
  partnerRenderY: number;
  frameTime: number;
  frameIndex: number;
  partnerFrameTime: number;
  partnerFrameIndex: number;
  bubbleText: string;
  bubbleExpiresAt: number;
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  text: string,
  accentHex: string
) {
  const display = text.length > 48 ? `${text.slice(0, 45)}...` : text;
  ctx.save();
  ctx.font = '700 11px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  const metrics = ctx.measureText(display);
  const bw = Math.min(220, Math.max(44, metrics.width + 18));
  const bh = 22;
  const bx = x - bw / 2;
  const by = topY - bh - 6;

  ctx.fillStyle = 'rgba(248, 252, 255, 0.96)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Speech pointer triangle
  ctx.beginPath();
  ctx.moveTo(x - 5, by + bh);
  ctx.lineTo(x + 5, by + bh);
  ctx.lineTo(x, by + bh + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#07142b';
  ctx.fillText(display, x, by + 14.5, bw - 12);
  ctx.restore();
}

export function TamerWorldCanvas({
  selection,
  starterDigimon,
  preferences,
  isGM,
  cloudIsGm = false,
  onUpdatePreferences,
  onOpenFeedback,
  onExitToLogin,
}: TamerWorldCanvasProps) {
  const soundEnabled = preferences.soundEnabled;
  const isServerGm = Boolean(cloudIsGm);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const isChatFocusedRef = useRef(false);

  const character = useMemo(
    () =>
      TAMER_CHARACTERS.find((c) => c.id === selection.characterId) ??
      TAMER_CHARACTERS[0],
    [selection.characterId]
  );

  const initialSpawn = useMemo(() => {
    const saved = getAdventureProgressForAccount(selection.accountUsername);
    const slot = getSpawnSlotForAccount(selection.accountUsername);

    if (saved && saved.mapId === DATA_FOREST_MAP_ID) {
      const safePos = ensureSafeDataForestSpawn(saved.worldX, saved.worldY);
      return {
        mapId: DATA_FOREST_MAP_ID as ActiveWorldMapId,
        x: safePos.x,
        y: safePos.y,
        dir: saved.facingDir,
        stepsCount: saved.stepsCount ?? 0,
        discoveredZones: saved.discoveredZones ?? [],
      };
    }

    if (saved && saved.mapId === HUNTING_MAP_ID) {
      const safePos = ensureSafeHuntingSpawn(saved.worldX, saved.worldY);
      return {
        mapId: HUNTING_MAP_ID as ActiveWorldMapId,
        x: safePos.x,
        y: safePos.y,
        dir: saved.facingDir,
        stepsCount: saved.stepsCount ?? 0,
        discoveredZones: saved.discoveredZones ?? [],
      };
    }

    if (saved && saved.mapId === DATS_MAP_ID) {
      const [safeX, safeY] = resolveCircleCircle(
        Math.max(48, Math.min(DATS_WORLD_W - 48, saved.worldX)),
        Math.max(336, Math.min(DATS_WORLD_H - 48, saved.worldY)),
        PLAYER_RADIUS,
        RICHARD_SAMPSON_NPC.x,
        RICHARD_SAMPSON_NPC.y,
        RICHARD_SAMPSON_NPC.collisionRadius
      );
      return {
        mapId: DATS_MAP_ID as ActiveWorldMapId,
        x: safeX,
        y: safeY,
        dir: saved.facingDir,
        stepsCount: saved.stepsCount ?? 0,
        discoveredZones: saved.discoveredZones ?? [],
      };
    }

    return {
      mapId: DATS_MAP_ID as ActiveWorldMapId,
      x: slot.x,
      y: slot.y,
      dir: slot.facingDir,
      stepsCount: saved?.stepsCount ?? 0,
      discoveredZones: [] as string[],
    };
  }, [selection.accountUsername]);

  const [loadedAssetsKey, setLoadedAssetsKey] = useState<string | null>(null);
  const targetAssetsKey = `${selection.characterId}:${starterDigimon.digimonId}`;
  const assetsReady = loadedAssetsKey === targetAssetsKey;

  // Real Account HUD Persistence (Tamer Lv/HP/DS/EXP, Digimon Lv/HP/DS/EXP, Bits, D-Coin, Inventory, Active Evolution Form)
  const initialHudAccount = useMemo(
    () => loadAccountHudState(selection.accountUsername, starterDigimon.digimonId),
    [selection.accountUsername, starterDigimon.digimonId]
  );
  const [hudAccount, setHudAccount] = useState<AccountHudPersistence>(initialHudAccount);
  const hudAccountRef = useRef<AccountHudPersistence>(initialHudAccount);

  const activeFormProfile = useMemo(
    () =>
      resolveActiveFormProfile(
        starterDigimon.digimonId,
        hudAccount.digimon.activeFormId
      ),
    [starterDigimon.digimonId, hudAccount.digimon.activeFormId]
  );
  const activeFormRef = useRef<DigimonFormProfile>(activeFormProfile);
  activeFormRef.current = activeFormProfile;

  const evoStatus = useMemo(
    () => getNextEvolutionInfo(starterDigimon.digimonId, hudAccount.digimon),
    [starterDigimon.digimonId, hudAccount.digimon]
  );

  // HUD Overlay & Drawer States
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [activeHudWindow, setActiveHudWindow] = useState<HudWindowId>(null);
  const [activeStationModal, setActiveStationModal] =
    useState<DatsInteractionPoint | null>(null);
  const [activeNpcDialogue, setActiveNpcDialogue] =
    useState<FixedWorldNpc | null>(null);
  const [evolutionCinematic, setEvolutionCinematic] = useState<{
    fromForm: DigimonFormProfile;
    toForm: DigimonFormProfile;
    level: number;
    maxHp: number;
    maxDs: number;
    derivedAttrs: ComputedDigimonAttributes;
  } | null>(null);
  const isEvolvingRef = useRef(false);
  isEvolvingRef.current = evolutionCinematic !== null;
  const [evolutionUnlockAlert, setEvolutionUnlockAlert] =
    useState<DigimonFormProfile | null>(null);
  const [hoveredNpcId, setHoveredNpcId] = useState<string | null>(null);
  const hoveredNpcIdRef = useRef<string | null>(null);
  const pendingIncubatorWalkRef = useRef(false);
  const activeHudWindowRef = useRef<HudWindowId>(null);
  activeHudWindowRef.current = activeHudWindow;
  const overlayLayerRef = useRef({
    npc: false,
    station: false,
    hud: false,
    inventory: false,
  });
  overlayLayerRef.current = {
    npc: activeNpcDialogue !== null,
    station: activeStationModal !== null,
    hud: activeHudWindow !== null,
    inventory: inventoryOpen,
  };
  const [levelUpPulse, setLevelUpPulse] = useState(false);
  const [digimonLevelUpPulse, setDigimonLevelUpPulse] = useState(false);
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0, active: false });

  // Chat & Notifications State (No fake players!)
  const [chatChannel, setChatChannel] = useState<ChatChannel>('all');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: `sys-init-${Date.now()}`,
      channel: 'system',
      text: `Bem-vindo ao Mundo Digital, ${selection.tamerName}! ${activeFormProfile.name} está pronto ao seu lado.`,
      timestamp: nowTimeStamp(),
      tone: 'info',
    },
  ]);
  const [notifications, setNotifications] = useState<HudNotificationItem[]>([]);

  const [remotePlayers, setRemotePlayers] = useState<RemoteWorldPlayer[]>([]);
  const [selectedRemotePlayer, setSelectedRemotePlayer] =
    useState<RemoteWorldPlayer | null>(null);
  const [worldBossState, setWorldBossState] = useState<WorldBossLiveState | null>(
    null
  );
  const [bossNowMs, setBossNowMs] = useState<number>(() => Date.now());
  const [bossAnnouncement, setBossAnnouncement] =
    useState<WorldBossAnnouncement | null>(null);
  const [bossRankingDismissed, setBossRankingDismissed] = useState(false);
  const worldBossRef = useRef<WorldBossLiveState | null>(null);
  const bossParticipatedRef = useRef<boolean>(false);
  const lastBossDefeatCountRef = useRef<number>(-1);
  const bossBannerTimerRef = useRef<number | null>(null);
  const remoteSmoothRef = useRef<Map<string, SmoothedRemotePlayer>>(new Map());
  const localBubbleRef = useRef<{ text: string; expiresAt: number } | null>(null);
  const seenRemoteChatSeqRef = useRef<Map<string, number>>(new Map());
  const knownOnlineUidsRef = useRef<Set<string>>(new Set());
  const initialPresenceLoadedRef = useRef(false);
  const lastPresenceSyncRef = useRef<{
    x: number;
    y: number;
    dir: CardinalDirection;
    state: TamerMovementState;
    mapId: ActiveWorldMapId;
    formId: DigimonFormId;
    tamerLevel: number;
    digimonLevel: number;
    sentAtMs: number;
    inFlight: boolean;
  }>({
    x: -9999,
    y: -9999,
    dir: 'S',
    state: 'idle',
    mapId: initialSpawn.mapId,
    formId: activeFormProfile.id,
    tamerLevel: initialHudAccount.tamer.level,
    digimonLevel: initialHudAccount.digimon.level,
    sentAtMs: 0,
    inFlight: false,
  });

  const pushChatMessage = useCallback(
    (
      channel: ChatChannel,
      text: string,
      opts?: {
        sender?: string;
        isGmSender?: boolean;
        mapTag?: string;
        tone?: ChatMessage['tone'];
      }
    ) => {
      setChatMessages((prev) => {
        const next = [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            channel,
            sender: opts?.sender,
            isGmSender: opts?.isGmSender,
            mapTag: opts?.mapTag,
            text,
            timestamp: nowTimeStamp(),
            tone: opts?.tone,
          },
        ];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    },
    []
  );

  const pushNotification = useCallback((title: string, detail: string) => {
    setNotifications((prev) => {
      const next: HudNotificationItem[] = [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          detail,
          timestamp: nowTimeStamp(),
          read: false,
        },
        ...prev,
      ];
      return next.slice(0, 20);
    });
  }, []);

  const [liveSnapshot, setLiveSnapshot] = useState<LiveWorldHudSnapshot>(() => ({
    mapId: initialSpawn.mapId,
    tamerX: initialSpawn.x,
    tamerY: initialSpawn.y,
    tamerDir: initialSpawn.dir,
    tamerMoveState: 'idle',
    partnerX: initialSpawn.x,
    partnerY: initialSpawn.y,
    partnerState: 'IDLE',
    inSafeZone: isPointInMapSafeZone(
      initialSpawn.mapId,
      initialSpawn.x,
      initialSpawn.y
    ),
    nearbyPointId: null,
    nearReturnPortal: false,
    discoveredZoneIds: initialSpawn.discoveredZones,
    special1Cooldown: 0,
    special1MaxCooldown: activeFormProfile.special1CooldownSec,
    special2Cooldown: 0,
    special2MaxCooldown: activeFormProfile.special2CooldownSec,
    activeSkillBanner: null,
    targetEnemy: null,
    minimapEnemies: [],
  }));

  const simRef = useRef<{
    mapId: ActiveWorldMapId;
    x: number;
    y: number;
    camX: number;
    camY: number;
    dir: CardinalDirection;
    state: TamerMovementState;
    frameTime: number;
    frameIndex: number;
    partner: PartnerRuntimeState;
    enemies: EnemyMonsterInstance[];
    combatEffects: ActiveCombatEffect[];
    floatingTexts: FloatingDamageText[];
    nextFxId: number;
    activeSkillBanner: string | null;
    skillBannerTimer: number;
    evoFlashTimer: number;
    enemyCounterTimer: number;
    safeRegenTimer: number;
    joyVx: number;
    joyVy: number;
    joyMag: number;
    tapTarget: { x: number; y: number } | null;
    keyOrder: CardinalDirection[];
    distMovedAccum: number;
    stepsCount: number;
    discoveredZones: Set<string>;
    nearbyPointId: string | null;
    nearReturnPortal: boolean;
    lastSaveTs: number;
  }>({
    mapId: initialSpawn.mapId,
    x: initialSpawn.x,
    y: initialSpawn.y,
    camX: initialSpawn.x,
    camY: initialSpawn.y - 56,
    dir: initialSpawn.dir as CardinalDirection,
    state: 'idle',
    frameTime: 0,
    frameIndex: 0,
    partner: createInitialPartnerRuntime(
      initialSpawn.x,
      initialSpawn.y,
      initialSpawn.dir as CardinalDirection
    ),
    enemies:
      initialSpawn.mapId === DATA_FOREST_MAP_ID
        ? createInitialDataForestMonsters()
        : createInitialWildMonsters(),
    combatEffects: [],
    floatingTexts: [],
    nextFxId: 1,
    activeSkillBanner: null,
    skillBannerTimer: 0,
    evoFlashTimer: 0,
    enemyCounterTimer: 0,
    safeRegenTimer: 0,
    joyVx: 0,
    joyVy: 0,
    joyMag: 0,
    tapTarget: null,
    keyOrder: [],
    distMovedAccum: 0,
    stepsCount: initialSpawn.stepsCount,
    discoveredZones: new Set<string>(initialSpawn.discoveredZones),
    nearbyPointId: null,
    nearReturnPortal: false,
    lastSaveTs: 0,
  });

  function buildLocalPresenceSnapshot(): LocalPresenceState {
    const sim = simRef.current;
    const hud = hudAccountRef.current;
    return {
      tamerName: selection.tamerName,
      characterId: selection.characterId,
      tamerLevel: hud.tamer.level,
      digimonFormId: activeFormRef.current.id,
      digimonLevel: hud.digimon.level,
      mapId: sim.mapId,
      worldX: sim.x,
      worldY: sim.y,
      facingDir: sim.dir,
      moveState: sim.state,
      partnerX: sim.partner.x,
      partnerY: sim.partner.y,
      partnerDir: sim.partner.dir,
      partnerMoving: sim.partner.isMoving,
      isGm: isServerGm,
      guildName: hud.guildName,
    };
  }

  // Subscribe to all live online players in Firestore & publish our own real-time presence
  useEffect(() => {
    const myEpoch = bumpPresenceSessionEpoch();
    let active = true;

    const pushFullPresenceNow = () => {
      if (!active) return;
      const snap = buildLocalPresenceSnapshot();
      lastPresenceSyncRef.current.x = snap.worldX;
      lastPresenceSyncRef.current.y = snap.worldY;
      lastPresenceSyncRef.current.dir = snap.facingDir;
      lastPresenceSyncRef.current.state = snap.moveState;
      lastPresenceSyncRef.current.mapId = snap.mapId;
      lastPresenceSyncRef.current.formId = snap.digimonFormId;
      lastPresenceSyncRef.current.tamerLevel = snap.tamerLevel;
      lastPresenceSyncRef.current.digimonLevel = snap.digimonLevel;
      lastPresenceSyncRef.current.sentAtMs = Date.now();
      lastPresenceSyncRef.current.inFlight = true;

      void publishLocalWorldPresence(snap, { forceFullWrite: true }).then(() => {
        lastPresenceSyncRef.current.inFlight = false;
      });
    };

    // Immediate join broadcast so other players see us right away
    pushFullPresenceNow();

    const unsubscribe = subscribeOnlineWorldPlayers((players) => {
      if (!active) return;

      const smoothMap = remoteSmoothRef.current;
      const activeUids = new Set<string>();
      const now = Date.now();

      for (const p of players) {
        activeUids.add(p.uid);

        // Lazily preload remote Tamer & Digimon evolution assets so every player renders with real sprites
        void preloadTamerSheets(p.characterId);
        void preloadDigimonPartnerAssets(p.digimonFormId);

        // Announce newly arrived players after initial world hydration
        if (initialPresenceLoadedRef.current && !knownOnlineUidsRef.current.has(p.uid)) {
          const mapLabel = getMapDisplayLabel(p.mapId);
          pushChatMessage(
            'system',
            `${p.isGm ? '[GM] ' : ''}${p.tamerName} entrou no Mundo Digital (${mapLabel})!`,
            { tone: 'info' }
          );
        }
        knownOnlineUidsRef.current.add(p.uid);

        // Process live chat broadcasts (deduplicated by uid + chatSeq)
        const prevSeq = seenRemoteChatSeqRef.current.get(p.uid);
        let bubbleText = smoothMap.get(p.uid)?.bubbleText ?? '';
        let bubbleExpiresAt = smoothMap.get(p.uid)?.bubbleExpiresAt ?? 0;

        if (prevSeq === undefined) {
          seenRemoteChatSeqRef.current.set(p.uid, p.chatSeq);
          // Only show speech bubble on initial sync if it was sent in the last 7 seconds
          if (p.chatText && Math.abs(now - p.updatedAtMs) <= 7000) {
            bubbleText = p.chatText;
            bubbleExpiresAt = now + 5500;
          }
        } else if (p.chatSeq > prevSeq && p.chatText) {
          seenRemoteChatSeqRef.current.set(p.uid, p.chatSeq);
          bubbleText = p.chatText;
          bubbleExpiresAt = now + 5500;
          const otherMapTag =
            p.mapId !== simRef.current.mapId
              ? getMapDisplayLabel(p.mapId, true)
              : undefined;
          pushChatMessage('all', p.chatText, {
            sender: p.tamerName,
            isGmSender: p.isGm,
            mapTag: otherMapTag,
          });
        }

        const existingSmooth = smoothMap.get(p.uid);
        if (!existingSmooth || existingSmooth.player.mapId !== p.mapId) {
          smoothMap.set(p.uid, {
            player: p,
            renderX: p.worldX,
            renderY: p.worldY,
            partnerRenderX: p.partnerX,
            partnerRenderY: p.partnerY,
            frameTime: 0,
            frameIndex: 0,
            partnerFrameTime: 0,
            partnerFrameIndex: 0,
            bubbleText,
            bubbleExpiresAt,
          });
        } else {
          existingSmooth.player = p;
          existingSmooth.bubbleText = bubbleText;
          existingSmooth.bubbleExpiresAt = bubbleExpiresAt;
        }
      }

      // Remove disconnected players from smooth map cleanly
      for (const uid of Array.from(smoothMap.keys())) {
        if (!activeUids.has(uid)) {
          smoothMap.delete(uid);
          knownOnlineUidsRef.current.delete(uid);
        }
      }

      initialPresenceLoadedRef.current = true;
      setRemotePlayers(players);
      setSelectedRemotePlayer((curr) =>
        curr ? players.find((p) => p.uid === curr.uid) ?? null : null
      );
    });

    const handleOfflineSignal = () => {
      void markLocalWorldPresenceOffline(myEpoch);
    };
    const handleReturnOnline = () => {
      if (document.visibilityState === 'visible') {
        pushFullPresenceNow();
      }
    };
    window.addEventListener('pagehide', handleOfflineSignal);
    window.addEventListener('beforeunload', handleOfflineSignal);
    window.addEventListener('focus', handleReturnOnline);
    window.addEventListener('online', handleReturnOnline);
    document.addEventListener('visibilitychange', handleReturnOnline);

    return () => {
      active = false;
      window.removeEventListener('pagehide', handleOfflineSignal);
      window.removeEventListener('beforeunload', handleOfflineSignal);
      window.removeEventListener('focus', handleReturnOnline);
      window.removeEventListener('online', handleReturnOnline);
      document.removeEventListener('visibilitychange', handleReturnOnline);
      unsubscribe();
      void markLocalWorldPresenceOffline(myEpoch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.tamerName, selection.characterId, isServerGm]);

  // Global Real-time Shared Multiplayer Raid Boss Subscription (active on all maps so every online player sees Boss Spawn, Defeat & Ranking)
  useEffect(() => {
    const triggerBossBanner = (nextBanner: WorldBossAnnouncement) => {
      setBossAnnouncement(nextBanner);
      if (bossBannerTimerRef.current !== null) {
        window.clearTimeout(bossBannerTimerRef.current);
      }
      bossBannerTimerRef.current = window.setTimeout(() => {
        setBossAnnouncement((curr) =>
          curr?.id === nextBanner.id ? null : curr
        );
        bossBannerTimerRef.current = null;
      }, 8000);
    };

    const unsubscribe = subscribeWorldBoss(KUWAGAMON_BOSS_ID, (state) => {
      const prevBoss = worldBossRef.current;
      worldBossRef.current = state;
      setWorldBossState(state);
      setBossNowMs(Date.now());

      const prevContribCount = prevBoss
        ? Object.keys(prevBoss.contributors).length
        : 0;
      const nextContribCount = Object.keys(state.contributors).length;
      if (prevContribCount === 0 && nextContribCount > 0 && state.alive) {
        setBossRankingDismissed(false);
      }

      const sim = simRef.current;
      const bossEnemy =
        sim.mapId === DATA_FOREST_MAP_ID
          ? sim.enemies.find(
              (e) => e.isBoss && e.bossId === KUWAGAMON_BOSS_ID
            )
          : undefined;
      if (bossEnemy) {
        bossEnemy.hp = state.hp;
        bossEnemy.maxHp = state.maxHp;
        bossEnemy.alive = state.alive;
        if (prevBoss && !prevBoss.alive && state.alive) {
          bossEnemy.x = bossEnemy.homeX;
          bossEnemy.y = bossEnemy.homeY;
          bossEnemy.attackAnimTimer = 0;
        }
      }

      if (prevBoss && !prevBoss.alive && state.alive) {
        bossParticipatedRef.current = false;
        setBossRankingDismissed(false);
        playDigitalTone('confirm', soundEnabled);
        triggerBossBanner({
          id: Date.now(),
          kind: 'spawn',
          bossName: state.name,
          level: state.level,
          mvpName: null,
          mvpDamage: 0,
          raiderCount: 0,
        });
        pushChatMessage(
          'system',
          'ALERTA DE RAID! O Boss Kuwagamon (Nv. 20) nasceu na Grande Árvore Sagrada (Floresta de Dados)!',
          { tone: 'level' }
        );
        pushNotification(
          'Raid Boss Apareceu!',
          'Kuwagamon (Nv. 20) nasceu na Grande Árvore da Floresta de Dados!'
        );
      }

      if (lastBossDefeatCountRef.current === -1) {
        lastBossDefeatCountRef.current = state.defeatedCount;
        return;
      }

      const justDefeated =
        state.defeatedCount > lastBossDefeatCountRef.current ||
        (Boolean(prevBoss?.alive) && !state.alive);

      if (justDefeated) {
        lastBossDefeatCountRef.current = state.defeatedCount;
        const myUid = auth.currentUser?.uid;
        const didContribute =
          bossParticipatedRef.current ||
          (myUid ? Boolean(state.contributors[myUid]) : false);
        bossParticipatedRef.current = false;

        if (bossEnemy && sim.partner.targetEnemyId === bossEnemy.id) {
          sim.partner.targetEnemyId = null;
        }

        const contributorList = Object.values(state.contributors).sort(
          (a, b) => b.damage - a.damage
        );
        const topNames = contributorList
          .slice(0, 3)
          .map((c) => c.tamerName)
          .join(', ');
        const raiderCount = Math.max(1, contributorList.length);
        const mvp = contributorList[0] ?? null;

        triggerBossBanner({
          id: Date.now(),
          kind: 'defeat',
          bossName: state.name,
          level: state.level,
          mvpName: mvp?.tamerName ?? null,
          mvpDamage: mvp?.damage ?? 0,
          raiderCount,
        });

        pushChatMessage(
          'system',
          `★ RAID BOSS DERROTADO! Kuwagamon (Nv. 20) foi vencido por ${raiderCount} Tamer${raiderCount > 1 ? 's' : ''}${topNames ? ` (${topNames})` : ''}! Renasce em 1h na Grande Árvore.`,
          { tone: 'level' }
        );

        if (didContribute) {
          const prevAcc = hudAccountRef.current;
          const formNow = activeFormRef.current;
          const gainedDigimonExp = Math.max(
            260,
            calcDmoKillExp(1500, prevAcc.digimon.level, 20)
          );
          const gainedTamerExp = Math.max(
            110,
            Math.round(calcDmoKillExp(1500, prevAcc.tamer.level, 20) * 0.55)
          );
          const bitsDrop = 450;

          const tamerRes = applyExpToTamer(
            prevAcc.tamer,
            gainedTamerExp,
            prevAcc.equippedItems
          );
          const digiRes = applyExpToDigimon(
            prevAcc.digimon,
            gainedDigimonExp,
            starterDigimon.digimonId
          );

          let nextInventory = prevAcc.inventory;
          const hpDrop = BASIC_BITS_SHOP_ITEMS[0];
          const dsDrop = BASIC_BITS_SHOP_ITEMS[1];
          const inv1 = addInventoryItem(nextInventory, {
            itemKey: hpDrop.itemKey,
            name: hpDrop.name,
            category: hpDrop.category,
            quantity: 1,
            description: hpDrop.description,
            hpRestore: hpDrop.hpRestore,
            dsRestore: hpDrop.dsRestore,
          });
          if (inv1.added) nextInventory = inv1.next;

          const inv2 = addInventoryItem(nextInventory, {
            itemKey: dsDrop.itemKey,
            name: dsDrop.name,
            category: dsDrop.category,
            quantity: 1,
            description: dsDrop.description,
            hpRestore: dsDrop.hpRestore,
            dsRestore: dsDrop.dsRestore,
          });
          if (inv2.added) nextInventory = inv2.next;

          commitHudAccount({
            ...prevAcc,
            tamer: tamerRes.next,
            digimon: digiRes.next,
            bits: prevAcc.bits + bitsDrop,
            inventory: nextInventory,
            defeatedEnemiesTotal: prevAcc.defeatedEnemiesTotal + 1,
            updatedAt: new Date().toISOString(),
          });

          playDigitalTone('confirm', soundEnabled);
          sim.floatingTexts.push({
            id: sim.nextFxId++,
            x: DATA_FOREST_BOSS_ARENA.x,
            y: DATA_FOREST_BOSS_ARENA.y - 78,
            text: `★ RAID BOSS DERROTADO! +${gainedDigimonExp} EXP · +${bitsDrop} Bits`,
            color: '#fde047',
            elapsed: 0,
            duration: 2.1,
          });
          pushChatMessage(
            'system',
            `Recompensa de Raid recebida: +${gainedDigimonExp} EXP (${formNow.name}), +${gainedTamerExp} EXP (Tamer), +${bitsDrop} Bits, ${hpDrop.name} e ${dsDrop.name}!`,
            { tone: 'loot' }
          );
          pushNotification(
            'Vitória na Raid Kuwagamon!',
            `Você participou da derrota do Boss e ganhou +${gainedDigimonExp} EXP e +${bitsDrop} Bits.`
          );

          if (tamerRes.leveledUp) {
            setLevelUpPulse(true);
            setTimeout(() => setLevelUpPulse(false), 1800);
            pushChatMessage(
              'system',
              `LEVEL UP! Tamer ${selection.tamerName} alcançou o Nível ${tamerRes.next.level}!`,
              { tone: 'level' }
            );
          }
          if (digiRes.leveledUp) {
            setDigimonLevelUpPulse(true);
            setTimeout(() => setDigimonLevelUpPulse(false), 1800);
            pushChatMessage(
              'system',
              `LEVEL UP! ${formNow.name} alcançou o Nível ${digiRes.next.level}!`,
              { tone: 'level' }
            );
          }
          if (digiRes.newlyUnlockedForms.length > 0) {
            for (const unlocked of digiRes.newlyUnlockedForms) {
              setEvolutionUnlockAlert(unlocked);
              pushChatMessage(
                'system',
                `EVOLUÇÃO DESBLOQUEADA! ${formNow.name} atingiu o Nível ${unlocked.unlockLevel} e está pronto para evoluir para ${unlocked.name}!`,
                { tone: 'level' }
              );
              pushNotification(
                'Evolução Desbloqueada!',
                `${formNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
              );
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (bossBannerTimerRef.current !== null) {
        window.clearTimeout(bossBannerTimerRef.current);
        bossBannerTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, starterDigimon.digimonId, selection.tamerName]);

  // Live 1s countdown & synchronized 1h respawn trigger for Kuwagamon when defeated
  useEffect(() => {
    if (
      !worldBossState ||
      worldBossState.alive ||
      worldBossState.respawnAtMs <= 0
    ) {
      return;
    }

    const tick = () => {
      const now = Date.now();
      setBossNowMs(now);
      if (now >= worldBossState.respawnAtMs) {
        void tryRespawnWorldBoss(KUWAGAMON_BOSS_ID);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [worldBossState]);

  function persistProgress() {
    const sim = simRef.current;
    saveAdventureProgressForAccount({
      accountUsername: selection.accountUsername,
      characterId: selection.characterId,
      tamerName: selection.tamerName,
      mapId: sim.mapId,
      worldX: Math.round(sim.x),
      worldY: Math.round(sim.y),
      facingDir: sim.dir,
      stepsCount: sim.stepsCount,
      discoveredZones: Array.from(sim.discoveredZones),
      updatedAt: new Date().toISOString(),
    });
    saveAccountHudState(hudAccountRef.current);
  }

  function commitHudAccount(next: AccountHudPersistence) {
    hudAccountRef.current = next;
    setHudAccount(next);
    saveAccountHudState(next);
  }

  function travelToMap(targetMap: ActiveWorldMapId) {
    const sim = simRef.current;
    setActiveStationModal(null);
    sim.tapTarget = null;
    sim.keyOrder = [];
    sim.combatEffects = [];
    sim.floatingTexts = [];
    sim.activeSkillBanner = null;
    sim.skillBannerTimer = 0;

    if (targetMap === DATA_FOREST_MAP_ID) {
      sim.mapId = DATA_FOREST_MAP_ID;
      sim.x = DATA_FOREST_SPAWN_POINT.x;
      sim.y = DATA_FOREST_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = DATA_FOREST_SPAWN_POINT.facingDir;
      sim.enemies = createInitialDataForestMonsters();
      if (worldBossRef.current) {
        const bossEnemy = sim.enemies.find(
          (e) => e.isBoss && e.bossId === KUWAGAMON_BOSS_ID
        );
        if (bossEnemy) {
          bossEnemy.hp = worldBossRef.current.hp;
          bossEnemy.maxHp = worldBossRef.current.maxHp;
          bossEnemy.alive = worldBossRef.current.alive;
        }
      }
      sim.partner = createInitialPartnerRuntime(
        sim.x,
        sim.y,
        DATA_FOREST_SPAWN_POINT.facingDir
      );
      pushChatMessage(
        'system',
        'Você chegou à Floresta de Dados (Nv. 10–20)! Atravesse as pontes para enfrentar Palmon, Kunemon, Mushroomon, Woodmon, Kiwimon e o Raid Boss Kuwagamon na Grande Árvore!',
        { tone: 'info' }
      );
    } else if (targetMap === HUNTING_MAP_ID) {
      sim.mapId = HUNTING_MAP_ID;
      sim.x = HUNTING_SPAWN_POINT.x;
      sim.y = HUNTING_SPAWN_POINT.y;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = 'S';
      sim.enemies = createInitialWildMonsters();
      sim.partner = createInitialPartnerRuntime(sim.x, sim.y, 'S');
      pushChatMessage(
        'system',
        'Você chegou à Planície Digital (Nv. 1–10)! Explore a Floresta, Ruínas, Ponte da Cachoeira, Lago e Caverna.',
        { tone: 'info' }
      );
    } else {
      sim.mapId = DATS_MAP_ID;
      sim.x = 800;
      sim.y = 1230;
      sim.camX = sim.x;
      sim.camY = sim.y - 56;
      sim.dir = 'N';
      sim.partner = createInitialPartnerRuntime(sim.x, sim.y, 'N');
      pushChatMessage(
        'system',
        'Retornou ao DATS Center (Zona Segura). Recuperação de HP/DS ativa.',
        { tone: 'info' }
      );
    }

    persistProgress();
    playDigitalTone('confirm', soundEnabled);
  }

  function handleMeetPlayer(target: RemoteWorldPlayer) {
    const sim = simRef.current;
    const { worldW, worldH, minY } = getMapDimensions(target.mapId);

    if (sim.mapId !== target.mapId) {
      travelToMap(target.mapId);
    }

    // Place smoothly right next to the target player (offset by 52px horizontally so sprites never overlap)
    const desiredX = Math.max(64, Math.min(worldW - 64, target.worldX + 52));
    const desiredY = Math.max(minY, Math.min(worldH - 64, target.worldY));
    sim.x = desiredX;
    sim.y = desiredY;
    sim.camX = desiredX;
    sim.camY = desiredY - 56;
    sim.tapTarget = null;
    sim.dir = 'W';
    sim.partner = createInitialPartnerRuntime(desiredX, desiredY, 'W');

    pushChatMessage(
      'system',
      `Você se encontrou com ${target.isGm ? '[GM] ' : ''}${target.tamerName}!`,
      { tone: 'info' }
    );
    persistProgress();
    void publishLocalWorldPresence(buildLocalPresenceSnapshot());
    playDigitalTone('confirm', soundEnabled);
  }

  function openNearbyStation() {
    const sim = simRef.current;
    if (isCombatWorldMap(sim.mapId) && sim.nearReturnPortal) {
      travelToMap(DATS_MAP_ID);
      return;
    }

    const ptId = sim.nearbyPointId;
    if (!ptId) return;
    const activePoints =
      sim.mapId === DATA_FOREST_MAP_ID
        ? DATA_FOREST_INTERACTION_POINTS
        : sim.mapId === HUNTING_MAP_ID
          ? HUNTING_INTERACTION_POINTS
          : DATS_INTERACTION_POINTS;
    const found = activePoints.find((p) => p.id === ptId);
    if (!found) return;
    if (!sim.discoveredZones.has(found.id)) {
      sim.discoveredZones.add(found.id);
      pushNotification('Local Descoberto', `Ponto registrado: ${found.title}`);
    }
    persistProgress();
    playDigitalTone('confirm', soundEnabled);
    if (found.id === DATS_INCUBATOR_STATION.id) {
      pendingIncubatorWalkRef.current = false;
      sim.tapTarget = null;
      sim.keyOrder = [];
      setActiveStationModal(null);
      setActiveHudWindow('incubator');
      return;
    }
    setActiveStationModal(found);
  }

  const handleTriggerManualSkill = useCallback(
    (kind: 'special1' | 'special2') => {
      const sim = simRef.current;
      const isCombat = isCombatWorldMap(sim.mapId);
      const inSafeZone = isPointInMapSafeZone(sim.mapId, sim.x, sim.y);
      const dsCost = kind === 'special1' ? SKILL_F1_DS_COST : SKILL_F2_DS_COST;
      const currentForm = activeFormRef.current;
      const skillName =
        kind === 'special1'
          ? currentForm.special1Name
          : currentForm.special2Name;
      const cooldownSec =
        kind === 'special1'
          ? currentForm.special1CooldownSec
          : currentForm.special2CooldownSec;
      const currentStats = hudAccountRef.current;

      const result = triggerPartnerManualSkill(sim.partner, {
        kind,
        tamerX: sim.x,
        tamerY: sim.y,
        isCombatMap: isCombat,
        isInSafeZone: inSafeZone,
        enemies: isCombat ? sim.enemies : [],
        hasEnoughDs: currentStats.digimon.ds >= dsCost,
        cooldownSec,
        snapDir: (dx, dy) => snapToCardinalVector(dx, dy).dir,
        onConsumeDs: () => {
          const nextAccount: AccountHudPersistence = {
            ...hudAccountRef.current,
            digimon: {
              ...hudAccountRef.current.digimon,
              ds: Math.max(0, hudAccountRef.current.digimon.ds - dsCost),
            },
          };
          hudAccountRef.current = nextAccount;
          setHudAccount(nextAccount);
        },
      });

      if (result.ok) {
        playDigitalTone('confirm', soundEnabled);
        sim.activeSkillBanner = `${skillName}!`;
        sim.skillBannerTimer = 1.0;
        return;
      }

      playDigitalTone('error', soundEnabled);
      const reasonMap: Record<
        'safe-zone' | 'cooldown' | 'low-ds' | 'no-target' | 'out-of-range' | 'busy',
        string
      > = {
        'safe-zone': 'Habilidades de ataque não podem ser usadas na Zona Segura.',
        cooldown: `${skillName} ainda está em recarga.`,
        'low-ds': `DS insuficiente para ${skillName} (${dsCost} DS necessários).`,
        'no-target': 'Clique em um Digimon inimigo para atacar antes de usar a habilidade.',
        'out-of-range': `${currentForm.name} está indo até o alvo clicado para usar ${skillName}.`,
        busy: `${currentForm.name} já está executando um ataque.`,
      };
      pushChatMessage('system', reasonMap[result.reason], { tone: 'warning' });
    },
    [pushChatMessage, soundEnabled]
  );

  const handleTriggerEvolution = useCallback(
    (targetFormOrId: DigimonFormId | DigimonFormProfile) => {
      const targetId: DigimonFormId =
        typeof targetFormOrId === 'string' ? targetFormOrId : targetFormOrId.id;
      const currentAcc = hudAccountRef.current;
      const currentForm = resolveActiveFormProfile(
        starterDigimon.digimonId,
        currentAcc.digimon.activeFormId
      );
      const res = evolveDigimonAccountState(
        currentAcc,
        starterDigimon.digimonId,
        targetId
      );
      if (res.error || !res.evolvedForm) {
        playDigitalTone('error', soundEnabled);
        if (res.error) {
          pushChatMessage('system', res.error, { tone: 'warning' });
        }
        return;
      }

      const targetForm = res.evolvedForm;
      if (targetForm.id === currentForm.id) return;

      commitHudAccount(res.next);
      setEvolutionUnlockAlert(null);

      if (targetForm.unlockLevel > currentForm.unlockLevel) {
        preloadAndUnlockEvolutionAudio();
        setActiveHudWindow(null);
        setActiveStationModal(null);
        setActiveNpcDialogue(null);
        simRef.current.tapTarget = null;
        simRef.current.keyOrder = [];
        simRef.current.evoFlashTimer = 1.65;

        const tamerAttrs = computeTamerAttributes(
          res.next.tamer,
          res.next.equippedItems
        );
        const derivedAttrs = computeDerivedDigimonAttributes(
          tamerAttrs,
          res.next.digimon,
          res.next.defeatedEnemiesTotal,
          targetForm.id
        );

        setEvolutionCinematic({
          fromForm: currentForm,
          toForm: targetForm,
          level: res.next.digimon.level,
          maxHp: res.next.digimon.maxHp,
          maxDs: res.next.digimon.maxDs,
          derivedAttrs,
        });
        pushChatMessage(
          'system',
          `DIGIEVOLUÇÃO! ${currentForm.name} evoluiu para ${targetForm.name} (${targetForm.stage})!`,
          { tone: 'level' }
        );
        pushNotification(
          `Evolução: ${targetForm.name}!`,
          `${currentForm.name} transformou-se em ${targetForm.name} no Nível ${res.next.digimon.level}.`
        );
      } else {
        playDigitalTone('click', soundEnabled);
        simRef.current.evoFlashTimer = 0.85;
        pushChatMessage(
          'system',
          `Forma alternada para ${targetForm.name} (${targetForm.stage}).`,
          { tone: 'info' }
        );
      }
    },
    [pushChatMessage, pushNotification, soundEnabled, starterDigimon.digimonId]
  );

  const handleAdminSetDigimonLevel = useCallback(
    (targetLevel: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const res = setDigimonLevelForTesting(
        prevAcc.digimon,
        starterDigimon.digimonId,
        targetLevel
      );
      const nextForm = resolveActiveFormProfile(
        starterDigimon.digimonId,
        res.next.activeFormId
      );
      commitHudAccount({
        ...prevAcc,
        digimon: res.next,
        updatedAt: new Date().toISOString(),
      });
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] Nível de ${nextForm.name} ajustado para Nv. ${res.next.level}.`,
        { tone: 'level' }
      );
      if (res.revertedForm) {
        setEvolutionUnlockAlert(null);
        pushChatMessage(
          'system',
          `[GM] Forma ajustada para ${nextForm.name} compatível com o Nv. ${res.next.level}.`,
          { tone: 'info' }
        );
      }
      if (res.newlyUnlockedForms.length > 0) {
        for (const unlocked of res.newlyUnlockedForms) {
          setEvolutionUnlockAlert(unlocked);
          pushChatMessage(
            'system',
            `EVOLUÇÃO DESBLOQUEADA! ${nextForm.name} atingiu o Nível ${unlocked.unlockLevel} e pode evoluir para ${unlocked.name}!`,
            { tone: 'level' }
          );
          pushNotification(
            'Evolução Desbloqueada!',
            `${nextForm.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
          );
        }
      }
    },
    [isGM, pushChatMessage, pushNotification, soundEnabled, starterDigimon.digimonId]
  );

  const handleAdminAddDigimonExp = useCallback(
    (expAmount: number) => {
      if (!isGM) return;
      const prevAcc = hudAccountRef.current;
      const res = applyExpToDigimon(
        prevAcc.digimon,
        expAmount,
        starterDigimon.digimonId
      );
      const activeFormNow = resolveActiveFormProfile(
        starterDigimon.digimonId,
        res.next.activeFormId
      );
      commitHudAccount({
        ...prevAcc,
        digimon: res.next,
        updatedAt: new Date().toISOString(),
      });
      playDigitalTone('confirm', soundEnabled);
      pushChatMessage(
        'system',
        `[GM] +${expAmount} EXP adicionados para ${activeFormNow.name} (Nv. ${res.next.level}).`,
        { tone: 'loot' }
      );
      if (res.newlyUnlockedForms.length > 0) {
        for (const unlocked of res.newlyUnlockedForms) {
          setEvolutionUnlockAlert(unlocked);
          pushChatMessage(
            'system',
            `EVOLUÇÃO DESBLOQUEADA! ${activeFormNow.name} atingiu o Nível ${unlocked.unlockLevel} e pode evoluir para ${unlocked.name}!`,
            { tone: 'level' }
          );
          pushNotification(
            'Evolução Desbloqueada!',
            `${activeFormNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
          );
        }
      }
    },
    [isGM, pushChatMessage, pushNotification, soundEnabled, starterDigimon.digimonId]
  );

  const handleAdminRestoreVitals = useCallback(() => {
    if (!isGM) return;
    const prevAcc = hudAccountRef.current;
    const tamerAttrs = computeTamerAttributes(prevAcc.tamer, prevAcc.equippedItems);
    commitHudAccount({
      ...prevAcc,
      tamer: {
        ...prevAcc.tamer,
        maxHp: tamerAttrs.maxHp,
        maxDs: tamerAttrs.maxDs,
        hp: tamerAttrs.maxHp,
        ds: tamerAttrs.maxDs,
      },
      digimon: {
        ...prevAcc.digimon,
        hp: prevAcc.digimon.maxHp,
        ds: prevAcc.digimon.maxDs,
      },
      updatedAt: new Date().toISOString(),
    });
    simRef.current.partner.special1Cooldown = 0;
    simRef.current.partner.special2Cooldown = 0;
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage(
      'system',
      '[GM] HP, DS e tempos de recarga restaurados para 100%.',
      { tone: 'info' }
    );
  }, [isGM, pushChatMessage, soundEnabled]);

  useEffect(() => {
    let cancelled = false;
    const tId: TamerId = selection.characterId;
    const dId: StarterDigimonId = starterDigimon.digimonId;
    Promise.all([
      preloadTamerSheets(tId),
      preloadDigimonEvolutionLine(dId),
      preloadFixedNpcSprite(RICHARD_SAMPSON_NPC),
      preloadWildDigimonSprites(),
    ]).then(() => {
      if (!cancelled) {
        setLoadedAssetsKey(`${tId}:${dId}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selection.characterId, starterDigimon.digimonId]);

  useEffect(() => {
    persistProgress();
    const handleBeforeUnload = () => persistProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.accountUsername, selection.characterId, selection.tamerName]);

  // Keyboard controls (WASD / Arrow keys + E/Enter interaction + F1/F2 skills, guarded when Chat input is focused)
  useEffect(() => {
    function keyToDir(k: string): CardinalDirection | null {
      if (k === 'w' || k === 'arrowup') return 'N';
      if (k === 's' || k === 'arrowdown') return 'S';
      if (k === 'a' || k === 'arrowleft') return 'W';
      if (k === 'd' || k === 'arrowright') return 'E';
      return null;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isEvolvingRef.current) {
        return;
      }
      if (
        isChatFocusedRef.current ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleTriggerManualSkill('special1');
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        handleTriggerManualSkill('special2');
        return;
      }
      if (e.key === 'F9') {
        if (!isGM) return;
        e.preventDefault();
        playDigitalTone('click', soundEnabled);
        setActiveHudWindow((curr) => (curr === 'admin' ? null : 'admin'));
        return;
      }

      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      if (k === 'escape') {
        if (overlayLayerRef.current.npc) {
          setActiveNpcDialogue(null);
        } else if (overlayLayerRef.current.station) {
          setActiveStationModal(null);
        } else if (overlayLayerRef.current.hud) {
          setActiveHudWindow(null);
        } else if (overlayLayerRef.current.inventory) {
          setInventoryOpen(false);
        }
        return;
      }
      if (activeHudWindowRef.current === 'incubator') {
        return;
      }
      if (k === 'i') {
        setInventoryOpen((o) => !o);
        return;
      }
      if (k === 'e' || k === 'enter') {
        const sim = simRef.current;
        if (isCombatWorldMap(sim.mapId) && sim.nearReturnPortal) {
          e.preventDefault();
          travelToMap(DATS_MAP_ID);
          return;
        }
        if (sim.nearbyPointId) {
          e.preventDefault();
          openNearbyStation();
        }
        return;
      }

      const dir = keyToDir(k);
      if (!dir) return;
      pendingIncubatorWalkRef.current = false;
      setActiveStationModal(null);
      setActiveNpcDialogue(null);
      const order = simRef.current.keyOrder;
      if (!order.includes(dir)) {
        order.push(dir);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const dir = keyToDir(e.key.toLowerCase());
      if (!dir) return;
      simRef.current.keyOrder = simRef.current.keyOrder.filter((d) => d !== dir);
    }

    function onWindowBlur() {
      simRef.current.keyOrder = [];
      simRef.current.joyVx = 0;
      simRef.current.joyVy = 0;
      simRef.current.joyMag = 0;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGM, soundEnabled, handleTriggerManualSkill]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const incubatorWorldRenderer = createIncubatorWorldSpriteRenderer();
    const datsGroundCanvas = buildDatsCenterStaticLayer();
    const datsDepthProps = buildDatsDepthProps({
      getIncubatorCanvas: (el) => incubatorWorldRenderer.getCanvas(el),
      isIncubatorNearby: () =>
        simRef.current.nearbyPointId === DATS_INCUBATOR_STATION.id,
    });
    const huntingGroundCanvas = buildHuntingFieldStaticLayer();
    const huntingDepthProps = buildHuntingDepthProps();
    const dataForestGroundCanvas = buildDataForestStaticLayer();
    const dataForestDepthProps = buildDataForestDepthProps();

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;
    let hudTimer = 0;

    function syncCanvasSize() {
      if (!canvas) return { w: 360, h: 540 };
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: rect.height };
    }

    function loop(now: number) {
      const dt = Math.max(0, Math.min(0.05, (now - lastTs) / 1000));
      lastTs = now;
      elapsed = Math.max(0, elapsed + dt);

      const { w: viewW, h: viewH } = syncCanvasSize();
      const sim = simRef.current;
      const isDataForest = sim.mapId === DATA_FOREST_MAP_ID;
      const isHunting = sim.mapId === HUNTING_MAP_ID;
      const isCombatMap = isHunting || isDataForest;
      const { worldW, worldH, minY } = getMapDimensions(sim.mapId);
      const colliders = isDataForest
        ? DATA_FOREST_COLLIDERS
        : isHunting
          ? HUNTING_COLLIDERS
          : DATS_COLLIDERS;

      const isEvolving = isEvolvingRef.current;

      // 1. Strict 4-direction Tamer movement vector (paused smoothly during Digivolution cinematic)
      let moveX = 0;
      let moveY = 0;
      let moveDir: CardinalDirection | null = null;

      if (!isEvolving) {
        if (sim.keyOrder.length > 0) {
          const activeDir = sim.keyOrder[sim.keyOrder.length - 1];
          moveDir = activeDir;
          if (activeDir === 'N') moveY = -1;
          else if (activeDir === 'S') moveY = 1;
          else if (activeDir === 'E') moveX = 1;
          else moveX = -1;
          sim.tapTarget = null;
        } else if (sim.joyMag > 0.18) {
          const snapped = snapToCardinalVector(sim.joyVx, sim.joyVy);
          moveX = snapped.vx;
          moveY = snapped.vy;
          moveDir = snapped.dir;
          sim.tapTarget = null;
        } else if (sim.tapTarget) {
          const dx = sim.tapTarget.x - sim.x;
          const dy = sim.tapTarget.y - sim.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 6) {
            sim.tapTarget = null;
          } else {
            const snapped = snapToCardinalVector(dx, dy);
            moveX = snapped.vx;
            moveY = snapped.vy;
            moveDir = snapped.dir;
          }
        }
      }

      // 2. Tamer movement, collision & animation state machine
      const liveTamerAttrs = computeTamerAttributes(
        hudAccountRef.current.tamer,
        hudAccountRef.current.equippedItems
      );
      if (moveDir) {
        if (sim.state !== 'walk') {
          sim.state = 'walk';
          sim.frameIndex = 0;
          sim.frameTime = 0;
        }
        sim.dir = moveDir;

        const prevX = sim.x;
        const prevY = sim.y;
        const moveSpeed = liveTamerAttrs.speed;

        sim.x = Math.max(42, Math.min(worldW - 42, sim.x + moveX * moveSpeed * dt));
        sim.y = Math.max(minY, Math.min(worldH - 42, sim.y + moveY * moveSpeed * dt));

        for (const col of colliders) {
          const [rx, ry] = resolveCircleRect(sim.x, sim.y, PLAYER_RADIUS, col);
          sim.x = rx;
          sim.y = ry;
        }

        if (!isCombatMap) {
          const [nx, ny] = resolveCircleCircle(
            sim.x,
            sim.y,
            PLAYER_RADIUS,
            RICHARD_SAMPSON_NPC.x,
            RICHARD_SAMPSON_NPC.y,
            RICHARD_SAMPSON_NPC.collisionRadius
          );
          sim.x = nx;
          sim.y = ny;
        } else {
          const activeFieldNpcs = isDataForest
            ? DATA_FOREST_FRIENDLY_NPCS
            : FRIENDLY_FIELD_NPCS;
          for (const npc of activeFieldNpcs) {
            const [nx, ny] = resolveCircleCircle(
              sim.x,
              sim.y,
              PLAYER_RADIUS,
              npc.x,
              npc.y,
              22
            );
            sim.x = nx;
            sim.y = ny;
          }
        }

        const movedDist = Math.hypot(sim.x - prevX, sim.y - prevY);
        sim.distMovedAccum += movedDist;
        if (sim.distMovedAccum >= 32) {
          sim.stepsCount += Math.floor(sim.distMovedAccum / 32);
          sim.distMovedAccum %= 32;
        }

        if (sim.tapTarget && movedDist < 0.25) {
          sim.tapTarget = null;
        }

        const walkFrameRate = 9.5;
        sim.frameTime += dt;
        if (sim.frameTime >= 1 / walkFrameRate) {
          sim.frameTime = 0;
          sim.frameIndex = (sim.frameIndex + 1) % TAMER_FRAME_COUNT;
        }
      } else {
        if (sim.state === 'walk') {
          sim.state = 'idle';
          sim.frameIndex = 0;
          sim.frameTime = 0;
          sim.lastSaveTs = now;
          persistProgress();
        }
        sim.frameTime += dt;
        if (sim.frameTime >= 0.36) {
          sim.frameTime = 0;
          sim.frameIndex = (sim.frameIndex + 1) % TAMER_FRAME_COUNT;
        }
      }

      // 2b. Wild Enemy Patrol, Per-Mob Aggro Chase, Counter-Attack & Respawn Loop (paused cleanly during Digivolution)
      const inSafeZone = isPointInMapSafeZone(sim.mapId, sim.x, sim.y);
      if (isCombatMap && !isEvolving) {
        let retreatedToSafeZone = false;

        for (const enemy of sim.enemies) {
          if (enemy.hitFlashTimer > 0) {
            enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
          }
          if (enemy.attackAnimTimer > 0) {
            enemy.attackAnimTimer = Math.max(0, enemy.attackAnimTimer - dt);
          }
          if ((enemy.counterCooldown ?? 0) > 0) {
            enemy.counterCooldown = Math.max(0, (enemy.counterCooldown ?? 0) - dt);
          }

          if (!enemy.alive) {
            enemy.aggroed = false;
            enemy.aggroTimer = 0;
            enemy.counterCooldown = 0;
            // World Raid Bosses respawn strictly via synchronized Firestore timer
            if (enemy.isBoss) {
              continue;
            }
            enemy.respawnTimer -= dt;
            if (enemy.respawnTimer <= 0) {
              enemy.alive = true;
              enemy.hp = enemy.maxHp;
              enemy.x = enemy.homeX;
              enemy.y = enemy.homeY;
              enemy.attackAnimTimer = 0;
            }
            continue;
          }

          const beingEngagedByPartner =
            (sim.partner.targetEnemyId === enemy.id &&
              sim.partner.aiState === 'ATTACK') ||
            sim.partner.activeAttack?.targetId === enemy.id;

          if (beingEngagedByPartner && !inSafeZone) {
            if (!enemy.aggroed) {
              enemy.aggroed = true;
              enemy.counterCooldown = enemy.isBoss ? 0.45 : 0.6;
            }
            enemy.aggroTimer = 8.5;
          }

          if (enemy.aggroed) {
            if (inSafeZone || retreatedToSafeZone) {
              enemy.aggroed = false;
              enemy.aggroTimer = 0;
            } else {
              enemy.aggroTimer = Math.max(0, (enemy.aggroTimer ?? 0) - dt);
              const leashDist = Math.hypot(
                enemy.x - enemy.homeX,
                enemy.y - enemy.homeY
              );
              const maxLeash = enemy.isBoss ? 420 : 340;
              if ((enemy.aggroTimer ?? 0) <= 0 || leashDist > maxLeash) {
                enemy.aggroed = false;
                enemy.aggroTimer = 0;
              }
            }
          }

          if (!enemy.aggroed) {
            enemy.patrolTimer += dt;
            enemy.patrolAngle += dt * (enemy.isBoss ? 0.36 : 0.52);
            const patrolRx = enemy.isBoss ? 14 : 18;
            const patrolRy = enemy.isBoss ? 8 : 12;
            const targetX = enemy.homeX + Math.cos(enemy.patrolAngle) * patrolRx;
            const targetY = enemy.homeY + Math.sin(enemy.patrolAngle * 0.8) * patrolRy;
            const stepX = (targetX - enemy.x) * Math.min(1, dt * 1.4);
            if (Math.abs(stepX) > 0.08) {
              enemy.facingRight = stepX > 0;
            }
            enemy.x += stepX;
            enemy.y += (targetY - enemy.y) * Math.min(1, dt * 1.4);
            continue;
          }

          // Enemy is actively aggroed: face partner, close distance if needed, and counter-attack!
          const dxToPartner = sim.partner.x - enemy.x;
          const dyToPartner = sim.partner.y - enemy.y;
          const distToPartner = Math.hypot(dxToPartner, dyToPartner);
          if (Math.abs(dxToPartner) > 1) {
            enemy.facingRight = dxToPartner >= 0;
          }

          const meleeReach = enemy.isBoss ? 114 : 84;
          if (distToPartner > meleeReach) {
            const mobChaseSpeed = enemy.isBoss ? 118 : 135;
            const step = Math.min(
              distToPartner - (meleeReach - 12),
              mobChaseSpeed * dt
            );
            if (step > 0.05 && distToPartner > 0.001) {
              let nx = Math.max(
                48,
                Math.min(worldW - 48, enemy.x + (dxToPartner / distToPartner) * step)
              );
              let ny = Math.max(
                minY,
                Math.min(worldH - 48, enemy.y + (dyToPartner / distToPartner) * step)
              );
              for (const col of colliders) {
                const [rx, ry] = resolveCircleRect(nx, ny, 16, col);
                nx = rx;
                ny = ry;
              }
              if (!isPointInMapSafeZone(sim.mapId, nx, ny)) {
                enemy.x = nx;
                enemy.y = ny;
              }
            }
          }

          const updatedDist = Math.hypot(
            sim.partner.x - enemy.x,
            sim.partner.y - enemy.y
          );
          if (
            !retreatedToSafeZone &&
            updatedDist <= meleeReach + 8 &&
            (enemy.counterCooldown ?? 0) <= 0
          ) {
            enemy.counterCooldown = enemy.isBoss ? 1.55 : 1.75;
            enemy.attackAnimTimer = 0.48;
            enemy.facingRight = sim.partner.x >= enemy.x;

            const cur = hudAccountRef.current;
            const tamerDefAttrs = computeTamerAttributes(cur.tamer, cur.equippedItems);
            const derivedDef = computeDerivedDigimonAttributes(
              tamerDefAttrs,
              cur.digimon,
              cur.defeatedEnemiesTotal,
              activeFormRef.current.id
            );

            // EV (Evasão): esquiva completa do contra-ataque inimigo
            if (Math.random() * 100 < derivedDef.evasion) {
              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: sim.partner.x,
                y: sim.partner.y - 44,
                text: 'ESQUIVOU!',
                color: '#38bdf8',
                elapsed: 0,
                duration: 0.75,
              });
            } else {
              // DE (Defesa) reduz o ataque bruto do Digimon selvagem (Raid Boss bate mais forte!)
              const rawEnemyAtk =
                (10 + enemy.level * 3.5) * (enemy.isBoss ? 1.42 : 1);
              const mitigated = Math.max(
                enemy.isBoss ? 8 : 2,
                Math.round(rawEnemyAtk - derivedDef.defense * 0.35)
              );
              // BL (Bloqueio): reduz o dano sofrido pela metade
              const isBlocked = Math.random() * 100 < derivedDef.blockRate;
              const incomingDmg = isBlocked
                ? Math.max(1, Math.round(mitigated * 0.5))
                : mitigated;
              const nextHp = cur.digimon.hp - incomingDmg;
              if (enemy.isBoss && Math.random() < 0.42) {
                sim.floatingTexts.push({
                  id: sim.nextFxId++,
                  x: enemy.x,
                  y: enemy.y - 98,
                  text: 'TESOURA CRUZADA!',
                  color: '#fca5a5',
                  elapsed: 0,
                  duration: 0.9,
                });
              }
              sim.floatingTexts.push({
                id: sim.nextFxId++,
                x: sim.partner.x,
                y: sim.partner.y - 44,
                text: isBlocked ? `BLOQUEIO -${incomingDmg}` : `-${incomingDmg}`,
                color: isBlocked ? '#fbbf24' : '#fb7185',
                elapsed: 0,
                duration: 0.78,
              });

              if (nextHp <= 0) {
                retreatedToSafeZone = true;
                // Emergency retreat back to the map's Safe Sanctuary without losing saved progress
                const recoveredAccount: AccountHudPersistence = {
                  ...cur,
                  digimon: {
                    ...cur.digimon,
                    hp: Math.max(25, Math.round(cur.digimon.maxHp * 0.35)),
                  },
                };
                commitHudAccount(recoveredAccount);
                pushChatMessage(
                  'system',
                  `${activeFormRef.current.name} sofreu dano crítico e recuou para a Área Segura!`,
                  { tone: 'warning' }
                );
                const safeSpawn = isDataForest
                  ? DATA_FOREST_SPAWN_POINT
                  : HUNTING_SPAWN_POINT;
                sim.x = safeSpawn.x;
                sim.y = safeSpawn.y;
                sim.partner.x = sim.x + 44;
                sim.partner.y = sim.y - 24;
                sim.partner.targetEnemyId = null;
                sim.partner.activeAttack = null;
                sim.partner.aiState = 'IDLE';
                for (const other of sim.enemies) {
                  other.aggroed = false;
                  other.aggroTimer = 0;
                }
              } else {
                const updated: AccountHudPersistence = {
                  ...cur,
                  digimon: { ...cur.digimon, hp: nextHp },
                };
                hudAccountRef.current = updated;
                setHudAccount(updated);
              }
            }
          }
        }
      }

      // Safe Zone natural HP & DS recovery
      if (inSafeZone) {
        sim.safeRegenTimer += dt;
        if (sim.safeRegenTimer >= 0.75) {
          sim.safeRegenTimer = 0;
          const cur = hudAccountRef.current;
          if (
            cur.tamer.hp < liveTamerAttrs.maxHp ||
            cur.tamer.ds < liveTamerAttrs.maxDs ||
            cur.digimon.hp < cur.digimon.maxHp ||
            cur.digimon.ds < cur.digimon.maxDs
          ) {
            const nextAccount: AccountHudPersistence = {
              ...cur,
              tamer: {
                ...cur.tamer,
                maxHp: liveTamerAttrs.maxHp,
                maxDs: liveTamerAttrs.maxDs,
                hp: Math.min(liveTamerAttrs.maxHp, cur.tamer.hp + 7),
                ds: Math.min(liveTamerAttrs.maxDs, cur.tamer.ds + 6),
              },
              digimon: {
                ...cur.digimon,
                hp: Math.min(cur.digimon.maxHp, cur.digimon.hp + 9),
                ds: Math.min(cur.digimon.maxDs, cur.digimon.ds + 8),
              },
            };
            hudAccountRef.current = nextAccount;
            setHudAccount(nextAccount);
          }
        }
      }

      // 2c. Autonomous 7-State Starter Digimon Partner AI (paused cleanly during Digivolution)
      const curAcc = hudAccountRef.current;
      const liveForm = activeFormRef.current;
      if (!isEvolving) updatePartnerAI(sim.partner, {
        dt,
        tamerX: sim.x,
        tamerY: sim.y,
        tamerDir: sim.dir,
        tamerMoving: sim.state === 'walk',
        isCombatMap,
        isInSafeZone: inSafeZone,
        worldW,
        worldH,
        minY,
        colliders,
        enemies: isCombatMap ? sim.enemies : [],
        speedMult: liveForm.spdMult,
        partnerSizeOffset: liveForm.worldDimensions.followGapBonus,
        basicHitIntervalSec: liveForm.basicHitIntervalSec,
        special1CooldownSec: liveForm.special1CooldownSec,
        special2CooldownSec: liveForm.special2CooldownSec,
        canUseSpecial1: curAcc.digimon.ds >= SKILL_F1_DS_COST,
        canUseSpecial2: curAcc.digimon.ds >= SKILL_F2_DS_COST,
        onConsumeSpecialDs: (kind) => {
          const cost = kind === 'special1' ? SKILL_F1_DS_COST : SKILL_F2_DS_COST;
          const liveAcc = hudAccountRef.current;
          if (liveAcc.digimon.ds < cost) return false;
          const nextAcc: AccountHudPersistence = {
            ...liveAcc,
            digimon: {
              ...liveAcc.digimon,
              ds: Math.max(0, liveAcc.digimon.ds - cost),
            },
          };
          hudAccountRef.current = nextAcc;
          setHudAccount(nextAcc);
          return true;
        },
        resolveCircleRect,
        snapDir: (dx, dy) => snapToCardinalVector(dx, dy).dir,
        onDealDamage: (enemy: EnemyMonsterInstance, kind: PartnerAttackKind, amount: number) => {
          if (!enemy.aggroed) {
            enemy.aggroed = true;
            enemy.counterCooldown = enemy.isBoss ? 0.45 : 0.6;
          }
          enemy.aggroTimer = 8.5;

          const curLive = hudAccountRef.current;
          const formNow = activeFormRef.current;
          const tamerCombatAttrs = computeTamerAttributes(
            curLive.tamer,
            curLive.equippedItems
          );
          const derivedCombat = computeDerivedDigimonAttributes(
            tamerCombatAttrs,
            curLive.digimon,
            curLive.defeatedEnemiesTotal,
            formNow.id
          );
          // HT (Acerto): calcula chance de acerto vs nível do alvo (skills F1/F2 têm bônus de precisão)
          const hitChance =
            kind === 'basic'
              ? Math.min(99, Math.max(84, 88 + (derivedCombat.accuracy - enemy.level * 14) * 0.08))
              : Math.min(99.5, Math.max(92, 94 + (derivedCombat.accuracy - enemy.level * 14) * 0.08));
          if (Math.random() * 100 > hitChance) {
            sim.floatingTexts.push({
              id: sim.nextFxId++,
              x: enemy.x,
              y: enemy.y - 42,
              text: 'ERROU!',
              color: '#94a3b8',
              elapsed: 0,
              duration: 0.7,
            });
            return;
          }

          const isCrit = Math.random() * 100 < derivedCombat.critRateTotal;
          const baseScaled =
            kind === 'special2'
              ? Math.max(amount, derivedCombat.totalSpecial2Damage)
              : kind === 'special1'
                ? Math.max(amount, derivedCombat.totalSpecial1Damage)
                : Math.max(amount, derivedCombat.totalBasicDamage);
          const finalDamage = isCrit ? Math.round(baseScaled * 1.5) : baseScaled;
          enemy.hitFlashTimer = 0.16;

          const fxId = sim.nextFxId++;
          sim.combatEffects.push({
            id: fxId,
            kind,
            attackerX: sim.partner.x,
            attackerY: sim.partner.y,
            targetX: enemy.x,
            targetY: enemy.y,
            elapsed: 0,
            duration:
              kind === 'basic'
                ? 0.28
                : kind === 'special1'
                  ? 0.72
                  : 0.84,
          });

          const skillLabel =
            kind === 'special2'
              ? formNow.special2Name
              : kind === 'special1'
                ? formNow.special1Name
                : null;

          if (skillLabel) {
            sim.activeSkillBanner = `${skillLabel}!`;
            sim.skillBannerTimer = 1.1;
          }

          sim.floatingTexts.push({
            id: sim.nextFxId++,
            x: enemy.x,
            y: enemy.y - (enemy.isBoss ? 86 : 42),
            text:
              kind === 'basic'
                ? isCrit
                  ? `-${finalDamage} CRÍTICO!`
                  : `-${finalDamage}`
                : isCrit
                  ? `-${finalDamage} ${skillLabel ?? ''} CRÍTICO!`
                  : `-${finalDamage} ${skillLabel ?? ''}!`,
            color:
              isCrit
                ? '#fde047'
                : kind === 'special2'
                  ? formNow.theme.accentHex
                  : kind === 'special1'
                    ? '#fef08a'
                    : '#ffffff',
            elapsed: 0,
            duration: 0.85,
          });

          // Shared Multiplayer World Raid Boss damage submission (synced live via Firestore + local test fallback)
          if (enemy.isBoss && enemy.bossId) {
            bossParticipatedRef.current = true;
            const nextBossHp = Math.max(0, enemy.hp - finalDamage);
            enemy.hp = nextBossHp;
            if (nextBossHp <= 0) {
              enemy.alive = false;
              if (sim.partner.targetEnemyId === enemy.id) {
                sim.partner.targetEnemyId = null;
              }
            }
            enqueueWorldBossDamage(
              enemy.bossId,
              selection.tamerName,
              finalDamage,
              nextBossHp
            );
            return;
          }

          enemy.hp = Math.max(0, enemy.hp - finalDamage);

          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.respawnTimer = 6.5;
            if (sim.partner.targetEnemyId === enemy.id) {
              sim.partner.targetEnemyId = null;
            }

            const prevAcc = hudAccountRef.current;
            const gainedDigimonExp = calcDmoKillExp(
              enemy.expReward,
              prevAcc.digimon.level,
              enemy.level
            );
            const gainedTamerExp = Math.max(
              1,
              Math.round(
                calcDmoKillExp(
                  enemy.expReward,
                  prevAcc.tamer.level,
                  enemy.level
                ) * 0.48
              )
            );
            const bitsDrop = 10 + enemy.level * 5;

            const tamerRes = applyExpToTamer(
              prevAcc.tamer,
              gainedTamerExp,
              prevAcc.equippedItems
            );
            const digiRes = applyExpToDigimon(
              prevAcc.digimon,
              gainedDigimonExp,
              starterDigimon.digimonId
            );

            let nextInventory = prevAcc.inventory;
            let droppedItemName: string | null = null;
            const roll = Math.random();
            if (roll < 0.26) {
              const dropTpl =
                roll < 0.14 ? BASIC_BITS_SHOP_ITEMS[0] : BASIC_BITS_SHOP_ITEMS[1];
              const invRes = addInventoryItem(nextInventory, {
                itemKey: dropTpl.itemKey,
                name: dropTpl.name,
                category: dropTpl.category,
                quantity: 1,
                description: dropTpl.description,
                hpRestore: dropTpl.hpRestore,
                dsRestore: dropTpl.dsRestore,
              });
              if (invRes.added) {
                nextInventory = invRes.next;
                droppedItemName = dropTpl.name;
              }
            }

            const nextAcc: AccountHudPersistence = {
              ...prevAcc,
              tamer: tamerRes.next,
              digimon: digiRes.next,
              bits: prevAcc.bits + bitsDrop,
              inventory: nextInventory,
              defeatedEnemiesTotal: prevAcc.defeatedEnemiesTotal + 1,
              updatedAt: new Date().toISOString(),
            };
            commitHudAccount(nextAcc);

            sim.floatingTexts.push({
              id: sim.nextFxId++,
              x: enemy.x,
              y: enemy.y - 60,
              text: `+${gainedDigimonExp} EXP · +${bitsDrop} Bits`,
              color: '#4ade80',
              elapsed: 0,
              duration: 1.15,
            });

            pushChatMessage(
              'system',
              `${enemy.name} derrotado! +${gainedDigimonExp} EXP (${formNow.name}) e +${bitsDrop} Bits.`,
              { tone: 'loot' }
            );
            if (droppedItemName) {
              pushChatMessage(
                'system',
                `Item obtido: ${droppedItemName} (armazenado no Inventário).`,
                { tone: 'loot' }
              );
            }
            if (tamerRes.leveledUp) {
              setLevelUpPulse(true);
              setTimeout(() => setLevelUpPulse(false), 1800);
              pushChatMessage(
                'system',
                `LEVEL UP! Tamer ${selection.tamerName} alcançou o Nível ${tamerRes.next.level}!`,
                { tone: 'level' }
              );
              pushNotification(
                'Tamer Subiu de Nível!',
                `${selection.tamerName} alcançou o Nível ${tamerRes.next.level}.`
              );
            }
            if (digiRes.leveledUp) {
              setDigimonLevelUpPulse(true);
              setTimeout(() => setDigimonLevelUpPulse(false), 1800);
              pushChatMessage(
                'system',
                `LEVEL UP! ${formNow.name} alcançou o Nível ${digiRes.next.level}!`,
                { tone: 'level' }
              );
              pushNotification(
                'Digimon Subiu de Nível!',
                `${formNow.name} alcançou o Nível ${digiRes.next.level}.`
              );
            }
            if (digiRes.newlyUnlockedForms.length > 0) {
              for (const unlocked of digiRes.newlyUnlockedForms) {
                playDigitalTone('confirm', soundEnabled);
                setEvolutionUnlockAlert(unlocked);
                pushChatMessage(
                  'system',
                  `EVOLUÇÃO DESBLOQUEADA! ${formNow.name} alcançou o Nível ${unlocked.unlockLevel} e está pronto para evoluir para ${unlocked.name}!`,
                  { tone: 'level' }
                );
                pushNotification(
                  'Evolução Desbloqueada!',
                  `${formNow.name} está pronto para evoluir para ${unlocked.name} (Nv. ${unlocked.unlockLevel}).`
                );
              }
            }
          }
        },
      });

      // Update VFX & floating damage timers
      if (sim.evoFlashTimer > 0) {
        sim.evoFlashTimer = Math.max(0, sim.evoFlashTimer - dt);
      }
      if (sim.skillBannerTimer > 0) {
        sim.skillBannerTimer = Math.max(0, sim.skillBannerTimer - dt);
        if (sim.skillBannerTimer === 0) sim.activeSkillBanner = null;
      }
      sim.combatEffects = sim.combatEffects.filter((fx) => {
        fx.elapsed += dt;
        return fx.elapsed < fx.duration;
      });
      sim.floatingTexts = sim.floatingTexts.filter((ft) => {
        ft.elapsed += dt;
        ft.y -= dt * 28;
        return ft.elapsed < ft.duration;
      });

      // 3. Detect proximity to interaction points, Return Portal & Exploration Zones
      let closestPt: DatsInteractionPoint | null = null;
      if (!isCombatMap) {
        let closestDist = Infinity;
        for (const pt of DATS_INTERACTION_POINTS) {
          const d = Math.hypot(sim.x - pt.x, sim.y - pt.y);
          if (d <= pt.radius && d < closestDist) {
            closestDist = d;
            closestPt = pt;
          }
        }
        sim.nearbyPointId = closestPt?.id ?? null;
        sim.nearReturnPortal = false;

        if (closestPt && !sim.discoveredZones.has(closestPt.id)) {
          sim.discoveredZones.add(closestPt.id);
          sim.lastSaveTs = now;
          persistProgress();
          pushNotification('Ponto DATS Descoberto', closestPt.title);
          pushChatMessage('system', `Ponto descoberto: ${closestPt.title}.`, {
            tone: 'info',
          });
        }

        if (
          pendingIncubatorWalkRef.current &&
          closestPt?.id === DATS_INCUBATOR_STATION.id &&
          !overlayLayerRef.current.hud
        ) {
          pendingIncubatorWalkRef.current = false;
          sim.tapTarget = null;
          sim.keyOrder = [];
          setActiveStationModal(null);
          setActiveHudWindow('incubator');
          playDigitalTone('confirm', soundEnabled);
        }
      } else {
        const activeReturnPortal = isDataForest
          ? DATA_FOREST_RETURN_PORTAL
          : HUNTING_RETURN_PORTAL;
        const activeInteractionPts = isDataForest
          ? DATA_FOREST_INTERACTION_POINTS
          : HUNTING_INTERACTION_POINTS;

        sim.nearReturnPortal =
          Math.hypot(sim.x - activeReturnPortal.x, sim.y - activeReturnPortal.y) <=
          activeReturnPortal.radius;

        let closestDist = Infinity;
        for (const pt of activeInteractionPts) {
          const d = Math.hypot(sim.x - pt.x, sim.y - pt.y);
          if (d <= pt.radius && d < closestDist) {
            closestDist = d;
            closestPt = pt;
          }
        }
        sim.nearbyPointId = sim.nearReturnPortal ? null : (closestPt?.id ?? null);

        const activeZone = isDataForest
          ? getDataForestZoneAtPoint(sim.x, sim.y)
          : getHuntingZoneAtPoint(sim.x, sim.y);
        if (activeZone && !sim.discoveredZones.has(activeZone.id)) {
          sim.discoveredZones.add(activeZone.id);
          sim.lastSaveTs = now;
          persistProgress();
          pushNotification('Região Explorada', `${activeZone.name} — ${activeZone.subtitle}`);
          pushChatMessage(
            'system',
            `Região descoberta em ${getMapDisplayLabel(sim.mapId)}: ${activeZone.name}.`,
            { tone: 'info' }
          );
        }
      }

      if (moveDir && now - sim.lastSaveTs > 1400) {
        sim.lastSaveTs = now;
        persistProgress();
      }

      // 4. Smooth Camera clamped cleanly inside active map (mobile-first responsive zoom on Combat Maps)
      const cameraZoom = getWorldCameraZoom(viewW, isCombatMap);
      const effViewW = viewW / cameraZoom;
      const effViewH = viewH / cameraZoom;
      const halfW = effViewW / 2;
      const halfH = effViewH / 2;
      const isPortraitMobile = viewW < 640 && viewH > viewW;
      const cameraVerticalBias = isPortraitMobile ? 76 : 52;
      const focusX = isEvolving ? sim.partner.x : sim.x;
      const focusY = isEvolving ? sim.partner.y - 24 : sim.y - cameraVerticalBias;
      const targetCamX =
        effViewW >= worldW
          ? worldW / 2
          : Math.max(halfW, Math.min(worldW - halfW, focusX));
      const targetCamY =
        effViewH >= worldH
          ? worldH / 2
          : Math.max(halfH, Math.min(worldH - halfH, focusY));

      const camLerp = Math.min(1, dt * (isEvolving ? 11 : 8));
      sim.camX += (targetCamX - sim.camX) * camLerp;
      sim.camY += (targetCamY - sim.camY) * camLerp;

      // 5. Render Active Map + Depth-Sorted Props, Enemies, Tamer & Partner Digimon
      ctx!.clearRect(0, 0, viewW, viewH);
      ctx!.save();
      ctx!.translate(viewW / 2, viewH / 2);
      if (cameraZoom !== 1) {
        ctx!.scale(cameraZoom, cameraZoom);
      }
      ctx!.translate(-sim.camX, -sim.camY);

      if (isDataForest) {
        ctx!.drawImage(dataForestGroundCanvas, 0, 0);
        drawDataForestGroundAnimations(
          ctx!,
          elapsed,
          sim.nearReturnPortal,
          worldBossRef.current?.alive ?? true
        );
      } else if (isHunting) {
        ctx!.drawImage(huntingGroundCanvas, 0, 0);
        drawHuntingGroundAnimations(ctx!, elapsed, sim.nearReturnPortal);
      } else {
        ctx!.drawImage(datsGroundCanvas, 0, 0);
        drawDatsGroundAnimations(ctx!, elapsed, sim.nearbyPointId);
      }

      if (sim.tapTarget) {
        const pulse = 1 + Math.sin(elapsed * 9) * 0.18;
        ctx!.save();
        ctx!.strokeStyle = '#38e8ff';
        ctx!.lineWidth = 2.5;
        ctx!.beginPath();
        ctx!.arc(sim.tapTarget.x, sim.tapTarget.y, 14 * pulse, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.fillStyle = 'rgba(56, 232, 255, 0.24)';
        ctx!.fill();
        ctx!.restore();
      }

      const drawables: Array<{ sortY: number; draw: () => void }> = [];
      const activeProps = isDataForest
        ? dataForestDepthProps
        : isHunting
          ? huntingDepthProps
          : datsDepthProps;

      for (const prop of activeProps) {
        drawables.push({
          sortY: prop.sortY,
          draw: () => prop.draw(ctx!, elapsed),
        });
      }

      if (isCombatMap) {
        // Frustum-cull wild Digimon outside the active camera viewport for locked 60fps on mobile
        const cullMargin = 220;
        const camMinX = sim.camX - halfW - cullMargin;
        const camMaxX = sim.camX + halfW + cullMargin;
        const camMinY = sim.camY - halfH - cullMargin;
        const camMaxY = sim.camY + halfH + cullMargin;

        for (const enemy of sim.enemies) {
          if (!enemy.alive) continue;
          if (
            enemy.x < camMinX ||
            enemy.x > camMaxX ||
            enemy.y < camMinY ||
            enemy.y > camMaxY
          ) {
            continue;
          }
          const targeted = sim.partner.targetEnemyId === enemy.id;
          drawables.push({
            sortY: enemy.y,
            draw: () => drawEnemyMonster(ctx!, enemy, elapsed, targeted),
          });
        }
      } else {
        // Fixed Official DATS NPC: Richard Sampson at Main Entrance
        drawables.push({
          sortY: RICHARD_SAMPSON_NPC.y,
          draw: () => {
            const isNearNpc =
              Math.hypot(
                sim.x - RICHARD_SAMPSON_NPC.x,
                sim.y - RICHARD_SAMPSON_NPC.y
              ) <= 95;
            drawFixedWorldNpc(ctx!, RICHARD_SAMPSON_NPC, elapsed, {
              hovered: hoveredNpcIdRef.current === RICHARD_SAMPSON_NPC.id,
              nearby: isNearNpc,
            });
          },
        });
      }

      // Player Tamer (with subtle 2.5D depth scaling on Combat Maps)
      drawables.push({
        sortY: sim.y,
        draw: () => {
          const pScale = getMapPerspectiveScale(sim.mapId, sim.y);
          ctx!.save();
          if (pScale !== 1) {
            ctx!.translate(sim.x, sim.y);
            ctx!.scale(pScale, pScale);
            ctx!.translate(-sim.x, -sim.y);
          }

          ctx!.save();
          ctx!.fillStyle = 'rgba(0, 0, 0, 0.38)';
          ctx!.beginPath();
          ctx!.ellipse(sim.x, sim.y + 2, 21, 7, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();

          const drew = drawTamerMovementFrame(
            ctx!,
            selection.characterId,
            sim.state,
            sim.dir,
            sim.frameIndex,
            elapsed,
            sim.x,
            sim.y
          );

          if (!drew) {
            ctx!.save();
            ctx!.strokeStyle = character.theme.accentHex;
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            ctx!.arc(sim.x, sim.y - 36, 14, elapsed * 4, elapsed * 4 + Math.PI * 1.4);
            ctx!.stroke();
            ctx!.restore();
          }

          ctx!.save();
          ctx!.font = '700 12px "Exo 2", sans-serif';
          ctx!.textAlign = 'center';
          const tagY = sim.y - 94;
          const localTagText = isGM
            ? `★ GM ${selection.tamerName}`
            : selection.tamerName;
          const tw = ctx!.measureText(localTagText).width + 14;
          ctx!.fillStyle = 'rgba(4, 17, 46, 0.88)';
          ctx!.beginPath();
          ctx!.roundRect(sim.x - tw / 2, tagY - 14, tw, 18, 6);
          ctx!.fill();
          ctx!.strokeStyle = isGM ? '#facc15' : character.theme.accentHex;
          ctx!.lineWidth = isGM ? 1.4 : 1;
          ctx!.stroke();
          ctx!.fillStyle = isGM ? '#fef08a' : '#ffffff';
          ctx!.fillText(localTagText, sim.x, tagY - 1);
          ctx!.restore();

          // Local overhead chat bubble
          if (localBubbleRef.current && Date.now() < localBubbleRef.current.expiresAt) {
            drawSpeechBubble(
              ctx!,
              sim.x,
              tagY - 16,
              localBubbleRef.current.text,
              isGM ? '#facc15' : character.theme.accentHex
            );
          }

          ctx!.restore();
        },
      });

      // Other Live Online Players & Their Partner Digimons on the SAME Map
      const nowFrameMs = Date.now();
      const lerpAlpha = Math.min(1, dt * 8.5);
      for (const smooth of remoteSmoothRef.current.values()) {
        const rp = smooth.player;
        if (rp.mapId !== sim.mapId) continue;

        // Smoothly interpolate position (snap if teleported > 360px)
        const tDx = rp.worldX - smooth.renderX;
        const tDy = rp.worldY - smooth.renderY;
        const tDist = Math.hypot(tDx, tDy);
        if (tDist > 360) {
          smooth.renderX = rp.worldX;
          smooth.renderY = rp.worldY;
        } else {
          smooth.renderX += tDx * lerpAlpha;
          smooth.renderY += tDy * lerpAlpha;
        }

        const pDx = rp.partnerX - smooth.partnerRenderX;
        const pDy = rp.partnerY - smooth.partnerRenderY;
        if (Math.hypot(pDx, pDy) > 360) {
          smooth.partnerRenderX = rp.partnerX;
          smooth.partnerRenderY = rp.partnerY;
        } else {
          smooth.partnerRenderX += pDx * lerpAlpha;
          smooth.partnerRenderY += pDy * lerpAlpha;
        }

        const isRemoteWalking = rp.moveState === 'walk' || tDist > 6;
        if (isRemoteWalking) {
          smooth.frameTime += dt;
          if (smooth.frameTime >= 0.14) {
            smooth.frameTime = 0;
            smooth.frameIndex = (smooth.frameIndex + 1) % TAMER_FRAME_COUNT;
          }
        } else {
          smooth.frameTime = 0;
          smooth.frameIndex = 0;
        }

        const isRemotePartnerMoving = rp.partnerMoving || Math.hypot(pDx, pDy) > 6;
        if (isRemotePartnerMoving) {
          smooth.partnerFrameTime += dt;
          if (smooth.partnerFrameTime >= 0.14) {
            smooth.partnerFrameTime = 0;
            smooth.partnerFrameIndex =
              (smooth.partnerFrameIndex + 1) % DIGIMON_FRAME_COUNT;
          }
        } else {
          smooth.partnerFrameTime = 0;
          smooth.partnerFrameIndex = 0;
        }

        const rX = smooth.renderX;
        const rY = smooth.renderY;
        const rpX = smooth.partnerRenderX;
        const rpY = smooth.partnerRenderY;
        const rFrame = smooth.frameIndex;
        const rpFrame = smooth.partnerFrameIndex;
        const rCharMeta =
          TAMER_CHARACTERS.find((c) => c.id === rp.characterId) ??
          TAMER_CHARACTERS[0];
        const rForm = getDigimonFormProfile(rp.digimonFormId);
        const rDims = rForm.worldDimensions;
        const rBubbleText =
          smooth.bubbleText && nowFrameMs < smooth.bubbleExpiresAt
            ? smooth.bubbleText
            : '';

        // Remote Tamer Drawable
        drawables.push({
          sortY: rY,
          draw: () => {
            const pScale = getMapPerspectiveScale(sim.mapId, rY);
            ctx!.save();
            if (pScale !== 1) {
              ctx!.translate(rX, rY);
              ctx!.scale(pScale, pScale);
              ctx!.translate(-rX, -rY);
            }

            // Ground shadow + subtle online presence aura ring
            ctx!.save();
            ctx!.fillStyle = 'rgba(0, 0, 0, 0.36)';
            ctx!.beginPath();
            ctx!.ellipse(rX, rY + 2, 21, 7, 0, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.strokeStyle = rp.isGm
              ? 'rgba(250, 204, 21, 0.65)'
              : 'rgba(52, 211, 153, 0.55)';
            ctx!.lineWidth = 1.4;
            ctx!.beginPath();
            ctx!.ellipse(rX, rY + 2, 23, 8, 0, 0, Math.PI * 2);
            ctx!.stroke();
            ctx!.restore();

            const drew = drawTamerMovementFrame(
              ctx!,
              rp.characterId,
              isRemoteWalking ? 'walk' : 'idle',
              rp.facingDir,
              rFrame,
              elapsed,
              rX,
              rY
            );

            if (!drew) {
              ctx!.save();
              ctx!.fillStyle = rCharMeta.theme.accentHex;
              ctx!.beginPath();
              ctx!.arc(rX, rY - 36, 13, 0, Math.PI * 2);
              ctx!.fill();
              ctx!.restore();
            }

            // Remote Tamer Nameplate (with GM Crown or Level tag)
            ctx!.save();
            ctx!.font = '700 11.5px "Exo 2", sans-serif';
            ctx!.textAlign = 'center';
            const tagY = rY - 94;
            const label = rp.isGm
              ? `★ GM ${rp.tamerName}`
              : `${rp.tamerName} Lv.${rp.tamerLevel}`;
            const tw = ctx!.measureText(label).width + 14;
            ctx!.fillStyle = rp.isGm
              ? 'rgba(42, 22, 4, 0.92)'
              : 'rgba(4, 22, 44, 0.88)';
            ctx!.beginPath();
            ctx!.roundRect(rX - tw / 2, tagY - 14, tw, 18, 6);
            ctx!.fill();
            ctx!.strokeStyle = rp.isGm ? '#facc15' : '#34d399';
            ctx!.lineWidth = rp.isGm ? 1.5 : 1.1;
            ctx!.stroke();
            ctx!.fillStyle = rp.isGm ? '#fef08a' : '#d1fae5';
            ctx!.fillText(label, rX, tagY - 1);
            ctx!.restore();

            if (rBubbleText) {
              drawSpeechBubble(
                ctx!,
                rX,
                tagY - 16,
                rBubbleText,
                rp.isGm ? '#facc15' : '#34d399'
              );
            }

            ctx!.restore();
          },
        });

        // Remote Partner Digimon Drawable (exact canonical evolution height & width)
        drawables.push({
          sortY: rpY,
          draw: () => {
            const pScale = getMapPerspectiveScale(sim.mapId, rpY);
            ctx!.save();
            if (pScale !== 1) {
              ctx!.translate(rpX, rpY);
              ctx!.scale(pScale, pScale);
              ctx!.translate(-rpX, -rpY);
            }

            ctx!.save();
            ctx!.fillStyle = 'rgba(0, 0, 0, 0.34)';
            ctx!.beginPath();
            ctx!.ellipse(
              rpX,
              rpY + 2,
              rDims.shadowRx,
              rDims.shadowRy,
              0,
              0,
              Math.PI * 2
            );
            ctx!.fill();
            ctx!.restore();

            drawDigimonPartnerFrame(
              ctx!,
              rForm.id,
              isRemotePartnerMoving ? 'walk' : 'idle',
              rp.partnerDir,
              rpFrame,
              elapsed,
              rpX,
              rpY
            );

            ctx!.save();
            ctx!.font = '700 10px "Exo 2", sans-serif';
            ctx!.textAlign = 'center';
            const pTagY = rpY - rDims.nameplateOffsetY;
            const pName = `${rForm.name}`;
            const ptw = ctx!.measureText(pName).width + 10;
            ctx!.fillStyle = 'rgba(4, 17, 46, 0.84)';
            ctx!.beginPath();
            ctx!.roundRect(rpX - ptw / 2, pTagY - 12, ptw, 14, 5);
            ctx!.fill();
            ctx!.strokeStyle = rForm.theme.accentHex;
            ctx!.lineWidth = 0.9;
            ctx!.stroke();
            ctx!.fillStyle = rForm.theme.accentHex;
            ctx!.fillText(pName, rpX, pTagY - 1.5);
            ctx!.restore();

            ctx!.restore();
          },
        });
      }

      // Active Digimon Partner (uses current Evolution Form sprites, studied worldDimensions, 2.5D depth & FX)
      const renderForm = activeFormRef.current;
      const dims = renderForm.worldDimensions;
      drawables.push({
        sortY: sim.partner.y,
        draw: () => {
          const pScale = getMapPerspectiveScale(sim.mapId, sim.partner.y);
          ctx!.save();
          if (pScale !== 1) {
            ctx!.translate(sim.partner.x, sim.partner.y);
            ctx!.scale(pScale, pScale);
            ctx!.translate(-sim.partner.x, -sim.partner.y);
          }

          ctx!.save();
          ctx!.fillStyle = 'rgba(0, 0, 0, 0.36)';
          ctx!.beginPath();
          ctx!.ellipse(
            sim.partner.x,
            sim.partner.y + 2,
            dims.shadowRx,
            dims.shadowRy,
            0,
            0,
            Math.PI * 2
          );
          ctx!.fill();
          ctx!.restore();

          if (sim.evoFlashTimer > 0) {
            const flashAlpha = Math.min(1, sim.evoFlashTimer / 1.1);
            const ringScale = Math.max(1, dims.widthPx / 54);
            const ringR = Math.max(
              1,
              ((1.65 - sim.evoFlashTimer) * 44 + 22) * Math.min(1.55, ringScale)
            );
            ctx!.save();
            ctx!.globalAlpha = flashAlpha * 0.85;
            ctx!.strokeStyle = '#fde047';
            ctx!.lineWidth = 3;
            ctx!.beginPath();
            ctx!.ellipse(sim.partner.x, sim.partner.y - 4, ringR, ringR * 0.42, 0, 0, Math.PI * 2);
            ctx!.stroke();
            ctx!.strokeStyle = '#38e8ff';
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            ctx!.ellipse(
              sim.partner.x,
              sim.partner.y - 12,
              ringR * 0.72,
              ringR * 0.28,
              0,
              0,
              Math.PI * 2
            );
            ctx!.stroke();
            ctx!.restore();
          }

          if (sim.partner.activeAttack) {
            const prog =
              sim.partner.activeAttack.elapsed /
              Math.max(0.1, sim.partner.activeAttack.duration);
            drawDigimonAttackPoseFrame(
              ctx!,
              renderForm.id,
              sim.partner.activeAttack.kind,
              sim.partner.activeAttack.facingRight,
              prog,
              sim.partner.x,
              sim.partner.y
            );
          } else {
            drawDigimonPartnerFrame(
              ctx!,
              renderForm.id,
              sim.partner.isMoving ? 'walk' : 'idle',
              sim.partner.dir,
              sim.partner.frameIndex % DIGIMON_FRAME_COUNT,
              elapsed,
              sim.partner.x,
              sim.partner.y
            );
          }

          ctx!.save();
          ctx!.font = '700 10.5px "Exo 2", sans-serif';
          ctx!.textAlign = 'center';
          const pTagY = sim.partner.y - dims.nameplateOffsetY;
          const pName = renderForm.name;
          const ptw = ctx!.measureText(pName).width + 12;
          ctx!.fillStyle = 'rgba(4, 17, 46, 0.86)';
          ctx!.beginPath();
          ctx!.roundRect(sim.partner.x - ptw / 2, pTagY - 12, ptw, 15, 5);
          ctx!.fill();
          ctx!.strokeStyle = renderForm.theme.accentHex;
          ctx!.lineWidth = 1;
          ctx!.stroke();
          ctx!.fillStyle = renderForm.theme.accentHex;
          ctx!.fillText(pName, sim.partner.x, pTagY - 1);
          ctx!.restore();

          ctx!.restore();
        },
      });

      drawables.sort((a, b) => a.sortY - b.sortY);
      for (const item of drawables) {
        item.draw();
      }

      for (const fx of sim.combatEffects) {
        drawDigimonSpecialVfx(
          ctx!,
          renderForm.id,
          fx.kind,
          fx.attackerX,
          fx.attackerY,
          fx.targetX,
          fx.targetY,
          fx.elapsed / fx.duration,
          fx.id
        );
      }

      for (const ft of sim.floatingTexts) {
        const fade = Math.max(0, 1 - ft.elapsed / ft.duration);
        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.font = '800 12px "Exo 2", sans-serif';
        ctx!.textAlign = 'center';
        ctx!.strokeStyle = 'rgba(2, 6, 23, 0.92)';
        ctx!.lineWidth = 3;
        ctx!.strokeText(ft.text, ft.x, ft.y);
        ctx!.fillStyle = ft.color;
        ctx!.fillText(ft.text, ft.x, ft.y);
        ctx!.restore();
      }

      ctx!.restore();

      // Off-screen directional pointers for online players on the SAME map outside the camera viewport
      for (const smooth of remoteSmoothRef.current.values()) {
        const rp = smooth.player;
        if (rp.mapId !== sim.mapId) continue;
        const screenX = (smooth.renderX - sim.camX) * cameraZoom + viewW / 2;
        const screenY = (smooth.renderY - sim.camY) * cameraZoom + viewH / 2;
        const marginX = 36;
        const marginTop = 98;
        const marginBottom = 132;
        const isOffScreen =
          screenX < marginX ||
          screenX > viewW - marginX ||
          screenY < marginTop ||
          screenY > viewH - marginBottom;
        if (!isOffScreen) continue;

        const angle = Math.atan2(screenY - viewH / 2, screenX - viewW / 2);
        const clampedX = Math.max(54, Math.min(viewW - 54, screenX));
        const clampedY = Math.max(106, Math.min(viewH - 138, screenY));
        const distM = Math.max(1, Math.round(Math.hypot(smooth.renderX - sim.x, smooth.renderY - sim.y) / 10));
        const badgeText = `${rp.isGm ? '★ ' : ''}${rp.tamerName} (${distM}m)`;

        ctx!.save();
        ctx!.font = '800 10px "Exo 2", sans-serif';
        const bw = Math.min(138, ctx!.measureText(badgeText).width + 24);
        const bh = 20;
        const bx = Math.max(10, Math.min(viewW - bw - 10, clampedX - bw / 2));
        const by = Math.max(96, Math.min(viewH - 148, clampedY - bh / 2));

        ctx!.fillStyle = rp.isGm ? 'rgba(42, 22, 4, 0.92)' : 'rgba(4, 24, 52, 0.9)';
        ctx!.beginPath();
        ctx!.roundRect(bx, by, bw, bh, 10);
        ctx!.fill();
        ctx!.strokeStyle = rp.isGm ? '#facc15' : '#34d399';
        ctx!.lineWidth = 1.4;
        ctx!.stroke();

        // Small directional triangle indicator
        const arrowX = bx + 10;
        const arrowY = by + bh / 2;
        ctx!.save();
        ctx!.translate(arrowX, arrowY);
        ctx!.rotate(angle);
        ctx!.fillStyle = rp.isGm ? '#facc15' : '#34d399';
        ctx!.beginPath();
        ctx!.moveTo(4.5, 0);
        ctx!.lineTo(-3.5, -3.5);
        ctx!.lineTo(-3.5, 3.5);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();

        ctx!.fillStyle = rp.isGm ? '#fef08a' : '#d1fae5';
        ctx!.textAlign = 'left';
        ctx!.fillText(badgeText, bx + 18, by + 13.5, bw - 24);
        ctx!.restore();
      }

      // Sync React HUD Snapshot cleanly (~11Hz)
      hudTimer += dt;
      if (hudTimer >= 0.09) {
        hudTimer = 0;
        const activeTarget = sim.partner.targetEnemyId
          ? sim.enemies.find(
              (e) => e.id === sim.partner.targetEnemyId && e.alive && e.hp > 0
            ) ?? null
          : null;

        setLiveSnapshot({
          mapId: sim.mapId,
          tamerX: sim.x,
          tamerY: sim.y,
          tamerDir: sim.dir,
          tamerMoveState: sim.state,
          partnerX: sim.partner.x,
          partnerY: sim.partner.y,
          partnerState: sim.partner.aiState,
          inSafeZone,
          nearbyPointId: closestPt?.id ?? null,
          nearReturnPortal: sim.nearReturnPortal,
          discoveredZoneIds: Array.from(sim.discoveredZones),
          special1Cooldown: sim.partner.special1Cooldown,
          special1MaxCooldown: renderForm.special1CooldownSec,
          special2Cooldown: sim.partner.special2Cooldown,
          special2MaxCooldown: renderForm.special2CooldownSec,
          activeSkillBanner: sim.activeSkillBanner,
          targetEnemy: activeTarget
            ? {
                id: activeTarget.id,
                species: activeTarget.species,
                name: activeTarget.name,
                level: activeTarget.level,
                hp: activeTarget.hp,
                maxHp: activeTarget.maxHp,
                isBoss: activeTarget.isBoss,
                classification: getWildDigimonClassification(activeTarget.species),
              }
            : null,
          minimapEnemies: isCombatMap
            ? sim.enemies.map((e) => ({
                id: e.id,
                x: e.x,
                y: e.y,
                alive: e.alive,
                isBoss: e.isBoss,
              }))
            : [],
          minimapPlayers: Array.from(remoteSmoothRef.current.values())
            .filter((s) => s.player.mapId === sim.mapId)
            .map((s) => ({
              uid: s.player.uid,
              tamerName: s.player.tamerName,
              x: s.renderX,
              y: s.renderY,
              isGm: s.player.isGm,
            })),
        });

        // Throttled real-time multiplayer presence broadcast (delta + 15s keepalive heartbeat)
        const syncMeta = lastPresenceSyncRef.current;
        const nowMs = Date.now();
        const elapsedSinceSync = nowMs - syncMeta.sentAtMs;
        const movedDist = Math.hypot(sim.x - syncMeta.x, sim.y - syncMeta.y);
        const mapOrFormChanged =
          sim.mapId !== syncMeta.mapId ||
          renderForm.id !== syncMeta.formId ||
          hudAccountRef.current.tamer.level !== syncMeta.tamerLevel ||
          hudAccountRef.current.digimon.level !== syncMeta.digimonLevel;
        const stoppedMoving =
          syncMeta.state === 'walk' && sim.state === 'idle' && elapsedSinceSync >= 160;
        const movedEnough =
          (movedDist >= 12 || sim.dir !== syncMeta.dir || sim.state !== syncMeta.state) &&
          elapsedSinceSync >= 450;
        const heartbeatDue = elapsedSinceSync >= 15_000;

        if (
          !syncMeta.inFlight &&
          (mapOrFormChanged || stoppedMoving || movedEnough || heartbeatDue)
        ) {
          syncMeta.inFlight = true;
          syncMeta.x = sim.x;
          syncMeta.y = sim.y;
          syncMeta.dir = sim.dir;
          syncMeta.state = sim.state;
          syncMeta.mapId = sim.mapId;
          syncMeta.formId = renderForm.id;
          syncMeta.tamerLevel = hudAccountRef.current.tamer.level;
          syncMeta.digimonLevel = hudAccountRef.current.digimon.level;
          syncMeta.sentAtMs = nowMs;

          void publishLocalWorldPresence(buildLocalPresenceSnapshot()).finally(() => {
            syncMeta.inFlight = false;
          });
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      incubatorWorldRenderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selection.characterId,
    selection.tamerName,
    starterDigimon.digimonId,
    character.theme.accentHex,
    assetsReady,
  ]);

  function handleCanvasTap(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setActiveStationModal(null);
    const rect = canvas.getBoundingClientRect();
    const tapScreenX = e.clientX - rect.left;
    const tapScreenY = e.clientY - rect.top;
    const sim = simRef.current;
    const isDataForest = sim.mapId === DATA_FOREST_MAP_ID;
    const isCombat = isCombatWorldMap(sim.mapId);
    const { worldW, worldH, minY } = getMapDimensions(sim.mapId);

    const cameraZoom = getWorldCameraZoom(rect.width, isCombat);
    const worldX = (tapScreenX - rect.width / 2) / cameraZoom + sim.camX;
    const worldY = (tapScreenY - rect.height / 2) / cameraZoom + sim.camY;

    if (!isCombat && isPointInsideNpcHitbox(RICHARD_SAMPSON_NPC, worldX, worldY)) {
      pendingIncubatorWalkRef.current = false;
      sim.tapTarget = null;
      playDigitalTone('confirm', soundEnabled);
      setActiveNpcDialogue(RICHARD_SAMPSON_NPC);
      return;
    }

    if (
      !isCombat &&
      worldX >= 460 &&
      worldX <= 590 &&
      worldY >= 596 &&
      worldY <= 786
    ) {
      setSelectedRemotePlayer(null);
      setActiveNpcDialogue(null);
      if (sim.nearbyPointId === DATS_INCUBATOR_STATION.id) {
        openNearbyStation();
      } else {
        pendingIncubatorWalkRef.current = true;
        sim.tapTarget = {
          x: DATS_INCUBATOR_STATION.standX,
          y: DATS_INCUBATOR_STATION.standY,
        };
        playDigitalTone('click', soundEnabled);
      }
      return;
    }

    if (isCombat) {
      const activeFieldNpcs = isDataForest
        ? DATA_FOREST_FRIENDLY_NPCS
        : FRIENDLY_FIELD_NPCS;
      const hitFieldNpc = activeFieldNpcs.find(
        (npc) =>
          Math.abs(worldX - npc.x) <= 32 &&
          worldY >= npc.y - 82 &&
          worldY <= npc.y + 10
      );
      if (hitFieldNpc) {
        sim.tapTarget = null;
        playDigitalTone('confirm', soundEnabled);
        setActiveNpcDialogue(fieldNpcToDialogueModel(hitFieldNpc));
        return;
      }

      // Direct tap/click-to-target on an alive wild Digimon (generous hitbox for Raid Boss Kuwagamon)
      const tappedEnemy = sim.enemies.find((enemy) => {
        if (!enemy.alive) return false;
        if (enemy.isBoss) {
          return (
            Math.abs(worldX - enemy.x) <= 78 &&
            worldY >= enemy.y - 165 &&
            worldY <= enemy.y + 22
          );
        }
        return (
          Math.abs(worldX - enemy.x) <= 42 &&
          worldY >= enemy.y - 92 &&
          worldY <= enemy.y + 18
        );
      });
      if (tappedEnemy) {
        sim.partner.targetEnemyId = tappedEnemy.id;
        sim.partner.recoverFailCount = 0;
        if (!isPointInMapSafeZone(sim.mapId, sim.x, sim.y)) {
          sim.partner.aiState = 'CHASE';
        }
        const distToEnemy = Math.hypot(tappedEnemy.x - sim.x, tappedEnemy.y - sim.y);
        const engageRadius = tappedEnemy.isBoss ? 235 : 195;
        if (distToEnemy > engageRadius) {
          // Walk smoothly closer so partner engages right away
          sim.tapTarget = {
            x: Math.max(48, Math.min(worldW - 48, tappedEnemy.x)),
            y: Math.max(minY, Math.min(worldH - 48, tappedEnemy.y + (tappedEnemy.isBoss ? 72 : 0))),
          };
        } else {
          sim.tapTarget = null;
        }
        playDigitalTone('confirm', soundEnabled);
        return;
      }
    }

    // Check if the player tapped another online Tamer on this map
    for (const smooth of remoteSmoothRef.current.values()) {
      if (smooth.player.mapId !== sim.mapId) continue;
      if (
        Math.abs(worldX - smooth.renderX) <= 30 &&
        worldY >= smooth.renderY - 94 &&
        worldY <= smooth.renderY + 12
      ) {
        sim.tapTarget = null;
        setActiveNpcDialogue(null);
        playDigitalTone('confirm', soundEnabled);
        setSelectedRemotePlayer(smooth.player);
        return;
      }
    }

    pendingIncubatorWalkRef.current = false;
    setSelectedRemotePlayer(null);
    setActiveNpcDialogue(null);
    sim.tapTarget = {
      x: Math.max(48, Math.min(worldW - 48, worldX)),
      y: Math.max(minY, Math.min(worldH - 48, worldY)),
    };
    playDigitalTone('click', soundEnabled);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = simRef.current;
    const rect = canvas.getBoundingClientRect();
    const cameraZoom = getWorldCameraZoom(
      rect.width,
      isCombatWorldMap(sim.mapId)
    );
    const worldX = (e.clientX - rect.left - rect.width / 2) / cameraZoom + sim.camX;
    const worldY = (e.clientY - rect.top - rect.height / 2) / cameraZoom + sim.camY;

    let nextHover: string | null = null;
    if (sim.mapId === DATS_MAP_ID) {
      if (isPointInsideNpcHitbox(RICHARD_SAMPSON_NPC, worldX, worldY)) {
        nextHover = RICHARD_SAMPSON_NPC.id;
      } else if (
        worldX >= 460 &&
        worldX <= 590 &&
        worldY >= 596 &&
        worldY <= 786
      ) {
        nextHover = DATS_INCUBATOR_STATION.id;
      }
    } else if (isCombatWorldMap(sim.mapId)) {
      const activeFieldNpcs =
        sim.mapId === DATA_FOREST_MAP_ID
          ? DATA_FOREST_FRIENDLY_NPCS
          : FRIENDLY_FIELD_NPCS;
      const hitFieldNpc = activeFieldNpcs.find(
        (npc) =>
          Math.abs(worldX - npc.x) <= 32 &&
          worldY >= npc.y - 82 &&
          worldY <= npc.y + 10
      );
      nextHover = hitFieldNpc?.id ?? null;
    }

    if (hoveredNpcIdRef.current !== nextHover) {
      hoveredNpcIdRef.current = nextHover;
      setHoveredNpcId(nextHover);
    }
  }

  function updateJoystick(clientX: number, clientY: number) {
    pendingIncubatorWalkRef.current = false;
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;
    const mag = maxR > 0 ? clamped / maxR : 0;

    simRef.current.joyVx = mag > 0.18 ? Math.cos(angle) : 0;
    simRef.current.joyVy = mag > 0.18 ? Math.sin(angle) : 0;
    simRef.current.joyMag = mag;

    setJoystickKnob({ x: knobX, y: knobY, active: true });
  }

  function resetJoystick() {
    simRef.current.joyVx = 0;
    simRef.current.joyVy = 0;
    simRef.current.joyMag = 0;
    setJoystickKnob({ x: 0, y: 0, active: false });
  }

  function handleUseInventoryItem(item: InventoryItem) {
    const cur = hudAccountRef.current;
    const idx = cur.inventory.findIndex((i) => i.id === item.id);
    if (idx < 0) return;

    const activeName = activeFormRef.current.name;
    let nextHp = cur.digimon.hp;
    let nextDs = cur.digimon.ds;
    if (item.hpRestore) {
      if (nextHp >= cur.digimon.maxHp) {
        pushChatMessage('system', `${activeName} já está com HP máximo.`, {
          tone: 'info',
        });
        return;
      }
      nextHp = Math.min(cur.digimon.maxHp, nextHp + item.hpRestore);
    }
    if (item.dsRestore) {
      if (nextDs >= cur.digimon.maxDs) {
        pushChatMessage('system', `${activeName} já está com DS máximo.`, {
          tone: 'info',
        });
        return;
      }
      nextDs = Math.min(cur.digimon.maxDs, nextDs + item.dsRestore);
    }

    const updatedInv = [...cur.inventory];
    if (updatedInv[idx].quantity > 1) {
      updatedInv[idx] = {
        ...updatedInv[idx],
        quantity: updatedInv[idx].quantity - 1,
      };
    } else {
      updatedInv.splice(idx, 1);
    }

    commitHudAccount({
      ...cur,
      digimon: { ...cur.digimon, hp: nextHp, ds: nextDs },
      inventory: updatedInv,
    });
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage('system', `Usou ${item.name} em ${activeName}.`, {
      tone: 'loot',
    });
  }

  function handleDiscardInventoryItem(item: InventoryItem) {
    const cur = hudAccountRef.current;
    const idx = cur.inventory.findIndex((i) => i.id === item.id);
    if (idx < 0) return;

    const updatedInv = [...cur.inventory];
    if (updatedInv[idx].quantity > 1) {
      updatedInv[idx] = {
        ...updatedInv[idx],
        quantity: updatedInv[idx].quantity - 1,
      };
    } else {
      updatedInv.splice(idx, 1);
    }
    commitHudAccount({ ...cur, inventory: updatedInv });
    playDigitalTone('click', soundEnabled);
  }

  function handleEquipInventoryItem(item: InventoryItem) {
    const res = equipInventoryItem(hudAccountRef.current, item.id);
    if (res.error || !res.equippedItem) {
      playDigitalTone('error', soundEnabled);
      if (res.error) {
        pushChatMessage('system', res.error, { tone: 'warning' });
      }
      return;
    }
    commitHudAccount(res.next);
    playDigitalTone('confirm', soundEnabled);
    const slotLabel = res.equippedItem.equipSlot
      ? EQUIPMENT_SLOT_LABELS[res.equippedItem.equipSlot]
      : 'Equipamento';
    pushChatMessage(
      'system',
      `Equipado: ${res.equippedItem.name} (${slotLabel}). Atributos atualizados.`,
      { tone: 'loot' }
    );
  }

  function handleUnequipSlot(slot: EquipmentSlotId) {
    const res = unequipSlotItem(hudAccountRef.current, slot);
    if (res.error) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage('system', res.error, { tone: 'warning' });
      return;
    }
    if (!res.unequippedItem) return;
    commitHudAccount(res.next);
    playDigitalTone('click', soundEnabled);
    pushChatMessage(
      'system',
      `Removido: ${res.unequippedItem.name} devolvido ao Inventário.`,
      { tone: 'info' }
    );
  }

  function handleBuyShopItem(itemKey: string) {
    const tpl = BASIC_BITS_SHOP_ITEMS.find((b) => b.itemKey === itemKey);
    if (!tpl) return;
    const cur = hudAccountRef.current;
    if (cur.bits < tpl.priceBits) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage('system', 'Bits insuficientes para esta compra.', {
        tone: 'warning',
      });
      return;
    }

    const res = addInventoryItem(cur.inventory, {
      itemKey: tpl.itemKey,
      name: tpl.name,
      category: tpl.category,
      quantity: 1,
      description: tpl.description,
      hpRestore: tpl.hpRestore,
      dsRestore: tpl.dsRestore,
      equipSlot: tpl.equipSlot,
      statBonuses: tpl.statBonuses,
    });

    if (!res.added) {
      playDigitalTone('error', soundEnabled);
      pushChatMessage('system', 'Inventário cheio (24/24 slots).', {
        tone: 'warning',
      });
      return;
    }

    commitHudAccount({
      ...cur,
      bits: cur.bits - tpl.priceBits,
      inventory: res.next,
    });
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage('system', `Comprou ${tpl.name} por ${tpl.priceBits} Bits.`, {
      tone: 'loot',
    });
  }

  function handleExecuteEggHatch(eggItemId: string) {
    const res = executeDigiEggHatch(hudAccountRef.current, eggItemId);
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }
    commitHudAccount(res.next);
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage('system', res.message, { tone: 'loot' });
    pushNotification('Incubadora de Digimon', res.message);
    return {
      ok: true,
      message: res.message,
      hatchedSpecies: res.hatchedSpecies,
    };
  }

  function handleExecuteEggReinforce(
    eggItemId: string,
    materialItemId: string | null
  ) {
    const res = executeEggReinforce(
      hudAccountRef.current,
      eggItemId,
      materialItemId
    );
    if (!res.ok) {
      playDigitalTone('error', soundEnabled);
      return { ok: false, message: res.message };
    }
    commitHudAccount(res.next);
    playDigitalTone('confirm', soundEnabled);
    pushChatMessage('system', res.message, { tone: 'loot' });
    return {
      ok: true,
      message: res.message,
      newReinforceLevel: res.newReinforceLevel,
    };
  }

  function handleOpenHudWindow(win: Exclude<HudWindowId, null>) {
    if (win === 'admin' && !isGM) return;
    playDigitalTone('click', soundEnabled);
    if (win === 'notifications') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setActiveHudWindow((curr) => (curr === win ? null : win));
  }

  const nearbyPoint = liveSnapshot.nearbyPointId
    ? (liveSnapshot.mapId === DATA_FOREST_MAP_ID
        ? DATA_FOREST_INTERACTION_POINTS
        : liveSnapshot.mapId === HUNTING_MAP_ID
          ? HUNTING_INTERACTION_POINTS
          : DATS_INTERACTION_POINTS
      ).find((p) => p.id === liveSnapshot.nearbyPointId) ?? null
    : null;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const canEnterDataForest =
    isGM || hudAccount.tamer.level >= 10 || hudAccount.digimon.level >= 10;

  return (
    <section
      aria-label={
        liveSnapshot.mapId === DATA_FOREST_MAP_ID
          ? 'Floresta de Dados — Área de Caça e Raid Boss'
          : liveSnapshot.mapId === HUNTING_MAP_ID
            ? 'Planície Digital — Área de Caça'
            : 'DATS Center — Praça Inicial'
      }
      className="relative h-dvh w-full overflow-hidden bg-[#030b1f]"
    >
      {/* Fullscreen World Canvas 2D Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasTap}
        onPointerMove={handleCanvasPointerMove}
        onPointerLeave={() => {
          if (hoveredNpcIdRef.current !== null) {
            hoveredNpcIdRef.current = null;
            setHoveredNpcId(null);
          }
        }}
        className={`block h-full w-full touch-none ${
          hoveredNpcId ? 'cursor-pointer' : 'cursor-crosshair'
        }`}
      />

      {/* TOP HUD LAYER (Mobile: Left Tamer+Digimon | Right Minimap; Desktop sm+: Left Tamer | Center Digimon+Target | Right Minimap) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-1.5 p-1.5 sm:gap-2 sm:p-3">
        {/* Top-Left Column */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:gap-2">
          <TamerHudPanel
            character={character}
            tamerName={selection.tamerName}
            stats={hudAccount.tamer}
            inSafeZone={liveSnapshot.inSafeZone}
            isCombatMap={isCombatWorldMap(liveSnapshot.mapId)}
            levelUpPulse={levelUpPulse}
            onOpenCharacter={() => handleOpenHudWindow('character')}
          />

          {/* Mobile (<640px): Active Digimon stacked cleanly above switcher so zero overlap */}
          <div className="sm:hidden">
            <ActiveDigimonHudPanel
              digimon={activeFormProfile}
              stats={hudAccount.digimon}
              partnerState={liveSnapshot.partnerState}
              activeSkillBanner={liveSnapshot.activeSkillBanner}
              levelUpPulse={digimonLevelUpPulse}
              snapshot={liveSnapshot}
              onTriggerSkill={handleTriggerManualSkill}
              onOpenDigimon={() => handleOpenHudWindow('digimon')}
            />
          </div>

          <DigimonSwitcherList
            activeDigimon={activeFormProfile}
            stats={hudAccount.digimon}
            onSelectActiveDigimon={() => handleOpenHudWindow('digimon')}
            onSelectEmptySlot={(slotNum) => {
              playDigitalTone('click', soundEnabled);
              pushChatMessage(
                'system',
                `Slot ${slotNum} vazio: atualmente você possui apenas seu parceiro inicial ${activeFormProfile.name}.`,
                { tone: 'info' }
              );
            }}
          />
        </div>

        {/* Top-Center Active Digimon + Battle Target (Desktop sm+ only; hidden on mobile so Minimap sits cleanly beside Tamer & Digimon) */}
        <div className="hidden flex-col items-center gap-1.5 sm:flex">
          <div>
            <ActiveDigimonHudPanel
              digimon={activeFormProfile}
              stats={hudAccount.digimon}
              partnerState={liveSnapshot.partnerState}
              activeSkillBanner={liveSnapshot.activeSkillBanner}
              levelUpPulse={digimonLevelUpPulse}
              snapshot={liveSnapshot}
              onTriggerSkill={handleTriggerManualSkill}
              onOpenDigimon={() => handleOpenHudWindow('digimon')}
            />
          </div>

          {liveSnapshot.targetEnemy && (() => {
            const targetPortraitUrl = getWildDigimonPortraitUrl(
              liveSnapshot.targetEnemy.species
            );
            const isBossTarget = Boolean(liveSnapshot.targetEnemy.isBoss);
            return (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={`Alvo em batalha: ${liveSnapshot.targetEnemy.name}`}
                className={`pointer-events-auto flex w-[198px] items-center gap-2 rounded-xl border px-2 py-1.5 backdrop-blur-xs select-none sm:w-[264px] sm:px-2.5 ${
                  isBossTarget
                    ? 'border-amber-300/90 bg-[#1a0714]/94 shadow-[0_0_24px_rgba(239,68,68,0.6)]'
                    : 'border-rose-400/75 bg-[#0a0b24]/92 shadow-[0_0_18px_rgba(244,63,94,0.42)]'
                }`}
              >
                {targetPortraitUrl && (
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 sm:h-11 sm:w-11 ${
                      isBossTarget
                        ? 'border-amber-300/75 bg-gradient-to-b from-[#450a0a] to-[#120408]'
                        : 'border-rose-400/55 bg-gradient-to-b from-[#1e1038] to-[#08071a]'
                    }`}
                  >
                    <img
                      src={targetPortraitUrl}
                      alt={liveSnapshot.targetEnemy.name}
                      className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`flex min-w-0 items-center gap-1 truncate text-[10px] font-black tracking-wide sm:text-[11px] ${
                        isBossTarget ? 'text-amber-200' : 'text-rose-200'
                      }`}
                    >
                      {isBossTarget && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-300" />
                      )}
                      <span className="truncate">
                        {isBossTarget
                          ? `BOSS · ${liveSnapshot.targetEnemy.name}`
                          : liveSnapshot.targetEnemy.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-[9.5px] font-black tabular-nums text-amber-300">
                      Lv.{liveSnapshot.targetEnemy.level}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full border border-rose-400/40 bg-[#020612]">
                    <div
                      className="dmo-hp-fill h-full transition-[width] duration-150"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (liveSnapshot.targetEnemy.hp /
                              Math.max(1, liveSnapshot.targetEnemy.maxHp)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <DigimonClassificationBadges
                      classification={liveSnapshot.targetEnemy.classification}
                      variant="target"
                    />
                    <span className="shrink-0 text-[8.5px] font-bold tabular-nums text-rose-100/90">
                      {Math.max(0, Math.round(liveSnapshot.targetEnemy.hp)).toLocaleString('pt-BR')}/
                      {liveSnapshot.targetEnemy.maxHp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Top-Right Minimap + Boss Portrait & Damage Ranking directly below */}
        <div className="flex flex-col items-end gap-1.5">
          <MinimapHudPanel
            snapshot={liveSnapshot}
            onOpenFullMap={() => handleOpenHudWindow('map')}
          />
          {worldBossState && worldBossState.mapId === liveSnapshot.mapId && (
            <WorldBossHudCard
              bossState={worldBossState}
              bossNowMs={bossNowMs}
              currentMapId={liveSnapshot.mapId}
              localTamerName={selection.tamerName}
              rankingDismissed={bossRankingDismissed}
              onDismissRanking={() => setBossRankingDismissed(true)}
              onNavigateToBoss={() => {
                playDigitalTone('click', soundEnabled);
                if (liveSnapshot.mapId === DATA_FOREST_MAP_ID) {
                  simRef.current.tapTarget = {
                    x: DATA_FOREST_BOSS_ARENA.x,
                    y: DATA_FOREST_BOSS_ARENA.y + 84,
                  };
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Global Raid Boss Spawn / Defeat Screen Announcement */}
      {bossAnnouncement && (
        <WorldBossGlobalBanner
          announcement={bossAnnouncement}
          inDataForest={liveSnapshot.mapId === DATA_FOREST_MAP_ID}
          onGoToTree={() => {
            simRef.current.tapTarget = {
              x: DATA_FOREST_BOSS_ARENA.x,
              y: DATA_FOREST_BOSS_ARENA.y + 84,
            };
            playDigitalTone('click', soundEnabled);
          }}
          onClose={() => setBossAnnouncement(null)}
        />
      )}

      {/* Selected Online Player Inspector Card */}
      {selectedRemotePlayer && (
        <RemotePlayerInspectorCard
          player={selectedRemotePlayer}
          onMeetPlayer={handleMeetPlayer}
          onWaveHello={(targetName) => {
            const greeting = `Olá, ${targetName}! Bora explorar juntos!`;
            localBubbleRef.current = {
              text: greeting,
              expiresAt: Date.now() + 5500,
            };
            pushChatMessage('all', greeting, {
              sender: selection.tamerName,
              isGmSender: isGM,
            });
            void broadcastWorldChatBubble(greeting, buildLocalPresenceSnapshot());
          }}
          onClose={() => setSelectedRemotePlayer(null)}
        />
      )}

      {/* Special Ready-to-Evolve Announcement Banner when hitting Lv. 15 / 30 / 50 */}
      {evolutionUnlockAlert && !evolutionCinematic && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          role="status"
          className="animate-dmo-window pointer-events-auto absolute left-1/2 top-[174px] z-35 flex w-[min(92vw,370px)] -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-[#051844]/96 px-3 py-2 shadow-[0_0_28px_rgba(251,191,36,0.68)] backdrop-blur-sm sm:top-[132px]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={evolutionUnlockAlert.portraitUrl}
              alt={evolutionUnlockAlert.name}
              className="h-9 w-9 shrink-0 rounded-full border border-amber-300/70 bg-[#082463] object-contain p-0.5"
            />
            <div className="min-w-0">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-amber-300">
                Evolução Pronta! · Nv.{evolutionUnlockAlert.unlockLevel}
              </p>
              <p className="truncate text-[11px] font-extrabold text-white">
                Evoluir para{' '}
                <span style={{ color: evolutionUnlockAlert.theme.accentHex }}>
                  {evolutionUnlockAlert.name}
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => handleTriggerEvolution(evolutionUnlockAlert)}
              className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950 shadow hover:brightness-110 active:scale-95"
            >
              Evoluir
            </button>
            <button
              type="button"
              onClick={() => setEvolutionUnlockAlert(null)}
              aria-label="Dispensar aviso de evolução"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/35 bg-[#072154] text-cyan-200 hover:bg-sky-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Right-Side DMO Inventory Window (opens cleanly above Bottom-Right MENU button) */}
      {inventoryOpen && (
        <div className="pointer-events-none absolute bottom-[64px] right-2 z-30 sm:bottom-[72px] sm:right-4">
          <InventoryHudWindow
            open={inventoryOpen}
            items={hudAccount.inventory}
            bits={hudAccount.bits}
            dCoin={hudAccount.dCoin}
            onClose={() => setInventoryOpen(false)}
            onUseItem={handleUseInventoryItem}
            onEquipItem={handleEquipInventoryItem}
            onDiscardItem={handleDiscardInventoryItem}
          />
        </div>
      )}

      {/* Proximity Interaction Button (Portal or DATS NPC) */}
      {(nearbyPoint || liveSnapshot.nearReturnPortal) && !activeStationModal && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-[68px] right-2.5 z-25 sm:bottom-[80px] sm:right-4"
        >
          <button
            type="button"
            onClick={openNearbyStation}
            className="flex min-h-[46px] max-w-[205px] items-center gap-2 rounded-xl border-2 border-amber-200 bg-[#061c4a]/95 px-3 py-2 text-left shadow-[0_0_22px_rgba(56,232,255,0.45)] transition-transform active:scale-95"
          >
            {liveSnapshot.nearReturnPortal ? (
              <Shield className="h-4 w-4 text-cyan-300" />
            ) : (
              renderInteractionIcon(nearbyPoint!.kind)
            )}
            <div className="min-w-0">
              <p className="truncate text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
                {liveSnapshot.nearReturnPortal ? 'Portal [E]' : 'Interagir [E]'}
              </p>
              <p className="truncate text-xs font-extrabold text-white">
                {liveSnapshot.nearReturnPortal
                  ? 'Voltar ao DATS'
                  : nearbyPoint!.badge}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* LOWER HUD LAYER: Bottom-Left Chat + Mobile Joystick */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-25 flex items-end justify-between gap-2 px-2 sm:bottom-3.5 sm:px-4">
        {/* Bottom-Left Corner: Chat stacked cleanly ABOVE Mobile Virtual Joystick */}
        <div className="flex flex-col items-start gap-2">
          <ChatHudPanel
            messages={chatMessages}
            activeChannel={chatChannel}
            onChangeChannel={setChatChannel}
            onSendMessage={(text) => {
              const targetChannel: ChatChannel =
                chatChannel === 'system' ? 'all' : chatChannel;
              pushChatMessage(targetChannel, text, {
                sender: selection.tamerName,
                isGmSender: isGM,
              });
              // Show live speech bubble above local Tamer and broadcast to all online players in real time
              localBubbleRef.current = {
                text,
                expiresAt: Date.now() + 5500,
              };
              void broadcastWorldChatBubble(text, buildLocalPresenceSnapshot());
            }}
            onChatFocusChange={(focused) => {
              isChatFocusedRef.current = focused;
            }}
          />

          {/* Mobile Touch Virtual Joystick (bottom-left corner directly under Chat) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto md:hidden"
          >
            <div
              ref={joystickBaseRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!joystickKnob.active) return;
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerUp={resetJoystick}
              onPointerCancel={resetJoystick}
              aria-label="Controle virtual de 4 direções"
              className="relative flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 border-cyan-400/60 bg-[#041232]/82 shadow-[0_0_18px_rgba(0,180,255,0.32)]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-14 w-[1px] bg-cyan-300/25"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-[1px] w-14 bg-cyan-300/25"
              />
              <div
                className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/85 bg-gradient-to-b from-[#38e8ff] to-[#0066e6] shadow-[0_0_12px_rgba(0,212,255,0.7)] transition-transform duration-75"
                style={{
                  transform: `translate3d(${joystickKnob.x}px, ${joystickKnob.y}px, 0)`,
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white/85" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT PROFESSIONAL "MENU" BASE BUTTON + 2-ROW ICON PANEL */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
        <BottomHudDock
          activeWindow={activeHudWindow}
          inventoryOpen={inventoryOpen}
          unreadNotifications={unreadNotifs}
          onToggleInventory={() => {
            playDigitalTone('click', soundEnabled);
            setInventoryOpen((o) => !o);
          }}
          onOpenWindow={handleOpenHudWindow}
        />
      </div>

      {/* Station / Portal Interaction Modal */}
      {activeStationModal && (
        <div
          onClick={() => setActiveStationModal(null)}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-dmo-window w-full max-w-[390px] rounded-2xl border-2 border-cyan-300/75 bg-gradient-to-b from-[#071d4d] via-[#041130] to-[#030b20] p-4 text-white shadow-[0_0_32px_rgba(0,190,255,0.45)]"
          >
            <div className="flex items-start justify-between gap-2 border-b border-cyan-400/25 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/50 bg-[#07265c]">
                  {renderInteractionIcon(activeStationModal.kind)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {activeStationModal.badge}
                  </p>
                  <h2 className="text-sm font-black tracking-wide text-white">
                    {activeStationModal.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStationModal(null)}
                aria-label="Fechar janela de interação"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#082256] text-cyan-200 hover:bg-sky-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-sky-100/90">
              {activeStationModal.description}
            </p>

            {activeStationModal.id === 'digital-world-portal' ? (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => travelToMap(HUNTING_MAP_ID)}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-300/70 bg-gradient-to-r from-[#0b3b82] to-[#08285c] px-3 py-2.5 text-left transition hover:brightness-110 active:scale-[0.98]"
                >
                  <div>
                    <p className="text-xs font-black text-white">
                      Planície Digital
                    </p>
                    <p className="text-[10px] font-semibold text-cyan-200/85">
                      Área de Caça Inicial · Digimons Nv. 1–10
                    </p>
                  </div>
                  <span className="rounded-md bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-200">
                    Viajar
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEnterDataForest}
                  onClick={() => {
                    if (canEnterDataForest) {
                      travelToMap(DATA_FOREST_MAP_ID);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    canEnterDataForest
                      ? 'border-emerald-300/70 bg-gradient-to-r from-[#0c4a38] to-[#062922] hover:brightness-110 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-600/50 bg-[#081326]/70 opacity-65'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black text-white">
                      Floresta de Dados
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-200/85">
                      {canEnterDataForest
                        ? 'Área Avançada & Raid Kuwagamon · Nv. 10–20'
                        : 'Requer Tamer ou Digimon Nv. 10+'}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      canEnterDataForest
                        ? 'bg-emerald-400/20 text-emerald-200'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {canEnterDataForest ? 'Viajar' : 'Nv.10+'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-cyan-400/25 bg-[#051840]/85 px-3 py-2">
                <span className="text-[11px] font-semibold text-cyan-200/90">
                  Módulo: {activeStationModal.futureModule}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStationModal(null)}
                  className="rounded-lg border border-cyan-300/60 bg-cyan-500/20 px-3 py-1 text-[11px] font-black uppercase text-cyan-100 hover:bg-cyan-500/35"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed DATS NPC Dialogue Modal (Richard Sampson) */}
      {activeNpcDialogue && (
        <NpcDialogueModal
          npc={activeNpcDialogue}
          tamerName={selection.tamerName}
          onClose={() => setActiveNpcDialogue(null)}
        />
      )}

      {/* Modal Overlay for Bottom Dock Windows, Incubadora, Shop & Exit Confirmation */}
      <HudWindowsOverlay
        activeWindow={activeHudWindow}
        hudAccount={hudAccount}
        character={character}
        tamerName={selection.tamerName}
        tamerStats={hudAccount.tamer}
        equippedItems={hudAccount.equippedItems}
        inventory={hudAccount.inventory}
        guildName={hudAccount.guildName}
        digimon={activeFormProfile}
        digimonStats={hudAccount.digimon}
        snapshot={liveSnapshot}
        bits={hudAccount.bits}
        dCoin={hudAccount.dCoin}
        defeatedTotal={hudAccount.defeatedEnemiesTotal}
        notifications={notifications}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
        onEquipItem={handleEquipInventoryItem}
        onUnequipSlot={handleUnequipSlot}
        onBuyShopItem={handleBuyShopItem}
        onEvolveDigimon={handleTriggerEvolution}
        onExecuteEggHatch={handleExecuteEggHatch}
        onExecuteEggReinforce={handleExecuteEggReinforce}
        onPlayTone={(tone) => playDigitalTone(tone, soundEnabled)}
        onAdminSetDigimonLevel={handleAdminSetDigimonLevel}
        onAdminAddDigimonExp={handleAdminAddDigimonExp}
        onAdminRestoreVitals={handleAdminRestoreVitals}
        onTravelToMap={travelToMap}
        isGM={isGM}
        onOpenFeedback={
          onOpenFeedback
            ? () => onOpenFeedback(`world:${liveSnapshot.mapId}`)
            : undefined
        }
        onConfirmExit={() => {
          persistProgress();
          void markLocalWorldPresenceOffline();
          playDigitalTone('click', soundEnabled);
          setActiveHudWindow(null);
          onExitToLogin();
        }}
        onClose={() => setActiveHudWindow(null)}
      />

      {/* Universal Cinematic Digivolution Overlay (works automatically for all existing & future Digimons) */}
      {evolutionCinematic && (
        <EvolutionCinematicOverlay
          fromForm={evolutionCinematic.fromForm}
          toForm={evolutionCinematic.toForm}
          level={evolutionCinematic.level}
          maxHp={evolutionCinematic.maxHp}
          maxDs={evolutionCinematic.maxDs}
          derivedAttrs={evolutionCinematic.derivedAttrs}
          soundEnabled={soundEnabled}
          onToggleSound={() =>
            onUpdatePreferences({
              ...preferences,
              soundEnabled: !preferences.soundEnabled,
            })
          }
          onComplete={() => {
            simRef.current.evoFlashTimer = 1.65;
            setEvolutionCinematic(null);
          }}
        />
      )}
    </section>
  );
}
