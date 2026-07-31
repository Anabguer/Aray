import type { SpellRuleId, SpellWord } from '@/spelling/types'

const RULE_EMOJI: Record<SpellRuleId, string> = {
  'r-rr': '🔤',
  'hie-hue': '🥚',
  'hay-ahi-ay': '📍',
  'hacer-echar': '🛠️',
  aba: '🎤',
  'll-illa': '💛',
  'haber-hablar': '💬',
  'b-v': '🅱️',
  'd-z': '✏️',
  'mb-mp': '🥁',
  'g-j': '🦒',
  'bu-bur': '🔍',
}

const RULE_TIP: Record<SpellRuleId, string> = {
  'r-rr': 'Entre vocales el sonido fuerte va con rr; tras l, n o s, una sola r',
  'hie-hue': 'Las palabras con hie- y hue- llevan h',
  'hay-ahi-ay': 'hay = existir · ahí = lugar · ¡ay! = exclamación',
  'hacer-echar': 'hacer lleva h; echar va sin h',
  aba: 'Las terminaciones -aba, -abas, -ábamos… van con b',
  'll-illa': 'Muchas palabras en -illo / -illa se escriben con ll',
  'haber-hablar': 'haber, hacer y hablar se escriben con h',
  'b-v': 'Repasa b/v: no todas las /b/ se escriben igual',
  'd-z': 'za, zo, zu con z; ce, ci con c',
  'mb-mp': 'Antes de p y b siempre va m',
  'g-j': 'Antes de e/i puede ir g o j: hay que aprender la palabra',
  'bu-bur': 'Muchas palabras empiezan por bu-, bur- o bus-',
}

function uniq3(word: string, candidates: string[]): [string, string, string] {
  const lower = word.toLowerCase()
  const out: string[] = []
  for (const c of candidates) {
    if (!c || c.toLowerCase() === lower) continue
    if (out.some((x) => x.toLowerCase() === c.toLowerCase())) continue
    out.push(c)
    if (out.length === 3) break
  }
  let n = 0
  while (out.length < 3 && n < 12) {
    n += 1
    const filler =
      n === 1
        ? `${word}s`
        : n === 2
          ? word.replace(/^[Hh]/, '') || `${word}a`
          : n === 3
            ? word.replace(/rr/i, 'r')
            : n === 4
              ? word.replace(/ll/i, 'y')
              : n === 5
                ? word.replace(/b/i, 'v')
                : n === 6
                  ? word.replace(/v/i, 'b')
                  : n === 7
                    ? word.replace(/m([bp])/i, 'n$1')
                    : n === 8
                      ? word.replace(/g([ei])/i, 'j$1')
                      : n === 9
                        ? word.replace(/j([ei])/i, 'g$1')
                        : n === 10
                          ? word.replace(/z/i, 'c')
                          : `${word}${n}`
    if (filler && filler.toLowerCase() !== lower && !out.some((x) => x.toLowerCase() === filler.toLowerCase())) {
      out.push(filler)
    }
  }
  while (out.length < 3) out.push(`${word}·${out.length}`)
  return [out[0]!, out[1]!, out[2]!]
}

/** Distractores tipográficos reales según la regla (sin “k” absurda). */
export function makeDistractors(word: string, rule: SpellRuleId): [string, string, string] {
  const w = word
  switch (rule) {
    case 'r-rr':
      if (/rr/i.test(w)) {
        return uniq3(w, [w.replace(/rr/i, 'r'), w.replace(/rr/i, 'rrr'), `${w}h`])
      }
      return uniq3(w, [
        w.replace(/([lns])r/i, '$1rr'),
        w.replace(/r/i, 'rr'),
        w.replace(/^h?/i, (m) => (m ? '' : 'H')),
      ])
    case 'hie-hue':
      return uniq3(w, [
        w.replace(/^h/i, ''),
        w.replace(/^h/i, 'y'),
        w.replace(/^hue/i, 'güe').replace(/^hie/i, 'ye'),
      ])
    case 'aba':
      return uniq3(w, [
        w.replace(/aba/i, 'ava'),
        w.replace(/ábamos/i, 'ávamos').replace(/abas/i, 'avas').replace(/aban/i, 'avan'),
        w.normalize('NFD').replace(/\u0301/g, ''),
      ])
    case 'll-illa':
      return uniq3(w, [w.replace(/ll/i, 'y'), w.replace(/ll/i, 'l'), w.replace(/ll/i, 'lll')])
    case 'b-v':
      return uniq3(w, [
        w.replace(/b/i, 'v'),
        w.replace(/v/i, 'b'),
        w.replace(/ll/i, 'y'),
      ])
    case 'haber-hablar':
      return uniq3(w, [w.replace(/^h/i, ''), w.replace(/^h/i, 'j'), `${w}h`])
    case 'mb-mp':
      return uniq3(w, [
        w.replace(/m([bp])/i, 'n$1'),
        w.replace(/m([bp])/i, 'mm$1'),
        w.normalize('NFD').replace(/\u0301/g, ''),
      ])
    case 'g-j':
      return uniq3(w, [
        w.replace(/g([eiéí])/i, 'j$1'),
        w.replace(/j([eiéí])/i, 'g$1'),
        w.replace(/g/i, 'j').replace(/j/i, 'g'),
      ])
    case 'bu-bur':
      return uniq3(w, [w.replace(/^b/i, 'v'), w.replace(/rr/i, 'r'), `${w}r`])
    case 'd-z':
      return uniq3(w, [
        w.replace(/z/i, 'c'),
        w.replace(/c([ei])/i, 'z$1'),
        w.replace(/z/i, 's'),
      ])
    case 'hacer-echar':
      return uniq3(w, [
        w.replace(/^h/i, ''),
        w.replace(/hech/i, 'ech').replace(/hac/i, 'ac'),
        w.replace(/ech/i, 'hech'),
      ])
    case 'hay-ahi-ay':
      return uniq3(w, ['hay', 'ahí', 'ay'].filter((x) => x.toLowerCase() !== w.toLowerCase()))
    default:
      return uniq3(w, [`${w}s`, w.replace(/^h/i, ''), w.replace(/b/i, 'v')])
  }
}

export function hardIndexFor(word: string, rule: SpellRuleId): number {
  const lower = word.toLowerCase()
  switch (rule) {
    case 'r-rr': {
      const rr = lower.indexOf('rr')
      if (rr >= 0) return rr
      const m = lower.match(/[lns]r/)
      if (m && m.index != null) return m.index + 1
      return Math.max(0, lower.indexOf('r'))
    }
    case 'hie-hue':
    case 'haber-hablar':
    case 'bu-bur':
      return 0
    case 'aba': {
      const i = lower.search(/ab/)
      return i >= 0 ? i : Math.max(0, lower.lastIndexOf('b'))
    }
    case 'll-illa': {
      const i = lower.indexOf('ll')
      return i >= 0 ? i : Math.max(0, Math.floor(word.length / 2))
    }
    case 'b-v': {
      const i = lower.search(/[bv]/)
      return i >= 0 ? i : 0
    }
    case 'mb-mp': {
      const i = lower.search(/m[bp]/)
      return i >= 0 ? i : Math.max(0, lower.indexOf('m'))
    }
    case 'g-j': {
      const i = lower.search(/[gj]/)
      return i >= 0 ? i : 0
    }
    case 'd-z': {
      const i = lower.search(/[cz]/)
      return i >= 0 ? i : Math.max(0, word.length - 1)
    }
    default:
      return 0
  }
}

export type SpellLemma = {
  word: string
  rule: SpellRuleId
  emoji?: string
  tip?: string
  hardIndex?: number
  distractors?: [string, string, string]
}

export function lemmaToWord(lemma: SpellLemma): SpellWord {
  return {
    word: lemma.word,
    rule: lemma.rule,
    emoji: lemma.emoji ?? RULE_EMOJI[lemma.rule],
    tip: lemma.tip ?? RULE_TIP[lemma.rule],
    hardIndex: lemma.hardIndex ?? hardIndexFor(lemma.word, lemma.rule),
    distractors: lemma.distractors ?? makeDistractors(lemma.word, lemma.rule),
  }
}

export function expandLemmas(lemmas: SpellLemma[]): SpellWord[] {
  const seen = new Set<string>()
  const out: SpellWord[] = []
  for (const lemma of lemmas) {
    const key = lemma.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(lemmaToWord(lemma))
  }
  return out
}
