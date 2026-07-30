import { useEffect, useId, useState } from 'react'
import type { MultiplicationFact } from '@/math/types'
import { soundEngine } from '@/sound/soundEngine'

export function AnswerGrid({
  options,
  disabled,
  correctValue,
  selectedValue,
  reveal,
  onSelect,
  bounceCorrect,
  shakeWrong,
  showCorrectAnswer = true,
}: {
  options: number[]
  disabled?: boolean
  correctValue?: number
  selectedValue?: number | null
  reveal?: boolean
  onSelect: (value: number) => void
  /** Pulso/rebote en la opción correcta al acertar. */
  bounceCorrect?: boolean
  /** Sacudida lateral suave en la opción fallida. */
  shakeWrong?: boolean
  /** Si false, en reveal solo marca la opción fallida (reintento). */
  showCorrectAnswer?: boolean
}) {
  return (
    <div className="answer-grid" role="group" aria-label="Respuestas">
      {options.map((option, index) => {
        let stateClass = ''
        if (reveal && showCorrectAnswer && option === correctValue) {
          stateClass = bounceCorrect ? 'is-correct is-bounce' : 'is-correct'
        }
        if (reveal && selectedValue === option && option !== correctValue) {
          stateClass = shakeWrong ? 'is-wrong is-shake' : 'is-wrong'
        }
        return (
          <button
            key={`${option}-${index}`}
            type="button"
            className={`answer-btn ${stateClass}`}
            disabled={disabled}
            onClick={() => {
              onSelect(option)
            }}
            aria-keyshortcuts={`${index + 1}`}
          >
            <span className="answer-btn__key" aria-hidden="true">
              {index + 1}
            </span>
            <span className="answer-btn__value">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

export function FactPrompt({ fact, highlight }: { fact: MultiplicationFact; highlight?: boolean }) {
  return (
    <p className={`fact-prompt${highlight ? ' fact-prompt--pulse' : ''}`} aria-live="polite">
      <span className="fact-prompt__a">{fact.a}</span>
      <span className="fact-prompt__op" aria-hidden="true">
        ×
      </span>
      <span className="fact-prompt__b">{fact.b}</span>
      <span className="fact-prompt__eq" aria-hidden="true">
        =
      </span>
      <span className="fact-prompt__q">?</span>
    </p>
  )
}

export function FeedbackBanner({
  tone,
  message,
}: {
  tone: 'ok' | 'bad' | 'info'
  message: string
}) {
  return (
    <div className={`feedback-banner feedback-banner--${tone}`} role="status">
      {message}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="dialog-card">
        <h2 id={titleId}>{title}</h2>
        <p className="shell-note">{body}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useKeyboardAnswers(
  enabled: boolean,
  options: number[],
  onSelect: (value: number) => void,
) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= 4 && options[n - 1] !== undefined) {
        e.preventDefault()
        onSelect(options[n - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, options, onSelect])
}

export function MuteToggle({
  muted,
  onToggle,
  className,
}: {
  muted: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={['icon-btn', className].filter(Boolean).join(' ')}
      onClick={() => {
        soundEngine.unlock()
        if (muted) {
          // Al reactivar, un click suave confirma el canal de audio
          onToggle()
          soundEngine.play('ui-click')
        } else {
          soundEngine.play('ui-click')
          onToggle()
        }
      }}
      aria-pressed={muted}
      aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
      title={muted ? 'Sonido off' : 'Sonido on'}
    >
      {muted ? (
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden="true">
          <path d="M4 10v4h3l5 4V6L7 10H4z" />
          <path d="M16 9l5 5M21 9l-5 5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden="true">
          <path d="M4 10v4h3l5 4V6L7 10H4z" />
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M18 7a7 7 0 0 1 0 10" />
        </svg>
      )}
    </button>
  )
}

export function useFlash(ms = 480) {
  const [on, setOn] = useState(false)
  const trigger = () => {
    setOn(true)
    window.setTimeout(() => setOn(false), ms)
  }
  return { on, trigger }
}
