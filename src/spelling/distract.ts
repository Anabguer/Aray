import type { SpellRuleId, SpellWord } from '@/spelling/types'

const RULE_EMOJI: Record<SpellRuleId, string> = {
  'r-rr': '🔤',
  'hie-hue': '🥚',
  h: '🏠',
  'hay-ahi-ay': '📍',
  'hacer-echar': '🛠️',
  aba: '🎤',
  'll-illa': '💛',
  'll-y': '💛',
  'haber-hablar': '💬',
  'b-v': '🅱️',
  'd-z': '✏️',
  'c-z-qu': '✏️',
  'mb-mp': '🥁',
  'mb-mp-nv': '🥁',
  'g-j': '🦒',
  'bu-bur': '🔍',
  'gu-gue': '🎸',
  tilde: '´',
}

const RULE_TIP: Record<SpellRuleId, string> = {
  'r-rr': 'Entre vocales el sonido fuerte va con rr; tras l, n o s, una sola r',
  'hie-hue': 'Las palabras con hie- y hue- llevan h',
  h: 'Muchas palabras llevan h aunque no suene',
  'hay-ahi-ay': 'hay = existir · ahí = lugar · ¡ay! = exclamación',
  'hacer-echar': 'hacer lleva h; echar va sin h',
  aba: 'Las terminaciones -aba, -abas, -ábamos… van con b',
  'll-illa': 'Muchas palabras en -illo / -illa se escriben con ll',
  'll-y': 'Repasa cuándo va ll y cuándo y',
  'haber-hablar': 'haber, hacer y hablar se escriben con h',
  'b-v': 'Repasa b/v: no todas las /b/ se escriben igual',
  'd-z': 'za, zo, zu con z; ce, ci con c',
  'c-z-qu': 'c / z / qu según el sonido',
  'mb-mp': 'Antes de p y b siempre va m',
  'mb-mp-nv': 'mb, mp y nv: repasa la nasal',
  'g-j': 'Antes de e/i puede ir g o j: hay que aprender la palabra',
  'bu-bur': 'Muchas palabras empiezan por bu-, bur- o bus-',
  'gu-gue': 'gu / gü: la diéresis marca que suena la u',
  tilde: 'Agudas, llanas y esdrújulas: repasa dónde va la tilde',
}

/** ¿Parece basura tipográfica o invento absurdo (inreloj, cazoón, re+lema…)? */
export function isJunkSpelling(form: string, correctWord?: string): boolean {
  const w = form.trim()
  if (!w) return true
  if (/\d/.test(w)) return true
  if (/·/.test(w)) return true
  if (/(.)\1\1/i.test(w)) return true // triple letra
  if (correctWord) {
    const base = correctWord.toLocaleLowerCase('es')
    const f = w.toLocaleLowerCase('es')
    // perro + o = perroo
    if (f.length === base.length + 1 && f.startsWith(base) && /^[aeiouáéíóú]$/i.test(f.slice(-1))) {
      return true
    }
    // Prefijos inventados: inreloj, recazo, desmesa…
    if (
      f === `in${base}` ||
      f === `re${base}` ||
      f === `des${base}` ||
      f === `a${base}` ||
      f === `ex${base}`
    ) {
      return true
    }
    // Sufijos inventados sobre el lema: cazoón, cazoito, relojoso…
    if (f.startsWith(base) && f.length > base.length) {
      const suf = f.slice(base.length)
      if (/^(ón|on|ito|ita|oso|osa|ura|esco|ía|ia|al|es|s)$/i.test(suf)) return true
    }
  }
  return false
}

function pushUnique(out: string[], word: string, candidate: string | undefined) {
  if (!candidate) return
  const lower = word.toLowerCase()
  const c = candidate.trim()
  if (!c || c.toLowerCase() === lower) return
  if (isJunkSpelling(c, word)) return
  if (out.some((x) => x.toLowerCase() === c.toLowerCase())) return
  out.push(c)
}

/**
 * Completa hasta 3 distractores solo con errores ortográficos plausibles.
 * Nunca inventa prefijos/sufijos absurdos (inreloj, cazoón, re+lema…).
 */
function uniq3(word: string, candidates: string[], ruleFallbacks: string[]): [string, string, string] {
  const out: string[] = []
  for (const c of candidates) pushUnique(out, word, c)
  for (const c of ruleFallbacks) {
    if (out.length >= 3) break
    pushUnique(out, word, c)
  }
  const generics = [
    word.replace(/b/gi, (ch) => (ch === 'B' ? 'V' : 'v')),
    word.replace(/v/gi, (ch) => (ch === 'V' ? 'B' : 'b')),
    word.replace(/rr/i, 'r'),
    word.replace(/([aeiouáéíóú])r([aeiouáéíóú])/i, '$1rr$2'),
    word.replace(/^h/i, ''),
    word.replace(/ll/i, 'y'),
    word.replace(/ll/i, 'l'),
    word.replace(/m([bp])/i, 'n$1'),
    word.replace(/g([eiéí])/i, 'j$1'),
    word.replace(/j([eiéí])/i, 'g$1'),
    word.replace(/z([aouáóú])/i, 'c$1'),
    word.replace(/c([eiéí])/i, 'z$1'),
    word.normalize('NFD').replace(/\u0301/g, ''),
    word.replace(/á/gi, 'a').replace(/é/gi, 'e').replace(/í/gi, 'i').replace(/ó/gi, 'o').replace(/ú/gi, 'u'),
    word.endsWith('o') ? `${word.slice(0, -1)}a` : undefined,
    word.endsWith('a') ? `${word.slice(0, -1)}o` : undefined,
    word.replace(/s$/i, ''),
    // Solo quitar «des-» real; nunca inventar «in»+lema.
    word.toLocaleLowerCase('es').startsWith('des') && word.length > 4 ? word.slice(3) : undefined,
  ].filter(Boolean) as string[]
  for (const c of generics) {
    if (out.length >= 3) break
    // No añadir solo una vocal al final (perro→perroo).
    if (c.length === word.length + 1 && /^[aeiouáéíóú]$/i.test(c.slice(-1)) && c.slice(0, -1).toLowerCase() === word.toLowerCase()) {
      continue
    }
    pushUnique(out, word, c)
  }
  // Variantes con tilde en otra vocal (siempre distintas).
  const base = word.normalize('NFD').replace(/\u0301/g, '')
  const accentMap: Record<string, string> = {
    a: 'á',
    e: 'é',
    i: 'í',
    o: 'ó',
    u: 'ú',
    A: 'Á',
    E: 'É',
    I: 'Í',
    O: 'Ó',
    U: 'Ú',
  }
  for (let i = 0; i < base.length && out.length < 3; i += 1) {
    const ch = base[i]!
    const alt = accentMap[ch]
    if (!alt) continue
    const trial = base.slice(0, i) + alt + base.slice(i + 1)
    pushUnique(out, word, trial)
  }
  // Último recurso: solo mutaciones de una letra (nunca prefijos/sufijos inventados).
  const vowelAlt: Record<string, string> = { a: 'e', e: 'i', i: 'u', o: 'u', u: 'o' }
  for (let i = 0; i < base.length && out.length < 3; i += 1) {
    const ch = base[i]!.toLowerCase()
    const alt = vowelAlt[ch]
    if (!alt) continue
    pushUnique(out, word, base.slice(0, i) + alt + base.slice(i + 1))
  }
  for (let i = 0; i < base.length && out.length < 3; i += 1) {
    if (!/[bcdfghjklmnpqrstvwxyz]/i.test(base[i]!)) continue
    pushUnique(out, word, `${base.slice(0, i)}${base.slice(i + 1)}`)
  }
  if (out.length < 3) {
    throw new Error(
      `[spelling] Sin distractores ortográficos plausibles para «${word}» (no se inventan formas absurdas)`,
    )
  }
  return [out[0]!, out[1]!, out[2]!]
}

function swapAllBv(w: string): string[] {
  const out: string[] = []
  for (let i = 0; i < w.length; i += 1) {
    const ch = w[i]!
    if (/b/i.test(ch)) {
      out.push(w.slice(0, i) + (ch === 'B' ? 'V' : 'v') + w.slice(i + 1))
    }
    if (/v/i.test(ch)) {
      out.push(w.slice(0, i) + (ch === 'V' ? 'B' : 'b') + w.slice(i + 1))
    }
  }
  return out
}

/** Distractores tipográficos reales según la regla (sin basura). */
export function makeDistractors(word: string, rule: SpellRuleId): [string, string, string] {
  const w = word
  const generic = [
    ...swapAllBv(w),
    w.replace(/rr/i, 'r'),
    w.replace(/ll/i, 'y'),
    w.replace(/^h/i, ''),
    w.replace(/m([bp])/i, 'n$1'),
  ]

  switch (rule) {
    case 'r-rr':
      if (/rr/i.test(w)) {
        // perro → pero (error real). Nunca perrro / perroo.
        return uniq3(
          w,
          [w.replace(/rr/i, 'r'), w.replace(/rr/gi, 'r')],
          [
            w.replace(/rr/i, 'r').replace(/b/i, 'v'),
            w.normalize('NFD').replace(/\u0301/g, ''),
            ...generic,
          ],
        )
      }
      return uniq3(
        w,
        [
          w.replace(/([lns])r/i, '$1rr'),
          w.replace(/([aeiouáéíóú])r([aeiouáéíóú])/i, '$1rr$2'),
          w.replace(/r/i, 'rr'),
        ],
        generic,
      )
    case 'hie-hue':
      return uniq3(
        w,
        [
          w.replace(/^h/i, ''),
          w.replace(/^hue/i, 'üe').replace(/^hie/i, 'ie'),
          w.replace(/^hue/i, 'güe'),
        ],
        generic,
      )
    case 'aba':
      return uniq3(
        w,
        [
          w.replace(/aba/i, 'ava'),
          w.replace(/ábamos/i, 'ávamos'),
          w.replace(/abas/i, 'avas'),
          w.replace(/aban/i, 'avan'),
          w.replace(/abais/i, 'avais'),
        ],
        generic,
      )
    case 'll-illa':
      return uniq3(
        w,
        [w.replace(/ll/i, 'y'), w.replace(/ll/i, 'l'), w.replace(/illo/i, 'iyo').replace(/illa/i, 'iya')],
        generic,
      )
    case 'b-v':
      return uniq3(w, swapAllBv(w), generic)
    case 'haber-hablar':
      return uniq3(
        w,
        [w.replace(/^h/i, ''), w.replace(/^ha/i, 'a'), w.replace(/^hab/i, 'ab')],
        generic,
      )
    case 'mb-mp':
      return uniq3(
        w,
        [w.replace(/m([bp])/i, 'n$1'), w.replace(/m([bp])/gi, 'n$1')],
        generic,
      )
    case 'g-j':
      return uniq3(
        w,
        [
          w.replace(/g([eiéí])/i, 'j$1'),
          w.replace(/j([eiéí])/i, 'g$1'),
          w.replace(/ge/i, 'je').replace(/gi/i, 'ji'),
          w.replace(/je/i, 'ge').replace(/ji/i, 'gi'),
        ],
        generic,
      )
    case 'bu-bur':
      return uniq3(
        w,
        [w.replace(/^b/i, 'v'), w.replace(/^bu/i, 'vu'), w.replace(/^bur/i, 'vur'), w.replace(/^bus/i, 'vus')],
        generic,
      )
    case 'd-z':
      return uniq3(
        w,
        [
          w.replace(/z([aouáóú])/i, 'c$1'),
          w.replace(/c([eiéí])/i, 'z$1'),
          w.replace(/z/i, 's'),
          w.replace(/c([ei])/i, 's$1'),
        ],
        generic,
      )
    case 'hacer-echar':
      return uniq3(
        w,
        [
          w.replace(/^h/i, ''),
          w.replace(/hech/i, 'ech'),
          w.replace(/hac/i, 'ac'),
          w.replace(/^ech/i, 'hech'),
          w.replace(/^ech/i, 'hech'),
        ],
        generic,
      )
    case 'hay-ahi-ay':
      return uniq3(
        w,
        ['hay', 'ahí', 'ay', 'ahi', 'hai'].filter((x) => x.toLowerCase() !== w.toLowerCase()),
        generic,
      )
    case 'tilde': {
      const noAccent = w.normalize('NFD').replace(/\u0301/g, '')
      const wrongSpot = (() => {
        const chars = [...noAccent]
        // Poner tilde en otra vocal
        for (let i = chars.length - 1; i >= 0; i -= 1) {
          if (/[aeiou]/i.test(chars[i]!) && chars[i]!.toLowerCase() !== w[i]?.toLowerCase()) {
            /* continue */
          }
          if (/[aeiou]/i.test(chars[i]!)) {
            const map: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }
            const alt = map[chars[i]!]
            if (alt) {
              const trial = [...chars]
              trial[i] = alt
              const joined = trial.join('')
              if (joined.toLowerCase() !== w.toLowerCase()) return joined
            }
          }
        }
        return `${noAccent}a`
      })()
      return uniq3(w, [noAccent, wrongSpot, noAccent.replace(/b/i, 'v')], generic)
    }
    default:
      return uniq3(w, generic, [])
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
    case 'tilde': {
      const nfd = word.normalize('NFD')
      const idx = nfd.search(/\u0301/)
      if (idx > 0) return Math.max(0, [...nfd.slice(0, idx)].length - 1)
      return Math.max(0, Math.floor(word.length / 2))
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
