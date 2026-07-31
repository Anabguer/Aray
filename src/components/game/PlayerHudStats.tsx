import { IconBolt } from '@/components/Icons'
import type { PlayerHudSnapshot } from '@/progress/playerHud'

export function PlayerHudBars({
  hud,
  compact = false,
}: {
  hud: PlayerHudSnapshot
  compact?: boolean
}) {
  return (
    <div
      className={`lobby-hud__bars${compact ? ' lobby-hud__bars--compact' : ''}`}
      aria-label="Progreso"
    >
      <div className="lobby-hud__xp">
        <div className="lobby-hud__xp-top">
          <span className="lobby-hud__level">Nv. {hud.level}</span>
          <span className="lobby-hud__xp-label">XP</span>
          <span className="lobby-hud__bar-nums" aria-hidden="true">
            {hud.xpIntoLevel}/{hud.xpPerLevel}
          </span>
        </div>
        <div
          className="lobby-hud__bar lobby-hud__bar--xp"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={hud.xpPerLevel}
          aria-valuenow={hud.xpIntoLevel}
          aria-label={`Nivel ${hud.level}: ${hud.xpIntoLevel} de ${hud.xpPerLevel} XP`}
        >
          <span style={{ width: `${hud.xpPct}%` }} />
        </div>
      </div>

      <div className="lobby-hud__energy">
        <div className="lobby-hud__energy-top">
          <IconBolt className="lobby-hud__bolt" aria-hidden />
          <span className="lobby-hud__energy-label">Energía</span>
          <span className="lobby-hud__bar-nums" aria-hidden="true">
            {hud.energyTotal}/{hud.energyTarget}
          </span>
        </div>
        <div
          className="lobby-hud__bar lobby-hud__bar--energy"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={hud.energyTarget}
          aria-valuenow={hud.energyTotal}
          aria-label={`Energía del premio: ${hud.energyTotal} de ${hud.energyTarget}. Hoy ${hud.energyToday} de ${hud.energyDailyCap}`}
        >
          <span style={{ width: `${hud.energyBarPct}%` }} />
        </div>
      </div>
    </div>
  )
}
