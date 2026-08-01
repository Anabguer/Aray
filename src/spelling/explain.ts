import type { SpellPlayMode, SpellRuleId } from '@/spelling/types'

export type SpellExplainCard = {
  badge: string
  whyWrong: string
  whyRight: string
}

const RULE_BADGE: Record<SpellRuleId, string> = {
  'r-rr': 'r / rr',
  'hie-hue': 'h muda',
  h: 'h muda',
  'hay-ahi-ay': 'hay · ahí · ¡ay!',
  'hacer-echar': 'hacer · echar',
  aba: '-aba con b',
  'll-illa': 'll',
  'll-y': 'll / y',
  'haber-hablar': 'con h',
  'b-v': 'b / v',
  'd-z': 'c / z',
  'c-z-qu': 'c / z / qu',
  'mb-mp': 'm antes de p/b',
  'mb-mp-nv': 'mb / mp / nv',
  'g-j': 'g / j',
  'bu-bur': 'bu · bur · bus',
  'gu-gue': 'gu / gü',
  tilde: 'tilde',
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/¡|!/g, '')
}

function explainHayAhiAy(correct: string, chosen: string): SpellExplainCard {
  const c = norm(correct)
  const w = norm(chosen)
  const meaning = (x: string) => {
    if (x === 'hay') return 'significa “existe” (verbo haber)'
    if (x === 'ahí') return 'señala un sitio'
    if (x === 'ay') return 'es una exclamación (¡ay!)'
    return 'no encaja aquí'
  }
  return {
    badge: RULE_BADGE['hay-ahi-ay'],
    whyWrong: `“${chosen}” ${meaning(w)}.`,
    whyRight: `Va “${correct}” porque ${meaning(c)}.`,
  }
}

function explainHacerEchar(correct: string, chosen: string): SpellExplainCard {
  const c = norm(correct)
  const w = norm(chosen)
  const isHacer = /hech|hiz|hac/.test(c)
  const choseEchar = /ech/.test(w) && !/hech/.test(w)
  const choseHacer = /hech|hiz|hac/.test(w)
  return {
    badge: RULE_BADGE['hacer-echar'],
    whyWrong: choseEchar
      ? `“${chosen}” es de echar (sin h). Aquí no es “tirar / poner”.`
      : choseHacer
        ? `“${chosen}” suena parecido, pero no es la forma que pide la frase.`
        : `“${chosen}” no es la forma correcta de esta frase.`,
    whyRight: isHacer
      ? `“${correct}” es de hacer → lleva h.`
      : `“${correct}” es de echar → va sin h.`,
  }
}

function explainRrr(correct: string, chosen: string): SpellExplainCard {
  const hasRr = /rr/i.test(correct)
  const choseSingle = /r/i.test(chosen) && !/rr/i.test(chosen)
  return {
    badge: RULE_BADGE['r-rr'],
    whyWrong: choseSingle
      ? `Con una sola r suena suave (como en “pero”).`
      : `“${chosen}” no escribe bien el sonido de la r.`,
    whyRight: hasRr
      ? `“${correct}” lleva rr porque entre vocales el sonido es fuerte.`
      : `“${correct}” lleva una sola r (tras l, n o s, o al inicio).`,
  }
}

function explainHieHue(correct: string, chosen: string): SpellExplainCard {
  const droppedH = !/^h/i.test(chosen) && /^h/i.test(correct)
  return {
    badge: RULE_BADGE['hie-hue'],
    whyWrong: droppedH
      ? `Falta la h: en español no se oye, pero se escribe.`
      : `“${chosen}” no sigue la regla de hie- / hue-.`,
    whyRight: `“${correct}” empieza por hie- o hue- → siempre con h.`,
  }
}

function explainGeneric(
  rule: SpellRuleId | undefined,
  correct: string,
  chosen: string,
  tip?: string,
): SpellExplainCard {
  return {
    badge: rule ? RULE_BADGE[rule] : 'Ortografía',
    whyWrong: `Elegiste “${chosen}”, pero esa forma no es la correcta.`,
    whyRight: tip
      ? `La buena es “${correct}”. ${tip}`
      : `La buena es “${correct}”.`,
  }
}

/** Explicación corta y visual para niños de 8–9 años tras un fallo. */
export function explainSpellMistake(input: {
  mode: SpellPlayMode
  rule?: SpellRuleId
  tip?: string
  correct: string
  chosen: string
}): SpellExplainCard {
  const { mode, rule, tip, correct, chosen } = input

  if (mode === 'intruder') {
    return {
      badge: 'La intrusa',
      whyWrong: `“${chosen}” está bien escrita. No era la intrusa.`,
      whyRight: `La mal escrita era “${correct}”. Esa es la que hay que pillar.`,
    }
  }

  if (rule === 'hay-ahi-ay') return explainHayAhiAy(correct, chosen)
  if (rule === 'hacer-echar') return explainHacerEchar(correct, chosen)
  if (rule === 'r-rr') return explainRrr(correct, chosen)
  if (rule === 'hie-hue') return explainHieHue(correct, chosen)

  if (rule === 'aba') {
    return {
      badge: RULE_BADGE.aba,
      whyWrong: `“${chosen}” no lleva bien la terminación del pasado.`,
      whyRight: `“${correct}” termina en -aba… y eso va con b (no con v).`,
    }
  }

  if (rule === 'mb-mp') {
    return {
      badge: RULE_BADGE['mb-mp'],
      whyWrong: `Antes de p o b no va n.`,
      whyRight: `En “${correct}” va m delante de p/b.`,
    }
  }

  if (rule === 'g-j') {
    return {
      badge: RULE_BADGE['g-j'],
      whyWrong: `“${chosen}” no escribe bien el sonido g/j de esta palabra.`,
      whyRight: `La forma correcta es “${correct}”. Hay que memorizarla.`,
    }
  }

  if (rule === 'bu-bur') {
    return {
      badge: RULE_BADGE['bu-bur'],
      whyWrong: `“${chosen}” no empieza bien (bu-/bur-/bus- o b).`,
      whyRight: `Va “${correct}” con b.`,
    }
  }

  if (rule === 'd-z') {
    return {
      badge: RULE_BADGE['d-z'],
      whyWrong: `“${chosen}” mezcla c y z.`,
      whyRight: `“${correct}” usa la letra que toca (za/zo/zu → z; ce/ci → c).`,
    }
  }

  if (rule === 'b-v' || rule === 'll-illa' || rule === 'haber-hablar') {
    return explainGeneric(rule, correct, chosen, tip)
  }

  return explainGeneric(rule, correct, chosen, tip)
}
