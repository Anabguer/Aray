import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './level-up-overlay.css'

export type LevelUpFlash = {
  newLevel: number
  energyGranted: number
  energyRequested: number
}

/** Overlay “¡Nivel N!” + energía. */
export function LevelUpOverlay({
  flash,
  onDone,
}: {
  flash: LevelUpFlash | null
  onDone: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!flash) {
      setVisible(false)
      return
    }
    setVisible(true)
    const t = window.setTimeout(() => {
      setVisible(false)
      onDone()
    }, 2800)
    return () => window.clearTimeout(t)
  }, [flash, onDone])

  if (!flash || !visible) return null

  const energyLine =
    flash.energyGranted > 0
      ? `+${flash.energyGranted} energía`
      : flash.energyRequested > 0
        ? 'Tope de energía de hoy — ¡sigue por vicio!'
        : null

  return createPortal(
    <div className="level-up-overlay" role="status" aria-live="polite">
      <div className="level-up-overlay__card">
        <p className="level-up-overlay__boom" aria-hidden="true">
          BOOM
        </p>
        <h2 className="level-up-overlay__title">¡Nivel {flash.newLevel}!</h2>
        {energyLine ? <p className="level-up-overlay__energy">{energyLine}</p> : null}
      </div>
    </div>,
    document.body,
  )
}
