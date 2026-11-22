/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { AlphaFeedbackModal } from './components/AlphaFeedbackModal';
import { BottomMenu } from './components/BottomMenu';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { DigimonSelectScreen } from './components/DigimonSelectScreen';
import { FooterBanner } from './components/FooterBanner';
import { GameLogo } from './components/GameLogo';
import { HeroScene } from './components/HeroScene';
import { LoginCard } from './components/LoginCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TamerWorldCanvas } from './components/TamerWorldCanvas';
import { UtilityModal } from './components/UtilityModal';
import { auth } from './firebase';
import {
  authService,
  getSavedCharacterForAccount,
  getSavedStarterDigimonForAccount,
  overrideCharacterForGm,
  overrideStarterDigimonForGm,
  rememberUsernameEmailAlias,
} from './services/authService';
import {
  bootstrapPlayerCloudProfile,
  flushPendingCloudSaves,
  hydrateLocalCacheFromCloud,
} from './services/cloudSaveService';
import { resolveIsGmAccount } from './services/gmRoleService';
import type {
  AppPreferences,
  AuthUserSummary,
  ModalSection,
} from './types/auth';
import type { SavedCharacterSelection, TamerId } from './types/character';
import type { SavedStarterDigimon, StarterDigimonId } from './types/digimon';
import { selectionThemePlayer } from './utils/soundFx';

type AppScreen = 'login' | 'character-select' | 'digimon-select' | 'world';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('login');
  const [authReady, setAuthReady] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthUserSummary | null>(null);
  const [selectedTamer, setSelectedTamer] =
    useState<SavedCharacterSelection | null>(null);
  const [selectedDigimon, setSelectedDigimon] =
    useState<SavedStarterDigimon | null>(null);
  const [activeModal, setActiveModal] = useState<ModalSection | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<string>('login');
  const [preferences, setPreferences] = useState<AppPreferences>({
    soundEnabled: true,
    animationsEnabled: true,
    graphicsQuality: 'alta',
  });

  const showMotion =
    preferences.animationsEnabled && preferences.graphicsQuality === 'alta';

  const isSelectionPhase =
    activeScreen === 'character-select' || activeScreen === 'digimon-select';

  // Restore verified Firebase session and cloud save automatically on reload
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;

      if (!fbUser || !fbUser.emailVerified) {
        setAuthReady(true);
        return;
      }

      try {
        const providerId = fbUser.providerData[0]?.providerId;
        const provider: 'google' | 'password' =
          providerId === 'google.com' ? 'google' : 'password';
        const cloud = await bootstrapPlayerCloudProfile(
          fbUser,
          fbUser.displayName || undefined,
          provider
        );
        if (!active) return;

        rememberUsernameEmailAlias(cloud.username, fbUser.email);
        hydrateLocalCacheFromCloud(cloud.username, cloud);
        const isGM = await resolveIsGmAccount(fbUser);
        if (!active) return;

        const summary: AuthUserSummary = {
          uid: fbUser.uid,
          username: cloud.username,
          email: fbUser.email ?? undefined,
          persistence: 'local',
          authProvider: provider,
          isGM,
        };
        setAuthenticatedUser(summary);

        const savedChar = getSavedCharacterForAccount(cloud.username);
        const savedStarter = getSavedStarterDigimonForAccount(cloud.username);

        setActiveScreen((prev) => {
          if (prev !== 'login') return prev;
          if (savedChar && savedStarter) {
            setSelectedTamer(savedChar);
            setSelectedDigimon(savedStarter);
            return 'world';
          }
          if (savedChar) {
            setSelectedTamer(savedChar);
            return 'digimon-select';
          }
          return 'character-select';
        });
      } catch (err) {
        console.error('Failed to restore cloud session:', err);
      } finally {
        if (active) setAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Flush debounced Firestore cloud saves whenever the user backgrounds or closes the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushPendingCloudSaves();
      }
    };
    const handlePageHide = () => {
      void flushPendingCloudSaves();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Keep "Vem Comigo" playing continuously across Tamer Select -> Starter Digimon Select,
  // stopping smoothly only once the player finishes selection and spawns in DATS (or returns to login).
  useEffect(() => {
    if (isSelectionPhase) {
      selectionThemePlayer.start(preferences.soundEnabled);
    } else {
      selectionThemePlayer.stop();
    }
  }, [isSelectionPhase, preferences.soundEnabled]);

  useEffect(() => {
    selectionThemePlayer.setMuted(!preferences.soundEnabled);
  }, [preferences.soundEnabled]);

  useEffect(() => {
    return () => {
      selectionThemePlayer.stop();
    };
  }, []);

  function handleToggleSound() {
    setPreferences((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }

  function handleOpenFeedback(contextOverride?: string) {
    setFeedbackContext(contextOverride ?? activeScreen);
    setFeedbackModalOpen(true);
  }

  function handleEnterAccount(user: AuthUserSummary) {
    setAuthenticatedUser(user);
    setActiveModal(null);

    const savedChar = getSavedCharacterForAccount(user.username);
    const savedStarter = getSavedStarterDigimonForAccount(user.username);

    // Returning players with saved Tamer + Starter resume directly in the world!
    if (savedChar && savedStarter) {
      selectionThemePlayer.stop();
      setSelectedTamer(savedChar);
      setSelectedDigimon(savedStarter);
      setActiveScreen('world');
      return;
    }

    // Unlock & kick off theme music synchronously inside the login click gesture
    selectionThemePlayer.start(preferences.soundEnabled);
    if (savedChar) {
      setSelectedTamer(savedChar);
      setSelectedDigimon(null);
      setActiveScreen('digimon-select');
      return;
    }

    setSelectedTamer(null);
    setSelectedDigimon(null);
    setActiveScreen('character-select');
  }

  function handleEnterWorld(selection: SavedCharacterSelection) {
    setSelectedTamer(selection);
    const savedStarter = getSavedStarterDigimonForAccount(
      selection.accountUsername
    );
    if (savedStarter) {
      selectionThemePlayer.stop();
      setSelectedDigimon(savedStarter);
      setActiveScreen('world');
      return;
    }
    // Keep selection theme playing smoothly into Digimon Select
    setSelectedDigimon(null);
    setActiveScreen('digimon-select');
  }

  function handleConfirmStarter(savedStarter: SavedStarterDigimon) {
    // Selection complete — stop selection music cleanly before spawning into DATS Center
    selectionThemePlayer.stop();
    setSelectedDigimon(savedStarter);
    setActiveScreen('world');
  }

  function handleAdminSwitchStarter(starterId: StarterDigimonId) {
    const accountName =
      selectedTamer?.accountUsername ?? authenticatedUser?.username ?? 'TamerTeste';
    const nextStarter = overrideStarterDigimonForGm({
      accountUsername: accountName,
      digimonId: starterId,
    });
    setSelectedDigimon(nextStarter);
  }

  function handleAdminSwitchTamer(characterId: TamerId) {
    const accountName =
      selectedTamer?.accountUsername ?? authenticatedUser?.username ?? 'TamerTeste';
    const nextTamer = overrideCharacterForGm({
      accountUsername: accountName,
      characterId,
      tamerName: selectedTamer?.tamerName,
    });
    setSelectedTamer(nextTamer);
  }

  function handleOpenSelectionFlow(screen: 'character-select' | 'digimon-select') {
    setActiveScreen(screen);
  }

  async function handleBackToLogin() {
    selectionThemePlayer.stop();
    await authService.signOutAccount();
    setAuthenticatedUser(null);
    setSelectedTamer(null);
    setSelectedDigimon(null);
    setActiveScreen('login');
  }

  const isFullViewportScreen =
    activeScreen === 'world' || isSelectionPhase;

  return (
    <div className="relative flex min-h-dvh w-full justify-center overflow-x-hidden bg-[#020816]">
      {/* Desktop / wide-screen ambient Digital World aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden sm:block bg-[radial-gradient(circle_at_50%_20%,rgba(12,68,168,0.45),rgba(3,10,28,0.96)_62%,#020612_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden sm:block opacity-20 [background-image:linear-gradient(to_right,rgba(0,212,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,212,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      {/* Primary stage: compact portrait for Login, full-viewport responsive MMORPG stage for Selection & World */}
      <main
        className={
          activeScreen === 'world'
            ? 'relative flex h-dvh w-full flex-col overflow-hidden bg-[#030b1f]'
            : isFullViewportScreen
              ? 'relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#030b1f]'
              : 'relative flex min-h-dvh w-full max-w-[460px] flex-col overflow-y-auto bg-gradient-to-b from-[#04102b] via-[#061a42] to-[#030b1f] shadow-[0_0_60px_rgba(0,140,255,0.28)] sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-cyan-400/25'
        }
      >
        {!authReady ? (
          <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 px-6 text-center text-sky-100">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <p className="font-[family-name:var(--font-display)] text-sm tracking-wider text-cyan-200">
              CONECTANDO AO SERVIDOR DIGITAL...
            </p>
          </div>
        ) : activeScreen === 'login' ? (
          <div className="relative flex min-h-full flex-col pb-4">
            {/* Decorative lower Digital City silhouettes & cyber floor glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 top-[35%] overflow-hidden"
            >
              <div className="absolute -left-2 bottom-12 h-72 w-20 bg-gradient-to-t from-[#08245c]/70 via-[#0d3b8c]/35 to-transparent opacity-60 [clip-path:polygon(0_20%,35%_20%,35%_5%,70%_5%,70%_32%,100%_32%,100%_100%,0_100%)]" />
              <div className="absolute -right-2 bottom-12 h-72 w-20 bg-gradient-to-t from-[#08245c]/70 via-[#0d3b8c]/35 to-transparent opacity-60 [clip-path:polygon(0_30%,30%_30%,30%_8%,65%_8%,65%_22%,100%_22%,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_bottom,rgba(0,195,255,0.22),transparent_72%)]" />

              {showMotion && (
                <>
                  <span className="animate-float-particle absolute bottom-28 left-6 h-1.5 w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_8px_#67e8f9]" />
                  <span
                    className="animate-float-particle absolute bottom-36 right-7 h-1.5 w-1.5 rounded-full bg-amber-300/80 shadow-[0_0_8px_#fcd34d]"
                    style={{ animationDelay: '1.6s' }}
                  />
                </>
              )}
            </div>

            {/* 1. Upper Hero Illustration & Top Corner Banners */}
            <HeroScene animationsEnabled={showMotion} />

            {/* 2. Prominent DIGIMON WORLD - DIGITAL WAR Logo */}
            <GameLogo />

            {/* 3. Main Interactive Login Form Card */}
            <div className="mt-1">
              <LoginCard
                soundEnabled={preferences.soundEnabled}
                onOpenModal={(section) => setActiveModal(section)}
                onLoginSuccess={handleEnterAccount}
              />
            </div>

            {/* 4. Bottom 4-Button Hexagonal Menu */}
            <BottomMenu
              soundEnabled={preferences.soundEnabled}
              onSelect={(section) => setActiveModal(section)}
            />

            {/* 4b. Installable PWA prompt banner (Android/Desktop native prompt or iOS guide) */}
            <PWAInstallButton
              variant="banner"
              soundEnabled={preferences.soundEnabled}
            />

            {/* 5. Bottom Digital World Tagline Ribbon */}
            <FooterBanner />
          </div>
        ) : activeScreen === 'character-select' ? (
          <CharacterSelectScreen
            accountUsername={authenticatedUser?.username ?? 'Domador'}
            soundEnabled={preferences.soundEnabled}
            animationsEnabled={showMotion}
            onToggleSound={handleToggleSound}
            onBackToLogin={() => {
              void handleBackToLogin();
            }}
            onEnterWorld={handleEnterWorld}
          />
        ) : activeScreen === 'digimon-select' && selectedTamer ? (
          <DigimonSelectScreen
            accountUsername={selectedTamer.accountUsername}
            tamerName={selectedTamer.tamerName}
            soundEnabled={preferences.soundEnabled}
            animationsEnabled={showMotion}
            onToggleSound={handleToggleSound}
            onBackToCharacterSelect={() => setActiveScreen('character-select')}
            onConfirmStarter={handleConfirmStarter}
          />
        ) : (
          selectedTamer &&
          selectedDigimon && (
            <TamerWorldCanvas
              selection={selectedTamer}
              starterDigimon={selectedDigimon}
              preferences={preferences}
              isGM={true}
              cloudIsGm={Boolean(authenticatedUser?.isGM)}
              onUpdatePreferences={setPreferences}
              onOpenFeedback={handleOpenFeedback}
              onAdminSwitchStarter={handleAdminSwitchStarter}
              onAdminSwitchTamer={handleAdminSwitchTamer}
              onOpenSelectionFlow={handleOpenSelectionFlow}
              onExitToLogin={() => {
                void (async () => {
                  await flushPendingCloudSaves();
                  await handleBackToLogin();
                })();
              }}
            />
          )
        )}
      </main>

      {/* Interactive Modal / Bottom Sheet for Menu & Account Actions */}
      <UtilityModal
        section={activeModal}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onAccountCreated={handleEnterAccount}
        onOpenFeedback={() => handleOpenFeedback(activeScreen)}
        onClose={() => setActiveModal(null)}
      />

      {/* Alpha Version Bug Report & Player Feedback Modal (saved to Firestore) */}
      <AlphaFeedbackModal
        open={feedbackModalOpen}
        username={authenticatedUser?.username}
        tamerName={selectedTamer?.tamerName}
        screenContext={feedbackContext}
        soundEnabled={preferences.soundEnabled}
        isGM={Boolean(authenticatedUser?.isGM)}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* Non-intrusive offline connectivity toast */}
      <OfflineIndicator />
    </div>
  );
}
