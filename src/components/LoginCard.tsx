import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MailCheck,
  RefreshCw,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import {
  authService,
  getStoredRememberPreference,
  prepareQuickTestSession,
  validateLoginIdentifier,
  validatePassword,
} from '../services/authService';
import { TAMER_CHARACTERS } from '../sprites/tamerSprites';
import type { AuthUserSummary, ModalSection } from '../types/auth';
import type { TamerId } from '../types/character';
import {
  DIGIMON_FORM_PROFILES,
  EVOLUTION_FORM_CHAINS,
  getDigimonFormProfile,
  type DigimonFormId,
  type StarterDigimonId,
} from '../types/digimon';
import { playDigitalTone } from '../utils/soundFx';

const LAST_TEST_FORM_KEY = 'dw_test_last_form_id';
const LAST_TEST_TAMER_KEY = 'dw_test_last_tamer_id';
const STARTER_LINE_ORDER: readonly { id: StarterDigimonId; label: string; dotClass: string }[] = [
  { id: 'agumon', label: 'Fogo', dotClass: 'bg-amber-400' },
  { id: 'gaomon', label: 'Velocidade', dotClass: 'bg-sky-400' },
  { id: 'lalamon', label: 'Natureza', dotClass: 'bg-fuchsia-400' },
];

function getInitialTestFormId(): DigimonFormId {
  try {
    const raw = window.localStorage.getItem(LAST_TEST_FORM_KEY) as DigimonFormId | null;
    if (raw && raw in DIGIMON_FORM_PROFILES) return raw;
  } catch {
    // Ignore storage unavailability
  }
  return 'agumon';
}

function getInitialTestTamerId(): TamerId {
  try {
    const raw = window.localStorage.getItem(LAST_TEST_TAMER_KEY) as TamerId | null;
    if (raw && TAMER_CHARACTERS.some((t) => t.id === raw)) return raw;
  } catch {
    // Ignore storage unavailability
  }
  return 'kai';
}

interface LoginCardProps {
  soundEnabled: boolean;
  onOpenModal: (section: ModalSection) => void;
  onLoginSuccess?: (user: AuthUserSummary) => void;
}

export function LoginCard({
  soundEnabled,
  onOpenModal,
  onLoginSuccess,
}: LoginCardProps) {
  const initialStored = getStoredRememberPreference();

  const [username, setUsername] = useState(initialStored.username);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(initialStored.rememberMe);
  const [showPassword, setShowPassword] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ username: false, password: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [selectedTestFormId, setSelectedTestFormId] = useState<DigimonFormId>(
    getInitialTestFormId
  );
  const [selectedTestTamerId, setSelectedTestTamerId] = useState<TamerId>(
    getInitialTestTamerId
  );
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedTestForm = getDigimonFormProfile(selectedTestFormId);

  function handleSelectTestForm(formId: DigimonFormId) {
    playDigitalTone('click', soundEnabled);
    setSelectedTestFormId(formId);
    try {
      window.localStorage.setItem(LAST_TEST_FORM_KEY, formId);
    } catch {
      // Ignore storage errors
    }
  }

  function handleSelectTestTamer(tamerId: TamerId) {
    playDigitalTone('click', soundEnabled);
    setSelectedTestTamerId(tamerId);
    try {
      window.localStorage.setItem(LAST_TEST_TAMER_KEY, tamerId);
    } catch {
      // Ignore storage errors
    }
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    setStatusFeedback(null);
    setNeedsVerification(false);
    if (touched.username) {
      setUsernameError(validateLoginIdentifier(value));
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setStatusFeedback(null);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
  }

  function handleUsernameBlur() {
    setTouched((prev) => ({ ...prev, username: true }));
    setUsernameError(validateLoginIdentifier(username));
  }

  function handlePasswordBlur() {
    setTouched((prev) => ({ ...prev, password: true }));
    setPasswordError(validatePassword(password));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const uErr = validateLoginIdentifier(username);
    const pErr = validatePassword(password);

    setTouched({ username: true, password: true });
    setUsernameError(uErr);
    setPasswordError(pErr);

    if (uErr || pErr) {
      playDigitalTone('error', soundEnabled);
      setStatusFeedback({
        type: 'error',
        text: 'Verifique os campos destacados antes de entrar.',
      });
      return;
    }

    playDigitalTone('click', soundEnabled);
    setIsSubmitting(true);
    setStatusFeedback(null);
    setNeedsVerification(false);

    try {
      const result = await authService.signInWithCredentials({
        username,
        password,
        rememberMe,
      });

      if (!result.success) {
        playDigitalTone('error', soundEnabled);
        if (result.errorField === 'username') setUsernameError(result.message);
        if (result.errorField === 'password') setPasswordError(result.message);
        if (result.requiresEmailVerification) setNeedsVerification(true);
        setStatusFeedback({ type: 'error', text: result.message });
      } else {
        playDigitalTone('confirm', soundEnabled);
        setStatusFeedback({ type: 'success', text: result.message });
        if (result.user && onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } catch {
      playDigitalTone('error', soundEnabled);
      setStatusFeedback({
        type: 'error',
        text: 'Não foi possível validar sua conexão. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (isSubmitting || isGoogleLoading) return;
    playDigitalTone('click', soundEnabled);
    setIsGoogleLoading(true);
    setStatusFeedback(null);
    setNeedsVerification(false);

    try {
      const result = await authService.signInWithGoogle(rememberMe);
      if (!result.success) {
        playDigitalTone('error', soundEnabled);
        setStatusFeedback({ type: 'error', text: result.message });
      } else {
        playDigitalTone('confirm', soundEnabled);
        setStatusFeedback({ type: 'success', text: result.message });
        if (result.user && onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  function handleQuickTestEnter() {
    if (isSubmitting || isGoogleLoading) return;
    prepareQuickTestSession({
      formId: selectedTestFormId,
      tamerId: selectedTestTamerId,
      accountUsername: 'TamerTeste',
    });
    playDigitalTone('confirm', soundEnabled);
    setStatusFeedback({
      type: 'success',
      text: `Entrando com ${selectedTestForm.name} (Nv. ${selectedTestForm.unlockLevel}) e Painel GM ativo...`,
    });
    if (onLoginSuccess) {
      onLoginSuccess({
        uid: 'local-test-tamer',
        username: 'TamerTeste',
        persistence: 'local',
        authProvider: 'password',
        isGM: false,
      });
    }
  }

  async function handleCheckVerification() {
    setIsSubmitting(true);
    setStatusFeedback(null);
    const res = await authService.reloadVerifiedUser(
      username.includes('@') ? undefined : username
    );
    setIsSubmitting(false);
    playDigitalTone(res.success ? 'confirm' : 'error', soundEnabled);
    setStatusFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success && res.user && onLoginSuccess) {
      setNeedsVerification(false);
      onLoginSuccess(res.user);
    }
  }

  async function handleResendVerification() {
    setIsSubmitting(true);
    const res = await authService.resendVerificationEmail();
    setIsSubmitting(false);
    playDigitalTone(res.success ? 'confirm' : 'error', soundEnabled);
    setStatusFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  }

  return (
    <section
      aria-label="Formulário de login"
      className="relative z-10 mx-auto w-full max-w-[392px] px-3.5 sm:px-4"
    >
      {/* Side cyber frame brackets */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#00e5ff]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#00e5ff]"
      />

      {/* Outer glowing neon-blue chamfered frame */}
      <div className="clip-cyber-panel bg-gradient-to-b from-[#2be3ff] via-[#0073ff] to-[#2be3ff] p-[1.5px] shadow-[0_0_28px_rgba(0,174,255,0.42)]">
        {/* Inner dark translucent cyber panel */}
        <div className="clip-cyber-panel relative bg-gradient-to-b from-[#071a42]/95 via-[#04102b]/95 to-[#06183c]/95 px-4 pb-4 pt-4 backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-5">
          {/* Subtle top inner glow bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[2px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-90"
          />

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* 1. CAMPO DE USUÁRIO OU E-MAIL */}
            <div>
              <label htmlFor="login-username" className="sr-only">
                Usuário ou E-mail
              </label>
              <div
                className={`clip-cyber-input p-[1px] transition-colors duration-150 ${
                  usernameError
                    ? 'bg-gradient-to-r from-[#ff4d6d] via-[#ff758f] to-[#ff4d6d] shadow-[0_0_12px_rgba(255,77,109,0.4)]'
                    : 'bg-gradient-to-r from-[#1354a8] via-[#26a4ff] to-[#1354a8] focus-within:from-[#00e1ff] focus-within:via-[#6beeff] focus-within:to-[#00e1ff] focus-within:shadow-[0_0_14px_rgba(0,225,255,0.45)]'
                }`}
              >
                <div className="clip-cyber-input flex min-h-[48px] items-center bg-[#040e24]/95">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-sky-400/20 bg-sky-950/35 text-sky-100">
                    <User className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={handleUsernameBlur}
                    placeholder="Usuário ou E-mail"
                    aria-invalid={Boolean(usernameError)}
                    aria-describedby={
                      usernameError ? 'login-username-error' : undefined
                    }
                    className="h-12 w-full bg-transparent px-3.5 text-[15px] font-medium text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              {usernameError && (
                <p
                  id="login-username-error"
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-[#ff8fa3]"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{usernameError}</span>
                </p>
              )}
            </div>

            {/* 2. CAMPO DE SENHA */}
            <div>
              <label htmlFor="login-password" className="sr-only">
                Senha
              </label>
              <div
                className={`clip-cyber-input p-[1px] transition-colors duration-150 ${
                  passwordError
                    ? 'bg-gradient-to-r from-[#ff4d6d] via-[#ff758f] to-[#ff4d6d] shadow-[0_0_12px_rgba(255,77,109,0.4)]'
                    : 'bg-gradient-to-r from-[#1354a8] via-[#26a4ff] to-[#1354a8] focus-within:from-[#00e1ff] focus-within:via-[#6beeff] focus-within:to-[#00e1ff] focus-within:shadow-[0_0_14px_rgba(0,225,255,0.45)]'
                }`}
              >
                <div className="clip-cyber-input flex min-h-[48px] items-center bg-[#040e24]/95">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r border-sky-400/20 bg-sky-950/35 text-sky-100">
                    <Lock className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={handlePasswordBlur}
                    placeholder="Senha"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? 'login-password-error' : undefined
                    }
                    className="h-12 w-full bg-transparent pl-3.5 pr-1 text-[15px] font-medium text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="flex h-12 min-w-[46px] shrink-0 items-center justify-center text-slate-300 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-[#ff8fa3]"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* 3. OPÇÕES: Lembrar-me & Esqueci minha senha */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="group flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    playDigitalTone('click', soundEnabled);
                    setRememberMe(e.target.checked);
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 ${
                    rememberMe
                      ? 'border-[#38e8ff] bg-gradient-to-b from-[#178eff] to-[#0051cc] shadow-[0_0_10px_rgba(0,180,255,0.65)]'
                      : 'border-sky-400/50 bg-[#051330] group-hover:border-cyan-300'
                  }`}
                >
                  {rememberMe && (
                    <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                  )}
                </span>
                <span className="text-[13px] font-semibold text-white/95 sm:text-sm">
                  Lembrar-me
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  onOpenModal('forgot-password');
                }}
                className="min-h-[44px] px-1 text-right text-[13px] font-semibold text-[#2be3ff] underline decoration-[#2be3ff]/70 underline-offset-4 transition-colors hover:text-cyan-200 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:text-sm"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Inline status feedback */}
            {statusFeedback && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium leading-relaxed ${
                  statusFeedback.type === 'success'
                    ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-100'
                    : 'border-rose-400/50 bg-rose-950/60 text-rose-100'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-300"
                    aria-hidden="true"
                  />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            {/* Inline Email Verification Actions when required */}
            {needsVerification && (
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-400/35 bg-[#051538]/90 p-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckVerification}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-emerald-500/25 border border-emerald-400/60 px-2.5 text-[11px] font-extrabold text-emerald-100 transition-colors hover:bg-emerald-500/35 disabled:opacity-60"
                >
                  <MailCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Já confirmei</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResendVerification}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-2.5 text-[11px] font-extrabold text-cyan-100 transition-colors hover:bg-cyan-500/25 disabled:opacity-60"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span>Reenviar link</span>
                </button>
              </div>
            )}

            {/* 4A. BOTÃO ENTRAR (Dourado com efeitos luminosos) */}
            <div className="pt-0.5">
              <div className="clip-cyber-btn bg-gradient-to-b from-[#fff5b8] via-[#ffb703] to-[#cc5800] p-[1.5px] shadow-[0_0_22px_rgba(255,174,0,0.6)] transition-transform duration-150 hover:brightness-110 active:scale-[0.985]">
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="clip-cyber-btn relative flex min-h-[48px] w-full items-center justify-center gap-2 bg-gradient-to-b from-[#ffe259] via-[#ffa718] to-[#e66f00] px-6 py-2.5 font-[family-name:var(--font-display)] text-[19px] tracking-wider text-[#081226] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-wait disabled:opacity-85 sm:text-[21px]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0.5 h-[38%] rounded-full bg-gradient-to-b from-white/55 to-transparent"
                  />
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="relative h-5 w-5 animate-spin text-[#081226]"
                        aria-hidden="true"
                      />
                      <span className="relative text-base font-extrabold tracking-wide">
                        ENTRANDO...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative italic drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
                        ENTRAR
                      </span>
                      <ChevronsRight
                        className="relative h-6 w-6 stroke-[2.75] text-[#081226]"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divisor "ou" */}
            <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-sky-400/55 to-sky-300/80" />
              <span className="text-xs font-bold tracking-wide text-slate-200">
                ou
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-sky-400/55 to-sky-300/80" />
            </div>

            {/* 4B. BOTÃO ENTRAR COM GOOGLE (Salvamento em Nuvem Instantâneo) */}
            <div>
              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-extrabold tracking-wide text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-transform duration-150 hover:bg-slate-50 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-wait disabled:opacity-75"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.96H1.28v3.1A12 12 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.1z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading ? 'CONECTANDO...' : 'ENTRAR COM GOOGLE'}
                </span>
              </button>
            </div>

            {/* 4C. BOTÃO CRIAR CONTA (Azul neon) */}
            <div>
              <div className="clip-cyber-btn bg-gradient-to-b from-[#78f0ff] via-[#1aa3ff] to-[#0055d4] p-[1.5px] shadow-[0_0_18px_rgba(0,174,255,0.5)] transition-transform duration-150 hover:brightness-110 active:scale-[0.985]">
                <button
                  type="button"
                  disabled={isSubmitting || isGoogleLoading}
                  onClick={() => {
                    playDigitalTone('click', soundEnabled);
                    onOpenModal('register');
                  }}
                  className="clip-cyber-btn relative flex min-h-[46px] w-full items-center justify-center gap-2.5 bg-gradient-to-b from-[#21a8ff] via-[#006be6] to-[#0041a8] px-5 py-2.5 text-[15px] font-extrabold tracking-wider text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-75 sm:text-base"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0.5 h-[36%] rounded-full bg-gradient-to-b from-white/30 to-transparent"
                  />
                  <UserPlus className="relative h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="relative">CRIAR CONTA</span>
                </button>
              </div>
            </div>

            {/* 4D. ACESSO RÁPIDO PARA TESTES (Escolha qualquer Digimon jogável + Painel GM ativo) */}
            <div className="space-y-2 rounded-xl border border-amber-400/40 bg-[#05122c]/90 p-2.5 shadow-[0_0_18px_rgba(251,191,36,0.16)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
                    Teste Rápido · Escolha o Digimon
                  </span>
                </div>
                <span className="rounded border border-amber-300/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                  {selectedTestForm.stage} · Nv.{selectedTestForm.unlockLevel}
                </span>
              </div>

              {/* 12 Playable Digimons across all 3 evolution chains */}
              <div className="space-y-1.5">
                {STARTER_LINE_ORDER.map((line) => {
                  const forms = EVOLUTION_FORM_CHAINS[line.id];
                  return (
                    <div key={line.id} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-0.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${line.dotClass}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          Linha {line.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {forms.map((form) => {
                          const isSelected = form.id === selectedTestFormId;
                          return (
                            <button
                              key={form.id}
                              type="button"
                              onClick={() => handleSelectTestForm(form.id)}
                              title={`${form.name} (${form.stage} · Nv.${form.unlockLevel})`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: form.theme.accentHex,
                                      boxShadow: `0 0 12px ${form.theme.glowRgba}`,
                                    }
                                  : undefined
                              }
                              className={`group flex flex-col items-center rounded-lg border px-1 py-1.5 text-center transition ${
                                isSelected
                                  ? 'bg-[#0b2352] text-white'
                                  : 'border-sky-400/20 bg-[#041028]/80 text-slate-300 hover:border-sky-300/55 hover:bg-[#081b40]'
                              }`}
                            >
                              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-slate-950/60">
                                <img
                                  src={form.portraitUrl}
                                  alt={form.name}
                                  className="h-8 w-8 object-contain transition-transform duration-150 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                              <span className="mt-1 w-full truncate text-[9px] font-extrabold tracking-tight">
                                {form.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold ${
                                  isSelected ? 'text-amber-200' : 'text-cyan-300/80'
                                }`}
                              >
                                Nv.{form.unlockLevel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Digimon skills summary + compact Tamer switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-400/20 bg-[#030b1d]/85 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-cyan-200">
                    F1: {selectedTestForm.special1Name} · F2: {selectedTestForm.special2Name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400">
                    Tamer:
                  </span>
                  {TAMER_CHARACTERS.map((tamer) => {
                    const active = tamer.id === selectedTestTamerId;
                    const label =
                      tamer.id.charAt(0).toUpperCase() + tamer.id.slice(1);
                    return (
                      <button
                        key={tamer.id}
                        type="button"
                        onClick={() => handleSelectTestTamer(tamer.id)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold transition ${
                          active
                            ? 'border border-cyan-300 bg-cyan-500/25 text-white'
                            : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={handleQuickTestEnter}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300/75 bg-gradient-to-r from-[#2c1902]/95 via-[#4b2a04]/95 to-[#2c1902]/95 px-3 py-2 text-xs font-extrabold tracking-wide text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.3)] transition hover:border-amber-200 hover:brightness-110 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-75 sm:text-[13px]"
              >
                <Zap className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                <span className="truncate">
                  ENTRAR DIRETO · {selectedTestForm.name} (NV.{selectedTestForm.unlockLevel})
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
