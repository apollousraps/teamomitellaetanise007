import { useEffect, useState, type CSSProperties } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import type { HudWindowId } from '../../types/hud';

interface BottomHudDockProps {
  activeWindow: HudWindowId;
  inventoryOpen: boolean;
  unreadNotifications: number;
  onToggleInventory: () => void;
  onOpenWindow: (win: Exclude<HudWindowId, null>) => void;
}

interface MenuButtonConfig {
  id: string;
  label: string;
  iconSrc: string;
  glowRgba: string;
  active: boolean;
  badge?: number;
  featured?: boolean;
  onClick: () => void;
}

function MmorpgMenuTile({
  item,
  onSelect,
}: {
  item: MenuButtonConfig;
  onSelect: () => void;
}) {
  const glowVars = {
    '--btn-glow': item.glowRgba,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={() => {
        item.onClick();
        onSelect();
      }}
      title={item.label}
      aria-label={item.label}
      aria-pressed={item.active}
      data-selected={item.active ? 'true' : 'false'}
      style={glowVars}
      className={`mmorpg-icon-btn group relative flex aspect-[6/6.6] w-full items-center justify-center rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        item.active
          ? 'border-amber-300/90 bg-[#0c3178]/85 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
          : item.featured
            ? 'border-cyan-300/55 bg-[#08255e]/75 hover:border-cyan-200 hover:bg-[#0c327a]/85'
            : 'border-cyan-400/25 bg-[#051840]/75 hover:border-cyan-300/70 hover:bg-[#092763]/85'
      }`}
    >
      {/* Radial Neon Back-Glow */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-1.5 rounded-full blur-md transition-opacity duration-200 ${
          item.active
            ? 'opacity-80'
            : item.featured
              ? 'opacity-35 group-hover:opacity-75'
              : 'opacity-0 group-hover:opacity-65'
        }`}
        style={{ background: item.glowRgba }}
      />

      {/* Custom Octagonal Metallic Icon + Integrated Nameplate PNG */}
      <img
        src={item.iconSrc}
        alt={item.label}
        draggable={false}
        referrerPolicy="no-referrer"
        className="relative z-10 h-[92%] w-[92%] object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:scale-105 group-active:scale-95"
      />

      {/* Live Unread Counter Badge (Notificações) */}
      {item.badge !== undefined && item.badge > 0 ? (
        <span
          aria-label={`${item.badge} não lidas`}
          className="absolute right-0.5 top-0.5 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-rose-200/95 bg-gradient-to-b from-rose-500 to-red-700 px-1 text-[8.5px] font-black leading-none text-white shadow-[0_0_8px_rgba(244,63,94,0.95)]"
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      ) : null}

      {/* Active Selected Neon Indicator Bar */}
      {item.active ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 left-1/2 z-20 h-[2.5px] w-6 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047]"
        />
      ) : null}
    </button>
  );
}

export function BottomHudDock({
  activeWindow,
  inventoryOpen,
  unreadNotifications,
  onToggleInventory,
  onOpenWindow,
}: BottomHudDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu cleanly with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Row 1 (6 core adventure & progression items)
  const topRowMenus: MenuButtonConfig[] = [
    {
      id: 'character',
      label: 'Personagem',
      iconSrc: '/assets/menu/character.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.85)',
      active: activeWindow === 'character',
      onClick: () => onOpenWindow('character'),
    },
    {
      id: 'digimon',
      label: 'Digimon',
      iconSrc: '/assets/menu/digimon.png?v=2',
      glowRgba: 'rgba(251, 191, 36, 0.85)',
      active: activeWindow === 'digimon',
      onClick: () => onOpenWindow('digimon'),
    },
    {
      id: 'inventory',
      label: 'Inventário',
      iconSrc: '/assets/menu/inventory.png?v=2',
      glowRgba: 'rgba(56, 189, 248, 0.85)',
      active: inventoryOpen,
      onClick: onToggleInventory,
    },
    {
      id: 'map',
      label: 'Mapa',
      iconSrc: '/assets/menu/map.png?v=2',
      glowRgba: 'rgba(34, 211, 238, 0.85)',
      active: activeWindow === 'map',
      onClick: () => onOpenWindow('map'),
    },
    {
      id: 'missions',
      label: 'Missões',
      iconSrc: '/assets/menu/missions.png?v=2',
      glowRgba: 'rgba(245, 158, 11, 0.85)',
      active: activeWindow === 'missions',
      onClick: () => onOpenWindow('missions'),
    },
    {
      id: 'shop',
      label: 'Shop (Loja Digital)',
      iconSrc: '/assets/menu/shop.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.92)',
      active: activeWindow === 'shop',
      featured: true,
      onClick: () => onOpenWindow('shop'),
    },
  ];

  // Row 2 (6 social, notification, settings & system items)
  const bottomRowMenus: MenuButtonConfig[] = [
    {
      id: 'guild',
      label: 'Guild',
      iconSrc: '/assets/menu/guild.png?v=2',
      glowRgba: 'rgba(250, 204, 21, 0.82)',
      active: activeWindow === 'guild',
      onClick: () => onOpenWindow('guild'),
    },
    {
      id: 'friends',
      label: 'Lista de Amigos',
      iconSrc: '/assets/menu/friends.png?v=2',
      glowRgba: 'rgba(52, 211, 153, 0.85)',
      active: activeWindow === 'friends',
      onClick: () => onOpenWindow('friends'),
    },
    {
      id: 'messenger',
      label: 'Mensagens',
      iconSrc: '/assets/menu/messenger.png?v=2',
      glowRgba: 'rgba(56, 232, 255, 0.85)',
      active: activeWindow === 'messenger',
      onClick: () => onOpenWindow('messenger'),
    },
    {
      id: 'notifications',
      label: 'Notificações',
      iconSrc: '/assets/menu/notifications.png?v=2',
      glowRgba: 'rgba(251, 191, 36, 0.88)',
      active: activeWindow === 'notifications',
      badge: unreadNotifications,
      onClick: () => onOpenWindow('notifications'),
    },
    {
      id: 'settings',
      label: 'Configurações',
      iconSrc: '/assets/menu/settings.png?v=2',
      glowRgba: 'rgba(125, 211, 252, 0.85)',
      active: activeWindow === 'settings',
      onClick: () => onOpenWindow('settings'),
    },
    {
      id: 'exit',
      label: 'Sair do Jogo',
      iconSrc: '/assets/menu/exit.png?v=2',
      glowRgba: 'rgba(251, 113, 133, 0.9)',
      active: activeWindow === 'exit-confirm',
      onClick: () => onOpenWindow('exit-confirm'),
    },
  ];

  const hasActiveChild = activeWindow !== null || inventoryOpen;

  return (
    <>
      {/* Click-outside backdrop when 2-row Menu Panel is open */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onPointerDown={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
          className="pointer-events-auto fixed inset-0 z-25 bg-[#020817]/35 backdrop-blur-[1.5px]"
        />
      )}

      {/* Floating 2-Row Professional Menu Panel (6 x 2 clean symmetrical grid) */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Menu do Jogo"
          onPointerDown={(e) => e.stopPropagation()}
          className="animate-dmo-window mmorpg-dock-rail pointer-events-auto fixed bottom-[68px] left-1/2 z-40 w-[min(95vw,492px)] -translate-x-1/2 rounded-2xl p-2.5 select-none sm:bottom-[76px] sm:p-3.5"
        >
          {/* Compact Metallic Header */}
          <div className="mb-2 flex items-center justify-between border-b border-cyan-400/25 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-300/60 bg-gradient-to-b from-[#1150c7] to-[#062261] shadow-[0_0_10px_rgba(56,214,255,0.45)]">
                <LayoutGrid className="h-3.5 w-3.5 text-cyan-100" />
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-xs tracking-wider text-white sm:text-sm">
                  MENU
                </h2>
                <span className="text-[10px] font-semibold text-cyan-200/75">
                  Aventura · Social · Sistema
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar Menu"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/35 bg-[#072154] text-cyan-200 transition hover:border-cyan-200 hover:bg-[#0c3278] active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 1: Gameplay & Adventure (6 icons) */}
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {topRowMenus.map((item) => (
              <MmorpgMenuTile
                key={item.id}
                item={item}
                onSelect={() => setMenuOpen(false)}
              />
            ))}
          </div>

          {/* Subtle Cyan Hairline Divider between the 2 rows */}
          <div
            aria-hidden="true"
            className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent sm:my-2.5"
          />

          {/* Row 2: Social & System (6 icons) */}
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {bottomRowMenus.map((item) => (
              <MmorpgMenuTile
                key={item.id}
                item={item}
                onSelect={() => setMenuOpen(false)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Compact Professional "MENU" Base Button anchored cleanly at Bottom-Right */}
      <nav
        aria-label="Menu principal do jogo"
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-none flex w-full items-end justify-end px-2.5 pb-2.5 sm:px-4 sm:pb-3.5 select-none"
      >
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar Menu do Jogo' : 'Abrir Menu do Jogo'}
          className={`pointer-events-auto relative flex min-h-[46px] items-center gap-2 rounded-2xl border-2 px-3.5 py-2 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-[50px] sm:px-4 ${
            menuOpen
              ? 'border-amber-300 bg-gradient-to-b from-[#1762e6] via-[#0c3ca0] to-[#051b54] text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.55)]'
              : hasActiveChild
                ? 'border-cyan-200 bg-gradient-to-b from-[#1255cf] via-[#082e82] to-[#041545] text-white shadow-[0_0_20px_rgba(56,214,255,0.55)]'
                : 'border-cyan-300/80 bg-gradient-to-b from-[#0e48b8]/95 via-[#07266d]/95 to-[#03123b]/95 text-white shadow-[0_6px_22px_rgba(0,12,48,0.8),0_0_16px_rgba(0,180,255,0.35)] hover:border-cyan-200 hover:brightness-110'
          }`}
        >
          {/* Metallic top inner sheen */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-2 top-0.5 h-[1px] rounded-full bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent"
          />

          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              menuOpen
                ? 'border-amber-200/80 bg-amber-400/20 text-amber-200'
                : 'border-cyan-300/50 bg-[#04143a]/70 text-cyan-200'
            }`}
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </span>

          <span className="font-[family-name:var(--font-display)] text-xs tracking-wider text-white drop-shadow sm:text-[13px]">
            MENU
          </span>

          {/* Unread Notifications Badge directly on MENU base button */}
          {unreadNotifications > 0 && !menuOpen ? (
            <span
              aria-label={`${unreadNotifications} notificações não lidas`}
              className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-rose-200 bg-gradient-to-b from-rose-500 to-red-700 px-1 text-[9.5px] font-black leading-none text-white shadow-[0_0_10px_rgba(244,63,94,0.95)]"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          ) : null}
        </button>
      </nav>
    </>
  );
}
