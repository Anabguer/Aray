import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { dailySkillIcons } from '@/assets/daily'
import { DAILY_TASKS } from '@/daily/dailyTasks'
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
          <div className="help-visual__bar">Lobby</div>
          <div className="help-visual__hero">Premio · energía</div>
          <div className="help-visual__mini-mission">Misión diaria · burbujas</div>
          <div className="help-visual__mini-mission">Reto del día · JUGAR</div>
          <div className="help-visual__mini-mission">Logros</div>
          <div className="help-visual__farm-btn">Farmear energía</div>
        </div>
      </div>
    )
  }
  if (kind === 'daily') {
    return (
      <div className="help-visual help-visual--daily-card" aria-hidden="true">
        <div className="help-visual__dm">
          <div className="help-visual__dm-top">
            <span className="help-visual__dm-title">Misión diaria</span>
            <span className="help-visual__dm-count">0/{DAILY_TASKS.length}</span>
          </div>
          <ul className="help-visual__dm-bubbles">
            {DAILY_TASKS.map((t) => (
              <li key={t.key} className="help-visual__dm-bubble">
                <span className="help-visual__dm-orb">
                  <img
                    src={dailySkillIcons[t.key]}
                    alt=""
                    width={40}
                    height={40}
                    draggable={false}
                  />
                </span>
                <span className="help-visual__dm-label">{t.label}</span>
                <span className="help-visual__dm-frac">
                  0/{t.target}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
  if (kind === 'challenge') {
    return (
      <div className="help-visual help-visual--challenge" aria-hidden="true">
        <article className="help-visual__reto">
          <img
            className="help-visual__reto-art"
            src={dailySkillIcons.tables}
            alt=""
            width={72}
            height={72}
            draggable={false}
          />
          <div className="help-visual__reto-body">
            <p className="help-visual__reto-eyebrow">Reto del día</p>
            <p className="help-visual__reto-title">Ejercicio del día</p>
            <p className="help-visual__reto-meta">+10 energía · una vez</p>
          </div>
          <div className="help-visual__reto-cta">
            <span aria-hidden="true">▶</span> JUGAR
          </div>
        </article>
      </div>
    )
  }
  if (kind === 'worlds') {
    return (
      <div className="help-visual help-visual--worlds-flow" aria-hidden="true">
        <div className="help-visual__farm-card">
          <p className="help-visual__farm-eyebrow">En el lobby</p>
          <div className="help-visual__farm-btn help-visual__farm-btn--lg">
            Farmear energía
          </div>
          <p className="help-visual__farm-arrow">te lleva a Mis mundos</p>
        </div>
        <div className="help-visual__worlds-row">
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
      </div>
    )
  }
  if (kind === 'modes') {
    return (
      <div className="help-visual help-visual--modes" aria-hidden="true">
        <div className="help-visual__mode help-visual__mode--rand">Random</div>
        <div className="help-visual__mode help-visual__mode--miss">Mis fallos</div>
        <div className="help-visual__mode help-visual__mode--train">+ retos abajo</div>
      </div>
    )
  }
  if (kind === 'achievements') {
    return (
      <div className="help-visual help-visual--achievements" aria-hidden="true">
        <div className="help-visual__logros-card">
          <ArayHubIcon id="coleccion" className="help-visual__logros-icon" />
          <div className="help-visual__logros-copy">
            <p className="help-visual__logros-title">Logros</p>
            <p className="help-visual__logros-desc">Insignias, rachas y premios</p>
          </div>
        </div>
        <ul className="help-visual__logros-badges">
          <li className="is-on">1ª misión</li>
          <li className="is-on">Racha</li>
          <li>Tabla ×2</li>
        </ul>
      </div>
    )
  }
  if (kind === 'lock') {
    return (
      <div className="help-visual help-visual--lock" aria-hidden="true">
        <div className="help-visual__lock-card">
          <svg
            className="help-visual__lock-svg"
            viewBox="0 0 24 24"
            width="48"
            height="48"
            fill="none"
          >
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
            <span />
            <span />
            <span />
            <span />
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
      if (e.key === 'ArrowRight') {
        setIndex((i) => Math.min(HELP_TOUR_STEPS.length - 1, i + 1))
      }
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const step = HELP_TOUR_STEPS[index]!
  const isLast = index >= HELP_TOUR_STEPS.length - 1
  const showBadge =
    step.visual !== 'daily' &&
    step.visual !== 'worlds' &&
    step.visual !== 'challenge' &&
    step.visual !== 'achievements'

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
          {showBadge ? (
            <ArayHubIcon id={step.icon} className="help-tour__badge" />
          ) : null}
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
            <span
              key={s.id}
              className={`help-tour__dot${i === index ? ' is-on' : ''}`}
            />
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
              onClick={() =>
                setIndex((i) => Math.min(HELP_TOUR_STEPS.length - 1, i + 1))
              }
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
