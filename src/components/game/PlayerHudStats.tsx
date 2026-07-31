import { useEffect, useRef, useState } from 'react'
import { IconBolt } from '@/components/Icons'
import {
  ENERGY_FLY_EVENT,
  energyBarTargetEl,
  type EnergyFlyDetail,
} from '@/feedback/energyFly'
import type { PlayerHudSnapshot } from '@/progress/playerHud'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function PlayerHudBars({
  hud,
  compact = false,
}: {
  hud: PlayerHudSnapshot
  compact?: boolean
}) {
  const [charging, setCharging] = useState(false)
  const chargeTimer = useRef(0)

  useEffect(() => {
    function onFly(ev: Event) {
      const detail = (ev as CustomEvent<EnergyFlyDetail>).detail
      if (!detail) return
      const bar = energyBarTargetEl()
      if (!bar) return

      window.clearTimeout(chargeTimer.current)
      setCharging(true)
      chargeTimer.current = window.setTimeout(() => setCharging(false), 1100)

      if (prefersReducedMotion() || detail.amount <= 0) return

      const to = bar.getBoundingClientRect()
      const toX = to.left + to.width * 0.85
      const toY = to.top + to.height / 2
      const from = detail.from ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.55,
      }

      const n = Math.min(8, Math.max(3, Math.round(detail.amount / 8) || 4))
      for (let i = 0; i < n; i += 1) {
        const orb = document.createElement('span')
        orb.className = 'energy-fly-orb'
        orb.setAttribute('aria-hidden', 'true')
        const jitterX = (Math.random() - 0.5) * 36
        const jitterY = (Math.random() - 0.5) * 28
        orb.style.left = `${from.x + jitterX}px`
        orb.style.top = `${from.y + jitterY}px`
        document.body.appendChild(orb)
        const delay = i * 45
        const dur = 520 + (i % 3) * 40
        window.setTimeout(() => {
          orb.style.transform = `translate(${toX - from.x - jitterX}px, ${toY - from.y - jitterY}px) scale(0.55)`
          orb.style.opacity = '0.15'
        }, delay + 16)
        window.setTimeout(() => orb.remove(), delay + dur + 80)
      }
    }

    window.addEventListener(ENERGY_FLY_EVENT, onFly)
    return () => {
      window.removeEventListener(ENERGY_FLY_EVENT, onFly)
      window.clearTimeout(chargeTimer.current)
    }
  }, [])

  return (
    <div
      className={`lobby-hud__bars${compact ? ' lobby-hud__bars--compact' : ''}${charging ? ' is-energy-charging' : ''}`}
      aria-label="Progreso"
    >
      <div className="lobby-hud__xp">
        <div className="lobby-hud__xp-top">
          <span className="lobby-hud__level">Nv. {hud.level}</span>
          <span className="lobby-hud__bar-nums lobby-hud__xp-nums" aria-hidden="true">
            ({hud.xpIntoLevel}/{hud.xpPerLevel})
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
          className={`lobby-hud__bar lobby-hud__bar--energy${charging ? ' is-charging' : ''}`}
          data-energy-bar
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
