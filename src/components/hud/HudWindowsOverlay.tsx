import {
  AlertTriangle,
  Bell,
  Bug,
  CheckCircle2,
  Coins,
  Compass,
  CornerUpLeft,
  Gem,
  Mail,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type { PlayableMapId } from '../../data/worldMapCatalog';
import { DATS_INTERACTION_POINTS } from '../../maps/datsCenterMap';
import { BASIC_BITS_SHOP_ITEMS } from '../../services/hudGameService';
import type { AppPreferences } from '../../types/auth';
import type { TamerCharacter } from '../../types/character';
import type { DigimonFormId, DigimonFormProfile } from '../../types/digimon';
import type {
  AccountHudPersistence,
  DigimonRuntimeStats,
  EquipmentSlotId,
  HudNotificationItem,
  HudWindowId,
  InventoryItem,
  LiveWorldHudSnapshot,
  TamerRuntimeStats,
} from '../../types/hud';
import { playDigitalTone } from '../../utils/soundFx';
import { PWAInstallButton } from '../PWAInstallButton';
import { AdminTestModal } from './AdminTestModal';
import { DigiEggIncubatorModal } from './DigiEggIncubatorModal';
import { DigimonCharacterModal } from './DigimonCharacterModal';
import { TamerCharacterModal } from './TamerCharacterModal';
import { WorldMapModal } from './WorldMapModal';

interface HudWindowsOverlayProps {
  activeWindow: HudWindowId;
  hudAccount: AccountHudPersistence;
  character: TamerCharacter;
  tamerName: string;
  tamerStats: TamerRuntimeStats;
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  inventory: InventoryItem[];
  guildName: string | null;
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  snapshot: LiveWorldHudSnapshot;
  bits: number;
  dCoin: number;
  defeatedTotal: number;
  notifications: HudNotificationItem[];
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onEquipItem: (item: InventoryItem) => void;
  onUnequipSlot: (slot: EquipmentSlotId) => void;
  onBuyShopItem: (itemKey: string) => void;
  onEvolveDigimon: (targetFormId: DigimonFormId) => void;
  onExecuteEggHatch: (eggItemId: string) => {
    ok: boolean;
    message: string;
    hatchedSpecies?: string;
  };
  onExecuteEggReinforce: (
    eggItemId: string,
    materialItemId: string | null
  ) => {
    ok: boolean;
    message: string;
    newReinforceLevel?: number;
  };
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onAdminSetDigimonLevel: (level: number) => void;
  onAdminAddDigimonExp: (expAmount: number) => void;
  onAdminRestoreVitals: () => void;
  onTravelToMap: (mapId: PlayableMapId) => void;
  isGM: boolean;
  onOpenFeedback?: () => void;
  onConfirmExit: () => void;
  onClose: () => void;
}

export function HudWindowsOverlay({
  activeWindow,
  hudAccount,
  character,
  tamerName,
  tamerStats,
  equippedItems,
  inventory,
  guildName,
  digimon,
  digimonStats,
  snapshot,
  bits,
  dCoin,
  defeatedTotal,
  notifications,
  preferences,
  onUpdatePreferences,
  onEquipItem,
  onUnequipSlot,
  onBuyShopItem,
  onEvolveDigimon,
  onExecuteEggHatch,
  onExecuteEggReinforce,
  onPlayTone,
  onAdminSetDigimonLevel,
  onAdminAddDigimonExp,
  onAdminRestoreVitals,
  onTravelToMap,
  isGM,
  onOpenFeedback,
  onConfirmExit,
  onClose,
}: HudWindowsOverlayProps) {
  if (!activeWindow) return null;

  if (activeWindow === 'character') {
    return (
      <TamerCharacterModal
        character={character}
        tamerName={tamerName}
        tamerStats={tamerStats}
        equippedItems={equippedItems}
        inventory={inventory}
        guildName={guildName}
        onEquipItem={onEquipItem}
        onUnequipSlot={onUnequipSlot}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'digimon') {
    return (
      <DigimonCharacterModal
        digimon={digimon}
        digimonStats={digimonStats}
        tamerStats={tamerStats}
        equippedItems={equippedItems}
        defeatedTotal={defeatedTotal}
        onEvolveForm={onEvolveDigimon}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'incubator') {
    return (
      <DigiEggIncubatorModal
        hudAccount={hudAccount}
        onExecuteHatch={onExecuteEggHatch}
        onExecuteReinforce={onExecuteEggReinforce}
        onPlayTone={onPlayTone}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'admin') {
    if (!isGM) return null;
    return (
      <AdminTestModal
        digimon={digimon}
        digimonStats={digimonStats}
        currentMapId={snapshot.mapId}
        onSetDigimonLevel={onAdminSetDigimonLevel}
        onAddDigimonExp={onAdminAddDigimonExp}
        onEvolveForm={onEvolveDigimon}
        onRestoreVitals={onAdminRestoreVitals}
        onTravelToMap={onTravelToMap}
        onClose={onClose}
      />
    );
  }

  if (activeWindow === 'map') {
    return (
      <WorldMapModal
        snapshot={snapshot}
        tamerStats={tamerStats}
        digimonStats={digimonStats}
        defeatedTotal={defeatedTotal}
        soundEnabled={preferences.soundEnabled}
        isGM={isGM}
        onTravelToMap={onTravelToMap}
        onClose={onClose}
      />
    );
  }

  const titles: Record<
    Exclude<HudWindowId, null | 'character' | 'digimon' | 'incubator' | 'admin' | 'map'>,
    string
  > = {
    guild: 'Sistema de Guilda',
    missions: 'Missões da DATS',
    settings: 'Configurações do Jogo',
    shop: 'Loja Digital (Shop)',
    messenger: 'Mensageiro DATS',
    notifications: 'Notificações',
    friends: 'Lista de Amigos',
    'exit-confirm': 'Sair do Mundo Digital',
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titles[activeWindow]}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/70 p-3 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[410px] overflow-hidden rounded-2xl border border-cyan-300/80 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_36px_rgba(0,174,255,0.5)]"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between border-b border-cyan-400/40 bg-[#082d7a] px-4 py-2.5">
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            {titles[activeWindow]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/70 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70dvh] overflow-y-auto p-4 text-xs text-sky-100">

          {activeWindow === 'missions' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-extrabold text-white">
                    <Compass className="h-4 w-4 text-cyan-300" />
                    Exploração do DATS Center
                  </span>
                  <span className="font-black tabular-nums text-amber-300">
                    {DATS_INTERACTION_POINTS.filter((pt) =>
                      snapshot.discoveredZoneIds.includes(pt.id)
                    ).length}
                    /{DATS_INTERACTION_POINTS.length}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {DATS_INTERACTION_POINTS.map((pt) => {
                    const done = snapshot.discoveredZoneIds.includes(pt.id);
                    return (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-[#061844] px-2.5 py-2 text-[11px]"
                      >
                        <span className={done ? 'font-bold text-emerald-300' : 'text-slate-200'}>
                          {pt.title}
                        </span>
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Pendente</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-center text-[11px] leading-relaxed text-slate-300">
                Novas linhas de missões da DATS serão adicionadas conforme o projeto avançar.
              </p>
            </div>
          )}



          {activeWindow === 'settings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-cyan-400/25 bg-[#041232] px-3 py-2.5">
                <div>
                  <p className="font-bold text-white">Efeitos sonoros</p>
                  <p className="text-[11px] text-slate-300">
                    Áudio de botões, portais e ações
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !preferences.soundEnabled;
                    onUpdatePreferences({ ...preferences, soundEnabled: next });
                    if (next) playDigitalTone('confirm', true);
                  }}
                  className={`min-h-[36px] min-w-[72px] rounded-lg border px-2.5 text-[11px] font-extrabold ${
                    preferences.soundEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  {preferences.soundEnabled ? 'ATIVO' : 'MUDO'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-cyan-400/25 bg-[#041232] px-3 py-2.5">
                <div>
                  <p className="font-bold text-white">Animações e partículas</p>
                  <p className="text-[11px] text-slate-300">
                    Efeitos visuais da interface
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      animationsEnabled: !preferences.animationsEnabled,
                    })
                  }
                  className={`min-h-[36px] min-w-[72px] rounded-lg border px-2.5 text-[11px] font-extrabold ${
                    preferences.animationsEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  {preferences.animationsEnabled ? 'ATIVO' : 'DESL.'}
                </button>
              </div>

              <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
                <p className="mb-2 flex items-center gap-1.5 font-bold text-white">
                  <Settings className="h-3.5 w-3.5 text-cyan-300" />
                  Qualidade Gráfica
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['alta', 'equilibrada'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        onUpdatePreferences({
                          ...preferences,
                          graphicsQuality: mode,
                        })
                      }
                      className={`min-h-[36px] rounded-lg border text-[11px] font-extrabold ${
                        preferences.graphicsQuality === mode
                          ? 'border-amber-300 bg-amber-500/20 text-amber-200'
                          : 'border-cyan-400/25 bg-[#071f54] text-slate-300'
                      }`}
                    >
                      {mode === 'alta' ? 'Alta Fidelidade' : 'Econômica'}
                    </button>
                  ))}
                </div>
              </div>

              <PWAInstallButton
                variant="compact"
                soundEnabled={preferences.soundEnabled}
                showInstalledState
              />

              {onOpenFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    playDigitalTone('click', preferences.soundEnabled);
                    onClose();
                    onOpenFeedback();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-3.5 py-2 text-xs font-extrabold tracking-wide text-[#081226] shadow-[0_0_14px_rgba(255,174,0,0.4)] transition-transform active:scale-[0.98]"
                >
                  <Bug className="h-4 w-4 shrink-0" />
                  <span>REPORTAR BUG / FEEDBACK ALFA</span>
                </button>
              )}
            </div>
          )}

          {activeWindow === 'shop' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-lg border border-amber-400/40 bg-[#041232] px-3 py-2">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Coins className="h-4 w-4" />
                    Bits
                  </span>
                  <span className="font-black tabular-nums text-white">
                    {bits.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-cyan-400/40 bg-[#041232] px-3 py-2">
                  <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Gem className="h-4 w-4" />
                    D-Coin
                  </span>
                  <span className="font-black tabular-nums text-amber-300">
                    {dCoin.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {BASIC_BITS_SHOP_ITEMS.map((item) => {
                  const canAfford = bits >= item.priceBits;
                  return (
                    <div
                      key={item.itemKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/25 bg-[#041232] p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-300">
                          {item.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyShopItem(item.itemKey)}
                        className="shrink-0 rounded-lg border border-amber-300/70 bg-amber-500/20 px-2.5 py-1.5 text-[10.5px] font-black tabular-nums text-amber-200 hover:bg-amber-500/35 disabled:border-slate-700 disabled:bg-slate-800/70 disabled:text-slate-400"
                      >
                        {item.priceBits} Bits
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeWindow === 'guild' && (
            <div className="space-y-2.5 rounded-xl border border-cyan-400/30 bg-[#041232] p-4 text-center">
              <Shield className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="text-sm font-extrabold text-white">
                {guildName ? `Guilda: ${guildName}` : 'Você ainda não participa de uma Guilda'}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-300">
                A interface de Guilda está integrada ao HUD e aguarda conexão com o servidor multiplayer para criação, convites e chat de guilda.
              </p>
            </div>
          )}

          {activeWindow === 'messenger' && (
            <div className="space-y-2.5 rounded-xl border border-cyan-400/30 bg-[#041232] p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="text-sm font-extrabold text-white">
                Caixa de Mensagens Diretas
              </p>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Nenhuma mensagem recebida no momento. O mensageiro está pronto para receber correio e sussurros quando o serviço online estiver ativo.
              </p>
            </div>
          )}

          {activeWindow === 'friends' && (
            <div className="space-y-2.5 rounded-xl border border-cyan-400/30 bg-[#041232] p-4 text-center">
              <Users className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="text-sm font-extrabold text-white">
                Lista de Amigos (0 conectados)
              </p>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Nenhum Tamer adicionado ainda. A lista será sincronizada com o banco de contas e presença em tempo real.
              </p>
            </div>
          )}

          {activeWindow === 'notifications' && (
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="rounded-xl border border-cyan-400/30 bg-[#041232] p-4 text-center">
                  <Bell className="mx-auto h-7 w-7 text-cyan-300" />
                  <p className="mt-2 font-bold text-white">
                    Nenhuma notificação registrada
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-amber-200">
                        {n.title}
                      </span>
                      <span className="text-[9.5px] text-cyan-300/75">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-200">
                      {n.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeWindow === 'exit-confirm' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/40 bg-[#041232] p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-extrabold text-white">
                    Deseja sair do jogo e voltar para a tela inicial?
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Seu Tamer, Digimon parceiro, posição, nível, Bits e inventário serão salvos automaticamente na nuvem antes de desconectar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-xl border border-cyan-400/50 bg-[#072666] font-extrabold text-white hover:bg-sky-800"
                >
                  Continuar Jogando
                </button>
                <button
                  type="button"
                  onClick={onConfirmExit}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-rose-300/70 bg-rose-700 font-extrabold text-white hover:bg-rose-600"
                >
                  <CornerUpLeft className="h-4 w-4" />
                  <span>Confirmar Saída</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
