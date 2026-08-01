export type * from '@/minigames/types'
export {
  listMechanics,
  getMechanic,
  hasMechanic,
} from '@/minigames/mechanics'
export {
  MINIGAME_CATALOG,
  listMinigames,
  getMinigame,
  hasMinigame,
  minigamesForCategory,
  minigamesForArea,
  spellingMinigameId,
  calcMinigameId,
  moneyMinigameId,
  clocksMinigameId,
  tablesMinigameId,
  isSpellPlayMode,
} from '@/minigames/catalog'
export { buildRound } from '@/minigames/buildRound'
export type {
  BuildRoundOptions,
  RoundResult,
  SpellMcqRound,
  OrdenarLetrasRound,
  MathsRound,
} from '@/minigames/buildRound'
export type {
  MathsQuestion,
  MathsAnswer,
  MathsSkillId,
  MathsShape,
} from '@/minigames/mathsContract'
export {
  assertValidMathsQuestion,
  isMcqIndexCorrect,
} from '@/minigames/mathsContract'
