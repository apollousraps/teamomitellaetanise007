import {
  SKILL_F1_DS_COST,
  SKILL_F2_DS_COST,
} from '../../services/hudGameService';
import {
  PARTNER_AI_STATE_LABELS,
  type DigimonFormProfile,
  type PartnerAIState,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  LiveWorldHudSnapshot,
} from '../../types/hud';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
  getDigimonSkillTheme,
} from '../../utils/skillIcons';

interface ActiveDigimonHudPanelProps {
  digimon: DigimonFormProfile;
  stats: DigimonRuntimeStats;
  partnerState: PartnerAIState;
  activeSkillBanner: string | null;
  levelUpPulse?: boolean;
  snapshot: LiveWorldHudSnapshot;
  onTriggerSkill: (kind: 'special1' | 'special2') => void;
  onOpenDigimon: () => void;
}

export function ActiveDigimonHudPanel({
  digimon,
  stats,
  partnerState,
  activeSkillBanner,
  levelUpPulse = false,
  snapshot,
  onTriggerSkill,
  onOpenDigimon,
}: ActiveDigimonHudPanelProps) {
  const hpPct = Math.max(0, Math.min(100, (stats.hp / Math.max(1, stats.maxHp)) * 100));
  const dsPct = Math.max(0, Math.min(100, (stats.ds / Math.max(1, stats.maxDs)) * 100));
  const expPct = Math.max(
    0,
    Math.min(100, (stats.exp / Math.max(1, stats.expToNext)) * 100)
  );

  const statusText = activeSkillBanner ?? PARTNER_AI_STATE_LABELS[partnerState];
  const showStatus =
    Boolean(activeSkillBanner) ||
    partnerState === 'ATTACK' ||
    partnerState === 'CHASE';

  const inCombatArea =
    snapshot.mapId !== 'dats-center' && !snapshot.inSafeZone;
  const skillTheme = getDigimonSkillTheme(digimon.id);

  const s1Cd = snapshot.special1Cooldown;
  const s1Max = Math.max(0.1, snapshot.special1MaxCooldown);
  const s1Pct = Math.min(100, Math.max(0, (s1Cd / s1Max) * 100));
  const s1LowDs = stats.ds < SKILL_F1_DS_COST;
  const s1Disabled = !inCombatArea || s1Cd > 0 || s1LowDs;

  const s2Cd = snapshot.special2Cooldown;
  const s2Max = Math.max(0.1, snapshot.special2MaxCooldown);
  const s2Pct = Math.min(100, Math.max(0, (s2Cd / s2Max) * 100));
  const s2LowDs = stats.ds < SKILL_F2_DS_COST;
  const s2Disabled = !inCombatArea || s2Cd > 0 || s2LowDs;

  const skillSlots = [
    {
      slotKey: 'f1' as const,
      keyLabel: 'F1',
      kind: 'special1' as const,
      name: digimon.special1Name,
      dsCost: SKILL_F1_DS_COST,
      cooldownSec: digimon.special1CooldownSec,
      cdRemaining: s1Cd,
      cdPct: s1Pct,
      lowDs: s1LowDs,
      disabled: s1Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f1'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f1'),
    },
    {
      slotKey: 'f2' as const,
      keyLabel: 'F2',
      kind: 'special2' as const,
      name: digimon.special2Name,
      dsCost: SKILL_F2_DS_COST,
      cooldownSec: digimon.special2CooldownSec,
      cdRemaining: s2Cd,
      cdPct: s2Pct,
      lowDs: s2LowDs,
      disabled: s2Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f2'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f2'),
    },
  ];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-start gap-1 select-none"
    >
      <button
        type="button"
        onClick={onOpenDigimon}
        title={`Abrir detalhes de ${digimon.name} (${digimon.stage}) · EXP ${stats.exp}/${stats.expToNext}`}
        className={`group relative flex items-center text-left transition-transform active:scale-[0.99] ${
          levelUpPulse ? 'drop-shadow-[0_0_16px_rgba(255,212,59,0.9)]' : ''
        }`}
      >
        {/* Overlapping Circular Portrait Ring */}
        <div
          className="dmo-ring relative z-20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-0.5 sm:h-16 sm:w-16"
          style={{
            boxShadow: `0 0 14px ${digimon.theme.glowRgba}, inset 0 0 8px rgba(0,110,255,0.85)`,
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#0b2f78] to-[#04102b] p-0.5">
            <img
              src={digimon.portraitUrl}
              alt={digimon.name}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Bottom-left Circular Level Badge */}
          <span
            title={`Nível de ${digimon.name}: ${stats.level}`}
            className="dmo-frame absolute -bottom-1 -left-1 z-30 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-[10.5px] font-black tabular-nums text-white"
          >
            {stats.level}
          </span>
        </div>

        {/* Right Extending Beveled Capsule + Bottom EXP Lip (mirrors Tamer HUD) */}
        <div className="-ml-4 flex flex-col">
          {/* Main HP/DS Capsule */}
          <div className="dmo-frame relative flex w-[142px] flex-col justify-center rounded-r-2xl py-1.5 pl-5 pr-2.5 sm:w-[172px] sm:pl-6">
            {/* HP Bar */}
            <div className="dmo-well relative h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-hp-fill h-full transition-[width] duration-200"
                style={{ width: `${hpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>HP</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.hp)}/{stats.maxHp}
                </span>
              </span>
            </div>

            {/* DS Bar */}
            <div className="dmo-well relative mt-1 h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-ds-fill h-full transition-[width] duration-200"
                style={{ width: `${dsPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>DS</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.ds)}/{stats.maxDs}
                </span>
              </span>
            </div>
          </div>

          {/* Tucked EXP Lip directly below photo/bars matching Tamer HUD */}
          <div
            title={`EXP de ${digimon.name}: ${stats.exp} / ${stats.expToNext} (${expPct.toFixed(2)}%)`}
            className="dmo-frame -mt-0.5 ml-2 flex h-4 w-[128px] items-center justify-between rounded-b-lg px-2 sm:w-[154px]"
          >
            <span
              className="max-w-[54px] truncate text-[8.5px] font-extrabold sm:max-w-[66px]"
              style={{ color: digimon.theme.accentHex }}
            >
              {digimon.name}
            </span>
            <div className="mx-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-[#020922]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-cyan-300 transition-[width] duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-black tabular-nums text-white drop-shadow">
              {expPct.toFixed(3)}%
            </span>
          </div>
        </div>
      </button>

      {/* Compact F1 & F2 Skill Thumbnails directly below Digimon Portrait */}
      <div className="ml-0.5 flex items-center gap-1.5">
        <div className="dmo-frame flex items-center gap-1 rounded-lg p-[3px]">
          {skillSlots.map((slot) => {
            const isReady = !slot.disabled;
            const isCooling = slot.cdRemaining > 0;
            return (
              <div key={slot.slotKey} className="group/slot relative">
                {/* Hover / Focus Tooltip (opens downward below top HUD) */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/70 bg-[#041130]/96 px-2 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.85),0_0_10px_rgba(56,214,255,0.4)] transition-opacity duration-150 group-hover/slot:opacity-100 group-focus-within/slot:opacity-100 sm:block"
                >
                  <p className="text-[10.5px] font-black tracking-wide text-white">
                    {slot.name}
                  </p>
                  <p className="mt-0.5 text-[9px] font-bold tabular-nums text-cyan-200/90">
                    {slot.keyLabel} · {slot.dsCost} DS · {slot.cooldownSec.toFixed(1)}s
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerSkill(slot.kind)}
                  title={`${slot.name} (${slot.keyLabel}) · ${slot.dsCost} DS`}
                  aria-label={`Usar golpe ${slot.name} (${slot.keyLabel})`}
                  className={`relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-[6px] border bg-[#030b22] transition-all duration-150 active:scale-95 sm:h-8 sm:w-8 ${
                    isReady
                      ? `${skillTheme.readyBorder} ${skillTheme.readyShadow} hover:brightness-110`
                      : isCooling || slot.lowDs
                        ? 'border-slate-500/70 brightness-75'
                        : `${skillTheme.readyBorder} opacity-95 hover:brightness-105`
                  }`}
                >
                  <img
                    src={slot.iconUrl}
                    alt={slot.name}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = slot.fallbackUrl;
                      }
                    }}
                    className={`h-full w-full object-cover ${
                      isCooling ? 'saturate-50' : ''
                    }`}
                  />

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"
                  />

                  {isCooling && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 z-10 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to top, rgba(2,6,18,0.86) ${slot.cdPct}%, rgba(2,6,18,0.34) ${slot.cdPct}%)`,
                      }}
                    >
                      <span className="text-[9px] font-black tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {slot.cdRemaining >= 10
                          ? `${Math.ceil(slot.cdRemaining)}s`
                          : `${slot.cdRemaining.toFixed(1)}s`}
                      </span>
                    </div>
                  )}

                  <span
                    className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border ${skillTheme.keycapBorder} bg-[#02081a]/92 px-[3px] py-[0.5px] font-display text-[6.5px] font-bold leading-none ${skillTheme.keycapText} shadow-[0_1px_2px_rgba(0,0,0,0.95)]`}
                  >
                    {slot.keyLabel}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Quiet contextual AI / active skill line beside mini F1/F2 */}
        {showStatus && (
          <span className="max-w-[114px] truncate text-[9px] font-bold tracking-wide text-cyan-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:max-w-[144px]">
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}
