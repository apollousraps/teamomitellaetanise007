import { Crown, ShieldCheck, Swords } from 'lucide-react';
import type { TamerCharacter } from '../../types/character';
import type { TamerRuntimeStats } from '../../types/hud';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';

interface TamerHudPanelProps {
  character: TamerCharacter;
  tamerName: string;
  stats: TamerRuntimeStats;
  inSafeZone: boolean;
  isCombatMap: boolean;
  levelUpPulse: boolean;
  onOpenCharacter: () => void;
}

export function TamerHudPanel({
  character,
  tamerName,
  stats,
  inSafeZone,
  isCombatMap,
  levelUpPulse,
  onOpenCharacter,
}: TamerHudPanelProps) {
  const hpPct = Math.max(0, Math.min(100, (stats.hp / Math.max(1, stats.maxHp)) * 100));
  const dsPct = Math.max(0, Math.min(100, (stats.ds / Math.max(1, stats.maxDs)) * 100));
  const expPct = Math.max(
    0,
    Math.min(100, (stats.exp / Math.max(1, stats.expToNext)) * 100)
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex items-start gap-1.5 select-none"
    >
      <button
        type="button"
        onClick={onOpenCharacter}
        title={`Abrir detalhes de ${tamerName}`}
        className={`group relative flex items-center text-left transition-transform active:scale-[0.99] ${
          levelUpPulse ? 'drop-shadow-[0_0_16px_rgba(255,212,59,0.9)]' : ''
        }`}
      >
        {/* Crown Crest at top-left */}
        <span
          aria-hidden="true"
          className="absolute -left-1 -top-1 z-30 flex h-5 w-5 items-center justify-center rounded-md border border-amber-200 bg-gradient-to-b from-[#fff176] via-[#fbbf24] to-[#b45309] shadow-[0_0_8px_rgba(251,191,36,0.75)]"
        >
          <Crown className="h-3 w-3 fill-[#fef08a] text-[#451a03]" />
        </span>

        {/* Overlapping Circular Ring Portrait */}
        <div className="dmo-ring relative z-20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-0.5 sm:h-16 sm:w-16">
          <TamerPortraitAvatar
            tamerId={character.id}
            tamerName={tamerName}
            sizeClass="h-full w-full"
          />

          {/* Bottom-left Circular Level Badge */}
          <span
            title={`Nível do Tamer: ${stats.level}`}
            className="dmo-frame absolute -bottom-1 -left-1 z-30 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-[10.5px] font-black tabular-nums text-white"
          >
            {stats.level}
          </span>
        </div>

        {/* Right Extending Beveled Capsule + Bottom EXP Lip */}
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

          {/* Tucked EXP Lip with 0.000% */}
          <div className="dmo-frame -mt-0.5 ml-2 flex h-4 w-[128px] items-center justify-between rounded-b-lg px-2 sm:w-[154px]">
            <span className="truncate text-[8.5px] font-extrabold text-cyan-100">
              {tamerName}
            </span>
            <div className="mx-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-[#020922]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-cyan-300 transition-[width] duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-black tabular-nums text-white drop-shadow">
              {expPct.toFixed(3)}%
            </span>
          </div>
        </div>
      </button>

      {/* Two Small Beveled Blue Buff Squares matching Reference */}
      <div className="hidden items-center gap-1 pt-0.5 sm:flex">
        <div
          title={inSafeZone ? 'Zona Segura: Recuperação Ativa' : 'Área de Combate'}
          className="dmo-frame flex h-7 w-7 items-center justify-center rounded-md"
        >
          {inSafeZone ? (
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-200" />
          ) : (
            <Swords className="h-3.5 w-3.5 text-amber-300" />
          )}
        </div>
        <div
          title={isCombatMap ? 'Modo Caça Ativo' : 'DATS Center'}
          className="dmo-frame flex h-7 w-7 items-center justify-center rounded-md text-[8px] font-black text-cyan-100"
        >
          {isCombatMap ? 'PVE' : 'HQ'}
        </div>
      </div>
    </div>
  );
}
