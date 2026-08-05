import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  WORDS_EXERCISES,
  activeWordsExercises,
  wordsExerciseHref,
} from '@/features/languages/words/exercises'

/**
 * Arriba: Random + Mis fallos.
 * Abajo: todos los ejercicios (lo que Random elige al azar).
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
            key="random"
            art="sorpresa"
            title="RANDOM"
            text="Formar, clasificar, montar frase… Lumo elige"
            className="mode-poster--random"
            tag="DESTACADO"
            featured
            onClick={startRandom}
          />,
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
        ]}
        roster={WORDS_EXERCISES.map((exercise) => (
          <StageSlot
            key={exercise.id}
            art={exercise.art}
            title={exercise.title.toUpperCase()}
            text={exercise.text}
            className={exercise.className}
            tag={exercise.tag}
            locked={exercise.status !== 'active'}
            to={
              exercise.status === 'active' ? wordsExerciseHref(exercise) : undefined
            }
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}
