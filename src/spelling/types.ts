export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'
  | 'review'

/**
 * Bloques alineados con 3.º / cicle mitjà (Catalunya + cuadernos CEIP Diputació / Maspe 3):
 * r-rr, hie-/hue-, ahí-hay-ay, hacer-echar, -aba, -illo/-illa, haber/hablar,
 * b/v, mb/mp, g/j, bu/bur/bus, c/z, tildes.
 */
export type SpellRuleId =
  | 'r-rr'
  | 'hie-hue'
  | 'h'
  | 'hay-ahi-ay'
  | 'hacer-echar'
  | 'aba'
  | 'll-illa'
  | 'll-y'
  | 'haber-hablar'
  | 'b-v'
  | 'd-z'
  | 'c-z-qu'
  | 'mb-mp'
  | 'mb-mp-nv'
  | 'g-j'
  | 'bu-bur'
  | 'gu-gue'
  | 'tilde'

export interface SpellWord {
  word: string
  distractors: [string, string, string]
  emoji: string
  rule: SpellRuleId
  tip: string
  hardIndex: number
}

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
  display?: string
  emoji?: string
  options: string[]
  correctIndex: number
  /** Clave para registrar fallos/aciertos (palabra o ctx:id). */
  targetKey?: string
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
  review: 'Mis fallos',
}

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
    options: ['hemos', 'emos', 'haymos', 'abemos'],
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
    options: ['perro', 'pero', 'péro', 'peró'],
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
    options: ['tierra', 'tiera', 'tyerra', 'tiéra'],
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
    options: ['cantaba', 'cantava', 'cantáva', 'kantaba'],
    correctIndex: 0,
    tip: 'Pretérito -aba con b',
    rule: 'aba',
  },
  {
    id: 'jugaba-ctx',
    sentence: 'Cuando éramos pequeños, ___ en la plaza.',
    options: ['jugábamos', 'jugávamos', 'jugabamos', 'jugavamos'],
    correctIndex: 0,
    tip: 'Pretérito -ábamos con b',
    rule: 'aba',
  },
  {
    id: 'saltaba-ctx',
    sentence: 'El gato ___ de silla en silla.',
    options: ['saltaba', 'saltava', 'saltáva', 'sáltava'],
    correctIndex: 0,
    tip: 'Pretérito -aba con b',
    rule: 'aba',
  },

  // ll
  {
    id: 'amarillo-ctx',
    sentence: 'El sol se veía ___ entre las nubes.',
    options: ['amarillo', 'amariyo', 'amarilo', 'amaríyo'],
    correctIndex: 0,
    tip: '-illo / -illa con ll',
    rule: 'll-illa',
  },
  {
    id: 'tortilla-ctx',
    sentence: 'De merienda comimos una ___ de patatas.',
    options: ['tortilla', 'tortiya', 'tortila', 'tortíya'],
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
    options: ['campo', 'canpo', 'cámpo', 'campó'],
    correctIndex: 0,
    tip: 'Antes de b/p va m',
    rule: 'mb-mp',
  },
  {
    id: 'tiempo-ctx',
    sentence: 'Hoy hace buen ___ para salir.',
    options: ['tiempo', 'tienpo', 'tiempó', 'tíempo'],
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
    options: ['hielo', 'ielo', 'yelo', 'hieló'],
    correctIndex: 0,
    tip: 'hie- lleva h',
    rule: 'hie-hue',
  },
  {
    id: 'huella-ctx',
    sentence: 'En la arena quedó la ___ del pie.',
    options: ['huella', 'uella', 'güella', 'huélla'],
    correctIndex: 0,
    tip: 'hue- lleva h',
    rule: 'hie-hue',
  },

  // b/v
  {
    id: 'caballo-ctx',
    sentence: 'El ___ galopa por el campo.',
    options: ['caballo', 'cavallo', 'cabayo', 'cavayo'],
    correctIndex: 0,
    tip: 'Esta palabra va con b',
    rule: 'b-v',
  },
  {
    id: 'ventana-ctx',
    sentence: 'Abre la ___ : hace calor.',
    options: ['ventana', 'bentana', 'ventána', 'bentána'],
    correctIndex: 0,
    tip: 'Esta palabra va con v',
    rule: 'b-v',
  },

  // g/j
  {
    id: 'gente-ctx',
    sentence: 'Había mucha ___ en la fiesta del pueblo.',
    options: ['gente', 'jente', 'génté', 'jénté'],
    correctIndex: 0,
    tip: 'gente se escribe con g',
    rule: 'g-j',
  },
  {
    id: 'jirafa-ctx',
    sentence: 'En el zoo vimos una ___ altísima.',
    options: ['jirafa', 'girafa', 'jírafa', 'giraffa'],
    correctIndex: 0,
    tip: 'jirafa se escribe con j',
    rule: 'g-j',
  },

  // bu
  {
    id: 'buscar-ctx',
    sentence: 'Vamos a ___ las llaves en el bolsillo.',
    options: ['buscar', 'vuscar', 'buzcar', 'buskar'],
    correctIndex: 0,
    tip: 'buscar empieza por bus-',
    rule: 'bu-bur',
  },
  {
    id: 'bosque-ctx',
    sentence: 'Paseamos por el ___ después de llover.',
    options: ['bosque', 'vosque', 'bósqe', 'vosqué'],
    correctIndex: 0,
    tip: 'bosque va con b',
    rule: 'bu-bur',
  },

  // c/z
  {
    id: 'zapato-ctx',
    sentence: 'Se me ha roto el ___ izquierdo.',
    options: ['zapato', 'capato', 'sapato', 'zápató'],
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
    options: ['lápiz', 'lápis', 'lapiz', 'lápic'],
    correctIndex: 0,
    tip: 'Algunas palabras terminan en z',
    rule: 'd-z',
  },
]
