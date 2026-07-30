import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { IconPlay, IconReview } from '@/components/Icons'
import { TableLevelCard } from '@/components/TableLevelCard'
import { MIX_TABLES, PLAYABLE_TABLES, type PlayableTable } from '@/config/playConfig'
import { emptyTableProgress } from '@/math/selector'
import { tableStatus } from '@/math/tableMastery'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'

export function TablesSelectScreen() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { selection, setSelection } = usePlaySession()
  const [picked, setPicked] = useState<number[]>(() =>
    selection.mix
      ? [...MIX_TABLES]
      : selection.tables.length
        ? selection.tables.filter((n) => PLAYABLE_TABLES.includes(n as PlayableTable))
        : [7],
  )
  const [mix, setMix] = useState(selection.mix)
  const [launchPulse, setLaunchPulse] = useState(false)

  const reviewTables = useMemo(
    () =>
      PLAYABLE_TABLES.filter((n) => {
        const t = progress.tables[String(n)]
        return t ? tableStatus(t).recommendPractice : false
      }),
    [progress.tables],
  )

  const selectedCount = mix ? MIX_TABLES.length : picked.length

  const playLabel = useMemo(() => {
    if (mix || picked.length > 1) return 'JUGAR MEZCLA'
    if (picked.length === 1) return `JUGAR TABLA DEL ${picked[0]}`
    return 'JUGAR'
  }, [mix, picked])

  const selectionKey = mix ? 'mix' : picked.join('-')

  useEffect(() => {
    if (selectedCount === 0) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    setLaunchPulse(true)
    const t = window.setTimeout(() => setLaunchPulse(false), 280)
    return () => window.clearTimeout(t)
  }, [selectionKey, selectedCount])

  function toggleTable(n: number) {
    setMix(false)
    setPicked((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n)
      return [...prev, n]
    })
  }

  function continueNext() {
    const tables = mix ? [...MIX_TABLES] : picked
    if (tables.length === 0) return
    setSelection({ tables, mix })
    navigate('/missions/mates/tables/modes')
  }

  return (
    <AppShell title="Niveles" showBack backTo="/missions/mates">
      <section className="levels-map" aria-label="Niveles">
        {reviewTables.length > 0 ? (
          <p className="review-notice" role="status">
            <IconReview className="review-notice__icon" />
            <span>
              {reviewTables.length === 1
                ? `La tabla del ${reviewTables[0]} necesita un repaso`
                : `Las tablas del ${reviewTables.join(', ')} necesitan un repaso`}
            </span>
          </p>
        ) : null}

        <div className="levels-grid" role="group" aria-label="Tablas del 2 al 9">
          {PLAYABLE_TABLES.map((n) => {
            const t = progress.tables[String(n)] ?? emptyTableProgress()
            const on = mix || picked.includes(n)
            const order = !mix && on ? picked.indexOf(n) + 1 : null
            return (
              <TableLevelCard
                key={n}
                table={n}
                progress={t}
                selected={on}
                selectionOrder={order}
                onToggle={() => toggleTable(n)}
              />
            )
          })}
        </div>

        <div className="levels-launch" aria-live="polite">
          <button
            type="button"
            className={`levels-launch__play${launchPulse ? ' is-pulse' : ''}`}
            disabled={selectedCount === 0}
            onClick={continueNext}
          >
            <IconPlay className="levels-launch__play-icon" aria-hidden />
            <span>{playLabel}</span>
          </button>
        </div>
      </section>
    </AppShell>
  )
}
