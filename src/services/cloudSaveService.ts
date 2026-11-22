import type { User } from 'firebase/auth';
import {
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { getTamerSprites } from '../sprites/tamerSprites';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import type { SavedStarterDigimon, StarterDigimonElement, StarterDigimonId } from '../types/digimon';
import type { AccountHudPersistence, EquipmentSlotId, InventoryItem } from '../types/hud';

export interface CloudTamerSelection {
  characterId: TamerId;
  tamerName: string;
  updatedAt: string;
}

export interface CloudStarterDigimon {
  digimonId: StarterDigimonId;
  digimonName: string;
  element: StarterDigimonElement;
  chosenAt: string;
}

export interface CloudAdventureProgress {
  mapId: 'dats-center' | 'hunting-plains' | 'data-forest';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt: string;
}

export interface CloudHudState {
  tamer: {
    level: number;
    exp: number;
    expToNext: number;
    hp: number;
    maxHp: number;
    ds: number;
    maxDs: number;
  };
  digimon: {
    level: number;
    exp: number;
    expToNext: number;
    hp: number;
    maxHp: number;
    ds: number;
    maxDs: number;
    activeFormId?: string;
    unlockedFormIds?: string[];
  };
  bits: number;
  dCoin: number;
  inventory: InventoryItem[];
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  guildName: string | null;
  defeatedEnemiesTotal: number;
  updatedAt: string;
}

export interface PlayerCloudSnapshot {
  ownerUid: string;
  username: string;
  usernameLower: string;
  tamerSelection: CloudTamerSelection | null;
  starterDigimon: CloudStarterDigimon | null;
  adventureProgress: CloudAdventureProgress | null;
  hudState: CloudHudState | null;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Ensures any player handle strictly satisfies firebase-blueprint.json:
 * length 3..24, pattern ^[a-zA-Z0-9._-]+$
 */
export function sanitizePlayerUsername(raw: string, fallbackUid?: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 24);
  if (cleaned.length >= 3 && USERNAME_PATTERN.test(cleaned)) {
    return cleaned;
  }
  const suffix = (fallbackUid ?? 'tamer').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '001';
  return `Tamer_${suffix}`.slice(0, 24);
}

function getVerifiedCurrentUser(): User | null {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;
  return user;
}

function clampIso(value?: unknown): string {
  const iso = (
    typeof value === 'string' && value.length >= 10
      ? value
      : new Date().toISOString()
  ).slice(0, 40);
  return iso;
}

function stripUndefined<T>(obj: T): T {
  if (typeof obj === 'number') {
    return (Number.isFinite(obj) ? obj : 0) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
}

function safeInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function safeCoord(value: unknown, max: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(max, Math.round(num * 10) / 10));
}

function safeCardinalDir(value: unknown): 'N' | 'S' | 'E' | 'W' {
  const raw = String(value ?? 'S').toUpperCase();
  if (raw === 'N' || raw === 'NE' || raw === 'NW') return 'N';
  if (raw === 'E') return 'E';
  if (raw === 'W') return 'W';
  return 'S';
}

function sanitizeTamerSelectionForCloud(
  raw: unknown
): CloudTamerSelection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const rawChar = String(obj.characterId ?? '');
  const characterId: TamerId =
    rawChar === 'kai' || rawChar === 'ren' || rawChar === 'hina' || rawChar === 'yuna'
      ? rawChar
      : 'kai';
  const trimmedName = String(obj.tamerName ?? '').trim().slice(0, 24);
  const safeTamerName = trimmedName.length >= 1 ? trimmedName : 'Tamer';
  return {
    characterId,
    tamerName: safeTamerName,
    updatedAt: clampIso(obj.updatedAt),
  };
}

function sanitizeStarterDigimonForCloud(
  raw: unknown
): CloudStarterDigimon | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const rawId = String(obj.digimonId ?? '');
  if (rawId !== 'agumon' && rawId !== 'gaomon' && rawId !== 'lalamon') {
    return null;
  }
  const digimonId: StarterDigimonId = rawId;
  const defaultElementByStarter: Record<StarterDigimonId, StarterDigimonElement> = {
    agumon: 'Fogo',
    gaomon: 'Velocidade',
    lalamon: 'Natureza',
  };
  const rawEl = String(obj.element ?? '');
  const element: StarterDigimonElement =
    rawEl === 'Fogo' || rawEl === 'Velocidade' || rawEl === 'Natureza'
      ? rawEl
      : defaultElementByStarter[digimonId];
  const rawName = String(obj.digimonName ?? '').trim().slice(0, 32);
  return {
    digimonId,
    digimonName: rawName.length >= 1 ? rawName : digimonId,
    element,
    chosenAt: clampIso(typeof obj.chosenAt === 'string' ? obj.chosenAt : undefined),
  };
}

function sanitizeHudStateForCloud(state: AccountHudPersistence): CloudHudState {
  const cleanInventory = (Array.isArray(state.inventory) ? state.inventory : [])
    .filter(
      (item): item is InventoryItem =>
        Boolean(item && typeof item === 'object' && !Array.isArray(item))
    )
    .slice(0, 48)
    .map((item) => stripUndefined(item));

  const cleanEquipped: Partial<Record<EquipmentSlotId, InventoryItem>> = {};
  const entries = Object.entries(state.equippedItems ?? {}).slice(0, 16);
  for (const [slot, item] of entries) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      cleanEquipped[slot as EquipmentSlotId] = stripUndefined(item);
    }
  }

  const digimonPayload: CloudHudState['digimon'] = {
    level: safeInt(state.digimon?.level, 1, 200, 1),
    exp: safeInt(state.digimon?.exp, 0, 100000000, 0),
    expToNext: safeInt(state.digimon?.expToNext, 1, 100000000, 100),
    hp: safeInt(state.digimon?.hp, 0, 1000000, 100),
    maxHp: safeInt(state.digimon?.maxHp, 1, 1000000, 100),
    ds: safeInt(state.digimon?.ds, 0, 1000000, 50),
    maxDs: safeInt(state.digimon?.maxDs, 1, 1000000, 50),
  };
  if (
    typeof state.digimon?.activeFormId === 'string' &&
    state.digimon.activeFormId.trim().length >= 1
  ) {
    digimonPayload.activeFormId = state.digimon.activeFormId.trim().slice(0, 32);
  }
  if (Array.isArray(state.digimon?.unlockedFormIds)) {
    digimonPayload.unlockedFormIds = state.digimon.unlockedFormIds
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .slice(0, 24)
      .map((id) => String(id).trim().slice(0, 32));
  }

  return {
    tamer: {
      level: safeInt(state.tamer?.level, 1, 200, 1),
      exp: safeInt(state.tamer?.exp, 0, 100000000, 0),
      expToNext: safeInt(state.tamer?.expToNext, 1, 100000000, 100),
      hp: safeInt(state.tamer?.hp, 0, 1000000, 100),
      maxHp: safeInt(state.tamer?.maxHp, 1, 1000000, 100),
      ds: safeInt(state.tamer?.ds, 0, 1000000, 50),
      maxDs: safeInt(state.tamer?.maxDs, 1, 1000000, 50),
    },
    digimon: digimonPayload,
    bits: safeInt(state.bits, 0, 1000000000, 0),
    dCoin: safeInt(state.dCoin, 0, 1000000000, 0),
    inventory: cleanInventory,
    equippedItems: cleanEquipped,
    guildName:
      typeof state.guildName === 'string' && state.guildName.trim().length > 0
        ? state.guildName.trim().slice(0, 32)
        : null,
    defeatedEnemiesTotal: safeInt(state.defeatedEnemiesTotal, 0, 100000000, 0),
    updatedAt: clampIso(state.updatedAt),
  };
}

function sanitizeAdventureForCloud(progress: {
  mapId?: 'dats-center' | 'hunting-plains' | 'data-forest';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt?: string;
}): CloudAdventureProgress {
  const mapId =
    progress.mapId === 'hunting-plains'
      ? 'hunting-plains'
      : progress.mapId === 'data-forest'
        ? 'data-forest'
        : 'dats-center';
  return {
    mapId,
    worldX: safeCoord(progress.worldX, 20000),
    worldY: safeCoord(progress.worldY, 20000),
    facingDir: safeCardinalDir(progress.facingDir),
    stepsCount: safeInt(progress.stepsCount, 0, 100000000, 0),
    discoveredZones: (Array.isArray(progress.discoveredZones)
      ? progress.discoveredZones
      : []
    )
      .slice(0, 40)
      .map((z) => String(z).slice(0, 64)),
    updatedAt: clampIso(progress.updatedAt),
  };
}

const ALLOWED_PLAYER_TOP_LEVEL_KEYS = new Set([
  'ownerUid',
  'username',
  'usernameLower',
  'tamerSelection',
  'starterDigimon',
  'adventureProgress',
  'hudState',
  'createdAt',
  'updatedAt',
]);

const inFlightBootstrapByUid = new Map<string, Promise<PlayerCloudSnapshot>>();
const bootstrappedUids = new Set<string>();
const writeQueueByUid = new Map<string, Promise<void>>();

function enqueuePlayerWrite<T>(uid: string, task: () => Promise<T>): Promise<T> {
  const previous = writeQueueByUid.get(uid) ?? Promise.resolve();
  const next = previous.then(task, task);
  const tracked = next.then(
    () => undefined,
    () => undefined
  );
  writeQueueByUid.set(uid, tracked);
  void tracked.finally(() => {
    if (writeQueueByUid.get(uid) === tracked) {
      writeQueueByUid.delete(uid);
    }
  });
  return next;
}

async function getAuthoritativePlayerSnap(userId: string) {
  const playerRef = doc(db, 'players', userId);
  try {
    return await getDocFromServer(playerRef);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('offline') || msg.includes('unavailable')) {
      return getDoc(playerRef);
    }
    throw err;
  }
}

export function clearCloudSaveSessionCache(): void {
  bootstrappedUids.clear();
  inFlightBootstrapByUid.clear();
  writeQueueByUid.clear();
}

function snapshotFromPlayerDoc(
  uid: string,
  data: Partial<PlayerCloudSnapshot>
): PlayerCloudSnapshot {
  const username = sanitizePlayerUsername(data.username ?? '', uid);
  return {
    ownerUid: data.ownerUid ?? uid,
    username,
    usernameLower: data.usernameLower ?? username.toLowerCase(),
    tamerSelection: data.tamerSelection ?? null,
    starterDigimon: data.starterDigimon ?? null,
    adventureProgress: data.adventureProgress ?? null,
    hudState: data.hudState ?? null,
  };
}

async function runBootstrapPlayerCloudProfile(
  user: User,
  preferredUsername?: string,
  authProvider: 'password' | 'google' = 'password'
): Promise<PlayerCloudSnapshot> {
  const playerPath = `players/${user.uid}`;
  const playerRef = doc(db, 'players', user.uid);

  let snap;
  try {
    snap = await getAuthoritativePlayerSnap(user.uid);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, playerPath);
  }

  if (snap.exists()) {
    bootstrappedUids.add(user.uid);
    return snapshotFromPlayerDoc(user.uid, snap.data() as PlayerCloudSnapshot);
  }

  // First-time verified sign-in: pick an unclaimed username cleanly
  const emailPrefix = user.email ? user.email.split('@')[0] : '';
  let candidate = sanitizePlayerUsername(
    preferredUsername || user.displayName || emailPrefix,
    user.uid
  );
  let candidateLower = candidate.toLowerCase();
  let shouldClaimUsername = true;

  try {
    const claimSnap = await getDoc(doc(db, 'usernames', candidateLower));
    if (claimSnap.exists()) {
      if (claimSnap.data()?.ownerUid === user.uid) {
        // Already claimed by this user; do not attempt to update immutable /usernames doc
        shouldClaimUsername = false;
      } else {
        const uidSuffix = user.uid
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 4)
          .toLowerCase();
        candidate = `${candidate.slice(0, 19)}_${uidSuffix}`;
        candidateLower = candidate.toLowerCase();
        const retrySnap = await getDoc(doc(db, 'usernames', candidateLower));
        if (retrySnap.exists() && retrySnap.data()?.ownerUid === user.uid) {
          shouldClaimUsername = false;
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${candidateLower}`);
  }

  const privateRef = doc(db, 'players', user.uid, 'private', 'account');
  let shouldCreatePrivate = true;
  try {
    const privSnap = await getDoc(privateRef);
    if (privSnap.exists()) {
      shouldCreatePrivate = false;
    }
  } catch {
    // Private doc read requires parent player doc to exist; safe to create in atomic batch
    shouldCreatePrivate = true;
  }

  const batch = writeBatch(db);
  const ts = serverTimestamp();

  batch.set(playerRef, {
    ownerUid: user.uid,
    username: candidate,
    usernameLower: candidateLower,
    tamerSelection: null,
    starterDigimon: null,
    adventureProgress: null,
    hudState: null,
    createdAt: ts,
    updatedAt: ts,
  });

  if (shouldCreatePrivate) {
    batch.set(privateRef, {
      ownerUid: user.uid,
      email: (user.email ?? `${candidateLower}@verified.local`).slice(0, 254),
      authProvider,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  if (shouldClaimUsername) {
    batch.set(doc(db, 'usernames', candidateLower), {
      ownerUid: user.uid,
      username: candidate,
      createdAt: ts,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    // Recover gracefully if a concurrent tab or listener created the player profile milliseconds earlier
    try {
      const recoverySnap = await getDoc(playerRef);
      if (recoverySnap.exists()) {
        bootstrappedUids.add(user.uid);
        return snapshotFromPlayerDoc(
          user.uid,
          recoverySnap.data() as PlayerCloudSnapshot
        );
      }
    } catch {
      // Fall through to structured error handler below
    }
    handleFirestoreError(error, OperationType.CREATE, playerPath);
  }

  bootstrappedUids.add(user.uid);

  return {
    ownerUid: user.uid,
    username: candidate,
    usernameLower: candidateLower,
    tamerSelection: null,
    starterDigimon: null,
    adventureProgress: null,
    hudState: null,
  };
}

/**
 * Loads the player's cloud profile from `/players/{uid}`, or atomically creates
 * `/players/{uid}`, `/players/{uid}/private/account`, and `/usernames/{usernameLower}`
 * if this is their first verified sign-in. Concurrent callers for the same UID
 * share a single in-flight promise so duplicate creates never race.
 */
export async function bootstrapPlayerCloudProfile(
  user: User,
  preferredUsername?: string,
  authProvider: 'password' | 'google' = 'password'
): Promise<PlayerCloudSnapshot> {
  const existingPromise = inFlightBootstrapByUid.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = runBootstrapPlayerCloudProfile(
    user,
    preferredUsername,
    authProvider
  ).finally(() => {
    inFlightBootstrapByUid.delete(user.uid);
  });

  inFlightBootstrapByUid.set(user.uid, promise);
  return promise;
}

export async function ensurePlayerDocBootstrapped(user: User): Promise<boolean> {
  if (bootstrappedUids.has(user.uid)) return true;
  try {
    const providerId = user.providerData[0]?.providerId;
    const provider: 'google' | 'password' =
      providerId === 'google.com' ? 'google' : 'password';
    await bootstrapPlayerCloudProfile(
      user,
      user.displayName || undefined,
      provider
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Hydrates the fast localStorage keys from the authoritative Firestore cloud save
 * so all game screens and TamerWorldCanvas immediately reflect the player's cloud state.
 */
export function hydrateLocalCacheFromCloud(
  accountUsername: string,
  cloud: PlayerCloudSnapshot
): void {
  const cleanKey = accountUsername.trim().toLowerCase();
  if (!cleanKey) return;

  try {
    if (cloud.tamerSelection) {
      const sprites = getTamerSprites(cloud.tamerSelection.characterId);
      const savedChar: SavedCharacterSelection = {
        accountUsername,
        characterId: cloud.tamerSelection.characterId,
        tamerName: cloud.tamerSelection.tamerName,
        spritesheetMeta: {
          frameWidth: sprites.frameWidth,
          frameHeight: sprites.frameHeight,
          columns: sprites.columns,
          rows: sprites.rows,
          directions: sprites.directions,
        },
        updatedAt: cloud.tamerSelection.updatedAt,
      };
      window.localStorage.setItem(
        `dw_digital_war_tamer_${cleanKey}`,
        JSON.stringify(savedChar)
      );
    }

    if (cloud.starterDigimon) {
      const savedStarter: SavedStarterDigimon = {
        accountUsername,
        digimonId: cloud.starterDigimon.digimonId,
        digimonName: cloud.starterDigimon.digimonName,
        element: cloud.starterDigimon.element,
        chosenAt: cloud.starterDigimon.chosenAt,
      };
      window.localStorage.setItem(
        `dw_digital_war_starter_${cleanKey}`,
        JSON.stringify(savedStarter)
      );
    }

    if (cloud.adventureProgress) {
      window.localStorage.setItem(
        `dw_digital_war_progress_${cleanKey}`,
        JSON.stringify({
          accountUsername,
          characterId: cloud.tamerSelection?.characterId ?? 'kai',
          tamerName: cloud.tamerSelection?.tamerName ?? accountUsername,
          ...cloud.adventureProgress,
        })
      );
    }

    if (cloud.hudState) {
      window.localStorage.setItem(
        `dw_digital_war_hud_v1_${cleanKey}`,
        JSON.stringify({
          accountUsername,
          ...cloud.hudState,
        })
      );
    }
  } catch {
    // Ignore private browsing localStorage quota errors gracefully
  }
}

interface PlayerPatchOverrides {
  tamerSelection?: CloudTamerSelection;
  starterDigimon?: CloudStarterDigimon;
  adventureProgress?: CloudAdventureProgress;
  hudState?: CloudHudState;
}

function isFirestoreTimestampLike(value: unknown): value is Timestamp {
  if (value instanceof Timestamp) return true;
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    seconds?: unknown;
    nanoseconds?: unknown;
    toMillis?: unknown;
  };
  return (
    typeof candidate.seconds === 'number' &&
    typeof candidate.nanoseconds === 'number' &&
    typeof candidate.toMillis === 'function'
  );
}

/**
 * Performs a fast partial updateDoc on `/players/{uid}`. If Firestore rejects the partial
 * update because an untouched legacy field on the existing document violates the current
 * hardened schema (or the doc disappeared), it reloads the authoritative server document,
 * sanitizes every field into a 100% schema-valid PlayerSave payload (preserving immutable
 * ownerUid, createdAt, tamerSelection, and starterDigimon), and heals it cleanly.
 */
async function updatePlayerDocWithSelfHeal(
  user: User,
  patch: PlayerPatchOverrides,
  swallowError: boolean
): Promise<void> {
  return enqueuePlayerWrite(user.uid, async () => {
    if (auth.currentUser?.uid !== user.uid) return;
    const ready = await ensurePlayerDocBootstrapped(user);
    if (!ready) return;

    const path = `players/${user.uid}`;
    const playerRef = doc(db, 'players', user.uid);
    const updatePayload: Record<string, unknown> = {
      ...patch,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(playerRef, updatePayload);
      return;
    } catch (firstErr) {
      // Ignore expected aborts if the user signed out while the request was in flight
      if (auth.currentUser?.uid !== user.uid) return;

      let stage = 'get-server';
      let hasValidTimestampCreatedAt = false;
      let createdAtKind = 'unknown';
      let extraKeysCount = 0;
      let docExisted = false;

      // Attempt authoritative server-side schema self-heal before reporting permission error
      try {
        const snap = await getAuthoritativePlayerSnap(user.uid);
        if (auth.currentUser?.uid !== user.uid) return;
        docExisted = snap.exists();

        if (!snap.exists()) {
          stage = 'recreate-missing';
          bootstrappedUids.delete(user.uid);
          const safeUsername = sanitizePlayerUsername(
            user.displayName || user.email?.split('@')[0] || '',
            user.uid
          );
          const ts = serverTimestamp();
          await setDoc(playerRef, {
            ownerUid: user.uid,
            username: safeUsername,
            usernameLower: safeUsername.toLowerCase(),
            tamerSelection: patch.tamerSelection ?? null,
            starterDigimon: patch.starterDigimon ?? null,
            adventureProgress: patch.adventureProgress ?? null,
            hudState: patch.hudState ?? null,
            createdAt: ts,
            updatedAt: ts,
          });
          bootstrappedUids.add(user.uid);
          return;
        }

        const raw = (snap.data() ?? {}) as Record<string, unknown>;
        const safeUsername = sanitizePlayerUsername(
          typeof raw.username === 'string' && raw.username.trim().length >= 3
            ? raw.username
            : user.displayName || user.email?.split('@')[0] || '',
          user.uid
        );
        const existingTamer = sanitizeTamerSelectionForCloud(raw.tamerSelection);
        const existingStarter = sanitizeStarterDigimonForCloud(raw.starterDigimon);
        const existingAdv =
          raw.adventureProgress &&
          typeof raw.adventureProgress === 'object' &&
          !Array.isArray(raw.adventureProgress)
            ? sanitizeAdventureForCloud(
                raw.adventureProgress as Parameters<typeof sanitizeAdventureForCloud>[0]
              )
            : null;
        const existingHud =
          raw.hudState &&
          typeof raw.hudState === 'object' &&
          !Array.isArray(raw.hudState)
            ? sanitizeHudStateForCloud(raw.hudState as AccountHudPersistence)
            : null;

        hasValidTimestampCreatedAt = isFirestoreTimestampLike(raw.createdAt);
        createdAtKind =
          raw.createdAt === undefined
            ? 'missing'
            : raw.createdAt === null
              ? 'null'
              : hasValidTimestampCreatedAt
                ? 'timestamp'
                : typeof raw.createdAt;

        const extraTopLevelKeys = Object.keys(raw).filter(
          (k) => !ALLOWED_PLAYER_TOP_LEVEL_KEYS.has(k)
        );
        extraKeysCount = extraTopLevelKeys.length;
        const hasDottedExtraKey = extraTopLevelKeys.some((k) => k.includes('.'));

        const normalizedFields: Record<string, unknown> = {
          ownerUid: user.uid,
          username: safeUsername,
          usernameLower: safeUsername.toLowerCase(),
          tamerSelection: existingTamer ?? patch.tamerSelection ?? null,
          starterDigimon: existingStarter ?? patch.starterDigimon ?? null,
          adventureProgress: patch.adventureProgress ?? existingAdv,
          hudState: patch.hudState ?? existingHud,
          updatedAt: serverTimestamp(),
        };

        if (hasValidTimestampCreatedAt) {
          // Tier A: update all normalized fields and delete clean extra keys via deleteField()
          // without touching createdAt at all.
          if (!hasDottedExtraKey) {
            stage = 'heal-updateDoc';
            const healPatch: Record<string, unknown> = { ...normalizedFields };
            for (const extraKey of extraTopLevelKeys) {
              healPatch[extraKey] = deleteField();
            }
            try {
              await updateDoc(playerRef, healPatch);
              return;
            } catch {
              // Fall through to Tier B full-document rewrite preserving exact Timestamp
            }
          }

          // Tier B: full-document setDoc replacing all keys cleanly while preserving
          // the exact server Timestamp (handles dotted legacy keys cleanly).
          stage = 'heal-setDoc-preserveCreatedAt';
          await setDoc(playerRef, {
            ...normalizedFields,
            createdAt: raw.createdAt,
          });
        } else {
          // Full rewrite required to initialize missing/non-Timestamp createdAt cleanly
          stage = 'heal-setDoc-initCreatedAt';
          await setDoc(playerRef, {
            ...normalizedFields,
            createdAt: serverTimestamp(),
          });
        }
        return;
      } catch (healError) {
        if (auth.currentUser?.uid !== user.uid) return;

        const diag = [
          `stage=${stage}`,
          `docExisted=${docExisted}`,
          `createdAt=${createdAtKind}`,
          `extraKeys=${extraKeysCount}`,
          `patchKeys=${Object.keys(patch).join(',') || 'none'}`,
          `first=${firstErr instanceof Error ? firstErr.message : String(firstErr)}`,
        ].join(' | ');
        const baseMsg =
          healError instanceof Error ? healError.message : String(healError);
        const enrichedError = new Error(`${baseMsg} [${diag}]`);

        if (swallowError) {
          try {
            handleFirestoreError(enrichedError, OperationType.UPDATE, path);
          } catch {
            // Structured error already logged to console
          }
          return;
        }
        handleFirestoreError(enrichedError, OperationType.UPDATE, path);
      }
    }
  });
}

export async function syncTamerSelectionToCloud(
  selection: SavedCharacterSelection
): Promise<void> {
  const user = getVerifiedCurrentUser();
  if (!user) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const cleanSelection = sanitizeTamerSelectionForCloud({
    characterId: selection.characterId,
    tamerName: selection.tamerName,
    updatedAt: selection.updatedAt,
  });
  if (!cleanSelection) return;

  try {
    const existingSnap = await getAuthoritativePlayerSnap(user.uid);
    if (existingSnap.exists() && existingSnap.data()?.tamerSelection != null) {
      return;
    }
  } catch {
    // Continue to update helper which handles error reporting
  }

  await updatePlayerDocWithSelfHeal(user, { tamerSelection: cleanSelection }, false);
}

export async function syncStarterDigimonToCloud(
  starter: SavedStarterDigimon
): Promise<void> {
  const user = getVerifiedCurrentUser();
  if (!user) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const cleanStarter = sanitizeStarterDigimonForCloud(starter);
  if (!cleanStarter) return;

  try {
    const existingSnap = await getAuthoritativePlayerSnap(user.uid);
    if (existingSnap.exists() && existingSnap.data()?.starterDigimon != null) {
      return;
    }
  } catch {
    // Continue to update helper which handles error reporting
  }

  await updatePlayerDocWithSelfHeal(user, { starterDigimon: cleanStarter }, false);
}

// ============================================================================
// Debounced Auto-Save Queue for Exploration & RPG HUD State (saves Firestore writes)
// ============================================================================

let pendingAdventure: CloudAdventureProgress | null = null;
let pendingHud: CloudHudState | null = null;
let syncTimer: number | null = null;
let inFlightCommitPromise: Promise<void> | null = null;

async function commitPendingCloudSaves(): Promise<void> {
  if (syncTimer !== null) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }

  if (inFlightCommitPromise) {
    await inFlightCommitPromise;
    if (!pendingAdventure && !pendingHud) return;
  }

  const user = getVerifiedCurrentUser();
  if (!user) {
    pendingAdventure = null;
    pendingHud = null;
    return;
  }

  const adv = pendingAdventure;
  const hud = pendingHud;
  pendingAdventure = null;
  pendingHud = null;

  if (!adv && !hud) return;

  const patch: PlayerPatchOverrides = {};
  if (adv) patch.adventureProgress = adv;
  if (hud) patch.hudState = hud;

  const commitPromise = (async () => {
    await updatePlayerDocWithSelfHeal(user, patch, true);
  })();
  inFlightCommitPromise = commitPromise;

  try {
    await commitPromise;
  } finally {
    if (inFlightCommitPromise === commitPromise) {
      inFlightCommitPromise = null;
    }
    // If newer saves arrived while the previous commit was in flight, schedule cleanly
    if ((pendingAdventure || pendingHud) && syncTimer === null) {
      syncTimer = window.setTimeout(() => {
        void commitPendingCloudSaves();
      }, 1500);
    }
  }
}

export function scheduleAdventureProgressSync(progress: {
  mapId?: 'dats-center' | 'hunting-plains' | 'data-forest';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt?: string;
}): void {
  if (!getVerifiedCurrentUser()) return;
  pendingAdventure = sanitizeAdventureForCloud(progress);
  if (syncTimer === null) {
    syncTimer = window.setTimeout(() => {
      void commitPendingCloudSaves();
    }, 2200);
  }
}

export function scheduleHudStateSync(state: AccountHudPersistence): void {
  if (!getVerifiedCurrentUser()) return;
  pendingHud = sanitizeHudStateForCloud(state);
  if (syncTimer === null) {
    syncTimer = window.setTimeout(() => {
      void commitPendingCloudSaves();
    }, 1800);
  }
}

export async function flushPendingCloudSaves(): Promise<void> {
  await commitPendingCloudSaves();
  if (inFlightCommitPromise) {
    await inFlightCommitPromise;
  }
  if (pendingAdventure || pendingHud) {
    await commitPendingCloudSaves();
  }
}
