import { IconBolt, IconCoin } from '@/components/Icons'
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
        {compact ? null : (
          <p className="lobby-hud__bar-text">
            {hud.xpIntoLevel} / {hud.xpPerLevel} XP
          </p>
        )}
      </div>

      <div className="lobby-hud__energy">
        <div className="lobby-hud__energy-top">
          <IconBolt className="lobby-hud__bolt" aria-hidden />
          <span>Energía</span>
        </div>
        <div
          className="lobby-hud__bar lobby-hud__bar--energy"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={hud.energyCap}
          aria-valuenow={hud.energyToday}
          aria-label={`Energía: ${hud.energyToday} de ${hud.energyCap}`}
        >
          <span style={{ width: `${hud.energyBarPct}%` }} />
        </div>
        {compact ? null : (
          <p className="lobby-hud__bar-text">
            {hud.energyToday} / {hud.energyCap}
          </p>
        )}
      </div>
    </div>
  )
}

export function PlayerHudCoins({ hud }: { hud: PlayerHudSnapshot }) {
  return (
    <div className="lobby-hud__coins" aria-label={`${hud.coins} monedas`}>
      <IconCoin className="lobby-hud__coin-icon" aria-hidden />
      <strong className="lobby-hud__coin-value">{hud.coins}</strong>
    </div>
  )
}
