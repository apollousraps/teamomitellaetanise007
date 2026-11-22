import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getTamerSprites } from '../sprites/tamerSprites';
import type {
  AuthAdapter,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import {
  getDigimonFormProfile,
  getStarterDigimonById,
  type DigimonFormId,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import {
  bootstrapPlayerCloudProfile,
  clearCloudSaveSessionCache,
  flushPendingCloudSaves,
  hydrateLocalCacheFromCloud,
  sanitizePlayerUsername,
  scheduleAdventureProgressSync,
  syncStarterDigimonToCloud,
  syncTamerSelectionToCloud,
} from './cloudSaveService';
import { resolveIsGmAccount } from './gmRoleService';
import { applyQuickTestDigimonFormToHudState } from './hudGameService';
import { markLocalWorldPresenceOffline } from './worldPresenceService';

const REMEMBERED_USER_KEY = 'dw_digital_war_remembered_user';
const REMEMBER_FLAG_KEY = 'dw_digital_war_remember_flag';
const USER_EMAIL_ALIAS_KEY = 'dw_digital_war_user_aliases_v1';
const CHARACTER_SELECTION_PREFIX = 'dw_digital_war_tamer_';
const STARTER_SELECTION_PREFIX = 'dw_digital_war_starter_';
const ADVENTURE_PROGRESS_PREFIX = 'dw_digital_war_progress_';

export interface AdventureProgress {
  accountUsername: string;
  characterId: TamerId;
  tamerName: string;
  mapId?: 'dats-center' | 'hunting-plains' | 'data-forest';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_STRICT_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Validates either a login username OR a valid email address.
 */
export function validateLoginIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Informe seu nome de usuário ou e-mail.';
  }
  if (trimmed.includes('@')) {
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Informe um endereço de e-mail válido.';
    }
    return null;
  }
  if (trimmed.length < 3) {
    return 'O usuário deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 24) {
    return 'O usuário pode ter no máximo 24 caracteres.';
  }
  if (!USERNAME_STRICT_REGEX.test(trimmed)) {
    return 'Use apenas letras, números ou . _ - (ou informe seu e-mail completo).';
  }
  return null;
}

/**
 * Validates registration username (matches firebase-blueprint.json: 3..24 chars, ^[a-zA-Z0-9._-]+$).
 */
export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Informe seu nome de usuário.';
  }
  if (trimmed.length < 3) {
    return 'O usuário deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 24) {
    return 'O usuário pode ter no máximo 24 caracteres.';
  }
  if (!USERNAME_STRICT_REGEX.test(trimmed)) {
    return 'Use apenas letras, números ou . _ -';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Informe sua senha de acesso.';
  }
  if (value.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
}

export function validateTamerName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Digite o nome do seu Tamer antes de confirmar.';
  }
  if (trimmed.length < 3) {
    return 'O nome do Tamer deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 16) {
    return 'O nome do Tamer pode ter no máximo 16 caracteres.';
  }
  if (!/^[a-zA-Z0-9À-ÿ _-]+$/.test(trimmed)) {
    return 'Use apenas letras, números, espaços, _ ou -';
  }
  return null;
}

// ============================================================================
// Device-local Username <-> Email Alias Cache (Zero PII in public Firestore)
// ============================================================================

function loadUsernameAliasMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(USER_EMAIL_ALIAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function rememberUsernameEmailAlias(
  username: string,
  email?: string | null
): void {
  const key = username.trim().toLowerCase();
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!key || !cleanEmail || !cleanEmail.includes('@')) return;
  try {
    const current = loadUsernameAliasMap();
    current[key] = cleanEmail;
    window.localStorage.setItem(USER_EMAIL_ALIAS_KEY, JSON.stringify(current));
  } catch {
    // Ignore private browsing storage restrictions
  }
}

function resolveRememberedEmailForUsername(username: string): string | null {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  const map = loadUsernameAliasMap();
  return map[key] ?? null;
}

export function getStoredRememberPreference(): {
  rememberMe: boolean;
  username: string;
} {
  try {
    const rememberFlag = window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
    const username = rememberFlag
      ? window.localStorage.getItem(REMEMBERED_USER_KEY) ?? ''
      : '';
    return { rememberMe: rememberFlag, username };
  } catch {
    return { rememberMe: false, username: '' };
  }
}

export function persistRememberPreference(
  rememberMe: boolean,
  username: string
): void {
  try {
    if (rememberMe && username.trim()) {
      window.localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
      window.localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
    } else {
      window.localStorage.removeItem(REMEMBER_FLAG_KEY);
      window.localStorage.removeItem(REMEMBERED_USER_KEY);
    }
  } catch {
    // Ignore storage quota or private browsing errors cleanly
  }
}

export function getSavedCharacterForAccount(
  accountUsername: string
): SavedCharacterSelection | null {
  try {
    const key = `${CHARACTER_SELECTION_PREFIX}${accountUsername.trim().toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCharacterSelection;
  } catch {
    return null;
  }
}

export async function saveCharacterForAccount(params: {
  accountUsername: string;
  characterId: TamerId;
  tamerName: string;
}): Promise<{ success: boolean; message: string; saved?: SavedCharacterSelection }> {
  const cleanAccount = params.accountUsername.trim() || 'tamer_local';
  const existing = getSavedCharacterForAccount(cleanAccount);

  // Permanent Tamer rule: once confirmed, the player cannot overwrite or switch to another Tamer.
  if (existing) {
    return {
      success: true,
      message: `Seu Tamer "${existing.tamerName}" já está vinculado definitivamente a esta conta.`,
      saved: existing,
    };
  }

  const nameErr = validateTamerName(params.tamerName);
  if (nameErr) {
    return { success: false, message: nameErr };
  }

  const sprites = getTamerSprites(params.characterId);
  const record: SavedCharacterSelection = {
    accountUsername: cleanAccount,
    characterId: params.characterId,
    tamerName: params.tamerName.trim(),
    spritesheetMeta: {
      frameWidth: sprites.frameWidth,
      frameHeight: sprites.frameHeight,
      columns: sprites.columns,
      rows: sprites.rows,
      directions: sprites.directions,
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    const key = `${CHARACTER_SELECTION_PREFIX}${record.accountUsername.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Graceful fallback even if storage is unavailable
  }

  // Sync to Cloud Firestore immediately when signed in with a verified account
  await syncTamerSelectionToCloud(record);

  return {
    success: true,
    message: `Personagem "${record.tamerName}" salvo definitivamente na conta "${record.accountUsername}"!`,
    saved: record,
  };
}

export function getAdventureProgressForAccount(
  accountUsername: string
): AdventureProgress | null {
  try {
    const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
    const raw = window.localStorage.getItem(`${ADVENTURE_PROGRESS_PREFIX}${cleanUser}`);
    if (!raw) return null;
    return JSON.parse(raw) as AdventureProgress;
  } catch {
    return null;
  }
}

export function saveAdventureProgressForAccount(progress: AdventureProgress): void {
  try {
    const cleanUser = (progress.accountUsername.trim() || 'tamer_local').toLowerCase();
    window.localStorage.setItem(
      `${ADVENTURE_PROGRESS_PREFIX}${cleanUser}`,
      JSON.stringify(progress)
    );
  } catch {
    // Graceful fallback if storage is unavailable
  }
  scheduleAdventureProgressSync(progress);
}

export function getSavedStarterDigimonForAccount(
  accountUsername: string
): SavedStarterDigimon | null {
  try {
    const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
    const raw = window.localStorage.getItem(`${STARTER_SELECTION_PREFIX}${cleanUser}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStarterDigimon;
    if (
      parsed.digimonId === 'agumon' ||
      parsed.digimonId === 'gaomon' ||
      parsed.digimonId === 'lalamon'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStarterDigimonForAccount(params: {
  accountUsername: string;
  digimonId: StarterDigimonId;
}): Promise<{ success: boolean; message: string; saved: SavedStarterDigimon }> {
  const cleanAccount = params.accountUsername.trim() || 'tamer_local';
  const existing = getSavedStarterDigimonForAccount(cleanAccount);

  // Permanent bond rule: once confirmed, the player cannot overwrite or switch to another starter.
  if (existing) {
    return {
      success: true,
      message: `Seu parceiro inicial ${existing.digimonName} já está vinculado à conta.`,
      saved: existing,
    };
  }

  const profile = getStarterDigimonById(params.digimonId);
  const record: SavedStarterDigimon = {
    accountUsername: cleanAccount,
    digimonId: profile.id,
    digimonName: profile.name,
    element: profile.element,
    chosenAt: new Date().toISOString(),
  };

  try {
    const key = `${STARTER_SELECTION_PREFIX}${cleanAccount.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Ignore storage unavailability cleanly
  }

  // Persist permanent starter bond to Cloud Firestore
  await syncStarterDigimonToCloud(record);

  return {
    success: true,
    message: `${profile.name} agora é seu parceiro oficial no Mundo Digital!`,
    saved: record,
  };
}

export function prepareQuickTestSession(params: {
  formId: DigimonFormId;
  tamerId?: TamerId;
  accountUsername?: string;
}): { savedTamer: SavedCharacterSelection; savedStarter: SavedStarterDigimon } {
  const cleanAccount = (params.accountUsername ?? 'TamerTeste').trim() || 'TamerTeste';
  const cleanKey = cleanAccount.toLowerCase();
  const tamerId: TamerId = params.tamerId ?? 'kai';
  const formProfile = getDigimonFormProfile(params.formId);
  const starterProfile = getStarterDigimonById(formProfile.starterId);
  const sprites = getTamerSprites(tamerId);
  const nowIso = new Date().toISOString();

  const savedTamer: SavedCharacterSelection = {
    accountUsername: cleanAccount,
    characterId: tamerId,
    tamerName: cleanAccount,
    spritesheetMeta: {
      frameWidth: sprites.frameWidth,
      frameHeight: sprites.frameHeight,
      columns: sprites.columns,
      rows: sprites.rows,
      directions: sprites.directions,
    },
    updatedAt: nowIso,
  };

  const savedStarter: SavedStarterDigimon = {
    accountUsername: cleanAccount,
    digimonId: starterProfile.id,
    digimonName: starterProfile.name,
    element: starterProfile.element,
    chosenAt: nowIso,
  };

  try {
    window.localStorage.setItem(
      `${CHARACTER_SELECTION_PREFIX}${cleanKey}`,
      JSON.stringify(savedTamer)
    );
    window.localStorage.setItem(
      `${STARTER_SELECTION_PREFIX}${cleanKey}`,
      JSON.stringify(savedStarter)
    );
  } catch {
    // Graceful fallback if localStorage is unavailable
  }

  applyQuickTestDigimonFormToHudState(cleanAccount, formProfile.id);

  return { savedTamer, savedStarter };
}

function mapFirebaseAuthError(error: unknown): {
  message: string;
  errorField?: AuthResponse['errorField'];
  emailProviderDisabled?: boolean;
} {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        message: 'Usuário/e-mail ou senha incorretos. Verifique seus dados e tente novamente.',
        errorField: 'password',
      };
    case 'auth/invalid-email':
      return {
        message: 'Endereço de e-mail inválido.',
        errorField: 'email',
      };
    case 'auth/email-already-in-use':
      return {
        message: 'Este e-mail já está cadastrado. Faça login ou use "Esqueci minha senha".',
        errorField: 'email',
      };
    case 'auth/weak-password':
      return {
        message: 'Senha muito fraca. Utilize pelo menos 6 caracteres.',
        errorField: 'password',
      };
    case 'auth/too-many-requests':
      return {
        message: 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.',
        errorField: 'general',
      };
    case 'auth/operation-not-allowed':
      return {
        message:
          'O login por E-mail/Senha ainda precisa ser ativado no Firebase Console (Authentication → Sign-in method → E-mail/senha). Você já pode entrar agora usando "Entrar com Google".',
        errorField: 'general',
        emailProviderDisabled: true,
      };
    case 'auth/popup-closed-by-user':
      return {
        message: 'Janela de login do Google fechada antes da conclusão.',
        errorField: 'general',
      };
    case 'auth/popup-blocked':
      return {
        message: 'O navegador bloqueou o pop-up do Google. Permita pop-ups para entrar.',
        errorField: 'general',
      };
    case 'auth/network-request-failed':
      return {
        message: 'Sem conexão com o servidor de autenticação. Verifique sua internet.',
        errorField: 'general',
      };
    default:
      return {
        message: 'Não foi possível concluir a autenticação. Tente novamente.',
        errorField: 'general',
      };
  }
}

/**
 * Production Firebase Authentication & Firestore Cloud Save adapter.
 * Supports login via Email or remembered Username + Password, Google Sign-In,
 * email verification enforcement, password reset, and automatic cloud sync.
 */
class FirebaseDigitalWarAuthService implements AuthAdapter {
  async signInWithCredentials(
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    const idError = validateLoginIdentifier(credentials.username);
    if (idError) {
      return {
        success: false,
        message: idError,
        errorField: 'username',
      };
    }

    const passwordError = validatePassword(credentials.password);
    if (passwordError) {
      return {
        success: false,
        message: passwordError,
        errorField: 'password',
      };
    }

    const rawIdentifier = credentials.username.trim();
    const isEmail = rawIdentifier.includes('@');
    let loginEmail = isEmail ? rawIdentifier.toLowerCase() : '';

    if (!isEmail) {
      const rememberedEmail = resolveRememberedEmailForUsername(rawIdentifier);
      if (!rememberedEmail) {
        return {
          success: false,
          message:
            'Neste dispositivo, faça o primeiro login usando seu e-mail cadastrado (ou Entrar com Google). Depois disso, seu nome de usuário funcionará automaticamente aqui.',
          errorField: 'username',
        };
      }
      loginEmail = rememberedEmail;
    }

    try {
      await setPersistence(
        auth,
        credentials.rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      const cred = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        credentials.password
      );
      const fbUser = cred.user;

      if (!fbUser.emailVerified) {
        return {
          success: false,
          requiresEmailVerification: true,
          message:
            'Confirme seu e-mail pelo link enviado antes de entrar para ativar o salvamento na nuvem.',
          errorField: 'general',
        };
      }

      const preferredHandle = !isEmail
        ? rawIdentifier
        : fbUser.displayName || loginEmail.split('@')[0];
      const cloud = await bootstrapPlayerCloudProfile(
        fbUser,
        preferredHandle,
        'password'
      );

      rememberUsernameEmailAlias(cloud.username, fbUser.email);
      persistRememberPreference(credentials.rememberMe, rawIdentifier);
      hydrateLocalCacheFromCloud(cloud.username, cloud);
      const isGM = await resolveIsGmAccount(fbUser);

      return {
        success: true,
        message: `Bem-vindo de volta, ${cloud.username}! Progresso sincronizado na nuvem.`,
        user: {
          uid: fbUser.uid,
          username: cloud.username,
          email: fbUser.email ?? undefined,
          persistence: credentials.rememberMe ? 'local' : 'session',
          authProvider: 'password',
          isGM,
        },
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
        emailProviderDisabled: mapped.emailProviderDisabled,
      };
    }
  }

  async signInWithGoogle(rememberMe = true): Promise<AuthResponse> {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;

      const preferredHandle = sanitizePlayerUsername(
        fbUser.displayName || fbUser.email?.split('@')[0] || 'Tamer',
        fbUser.uid
      );
      const cloud = await bootstrapPlayerCloudProfile(
        fbUser,
        preferredHandle,
        'google'
      );

      rememberUsernameEmailAlias(cloud.username, fbUser.email);
      hydrateLocalCacheFromCloud(cloud.username, cloud);
      const isGM = await resolveIsGmAccount(fbUser);

      return {
        success: true,
        message: `Conta Google conectada como ${cloud.username}. Progresso salvo na nuvem!`,
        user: {
          uid: fbUser.uid,
          username: cloud.username,
          email: fbUser.email ?? undefined,
          persistence: rememberMe ? 'local' : 'session',
          authProvider: 'google',
          isGM,
        },
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async createAccount(payload: RegisterCredentials): Promise<AuthResponse> {
    const usernameError = validateUsername(payload.username);
    if (usernameError) {
      return { success: false, message: usernameError, errorField: 'username' };
    }

    const emailTrimmed = payload.email.trim().toLowerCase();
    if (!emailTrimmed || !EMAIL_REGEX.test(emailTrimmed)) {
      return {
        success: false,
        message: 'Informe um e-mail válido para vincular sua conta.',
        errorField: 'email',
      };
    }

    const passwordError = validatePassword(payload.password);
    if (passwordError) {
      return { success: false, message: passwordError, errorField: 'password' };
    }

    if (payload.password !== payload.confirmPassword) {
      return {
        success: false,
        message: 'As senhas digitadas não coincidem.',
        errorField: 'confirmPassword',
      };
    }

    const cleanUsername = sanitizePlayerUsername(payload.username);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(
        auth,
        emailTrimmed,
        payload.password
      );
      await updateProfile(cred.user, { displayName: cleanUsername });
      rememberUsernameEmailAlias(cleanUsername, emailTrimmed);
      persistRememberPreference(true, cleanUsername);

      await sendEmailVerification(cred.user);

      return {
        success: true,
        requiresEmailVerification: true,
        message: `Conta "${cleanUsername}" criada! Enviamos um link de confirmação para ${emailTrimmed}. Clique no link e depois toque em "Já confirmei — Entrar".`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
        emailProviderDisabled: mapped.emailProviderDisabled,
      };
    }
  }

  async reloadVerifiedUser(preferredUsername?: string): Promise<AuthResponse> {
    const current = auth.currentUser;
    if (!current) {
      return {
        success: false,
        message: 'Nenhuma sessão ativa encontrada. Faça login novamente.',
        errorField: 'general',
      };
    }

    try {
      await current.reload();
      await current.getIdToken(true);
      if (!current.emailVerified) {
        return {
          success: false,
          requiresEmailVerification: true,
          message:
            'Seu e-mail ainda não consta como confirmado. Verifique sua caixa de entrada ou spam e tente novamente.',
          errorField: 'general',
        };
      }

      const cloud = await bootstrapPlayerCloudProfile(
        current,
        preferredUsername || current.displayName || undefined,
        'password'
      );
      rememberUsernameEmailAlias(cloud.username, current.email);
      hydrateLocalCacheFromCloud(cloud.username, cloud);
      const isGM = await resolveIsGmAccount(current);

      return {
        success: true,
        message: `E-mail confirmado! Bem-vindo, ${cloud.username}.`,
        user: {
          uid: current.uid,
          username: cloud.username,
          email: current.email ?? undefined,
          persistence: 'local',
          authProvider: 'password',
          isGM,
        },
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async resendVerificationEmail(): Promise<AuthResponse> {
    const current = auth.currentUser;
    if (!current) {
      return {
        success: false,
        message: 'Faça login com seu e-mail e senha primeiro para reenviar o link.',
        errorField: 'general',
      };
    }
    try {
      await sendEmailVerification(current);
      return {
        success: true,
        requiresEmailVerification: true,
        message: `Novo link de verificação enviado para ${current.email ?? 'seu e-mail'}.`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async sendPasswordReset(identifier: string): Promise<AuthResponse> {
    const trimmed = identifier.trim();
    if (!trimmed || trimmed.length < 3) {
      return {
        success: false,
        message: 'Digite seu e-mail ou usuário cadastrado.',
        errorField: 'email',
      };
    }

    let targetEmail = trimmed.includes('@')
      ? trimmed.toLowerCase()
      : resolveRememberedEmailForUsername(trimmed) ?? '';

    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return {
        success: false,
        message: 'Digite o endereço de e-mail completo vinculado à sua conta.',
        errorField: 'email',
      };
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      return {
        success: true,
        message: `Link de redefinição de senha enviado para ${targetEmail}. Confira sua caixa de entrada e spam.`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async signOutAccount(): Promise<void> {
    await Promise.all([
      flushPendingCloudSaves(),
      markLocalWorldPresenceOffline(),
    ]);
    clearCloudSaveSessionCache();
    await signOut(auth);
  }
}

export const authService: AuthAdapter = new FirebaseDigitalWarAuthService();
