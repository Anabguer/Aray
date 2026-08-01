import type { ReactNode } from 'react'
import { ConfirmDialog } from '@/components/quiz/QuizWidgets'
import { Lumo } from '@/lumo/Lumo'
import type { LumoIntensity, LumoState } from '@/lumo/types'
import { COMBO_MIN, type RunFx } from '@/run/answerFx'
import { MicroCelebrateBanner, useMicroCelebrate } from '@/run/microCelebrateUi'

/** HUD de partida (barra + dots + combo) — mismas clases visuales que Learn. */
export function RunHud({
  title,
  current,
  total,
  hits,
  streak,
  note,
  countLabel,
}: {
  title: string
  current: number
  total: number
  hits: number
  streak: number
  /** Sustituye la nota de aciertos/combo (p. ej. timer de cálculo). */
  note?: ReactNode
  countLabel?: ReactNode
}) {
  const completed = Math.max(0, current - 1)
  const barPct = Math.min(100, (completed / Math.max(1, total)) * 100)
  const nodes = Array.from({ length: Math.min(total, 20) }, (_, i) => i + 1)

  return (
    <header className="learn-lab__hud">
      <div className="learn-lab__hud-top">
        <p className="learn-lab__table">
          {title}
          <span className="learn-lab__table-run"> · EN JUEGO</span>
        </p>
        <p className="learn-lab__count" aria-live="polite">
          {countLabel ?? (
            <>
              {current} de {total}
            </>
          )}
        </p>
      </div>
      <div className="learn-lab__track">
        <div
          className="learn-lab__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          aria-label={`Progreso: ${current} de ${total}`}
        >
          <span style={{ width: `${Math.max(barPct > 0 ? 8 : 0, barPct)}%` }} />
        </div>
        <div className="learn-lab__nodes" aria-hidden="true">
          {nodes.map((n) => (
            <i
              key={n}
              className={`learn-lab__node${n < current ? ' is-done' : ''}${n === current ? ' is-now' : ''}`}
            />
          ))}
        </div>
      </div>
      <p className="learn-lab__bar-note">
        {note ?? (
          <>
            {hits} {hits === 1 ? 'acierto' : 'aciertos'} en esta partida
            {streak >= COMBO_MIN ? ` · ¡Combo ×${streak}!` : ''}
          </>
        )}
      </p>
    </header>
  )
}

export function RunFxChrome({ fx }: { fx: RunFx | null }) {
  if (!fx) return null
  if (fx.kind === 'bubble') {
    return (
      <div className={`learn-lab__bubble learn-lab__bubble--${fx.tone}`} key={fx.key}>
        <span className="learn-lab__bubble-msg">{fx.message}</span>
        {fx.xp != null ? <span className="learn-lab__bubble-xp">+{fx.xp} XP</span> : null}
        {fx.combo != null ? (
          <span className="learn-lab__bubble-combo">¡Combo ×{fx.combo}!</span>
        ) : null}
      </div>
    )
  }
  if (fx.kind === 'stamp') {
    return (
      <p
        className={`learn-lab__stamp learn-lab__stamp--${fx.slot} learn-lab__stamp--${fx.tone}`}
        key={fx.key}
      >
        <span className="learn-lab__stamp-label">{fx.stamp ?? fx.message}</span>
        {fx.xp != null ? <span className="learn-lab__stamp-xp">+{fx.xp} XP</span> : null}
      </p>
    )
  }
  if (fx.kind === 'band') {
    return (
      <p className={`learn-lab__band learn-lab__band--${fx.tone}`} key={fx.key} role="status">
        <span className="learn-lab__band-msg">{fx.stamp ?? fx.message}</span>
        {fx.xp != null ? <span className="learn-lab__band-xp">+{fx.xp} XP</span> : null}
      </p>
    )
  }
  return null
}

/** Shell de partida para side-activities (ortografía, calc, dinero, reloj…). */
export function SideRunShell({
  title,
  current,
  total,
  hits,
  streak,
  lumoState,
  lumoIntensity,
  prompt,
  detail,
  extra,
  answers,
  footer,
  fx,
  lumoBoost,
  hit,
  miss,
  canPrev = false,
  onPrev,
  exitOpen,
  onExitRequest,
  onConfirmExit,
  onCancelExit,
  enterKey,
  note,
  countLabel,
}: {
  title: string
  current: number
  total: number
  hits: number
  streak: number
  lumoState: LumoState
  lumoIntensity: LumoIntensity
  prompt: ReactNode
  detail?: ReactNode
  extra?: ReactNode
  answers: ReactNode
  footer?: ReactNode
  fx: RunFx | null
  lumoBoost: boolean
  hit?: boolean
  miss?: boolean
  canPrev?: boolean
  onPrev?: () => void
  exitOpen: boolean
  onExitRequest: () => void
  onConfirmExit: () => void
  onCancelExit: () => void
  enterKey?: number
  note?: ReactNode
  countLabel?: ReactNode
}) {
  const micro = useMicroCelebrate(streak)
  const liveLumoState: LumoState = micro ? 'celebration' : lumoState
  const liveLumoIntensity: LumoIntensity = micro ? 4 : lumoIntensity
  const showBubble = fx?.kind === 'bubble'
  const showNearHint =
    fx?.kind === 'near' ? (
      <p className={`learn-lab__band learn-lab__band--${fx.tone}`} role="status">
        <span className="learn-lab__band-msg">{fx.message}</span>
        {fx.combo != null ? (
          <span className="learn-lab__band-xp">¡Combo ×{fx.combo}!</span>
        ) : null}
      </p>
    ) : null

  return (
    <section className="learn-lab side-run" aria-label="Partida">
      <RunHud
        title={title}
        current={current}
        total={total}
        hits={hits}
        streak={streak}
        note={note}
        countLabel={countLabel}
      />

      <div className="learn-lab__stage" key={enterKey} style={{ position: 'relative' }}>
        <MicroCelebrateBanner event={micro} />
        <div
          className={`learn-lab__console${hit ? ' is-hit' : ''}${miss ? ' is-miss' : ''}${
            lumoBoost || micro ? ' is-lumo-up' : ''
          }`}
          aria-live="polite"
        >
          <span className="learn-lab__console-glow" aria-hidden="true" />
          <div
            className={`learn-lab__lumo-peek${lumoBoost || micro ? ' is-boost' : ''}${
              fx?.tone === 'miss' && fx.kind === 'bubble' ? ' is-troll' : ''
            }`}
            aria-hidden="true"
          >
            <Lumo state={liveLumoState} intensity={liveLumoIntensity} size="sm" label="Lumo" />
            {showBubble ? <RunFxChrome fx={fx} /> : null}
          </div>

          <p className="learn-lab__eyebrow">{prompt}</p>
          {extra ? <div className="side-run__extra">{extra}</div> : null}
          {detail ? <div className="side-run__detail">{detail}</div> : null}

          {!showBubble ? <RunFxChrome fx={fx} /> : null}
          {showNearHint}
        </div>
      </div>

      <div className="learn-lab__answers">{answers}</div>

      {footer}

      <nav className="learn-lab__nav" aria-label="Salir o volver">
        <button
          type="button"
          className="learn-lab__nav-btn learn-lab__nav-btn--prev"
          disabled={!canPrev || !onPrev}
          onClick={onPrev}
        >
          <svg
            className="learn-lab__nav-ico"
            viewBox="0 0 24 24"
            width="1.1em"
            height="1.1em"
            aria-hidden
          >
            <path
              d="M14.5 6.5 9 12l5.5 5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="learn-lab__nav-label">ANTERIOR</span>
        </button>
        <button
          type="button"
          className="learn-lab__nav-btn learn-lab__nav-btn--exit"
          onClick={onExitRequest}
        >
          <svg
            className="learn-lab__nav-ico"
            viewBox="0 0 24 24"
            width="1.1em"
            height="1.1em"
            aria-hidden
          >
            <path
              d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M12 12h8m0 0-2.6-2.6M20 12l-2.6 2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="learn-lab__nav-label learn-lab__nav-label--exit">SALIR</span>
          <span className="learn-lab__nav-label learn-lab__nav-label--exit-short">SALIR</span>
        </button>
      </nav>

      <ConfirmDialog
        open={exitOpen}
        title="¿Sales ahora?"
        body="Se guarda lo que hayas acertado. Lo que quede a medias no cuenta."
        confirmLabel="SALIR"
        cancelLabel="SEGUIR JUGANDO"
        cancelIsPrimary
        onConfirm={onConfirmExit}
        onCancel={onCancelExit}
      />
    </section>
  )
}
