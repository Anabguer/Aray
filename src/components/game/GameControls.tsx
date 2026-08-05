import { useEffect, useState } from 'react'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { SoundSettingsModal } from '@/components/SoundSettingsModal'
import { AdultPinModal } from '@/features/access/AdultPinModal'
import { HelpTourModal } from '@/features/help/HelpTourModal'
import { consumeHelpTourPending } from '@/features/help/helpTourPending'
import { soundEngine } from '@/sound/soundEngine'

/** Controles circulares del HUD: sonido, ayuda y acceso adulto. */
export function GameControls({
  className,
  toolbarLabel = 'Controles del juego',
}: {
  className?: string
  toolbarLabel?: string
}) {
  const [adultPinOpen, setAdultPinOpen] = useState(false)
  const [soundOpen, setSoundOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [prefs, setPrefs] = useState(() => soundEngine.getPrefs())

  useEffect(() => soundEngine.subscribePrefs(setPrefs), [])

  useEffect(() => {
    if (consumeHelpTourPending()) setHelpOpen(true)
  }, [])

  // Icono “mute” solo si efectos y música están apagados
  const fullyMuted = !prefs.sfxEnabled && !prefs.musicEnabled

  return (
    <>
      <div
        className={['lobby__trailing', className].filter(Boolean).join(' ')}
        role="toolbar"
        aria-label={toolbarLabel}
      >
        <MuteToggle
          className="lobby-ctrl"
          muted={fullyMuted}
          ariaLabel="Ajustes de sonido"
          title="Sonido"
          onToggle={() => {
            soundEngine.unlock()
            setSoundOpen(true)
          }}
        />

        <button
          type="button"
          className="lobby-ctrl lobby-ctrl--help"
          aria-label="Cómo se juega"
          title="Ayuda"
          onClick={() => setHelpOpen(true)}
        >
          <span className="lobby-ctrl__mark" aria-hidden="true">
            ?
          </span>
        </button>

        <button
          type="button"
          className="lobby-ctrl lobby-ctrl--lock"
          aria-label="Acceso adulto"
          title="Adultos"
          onClick={() => setAdultPinOpen(true)}
        >
          <svg
            className="lobby-ctrl__lock"
            viewBox="0 0 24 24"
            width="1.15em"
            height="1.15em"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="gameLockGrad" x1="4" y1="2" x2="20" y2="22">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
            <path
              d="M8 10V8a4 4 0 0 1 8 0v2"
              stroke="url(#gameLockGrad)"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <rect
              x="5.5"
              y="10"
              width="13"
              height="10"
              rx="2.4"
              stroke="url(#gameLockGrad)"
              strokeWidth="1.9"
            />
            <circle cx="12" cy="14.2" r="1.15" fill="url(#gameLockGrad)" />
            <path
              d="M12 15.4v2.1"
              stroke="url(#gameLockGrad)"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <SoundSettingsModal open={soundOpen} onClose={() => setSoundOpen(false)} />
      <HelpTourModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AdultPinModal open={adultPinOpen} onClose={() => setAdultPinOpen(false)} />
    </>
  )
}
