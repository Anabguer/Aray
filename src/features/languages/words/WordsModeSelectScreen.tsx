import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  activeWordsExercises,
  wordsExerciseHref,
} from '@/features/languages/words/exercises'

/**
 * Solo Mis fallos + Random.
 * Random elige un ejercicio activo al azar.
 * Mis fallos: aún sin store de lemas; card bloqueada hasta que exista.
 */
export function WordsModeSelectScreen() {
  const navigate = useNavigate()
  const active = activeWordsExercises()

  function startRandom() {
    if (active.length === 0) return
    const exercise = active[Math.floor(Math.random() * active.length)]!
    navigate(wordsExerciseHref(exercise))
  }

  return (
    <AppShell title="PALABRAS" shortTitle="Palabras" showBack backTo="/missions/languages">
      <StageSelect
        heroes={[
          <StageSlot
            key="misses"
            art="mis-fallos"
            title="MIS FALLOS"
            text="Pronto: los fallos de cada ejercicio se guardarán aquí"
            className="mode-poster--misses"
            tag="REPASO"
            featured
            locked
          />,
          <StageSlot
            key="random"
            art="sorpresa"
            title="RANDOM"
            text="Formar, clasificar, montar frase… Lumo elige"
            className="mode-poster--random"
            tag="DESTACADO"
            featured
            onClick={startRandom}
          />,
        ]}
      />
    </AppShell>
  )
}
