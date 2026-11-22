import type { TamerId } from '../../types/character';

interface TamerPortraitAvatarProps {
  tamerId: TamerId;
  tamerName: string;
  sizeClass?: string;
}

/**
 * Renders the authentic first-frame head & upper-body portrait of the selected Tamer
 * directly from `/assets/sprites/tamers/<id>/idle.png` (576x224 = 4x 144x224 frames).
 */
export function TamerPortraitAvatar({
  tamerId,
  tamerName,
  sizeClass = 'h-12 w-12',
}: TamerPortraitAvatarProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-gradient-to-b from-[#0b2f78] to-[#04102b] ${sizeClass}`}
    >
      <div
        role="img"
        aria-label={`Retrato de ${tamerName}`}
        className="h-full w-full"
        style={{
          backgroundImage: `url(/assets/sprites/tamers/${tamerId}/idle.png)`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '420% auto',
          backgroundPosition: '2.5% 10%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
