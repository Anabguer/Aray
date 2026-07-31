export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'

/**
 * Bloques alineados con cuadernos de 3.º (castellano),
 * p. ej. CEIP Diputació / genially 3º: r-rr, hie-/hue-, ahí-hay-ay,
 * hacer-echar, -aba, -illo/-illa, verbos haber/hacer/hablar.
 */
export type SpellRuleId =
  | 'r-rr'
  | 'hie-hue'
  | 'hay-ahi-ay'
  | 'hacer-echar'
  | 'aba'
  | 'll-illa'
  | 'haber-hablar'
  | 'b-v'
  | 'd-z'
  | 'mb-mp'

export interface SpellWord {
  word: string
  /** Confusiones reales (nunca “k” absurda). */
  distractors: [string, string, string]
  emoji: string
  rule: SpellRuleId
  /** Regla genérica: no debe delatar la palabra concreta. */
  tip: string
  hardIndex: number
}

/** Frase con hueco: el ejercicio típico de 3.º. */
export interface SpellContext {
  id: string
  sentence: string
  options: [string, string, string, string]
  correctIndex: number
  tip: string
  rule: SpellRuleId
}

export interface SpellMcqQuestion {
  kind: 'mcq'
  id: string
  mode: SpellPlayMode
  prompt: string
  tip?: string
  rule?: SpellRuleId
  /** Frase con ___ o patrón con _ */
  display?: string
  emoji?: string
  options: string[]
  correctIndex: number
}

export type SpellQuestion = SpellMcqQuestion

export interface SpellSessionSummary {
  mode: SpellPlayMode
  total: number
  correct: number
  bestStreak: number
}

export const SPELL_ROUND_SIZE = 12

export const SPELL_MODE_LABELS: Record<SpellPlayMode, string> = {
  missing: 'Letra de la regla',
  correct: 'Forma correcta',
  picture: 'Imagen y palabra',
  intruder: 'La intrusa',
  complete: 'Completa la frase',
  mix: 'Mezcla total',
}

/** Vocabulario / confusiones de cuaderno 3.º (no trampas con k). */
export const SPELL_BANK: SpellWord[] = [
  // r / rr
  {
    word: 'perro',
    distractors: ['pero', 'perroo', 'perrro'],
    emoji: '🐕',
    rule: 'r-rr',
    tip: 'Entre vocales, el sonido fuerte se escribe rr',
    hardIndex: 2,
  },
  {
    word: 'carro',
    distractors: ['caro', 'carroo', 'carroh'],
    emoji: '🚗',
    rule: 'r-rr',
    tip: 'Entre vocales, el sonido fuerte se escribe rr',
    hardIndex: 2,
  },
  {
    word: 'alrededor',
    distractors: ['arrededor', 'alededor', 'alrrededor'],
    emoji: '🔄',
    rule: 'r-rr',
    tip: 'Tras l, n o s: una sola r (aunque suene fuerte)',
    hardIndex: 2,
  },
  {
    word: 'sonreír',
    distractors: ['sorrreír', 'sonreir', 'sonrreír'],
    emoji: '😊',
    rule: 'r-rr',
    tip: 'Tras l, n o s: una sola r',
    hardIndex: 3,
  },
  {
    word: 'Enrique',
    distractors: ['Enrrique', 'Enriqe', 'Henrique'],
    emoji: '👦',
    rule: 'r-rr',
    tip: 'Tras l, n o s: una sola r',
    hardIndex: 2,
  },

  // hie- / hue-
  {
    word: 'hierro',
    distractors: ['yerro', 'ierro', 'hiero'],
    emoji: '⚙️',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'hueso',
    distractors: ['ueso', 'güeso', 'huesoa'],
    emoji: '🦴',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'hierba',
    distractors: ['yerba', 'ierba', 'hierbah'],
    emoji: '🌿',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'huevo',
    distractors: ['uevo', 'güevo', 'huebo'],
    emoji: '🥚',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'hielo',
    distractors: ['ielo', 'yelo', 'hieloh'],
    emoji: '🧊',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'huella',
    distractors: ['uella', 'güella', 'huellaa'],
    emoji: '👣',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },

  // -aba
  {
    word: 'cantaba',
    distractors: ['cantava', 'cantába', 'cantabah'],
    emoji: '🎤',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 5,
  },
  {
    word: 'jugaba',
    distractors: ['jugava', 'jugába', 'hugaba'],
    emoji: '⚽',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 4,
  },
  {
    word: 'estudiábamos',
    distractors: ['estudiávamos', 'estudiabamos', 'estudiábamoss'],
    emoji: '📚',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 7,
  },

  // -illo / -illa
  {
    word: 'amarillo',
    distractors: ['amariyo', 'amarilo', 'amarrillo'],
    emoji: '💛',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 5,
  },
  {
    word: 'cucharilla',
    distractors: ['cuchariya', 'cucharila', 'cucharillaa'],
    emoji: '🥄',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 7,
  },
  {
    word: 'bolsillo',
    distractors: ['bolsiyo', 'bolsilo', 'bolssillo'],
    emoji: '👖',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 5,
  },

  // b/v habitual
  {
    word: 'caballo',
    distractors: ['cavallo', 'cabayo', 'caballoh'],
    emoji: '🐴',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 2,
  },
  {
    word: 'haber',
    distractors: ['aver', 'haver', 'áber'],
    emoji: '📦',
    rule: 'haber-hablar',
    tip: 'hacer, haber y hablar se escriben con h',
    hardIndex: 0,
  },
  {
    word: 'hablar',
    distractors: ['ablar', 'havlar', 'hablár'],
    emoji: '💬',
    rule: 'haber-hablar',
    tip: 'hacer, haber y hablar se escriben con h',
    hardIndex: 0,
  },

  // mb/mp
  {
    word: 'también',
    distractors: ['tanbién', 'tambien', 'tambíen'],
    emoji: '➕',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
]

/**
 * Frases tipo cuaderno 3.º (hay/ahí/ay, hecho/echo, hacer/echar…).
 * Las 4 opciones suenan o se parecen: hay que pensar el significado.
 */
export const SPELL_CONTEXTS: SpellContext[] = [
  {
    id: 'hay-1',
    sentence: 'En la calle ___ varios perros.',
    options: ['hay', 'ahí', '¡ay!', 'ay'],
    correctIndex: 0,
    tip: 'hay = verbo haber (existencia)',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ahi-1',
    sentence: 'He dejado el libro ___ encima de la mesa.',
    options: ['ahí', 'hay', '¡ay!', 'ay'],
    correctIndex: 0,
    tip: 'ahí = lugar',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ay-1',
    sentence: '___ qué pisotón me has dado!',
    options: ['¡Ay!', 'Hay', 'Ahí', 'Ay'],
    correctIndex: 0,
    tip: '¡ay! = dolor, sorpresa o alegría',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'hay-2',
    sentence: '¿___ algún asiento libre a la sombra?',
    options: ['Hay', 'Ahí', '¡Ay!', 'Ay'],
    correctIndex: 0,
    tip: 'hay = verbo haber',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ahi-2',
    sentence: 'No pongas ___ tu abrigo: se ensucia.',
    options: ['ahí', 'hay', '¡ay!', 'hai'],
    correctIndex: 0,
    tip: 'ahí = lugar',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ay-2',
    sentence: 'El futbolista gritó ___ cuando recibió la patada.',
    options: ['¡ay!', 'hay', 'ahí', 'hai'],
    correctIndex: 0,
    tip: '¡ay! expresa dolor o sorpresa',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'hecho-1',
    sentence: 'Luisa ha ___ una pajarita de papel.',
    options: ['hecho', 'echo', 'heco', 'haecho'],
    correctIndex: 0,
    tip: 'hecho = verbo hacer (con h)',
    rule: 'hacer-echar',
  },
  {
    id: 'echo-1',
    sentence: 'Yo ___ agua al jardinero cada tarde.',
    options: ['echo', 'hecho', 'heco', 'ha echo'],
    correctIndex: 0,
    tip: 'echo = verbo echar (sin h)',
    rule: 'hacer-echar',
  },
  {
    id: 'hecho-2',
    sentence: 'Las cuentas ya están ___.',
    options: ['hechas', 'echas', 'echadas', 'fechas'],
    correctIndex: 0,
    tip: 'hecho/hechas = hacer',
    rule: 'hacer-echar',
  },
  {
    id: 'echa-1',
    sentence: 'Ramona ___ el ramo de flores al agua.',
    options: ['echa', 'hecha', 'hace', 'echaó'],
    correctIndex: 0,
    tip: 'echar = sin h',
    rule: 'hacer-echar',
  },
  {
    id: 'hizo-1',
    sentence: 'Primero ella ___ un ramo con rosas.',
    options: ['hizo', 'izo', 'echo', 'hiso'],
    correctIndex: 0,
    tip: 'formas de hacer llevan h',
    rule: 'hacer-echar',
  },
  {
    id: 'echaron-1',
    sentence: 'Ayer ___ comida a las gallinas.',
    options: ['echaron', 'hecharon', 'hacharón', 'echarón'],
    correctIndex: 0,
    tip: 'formas de echar van sin h',
    rule: 'hacer-echar',
  },
  {
    id: 'habia-1',
    sentence: 'En el hueco de la escalera ___ un hierro retorcido.',
    options: ['había', 'avía', 'habia', 'a vía'],
    correctIndex: 0,
    tip: 'haber se escribe con h',
    rule: 'haber-hablar',
  },
  {
    id: 'hierro-ctx',
    sentence: 'La valla del huerto es de ___.',
    options: ['hierro', 'yerro', 'ierro', 'hiero'],
    correctIndex: 0,
    tip: 'hie- / hue- llevan h',
    rule: 'hie-hue',
  },
  {
    id: 'perro-ctx',
    sentence: 'El ___ llegó corriendo hasta el carro.',
    options: ['perro', 'pero', 'perroo', 'perrro'],
    correctIndex: 0,
    tip: 'Entre vocales, sonido fuerte → rr',
    rule: 'r-rr',
  },
  {
    id: 'alrededor-ctx',
    sentence: 'Los gorriones volaban ___ de la torre.',
    options: ['alrededor', 'arrededor', 'alededor', 'alrrededor'],
    correctIndex: 0,
    tip: 'Tras l: una sola r',
    rule: 'r-rr',
  },
  {
    id: 'cantaba-ctx',
    sentence: 'Ayer ella ___ una canción en el patio.',
    options: ['cantaba', 'cantava', 'cantába', 'cantabah'],
    correctIndex: 0,
    tip: 'Pretérito -aba con b',
    rule: 'aba',
  },
  {
    id: 'hola-1',
    sentence: '___ , ¿cómo estás?',
    options: ['Hola', 'Ola', '¡Hola!', 'Olaa'],
    correctIndex: 0,
    tip: 'Saludo: hola (con h)',
    rule: 'haber-hablar',
  },
]
