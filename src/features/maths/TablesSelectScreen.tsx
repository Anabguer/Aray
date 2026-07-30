import { useMemo, useState } from 'react'
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

  const reviewTables = useMemo(
    () =>
      PLAYABLE_TABLES.filter((n) => {
        const t = progress.tables[String(n)]
        return t ? tableStatus(t).recommendPractice : false
      }),
    [progress.tables],
  )

  const playLabel = useMemo(() => {
    if (mix) return 'JUGAR MEZCLA'
    if (picked.length === 1) return `JUGAR TABLA DEL ${picked[0]}`
    if (picked.length > 1) return `JUGAR ${picked.length} TABLAS`
    return 'JUGAR'
  }, [mix, picked])

  function toggleTable(n: number) {
    setMix(false)
    setPicked((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n)
      return [...prev, n]
    })
  }

  function selectMix() {
    setMix(true)
    setPicked([...MIX_TABLES])
  }

  function continueNext() {
    const tables = mix ? [...MIX_TABLES] : picked
    if (tables.length === 0) return
    setSelection({ tables, mix })
    navigate('/missions/mates/tables/modes')
  }

  return (
    <AppShell
      title="Niveles"
      showBack
      backTo="/missions/mates"
    >
      <section className="levels-map">
        <p className="page-intro__lead page-intro__lead--tight">
          Elige niveles. Varias tablas se juegan en el orden escogido.
        </p>

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

        <button
          type="button"
          className={`mix-chip${mix ? ' is-on' : ''}`}
          onClick={selectMix}
          aria-pressed={mix}
        >
          Mezcla
          <span>Todas del 2 al 9 · en orden</span>
        </button>

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

        <div className="tables-select__footer">
          <button
            type="button"
            className="btn btn-primary btn-block tables-select__play"
            disabled={!mix && picked.length === 0}
            onClick={continueNext}
          >
            <IconPlay className="tables-select__play-icon" aria-hidden />
            {playLabel}
          </button>
        </div>
      </section>
    </AppShell>
  )
}
