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
import type { AuthUserSummary, ModalSection } from '../types/auth';
import { playDigitalTone } from '../utils/soundFx';

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
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
      formId: 'agumon',
      tamerId: 'kai',
      accountUsername: 'TamerTeste',
    });
    playDigitalTone('confirm', soundEnabled);
    setStatusFeedback({
      type: 'success',
      text: 'Entrando automaticamente no Mundo Digital...',
    });
    if (onLoginSuccess) {
      onLoginSuccess({
        uid: 'local-test-tamer',
        username: 'TamerTeste',
        persistence: 'local',
        authProvider: 'password',
        isGM: true,
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
        <div className="clip-cyber-panel relative bg-gradient-to-b from-[#071a42]/95 via-[#04102b]/95 to-[#06183c]/95 px-3.5 pb-4 pt-3.5 backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-4">
          {/* Subtle top inner glow bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[2px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-90"
          />

          <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
            {/* BOTÃO ÚNICO DE ENTRADA AUTOMÁTICA (SEM LOGIN) */}
            <div className="clip-cyber-btn bg-gradient-to-r from-[#5efce8] via-[#22d3ee] to-[#fbbf24] p-[1.5px] shadow-[0_0_20px_rgba(34,211,238,0.42)] transition-transform duration-150 hover:brightness-110 active:scale-[0.985]">
              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={handleQuickTestEnter}
                className="clip-cyber-btn relative flex min-h-[50px] w-full items-center justify-center gap-2 bg-gradient-to-r from-[#07335e] via-[#094775] to-[#08305c] px-4 py-2.5 text-center font-extrabold tracking-wide text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-75"
              >
                <Zap className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                <span className="whitespace-nowrap text-[13px] tracking-wider text-amber-100 sm:text-sm">
                  ENTRAR AUTOMATICAMENTE
                </span>
                <ChevronsRight
                  className="h-4 w-4 shrink-0 text-cyan-300"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-2.5 pt-0.5" aria-hidden="true">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-sky-400/50 to-sky-300/75" />
              <span className="text-[11px] font-bold tracking-wide text-sky-200/90">
                ou entre com sua conta
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-sky-400/50 to-sky-300/75" />
            </div>

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
                <div className="clip-cyber-input flex min-h-[46px] items-center bg-[#040e24]/95">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-sky-400/20 bg-sky-950/35 text-sky-100">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
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
                    className="h-11 w-full bg-transparent px-3 text-[16px] font-medium text-white placeholder:text-slate-400 focus:outline-none sm:text-[15px]"
                  />
                </div>
              </div>
              {usernameError && (
                <p
                  id="login-username-error"
                  role="alert"
                  className="mt-1 flex items-center gap-1.5 px-1 text-xs font-medium text-[#ff8fa3]"
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
                <div className="clip-cyber-input flex min-h-[46px] items-center bg-[#040e24]/95">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-sky-400/20 bg-sky-950/35 text-sky-100">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
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
                    className="h-11 w-full bg-transparent pl-3 pr-1 text-[16px] font-medium text-white placeholder:text-slate-400 focus:outline-none sm:text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="flex h-11 min-w-[44px] shrink-0 items-center justify-center text-slate-300 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
                  className="mt-1 flex items-center gap-1.5 px-1 text-xs font-medium text-[#ff8fa3]"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* 3. OPÇÕES: Lembrar-me & Esqueci minha senha */}
            <div className="flex items-center justify-between gap-2">
              <label className="group flex min-h-[44px] cursor-pointer items-center gap-2 select-none">
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
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium leading-relaxed ${
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
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-400/35 bg-[#051538]/90 p-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckVerification}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/25 px-2.5 text-[11px] font-extrabold text-emerald-100 transition-colors hover:bg-emerald-500/35 disabled:opacity-60"
                >
                  <MailCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Já confirmei</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResendVerification}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-2.5 text-[11px] font-extrabold text-cyan-100 transition-colors hover:bg-cyan-500/25 disabled:opacity-60"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span>Reenviar link</span>
                </button>
              </div>
            )}

            {/* 4A. BOTÃO ENTRAR (Dourado com efeitos luminosos) */}
            <div>
              <div className="clip-cyber-btn bg-gradient-to-b from-[#fff5b8] via-[#ffb703] to-[#cc5800] p-[1.5px] shadow-[0_0_20px_rgba(255,174,0,0.55)] transition-transform duration-150 hover:brightness-110 active:scale-[0.985]">
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="clip-cyber-btn relative flex min-h-[46px] w-full items-center justify-center gap-2 bg-gradient-to-b from-[#ffe259] via-[#ffa718] to-[#e66f00] px-6 py-2 font-[family-name:var(--font-display)] text-[18px] tracking-wider text-[#081226] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-wait disabled:opacity-85 sm:text-[20px]"
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

            {/* 4B & 4C. GOOGLE + CRIAR CONTA */}
            <div className="grid grid-cols-1 gap-2 pt-0.5">
              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-[13.5px] font-extrabold tracking-wide text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-transform duration-150 hover:bg-slate-50 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-wait disabled:opacity-75 sm:text-sm"
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

              <div className="clip-cyber-btn bg-gradient-to-b from-[#78f0ff] via-[#1aa3ff] to-[#0055d4] p-[1.5px] shadow-[0_0_16px_rgba(0,174,255,0.45)] transition-transform duration-150 hover:brightness-110 active:scale-[0.985]">
                <button
                  type="button"
                  disabled={isSubmitting || isGoogleLoading}
                  onClick={() => {
                    playDigitalTone('click', soundEnabled);
                    onOpenModal('register');
                  }}
                  className="clip-cyber-btn relative flex min-h-[44px] w-full items-center justify-center gap-2 bg-gradient-to-b from-[#21a8ff] via-[#006be6] to-[#0041a8] px-5 py-2 text-[14px] font-extrabold tracking-wider text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-75 sm:text-[15px]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0.5 h-[36%] rounded-full bg-gradient-to-b from-white/30 to-transparent"
                  />
                  <UserPlus className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span className="relative">CRIAR CONTA</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
