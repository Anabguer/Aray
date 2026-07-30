import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/feedback/usePrefersReducedMotion'
import { xpBarFromTotal, type XpBarView } from '@/feedback/xpPreview'

type Props = {
  /** XP total (progreso guardado + XP de sesión pendiente de persistir). */
  totalXp: number
  /** Incremento reciente para resaltar el tramo nuevo. */
  highlightGain?: number
  className?: string
  compact?: boolean
}

/**
 * Barra de XP alineada con derivePlayerHud / Lobby.
 * `totalXp` debe ser el XP real (persistido o el que se persistirá al cerrar sesión).
 */
export function SessionXpBar({ totalXp, highlightGain = 0, className, compact }: Props) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState<XpBarView>(() => xpBarFromTotal(totalXp))
  const [pulse, setPulse] = useState(false)
  const prevXp = useRef(totalXp)

  useEffect(() => {
    const next = xpBarFromTotal(totalXp)
    if (totalXp === prevXp.current) {
      setDisplay(next)
      return
    }
    const gained = totalXp - prevXp.current
    prevXp.current = totalXp
    if (reduced || gained <= 0) {
      setDisplay(next)
      return
    }
    setPulse(true)
    const t = window.setTimeout(() => {
      setDisplay(next)
      setPulse(false)
    }, 80)
    return () => window.clearTimeout(t)
  }, [reduced, totalXp])

  const remain = display.xpPerLevel - display.xpIntoLevel

  return (
    <div
      className={['session-xp-bar', compact ? 'session-xp-bar--compact' : '', pulse ? 'is-pulse' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Nivel ${display.level}: ${display.xpIntoLevel} de ${display.xpPerLevel} XP. Faltan ${remain} XP para el siguiente nivel.`}
    >
      <div className="session-xp-bar__top">
        <span className="session-xp-bar__level">Nv. {display.level}</span>
        <span className="session-xp-bar__remain">Faltan {remain} XP</span>
      </div>
      <div
        className="session-xp-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={display.xpPerLevel}
        aria-valuenow={display.xpIntoLevel}
      >
        <span
          className="session-xp-bar__fill"
          style={{
            width: `${display.xpPct}%`,
            transition: reduced ? 'none' : 'width 0.55s ease-out',
          }}
        />
        {highlightGain > 0 && !reduced ? (
          <span className="session-xp-bar__gain-flash" aria-hidden="true" />
        ) : null}
      </div>
      {compact ? null : (
        <p className="session-xp-bar__text">
          {display.xpIntoLevel} / {display.xpPerLevel} XP
        </p>
      )}
    </div>
  )
}
