import type { ReactNode } from 'react'
import { Lumo } from '@/lumo/Lumo'
import type { LumoIntensity, LumoState } from '@/lumo/types'
import './quiz-arena.css'

const LUMO_LINE: Partial<Record<LumoState, string>> = {
  thinking: 'Mira bien…',
  correct: '¡Eso!',
  incorrect: 'Casi…',
  streak: '¡Racha!',
  celebration: '¡Genial!',
}

/** Escenario de quiz tipo videojuego: tarjeta pregunta + tarjeta respuestas. */
export function QuizArena({
  hudRight,
  lumoState = 'thinking',
  lumoIntensity = 0,
  prompt,
  detail,
  extra,
  answersLabel = 'Elige una respuesta',
  answers,
  className = '',
}: {
  /** Contador / timer a la derecha del HUD. */
  hudRight: ReactNode
  lumoState?: LumoState
  lumoIntensity?: LumoIntensity
  prompt: ReactNode
  detail?: ReactNode
  /** Emoji, reloj, expresión… dentro de la tarjeta de pregunta. */
  extra?: ReactNode
  answersLabel?: string
  answers: ReactNode
  className?: string
}) {
  const tip = LUMO_LINE[lumoState] ?? '¡Tú puedes!'

  return (
    <section className={`quiz-arena${className ? ` ${className}` : ''}`}>
      <header className="quiz-arena__hud">
        <span className="quiz-arena__hud-tag" aria-hidden="true">
          PARTIDA
        </span>
        <div className="quiz-arena__hud-right">{hudRight}</div>
      </header>

      <div className="quiz-arena__board">
        <article className="quiz-arena__prompt-card" aria-live="polite">
          <div className="quiz-arena__lumo" aria-hidden="true">
            <Lumo state={lumoState} intensity={lumoIntensity} size="md" className="lumo--face-in" />
            <p className="quiz-arena__lumo-tip">{tip}</p>
          </div>
          <div className="quiz-arena__prompt-main">
            <div className="quiz-arena__prompt-title">{prompt}</div>
            {extra ? <div className="quiz-arena__prompt-extra">{extra}</div> : null}
            {detail ? <div className="quiz-arena__prompt-detail">{detail}</div> : null}
          </div>
        </article>

        <article className="quiz-arena__answers-card">
          <p className="quiz-arena__answers-label">{answersLabel}</p>
          {answers}
        </article>
      </div>
    </section>
  )
}
