import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  activeWordsExercises,
  wordsExerciseHref,
  type WordsExercise,
} from '@/features/languages/words/exercises'

function slotFor(exercise: WordsExercise) {
  return (
    <StageSlot
      key={exercise.id}
      art={exercise.art}
      title={exercise.title.toUpperCase()}
      text={exercise.text}
      className={exercise.className}
      tag={exercise.tag}
      featured={Boolean(exercise.featured)}
      to={wordsExerciseHref(exercise)}
    />
  )
}

export function WordsModeSelectScreen() {
  const active = activeWordsExercises()
  const heroes = active.filter((e) => e.featured)
  const roster = active.filter((e) => !e.featured)

  return (
    <AppShell title="PALABRAS" shortTitle="Palabras" showBack backTo="/missions/languages">
      <StageSelect
        heroes={heroes.map(slotFor)}
        heroesCols={heroes.length >= 3 ? 3 : 2}
        roster={roster.length > 0 ? roster.map(slotFor) : undefined}
        rosterCols={3}
      />
    </AppShell>
  )
}
