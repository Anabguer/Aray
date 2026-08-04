import {
  mundoIngles,
  mundoLenguas,
  mundoMatematicas,
  mundoMedi,
} from '@/assets/worlds'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { visibleWorlds } from '@/curriculum'
import type { SubjectId } from '@/curriculum/types'
import { useProgress } from '@/progress/ProgressContext'

const WORLD_META: Record<
  string,
  { imageSrc: string; className: string; text: string; tag: string }
> = {
  maths: {
    imageSrc: mundoMatematicas,
    className: 'mode-poster--challenge',
    text: 'Tablas, cálculo, dinero y horas',
    tag: 'DESTACADO',
  },
  languages: {
    imageSrc: mundoLenguas,
    className: 'mode-poster--learn',
    text: 'ABC, ortografía y más',
    tag: 'DESTACADO',
  },
  english: {
    imageSrc: mundoIngles,
    className: 'mode-poster--train',
    text: 'Vocabulario, gramática y frases',
    tag: '01',
  },
  medi: {
    imageSrc: mundoMedi,
    className: 'mode-poster--match',
    text: 'Ciencias y el mundo real',
    tag: '02',
  },
}

export function MissionsScreen() {
  const { progress } = useProgress()
  const worlds = visibleWorlds(progress)
  const byId = new Map(worlds.map((w) => [w.id, w]))

  function slot(id: SubjectId | 'medi', featured: boolean) {
    const world = byId.get(id as SubjectId)
    const meta = WORLD_META[id]!
    const title = (world?.title ?? id).toUpperCase()
    const available = Boolean(world?.hasPlayable)
    return (
      <StageSlot
        key={id}
        imageSrc={meta.imageSrc}
        title={title}
        text={meta.text}
        className={meta.className}
        tag={featured ? meta.tag : meta.tag}
        featured={featured}
        world
        locked={!available}
        to={available ? world?.worldPath : undefined}
      />
    )
  }

  return (
    <AppShell title="MIS MUNDOS" shortTitle="Mundos">
      <StageSelect
        kicker="Selecciona mundo"
        title="Elige tu mundo"
        divider="Más mundos"
        heroes={
          <>
            {slot('maths', true)}
            {slot('languages', true)}
          </>
        }
        roster={
          <>
            {slot('english', false)}
            {slot('medi', false)}
          </>
        }
        rosterCols={2}
        ariaLabel="Selección de mundos"
      />
    </AppShell>
  )
}
