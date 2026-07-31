import { expandLemmas } from '@/spelling/distract'
import { SPELL_LEMMAS } from '@/spelling/lemmas.generated'
import type { SpellWord } from '@/spelling/types'

/** Banco ampliado (~1000+) para 3.º / cicle mitjà. */
export const SPELL_BANK: SpellWord[] = expandLemmas(SPELL_LEMMAS)
