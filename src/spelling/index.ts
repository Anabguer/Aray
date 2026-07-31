export type {
  SpellPlayMode,
  SpellQuestion,
  SpellSessionSummary,
  SpellRuleId,
} from '@/spelling/types'
export { SPELL_ROUND_SIZE, SPELL_MODE_LABELS, SPELL_CONTEXTS } from '@/spelling/types'
export { SPELL_BANK } from '@/spelling/bank'
export { buildSpellRound, buildSpellQuestion, hardUnitAt } from '@/spelling/generator'
export { explainSpellMistake } from '@/spelling/explain'
export { SpellSessionProvider, useSpellSession } from '@/spelling/SpellSessionContext'
export {
  recordSpellMiss,
  recordSpellHit,
  listActiveSpellMisses,
  countActiveSpellMisses,
} from '@/spelling/missStore'
