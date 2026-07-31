import type { CSSProperties, ReactNode } from 'react'
import { Lumo } from '@/lumo/Lumo'
import type { LumoState } from '@/lumo/types'
import './round-summary.css'

export type RoundSummaryStat = {
  value: string | number
  label: string
}

type RoundSummaryProps = {
  title: string
  titleId?: string
  meta?: ReactNode
  lumoState?: LumoState
  /** Más punch visual (racha alta / casi perfecto). */
  celebrate?: boolean
  stats: RoundSummaryStat[]
  note?: ReactNode
  /** Bloque opcional entre nota y CTAs (p. ej. fallos a repasar). */
  extra?: ReactNode
  actions: ReactNode
  className?: string
}

export function RoundSummary({
  title,
  titleId = 'round-summary-title',
  meta,
  lumoState = 'correct',
  celebrate = false,
  stats,
  note,
  extra,
  actions,
  className = '',
}: RoundSummaryProps) {
  const intensity = celebrate || lumoState === 'celebration' ? 4 : 2

  return (
    <section
      className={[
        'round-summary',
        celebrate || lumoState === 'celebration' ? 'round-summary--hot' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
    >
      <div className="round-summary__fx" aria-hidden="true">
        <span className="round-summary__ring round-summary__ring--a" />
        <span className="round-summary__ring round-summary__ring--b" />
        <span className="round-summary__burst" />
        <span className="round-summary__spark round-summary__spark--1" />
        <span className="round-summary__spark round-summary__spark--2" />
        <span className="round-summary__spark round-summary__spark--3" />
        <span className="round-summary__spark round-summary__spark--4" />
        <span className="round-summary__spark round-summary__spark--5" />
        <span className="round-summary__spark round-summary__spark--6" />
      </div>

      <div className="round-summary__hero">
        <div className="round-summary__lumo-wrap">
          <Lumo state={lumoState} intensity={intensity} size="lg" />
        </div>
        <h2 id={titleId} className="round-summary__title">
          {title}
        </h2>
        {meta ? <div className="round-summary__meta">{meta}</div> : null}
      </div>

      {stats.length > 0 ? (
        <ul className="round-summary__stats">
          {stats.map((stat, i) => (
            <li
              key={`${stat.label}-${i}`}
              className="round-summary__stat"
              style={{ '--rs-i': i } as CSSProperties}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? <div className="round-summary__note">{note}</div> : null}
      {extra ? <div className="round-summary__extra">{extra}</div> : null}
      <div className="round-summary__actions">{actions}</div>
    </section>
  )
}
