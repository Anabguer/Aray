import { useEffect, useRef, useState } from 'react'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { AdultPinModal } from '@/features/access/AdultPinModal'
import { useProgress } from '@/progress/ProgressContext'

/** Controles circulares del juego: ayuda, sonido y acceso adulto. */
export function GameControls({
  className,
  toolbarLabel = 'Controles del juego',
}: {
  className?: string
  toolbarLabel?: string
}) {
  const { progress, setSoundMuted } = useProgress()
  const [adultPinOpen, setAdultPinOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!helpOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!helpRef.current?.contains(event.target as Node)) {
        setHelpOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setHelpOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [helpOpen])

  return (
    <>
      <div
        className={['lobby__trailing', className].filter(Boolean).join(' ')}
        role="toolbar"
        aria-label={toolbarLabel}
      >
        <div className="lobby-help lobby-help--toolbar" ref={helpRef}>
          <button
            type="button"
            className="lobby-ctrl"
            aria-label="Cómo se juega"
            aria-expanded={helpOpen}
            aria-controls="game-help-panel"
            onClick={() => setHelpOpen((open) => !open)}
          >
            <span className="lobby-ctrl__mark" aria-hidden="true">
              ?
            </span>
          </button>
          {helpOpen ? (
            <div
              id="game-help-panel"
              className="lobby-help__panel"
              role="dialog"
              aria-labelledby="game-help-title"
            >
              <h2 id="game-help-title" className="lobby-help__title">
                ¿CÓMO SE JUEGA?
              </h2>
              <ul className="lobby-help__steps">
                <li>
                  <span aria-hidden="true">🎮</span>
                  <span>Completa actividades</span>
                </li>
                <li>
                  <span aria-hidden="true">⭐</span>
                  <span>Gana XP, monedas y energía</span>
                </li>
                <li>
                  <span aria-hidden="true">🎁</span>
                  <span>Llena el premio y consigue Robux</span>
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-primary btn-block lobby-help__ok"
                onClick={() => setHelpOpen(false)}
              >
                ¡ENTENDIDO!
              </button>
            </div>
          ) : null}
        </div>

        <MuteToggle
          className="lobby-ctrl"
          muted={progress.soundMuted}
          onToggle={() => setSoundMuted(!progress.soundMuted)}
        />

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

      <AdultPinModal open={adultPinOpen} onClose={() => setAdultPinOpen(false)} />
    </>
  )
}
