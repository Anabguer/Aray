export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'

/**
 * Bloques alineados con 3.º / cicle mitjà (Catalunya + cuadernos CEIP Diputació / Maspe 3):
 * r-rr, hie-/hue-, ahí-hay-ay, hacer-echar, -aba, -illo/-illa, haber/hablar,
 * b/v, mb/mp, g/j, bu/bur/bus, c/z.
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
  | 'g-j'
  | 'bu-bur'

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

/** Vocabulario / confusiones de cuaderno 3.º (cicle mitjà Catalunya). */
export const SPELL_BANK: SpellWord[] = [
  // —— r / rr ——
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
    word: 'tierra',
    distractors: ['tiera', 'tierrra', 'tyerra'],
    emoji: '🌍',
    rule: 'r-rr',
    tip: 'Entre vocales, el sonido fuerte se escribe rr',
    hardIndex: 3,
  },
  {
    word: 'guerra',
    distractors: ['guera', 'guerrra', 'güerra'],
    emoji: '⚔️',
    rule: 'r-rr',
    tip: 'Entre vocales, el sonido fuerte se escribe rr',
    hardIndex: 3,
  },
  {
    word: 'parra',
    distractors: ['para', 'parrra', 'parrah'],
    emoji: '🍇',
    rule: 'r-rr',
    tip: 'Entre vocales, el sonido fuerte se escribe rr',
    hardIndex: 2,
  },
  {
    word: 'torre',
    distractors: ['tore', 'torrre', 'torreh'],
    emoji: '🏰',
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
  {
    word: 'honrado',
    distractors: ['honrrado', 'onrado', 'honrrrado'],
    emoji: '🤝',
    rule: 'r-rr',
    tip: 'Tras l, n o s: una sola r',
    hardIndex: 3,
  },
  {
    word: 'Israel',
    distractors: ['Isrrael', 'Isrraelh', 'Ysrael'],
    emoji: '🗺️',
    rule: 'r-rr',
    tip: 'Tras l, n o s: una sola r',
    hardIndex: 2,
  },

  // —— hie- / hue- ——
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
  {
    word: 'hueco',
    distractors: ['ueco', 'güeco', 'huecoo'],
    emoji: '🕳️',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'huerta',
    distractors: ['uerta', 'güerta', 'huertah'],
    emoji: '🥬',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'hiena',
    distractors: ['iena', 'yena', 'hienah'],
    emoji: '🐺',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },
  {
    word: 'huelga',
    distractors: ['uelga', 'güelga', 'huelgah'],
    emoji: '🪧',
    rule: 'hie-hue',
    tip: 'Las palabras con hie- y hue- llevan h',
    hardIndex: 0,
  },

  // —— -aba ——
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
  {
    word: 'saltaba',
    distractors: ['saltava', 'saltába', 'saltabah'],
    emoji: '🤸',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 5,
  },
  {
    word: 'dibujaba',
    distractors: ['dibujava', 'dibujába', 'dibujabah'],
    emoji: '🎨',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 6,
  },
  {
    word: 'bailaban',
    distractors: ['bailavan', 'bailában', 'bailabann'],
    emoji: '💃',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 5,
  },
  {
    word: 'caminabas',
    distractors: ['caminavas', 'caminábas', 'caminabass'],
    emoji: '🚶',
    rule: 'aba',
    tip: 'Las terminaciones -aba, -abas, -ábamos… van con b',
    hardIndex: 6,
  },

  // —— -illo / -illa ——
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
  {
    word: 'tortilla',
    distractors: ['tortiya', 'tortila', 'torrtilla'],
    emoji: '🫓',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 5,
  },
  {
    word: 'camisilla',
    distractors: ['camisiya', 'camisila', 'camissilla'],
    emoji: '👕',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 6,
  },
  {
    word: 'martillo',
    distractors: ['martiyo', 'martilo', 'marrtillo'],
    emoji: '🔨',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 5,
  },
  {
    word: 'mesilla',
    distractors: ['mesiya', 'mesila', 'messilla'],
    emoji: '🛏️',
    rule: 'll-illa',
    tip: 'Muchas palabras en -illo / -illa se escriben con ll',
    hardIndex: 4,
  },

  // —— b / v ——
  {
    word: 'caballo',
    distractors: ['cavallo', 'cabayo', 'caballoh'],
    emoji: '🐴',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 2,
  },
  {
    word: 'árbol',
    distractors: ['árvol', 'arbol', 'árboll'],
    emoji: '🌳',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 2,
  },
  {
    word: 'abeja',
    distractors: ['aveja', 'abejia', 'habeja'],
    emoji: '🐝',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 1,
  },
  {
    word: 'libro',
    distractors: ['livro', 'libbro', 'llibro'],
    emoji: '📖',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 2,
  },
  {
    word: 'vaca',
    distractors: ['baca', 'vacca', 'vahca'],
    emoji: '🐄',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 0,
  },
  {
    word: 'ventana',
    distractors: ['bentana', 'ventanna', 'ventaná'],
    emoji: '🪟',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 0,
  },
  {
    word: 'viaje',
    distractors: ['biaje', 'viajje', 'viajeh'],
    emoji: '✈️',
    rule: 'b-v',
    tip: 'Repasa b/v: no todas las /b/ se escriben igual',
    hardIndex: 0,
  },
  {
    word: 'albóndiga',
    distractors: ['alvóndiga', 'albondiga', 'albóndigaa'],
    emoji: '🧆',
    rule: 'b-v',
    tip: 'Tras al- suele ir b',
    hardIndex: 2,
  },

  // —— haber / hablar / h ——
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
  {
    word: 'hacer',
    distractors: ['acer', 'hacerh', 'hacér'],
    emoji: '🛠️',
    rule: 'haber-hablar',
    tip: 'hacer, haber y hablar se escriben con h',
    hardIndex: 0,
  },
  {
    word: 'hola',
    distractors: ['ola', 'hóla', 'holá'],
    emoji: '👋',
    rule: 'haber-hablar',
    tip: 'Saludo: hola (con h)',
    hardIndex: 0,
  },
  {
    word: 'hermano',
    distractors: ['ermano', 'hermmano', 'jermano'],
    emoji: '🧒',
    rule: 'haber-hablar',
    tip: 'Muchas palabras empiezan por h aunque no se oiga',
    hardIndex: 0,
  },
  {
    word: 'hora',
    distractors: ['ora', 'hórá', 'horra'],
    emoji: '🕐',
    rule: 'haber-hablar',
    tip: 'Muchas palabras empiezan por h aunque no se oiga',
    hardIndex: 0,
  },

  // —— mb / mp ——
  {
    word: 'también',
    distractors: ['tanbién', 'tambien', 'tambíen'],
    emoji: '➕',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
  {
    word: 'campo',
    distractors: ['canpo', 'campó', 'cammpo'],
    emoji: '🌾',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
  {
    word: 'tiempo',
    distractors: ['tienpo', 'tiempó', 'tiiempo'],
    emoji: '⏱️',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 3,
  },
  {
    word: 'hombre',
    distractors: ['honbre', 'ombre', 'hommbre'],
    emoji: '👨',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
  {
    word: 'tambor',
    distractors: ['tanbor', 'tambór', 'tambror'],
    emoji: '🥁',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
  {
    word: 'siempre',
    distractors: ['sienpre', 'siémpre', 'siemrpe'],
    emoji: '♾️',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 3,
  },
  {
    word: 'cambiar',
    distractors: ['canbiar', 'cambíar', 'cammbiar'],
    emoji: '🔀',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },
  {
    word: 'comprar',
    distractors: ['conprar', 'comprár', 'comrpar'],
    emoji: '🛒',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre va m',
    hardIndex: 2,
  },

  // —— g / j (ge-gi / je-ji) ——
  {
    word: 'gente',
    distractors: ['jente', 'gentte', 'genteh'],
    emoji: '👥',
    rule: 'g-j',
    tip: 'Antes de e/i puede ir g o j: hay que aprender la palabra',
    hardIndex: 0,
  },
  {
    word: 'girasol',
    distractors: ['jirasol', 'girasoll', 'guirasol'],
    emoji: '🌻',
    rule: 'g-j',
    tip: 'Antes de e/i puede ir g o j: hay que aprender la palabra',
    hardIndex: 0,
  },
  {
    word: 'jefe',
    distractors: ['gefe', 'jeffe', 'jefeh'],
    emoji: '👔',
    rule: 'g-j',
    tip: 'Antes de e/i puede ir g o j: hay que aprender la palabra',
    hardIndex: 0,
  },
  {
    word: 'jirafa',
    distractors: ['girafa', 'jirraffa', 'jirafá'],
    emoji: '🦒',
    rule: 'g-j',
    tip: 'Antes de e/i puede ir g o j: hay que aprender la palabra',
    hardIndex: 0,
  },
  {
    word: 'pájaro',
    distractors: ['págaro', 'pajaro', 'pájarro'],
    emoji: '🐦',
    rule: 'g-j',
    tip: 'Antes de e/i puede ir g o j: hay que aprender la palabra',
    hardIndex: 2,
  },
  {
    word: 'ojo',
    distractors: ['ogo', 'ojjo', 'ojoh'],
    emoji: '👁️',
    rule: 'g-j',
    tip: 'El sonido fuerte ante a/o/u suele ir con j',
    hardIndex: 1,
  },

  // —— bu / bur / bus ——
  {
    word: 'bueno',
    distractors: ['vueno', 'buemo', 'buenno'],
    emoji: '👍',
    rule: 'bu-bur',
    tip: 'Muchas palabras empiezan por bu-, bur- o bus-',
    hardIndex: 0,
  },
  {
    word: 'buscar',
    distractors: ['vuscar', 'buscarr', 'buzcar'],
    emoji: '🔍',
    rule: 'bu-bur',
    tip: 'Muchas palabras empiezan por bu-, bur- o bus-',
    hardIndex: 0,
  },
  {
    word: 'burro',
    distractors: ['vurro', 'buro', 'burrro'],
    emoji: '🫏',
    rule: 'bu-bur',
    tip: 'Muchas palabras empiezan por bu-, bur- o bus-',
    hardIndex: 0,
  },
  {
    word: 'bosque',
    distractors: ['vosque', 'bosqe', 'bosquee'],
    emoji: '🌲',
    rule: 'bu-bur',
    tip: 'Muchas palabras con bo-/bu- van con b',
    hardIndex: 0,
  },
  {
    word: 'búho',
    distractors: ['vúho', 'buho', 'búo'],
    emoji: '🦉',
    rule: 'bu-bur',
    tip: 'Muchas palabras empiezan por bu-, bur- o bus-',
    hardIndex: 0,
  },

  // —— c / z (ce-ci / za-zo-zu) ——
  {
    word: 'zapato',
    distractors: ['capato', 'sappato', 'zapatto'],
    emoji: '👟',
    rule: 'd-z',
    tip: 'za, zo, zu con z; ce, ci con c',
    hardIndex: 0,
  },
  {
    word: 'azul',
    distractors: ['acul', 'azull', 'asul'],
    emoji: '💙',
    rule: 'd-z',
    tip: 'za, zo, zu con z; ce, ci con c',
    hardIndex: 1,
  },
  {
    word: 'lápiz',
    distractors: ['lápis', 'lapiz', 'lápizz'],
    emoji: '✏️',
    rule: 'd-z',
    tip: 'Algunas palabras terminan en z',
    hardIndex: 4,
  },
  {
    word: 'pez',
    distractors: ['pes', 'pec', 'pezz'],
    emoji: '🐟',
    rule: 'd-z',
    tip: 'Algunas palabras terminan en z',
    hardIndex: 2,
  },
  {
    word: 'cine',
    distractors: ['zine', 'cinne', 'sine'],
    emoji: '🎬',
    rule: 'd-z',
    tip: 'ce, ci se escriben con c',
    hardIndex: 0,
  },
  {
    word: 'ciudad',
    distractors: ['ziudad', 'siudad', 'ciudád'],
    emoji: '🏙️',
    rule: 'd-z',
    tip: 'ce, ci se escriben con c',
    hardIndex: 0,
  },
  {
    word: 'corazón',
    distractors: ['corasón', 'corazon', 'corrazón'],
    emoji: '❤️',
    rule: 'd-z',
    tip: 'za, zo, zu con z; ce, ci con c',
    hardIndex: 4,
  },
]

/**
 * Frases tipo cuaderno 3.º (hay/ahí/ay, hecho/echo, hacer/echar…).
 * Las 4 opciones suenan o se parecen: hay que pensar el significado.
 */
export const SPELL_CONTEXTS: SpellContext[] = [
  // hay / ahí / ¡ay!
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
    id: 'hay-3',
    sentence: 'En el patio ___ una torre de libros.',
    options: ['hay', 'ahí', '¡ay!', 'hai'],
    correctIndex: 0,
    tip: 'hay = existe / hay algo',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ahi-3',
    sentence: 'Siéntate ___ , junto a la ventana.',
    options: ['ahí', 'hay', '¡ay!', 'ay'],
    correctIndex: 0,
    tip: 'ahí = ese lugar',
    rule: 'hay-ahi-ay',
  },
  {
    id: 'ay-3',
    sentence: '___ , me he pillado el dedo con la puerta!',
    options: ['¡Ay!', 'Hay', 'Ahí', 'Hai'],
    correctIndex: 0,
    tip: '¡ay! = dolor',
    rule: 'hay-ahi-ay',
  },

  // hacer / echar
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
    id: 'hace-1',
    sentence: 'Mi hermano ___ los deberes después del cole.',
    options: ['hace', 'ace', 'echa', 'hase'],
    correctIndex: 0,
    tip: 'hacer lleva h',
    rule: 'hacer-echar',
  },
  {
    id: 'echamos-1',
    sentence: 'Nosotros ___ la basura en el contenedor.',
    options: ['echamos', 'hechamos', 'hacemos', 'echámos'],
    correctIndex: 0,
    tip: 'echar = sin h',
    rule: 'hacer-echar',
  },

  // haber / hablar / h
  {
    id: 'habia-1',
    sentence: 'En el hueco de la escalera ___ un hierro retorcido.',
    options: ['había', 'avía', 'habia', 'a vía'],
    correctIndex: 0,
    tip: 'haber se escribe con h',
    rule: 'haber-hablar',
  },
  {
    id: 'hola-1',
    sentence: '___ , ¿cómo estás?',
    options: ['Hola', 'Ola', '¡Hola!', 'Olaa'],
    correctIndex: 0,
    tip: 'Saludo: hola (con h)',
    rule: 'haber-hablar',
  },
  {
    id: 'hablaba-1',
    sentence: 'La maestra ___ muy bajito en la biblioteca.',
    options: ['hablaba', 'ablaba', 'hablava', 'hababa'],
    correctIndex: 0,
    tip: 'hablar lleva h',
    rule: 'haber-hablar',
  },
  {
    id: 'hemos-1',
    sentence: 'Ya ___ terminado el dibujo del mapa.',
    options: ['hemos', 'emos', 'haymos', 'hemosh'],
    correctIndex: 0,
    tip: 'formas de haber llevan h',
    rule: 'haber-hablar',
  },

  // r / rr en frase
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
    id: 'tierra-ctx',
    sentence: 'Plantamos semillas en la ___.',
    options: ['tierra', 'tiera', 'tierrra', 'tyerra'],
    correctIndex: 0,
    tip: 'Entre vocales, sonido fuerte → rr',
    rule: 'r-rr',
  },
  {
    id: 'enrique-ctx',
    sentence: '___ llevó el hierro al herrero.',
    options: ['Enrique', 'Enrrique', 'Henrique', 'Enriqe'],
    correctIndex: 0,
    tip: 'Tras n: una sola r',
    rule: 'r-rr',
  },

  // -aba
  {
    id: 'cantaba-ctx',
    sentence: 'Ayer ella ___ una canción en el patio.',
    options: ['cantaba', 'cantava', 'cantába', 'cantabah'],
    correctIndex: 0,
    tip: 'Pretérito -aba con b',
    rule: 'aba',
  },
  {
    id: 'jugaba-ctx',
    sentence: 'Cuando éramos pequeños, ___ en la plaza.',
    options: ['jugábamos', 'jugávamos', 'jugabamos', 'jugábamoss'],
    correctIndex: 0,
    tip: 'Pretérito -ábamos con b',
    rule: 'aba',
  },
  {
    id: 'saltaba-ctx',
    sentence: 'El gato ___ de silla en silla.',
    options: ['saltaba', 'saltava', 'saltába', 'saltabah'],
    correctIndex: 0,
    tip: 'Pretérito -aba con b',
    rule: 'aba',
  },

  // ll
  {
    id: 'amarillo-ctx',
    sentence: 'El sol se veía ___ entre las nubes.',
    options: ['amarillo', 'amariyo', 'amarilo', 'amarrillo'],
    correctIndex: 0,
    tip: '-illo / -illa con ll',
    rule: 'll-illa',
  },
  {
    id: 'tortilla-ctx',
    sentence: 'De merienda comimos una ___ de patatas.',
    options: ['tortilla', 'tortiya', 'tortila', 'torrtilla'],
    correctIndex: 0,
    tip: '-illo / -illa con ll',
    rule: 'll-illa',
  },

  // mb / mp
  {
    id: 'tambien-ctx',
    sentence: 'Yo ___ quiero ir al parque.',
    options: ['también', 'tanbién', 'tambien', 'tambíen'],
    correctIndex: 0,
    tip: 'Antes de b/p va m',
    rule: 'mb-mp',
  },
  {
    id: 'campo-ctx',
    sentence: 'El tractor trabaja en el ___.',
    options: ['campo', 'canpo', 'campó', 'cammpo'],
    correctIndex: 0,
    tip: 'Antes de b/p va m',
    rule: 'mb-mp',
  },
  {
    id: 'tiempo-ctx',
    sentence: 'Hoy hace buen ___ para salir.',
    options: ['tiempo', 'tienpo', 'tiempó', 'tiiempo'],
    correctIndex: 0,
    tip: 'Antes de b/p va m',
    rule: 'mb-mp',
  },

  // hie / hue en frase
  {
    id: 'huevo-ctx',
    sentence: 'La gallina puso un ___ en el nido.',
    options: ['huevo', 'uevo', 'güevo', 'huebo'],
    correctIndex: 0,
    tip: 'hue- lleva h',
    rule: 'hie-hue',
  },
  {
    id: 'hielo-ctx',
    sentence: 'En invierno el lago se llena de ___.',
    options: ['hielo', 'ielo', 'yelo', 'hieloh'],
    correctIndex: 0,
    tip: 'hie- lleva h',
    rule: 'hie-hue',
  },
  {
    id: 'huella-ctx',
    sentence: 'En la arena quedó la ___ del pie.',
    options: ['huella', 'uella', 'güella', 'huellaa'],
    correctIndex: 0,
    tip: 'hue- lleva h',
    rule: 'hie-hue',
  },

  // b/v
  {
    id: 'caballo-ctx',
    sentence: 'El ___ galopa por el campo.',
    options: ['caballo', 'cavallo', 'cabayo', 'caballoh'],
    correctIndex: 0,
    tip: 'Esta palabra va con b',
    rule: 'b-v',
  },
  {
    id: 'ventana-ctx',
    sentence: 'Abre la ___ : hace calor.',
    options: ['ventana', 'bentana', 'ventanna', 'ventaná'],
    correctIndex: 0,
    tip: 'Esta palabra va con v',
    rule: 'b-v',
  },

  // g/j
  {
    id: 'gente-ctx',
    sentence: 'Había mucha ___ en la fiesta del pueblo.',
    options: ['gente', 'jente', 'gentte', 'genteh'],
    correctIndex: 0,
    tip: 'gente se escribe con g',
    rule: 'g-j',
  },
  {
    id: 'jirafa-ctx',
    sentence: 'En el zoo vimos una ___ altísima.',
    options: ['jirafa', 'girafa', 'jirraffa', 'jirafá'],
    correctIndex: 0,
    tip: 'jirafa se escribe con j',
    rule: 'g-j',
  },

  // bu
  {
    id: 'buscar-ctx',
    sentence: 'Vamos a ___ las llaves en el bolsillo.',
    options: ['buscar', 'vuscar', 'buscarr', 'buzcar'],
    correctIndex: 0,
    tip: 'buscar empieza por bus-',
    rule: 'bu-bur',
  },
  {
    id: 'bosque-ctx',
    sentence: 'Paseamos por el ___ después de llover.',
    options: ['bosque', 'vosque', 'bosqe', 'bosquee'],
    correctIndex: 0,
    tip: 'bosque va con b',
    rule: 'bu-bur',
  },

  // c/z
  {
    id: 'zapato-ctx',
    sentence: 'Se me ha roto el ___ izquierdo.',
    options: ['zapato', 'capato', 'sappato', 'zapatto'],
    correctIndex: 0,
    tip: 'za- con z',
    rule: 'd-z',
  },
  {
    id: 'ciudad-ctx',
    sentence: 'Barcelona es una ___ grande.',
    options: ['ciudad', 'ziudad', 'siudad', 'ciudád'],
    correctIndex: 0,
    tip: 'ci- con c',
    rule: 'd-z',
  },
  {
    id: 'lapiz-ctx',
    sentence: 'Escribe con un ___ de color azul.',
    options: ['lápiz', 'lápis', 'lapiz', 'lápizz'],
    correctIndex: 0,
    tip: 'Algunas palabras terminan en z',
    rule: 'd-z',
  },
]
