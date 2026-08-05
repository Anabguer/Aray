import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { HELP_TOUR_STEPS } from '@/features/help/helpTourSteps'
import '@/features/help/helpTour.css'

type Props = {
  open: boolean
  onClose: () => void
}

function HelpVisual({ kind }: { kind: (typeof HELP_TOUR_STEPS)[number]['visual'] }) {
  if (kind === 'lobby') {
    return (
      <div className="help-visual help-visual--lobby" aria-hidden="true">
        <div className="help-visual__phone">
          <div className="help-visual__bar">AFK Academy</div>
          <div className="help-visual__hero">Premio · energía</div>
          <div className="help-visual__row">
            <span>Misión</span>
            <span>Mundos</span>
          </div>
        </div>
      </div>
    )
  }
  if (kind === 'daily') {
    return (
      <div className="help-visual help-visual--daily" aria-hidden="true">
        <div className="help-visual__bubbles">
          {['Tablas', 'Cálculo', 'Orto', 'Palabras', 'Reloj', '€'].map((label) => (
            <div key={label} className="help-visual__bubble">
              <span className="help-visual__orb" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'worlds') {
    return (
      <div className="help-visual help-visual--worlds" aria-hidden="true">
        <div className="help-visual__zone help-visual__zone--mates">
          <ArayHubIcon id="matematicas" className="help-visual__zone-icon" />
          <span>Mates</span>
        </div>
        <div className="help-visual__zone help-visual__zone--lang">
          <ArayHubIcon id="castellano" className="help-visual__zone-icon" />
          <span>Lengua</span>
        </div>
        <div className="help-visual__zone help-visual__zone--soon">
          <ArayHubIcon id="ingles" className="help-visual__zone-icon" />
          <span>Pronto</span>
        </div>
      </div>
    )
  }
  if (kind === 'modes') {
    return (
      <div className="help-visual help-visual--modes" aria-hidden="true">
        <div className="help-visual__mode help-visual__mode--miss">Mis fallos</div>
        <div className="help-visual__mode help-visual__mode--rand">Random</div>
        <div className="help-visual__mode help-visual__mode--train">Entrena</div>
      </div>
    )
  }
  if (kind === 'lock') {
    return (
      <div className="help-visual help-visual--lock" aria-hidden="true">
        <div className="help-visual__lock-card">
          <svg className="help-visual__lock-svg" viewBox="0 0 24 24" width="48" height="48" fill="none">
            <path
              d="M8 10V8a4 4 0 0 1 8 0v2"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <rect
              x="5.5"
              y="10"
              width="13"
              height="10"
              rx="2.4"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <circle cx="12" cy="14.2" r="1.15" fill="currentColor" />
          </svg>
          <p className="help-visual__pin-label">PIN familiar</p>
          <div className="help-visual__pin-dots">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="help-visual help-visual--energy" aria-hidden="true">
      <div className="help-visual__energy-bar">
        <div className="help-visual__energy-fill" />
      </div>
      <p className="help-visual__energy-label">Energía del día → premio</p>
    </div>
  )
}

export function HelpTourModal({ open, onClose }: Props) {
  const titleId = useId()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    setIndex(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(HELP_TOUR_STEPS.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const step = HELP_TOUR_STEPS[index]!
  const isLast = index >= HELP_TOUR_STEPS.length - 1

  return createPortal(
    <div className="help-tour" role="presentation" onClick={onClose}>
      <div
        className="help-tour__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="help-tour__close"
          aria-label="Cerrar guía"
          onClick={onClose}
        >
          ×
        </button>

        <div className="help-tour__visual-wrap">
          <ArayHubIcon id={step.icon} className="help-tour__badge" />
          <HelpVisual kind={step.visual} />
        </div>

        <p className="help-tour__step">
          {index + 1} / {HELP_TOUR_STEPS.length}
        </p>
        <h2 id={titleId} className="help-tour__title">
          {step.title}
        </h2>
        <p className="help-tour__lead">{step.lead}</p>
        <ul className="help-tour__bullets">
          {step.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="help-tour__dots" aria-hidden="true">
          {HELP_TOUR_STEPS.map((s, i) => (
            <span key={s.id} className={`help-tour__dot${i === index ? ' is-on' : ''}`} />
          ))}
        </div>

        <div className="help-tour__nav">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Atrás
          </button>
          {isLast ? (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              ¡A jugar!
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIndex((i) => Math.min(HELP_TOUR_STEPS.length - 1, i + 1))}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
