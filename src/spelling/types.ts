export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'

/** Bloques de ortografía típicos de repaso en 3.º de Primaria. */
export type SpellRuleId =
  | 'b-v'
  | 'g-j'
  | 'h'
  | 'll-y'
  | 'r-rr'
  | 'mb-mp'
  | 'que-qui'
  | 'gue-gui'
  | 'c-z'
  | 'tilde'

export interface SpellWord {
  word: string
  /** Tres faltas plausibles de la misma palabra (nunca otra palabra real del banco). */
  distractors: [string, string, string]
  emoji: string
  rule: SpellRuleId
  tip: string
  hardIndex: number
}

export interface SpellMcqQuestion {
  kind: 'mcq'
  id: string
  mode: SpellPlayMode
  prompt: string
  tip?: string
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
  missing: 'Letra difícil',
  correct: '¿Cuál está bien?',
  picture: 'Imagen y palabra',
  intruder: 'Palabra intrusa',
  complete: 'Completa con regla',
  mix: 'Repaso mezclado',
}

/**
 * Repaso 3.º Primaria: b/v, g/j, h, ll/y, r/rr, mb/mp, que-qui, gue-gü, c/z, tilde.
 * Distractores = faltas reales de esa palabra (no “gatoo” ni palabras ajenas).
 */
export const SPELL_BANK: SpellWord[] = [
  // —— b / v ——
  {
    word: 'caballo',
    distractors: ['cavallo', 'cabayo', 'kaballo'],
    emoji: '🐴',
    rule: 'b-v',
    tip: 'Tras vocal + b en -allo; no “cavallo”',
    hardIndex: 2,
  },
  {
    word: 'vaso',
    distractors: ['baso', 'vazo', 'basso'],
    emoji: '🥛',
    rule: 'b-v',
    tip: 'vaso se escribe con v',
    hardIndex: 0,
  },
  {
    word: 'libro',
    distractors: ['livro', 'libbro', 'livvro'],
    emoji: '📖',
    rule: 'b-v',
    tip: 'Grupo -br- con b',
    hardIndex: 2,
  },
  {
    word: 'cantaba',
    distractors: ['cantava', 'kantaba', 'cantába'],
    emoji: '🎤',
    rule: 'b-v',
    tip: 'Pretérito -aba / -abas… con b',
    hardIndex: 5,
  },
  {
    word: 'abrir',
    distractors: ['havrir', 'avrir', 'abír'],
    emoji: '🚪',
    rule: 'b-v',
    tip: 'Verbos en -bir: con b (abrir)',
    hardIndex: 1,
  },

  // —— g / j ——
  {
    word: 'gente',
    distractors: ['jente', 'guente', 'genteh'],
    emoji: '👥',
    rule: 'g-j',
    tip: 'ge/gi suenan fuerte pero van con g',
    hardIndex: 0,
  },
  {
    word: 'jirafa',
    distractors: ['girafa', 'jiraffa', 'xirafa'],
    emoji: '🦒',
    rule: 'g-j',
    tip: 'jirafa empieza por j',
    hardIndex: 0,
  },
  {
    word: 'garaje',
    distractors: ['garage', 'garahe', 'garaxe'],
    emoji: '🅿️',
    rule: 'g-j',
    tip: 'Terminación -aje con j',
    hardIndex: 4,
  },
  {
    word: 'juguete',
    distractors: ['guguete', 'jugete', 'juguette'],
    emoji: '🧸',
    rule: 'g-j',
    tip: 'ju- se escribe con j',
    hardIndex: 0,
  },
  {
    word: 'página',
    distractors: ['pájina', 'pagina', 'páguina'],
    emoji: '📄',
    rule: 'g-j',
    tip: 'página: g + tilde',
    hardIndex: 2,
  },

  // —— h ——
  {
    word: 'huevo',
    distractors: ['uevo', 'güevo', 'huebo'],
    emoji: '🥚',
    rule: 'h',
    tip: 'hue- / hie- llevan h muda',
    hardIndex: 0,
  },
  {
    word: 'hielo',
    distractors: ['ielo', 'yelo', 'hieloh'],
    emoji: '🧊',
    rule: 'h',
    tip: 'hie- siempre con h',
    hardIndex: 0,
  },
  {
    word: 'hermano',
    distractors: ['ermano', 'jermano', 'hermmano'],
    emoji: '👦',
    rule: 'h',
    tip: 'Muchas palabras empiezan por h',
    hardIndex: 0,
  },
  {
    word: 'ahora',
    distractors: ['aora', 'ahorra', 'ajora'],
    emoji: '⏰',
    rule: 'h',
    tip: 'h intercalada: a-hora',
    hardIndex: 1,
  },
  {
    word: 'hacer',
    distractors: ['acer', 'haser', 'hácer'],
    emoji: '🛠️',
    rule: 'h',
    tip: 'hacer / haber / hablar llevan h',
    hardIndex: 0,
  },

  // —— ll / y ——
  {
    word: 'lluvia',
    distractors: ['yuvía', 'llubia', 'yuvia'],
    emoji: '🌧️',
    rule: 'll-y',
    tip: 'lluvia con ll',
    hardIndex: 0,
  },
  {
    word: 'llave',
    distractors: ['yave', 'llabe', 'llavee'],
    emoji: '🔑',
    rule: 'll-y',
    tip: 'llave: ll + v',
    hardIndex: 0,
  },
  {
    word: 'playa',
    distractors: ['plalla', 'plaia', 'playya'],
    emoji: '🏖️',
    rule: 'll-y',
    tip: 'playa termina en y',
    hardIndex: 3,
  },
  {
    word: 'amarillo',
    distractors: ['amariyo', 'amarilo', 'amarrillo'],
    emoji: '💛',
    rule: 'll-y',
    tip: 'Terminación -illo con ll',
    hardIndex: 5,
  },

  // —— r / rr ——
  {
    word: 'perro',
    distractors: ['pero', 'perrro', 'perroo'],
    emoji: '🐕',
    rule: 'r-rr',
    tip: 'Entre vocales el sonido fuerte es rr',
    hardIndex: 2,
  },
  {
    word: 'carro',
    distractors: ['caro', 'karro', 'carroo'],
    emoji: '🚗',
    rule: 'r-rr',
    tip: 'ca-rro: rr entre vocales',
    hardIndex: 2,
  },
  {
    word: 'alrededor',
    distractors: ['alededor', 'arrededor', 'alrrededor'],
    emoji: '🔄',
    rule: 'r-rr',
    tip: 'Tras l, n, s: una sola r (no rr)',
    hardIndex: 2,
  },
  {
    word: 'tierra',
    distractors: ['tiera', 'tierrra', 'tiérra'],
    emoji: '🌍',
    rule: 'r-rr',
    tip: 'tierra lleva rr',
    hardIndex: 3,
  },

  // —— mb / mp ——
  {
    word: 'campo',
    distractors: ['canpo', 'kampo', 'campoh'],
    emoji: '🌾',
    rule: 'mb-mp',
    tip: 'Antes de p y b siempre m (nunca n)',
    hardIndex: 2,
  },
  {
    word: 'tambor',
    distractors: ['tanbor', 'tamborr', 'támbór'],
    emoji: '🥁',
    rule: 'mb-mp',
    tip: 'm + b: tam-bor',
    hardIndex: 2,
  },
  {
    word: 'tiempo',
    distractors: ['tienpo', 'tiempoh', 'tíempo'],
    emoji: '⏳',
    rule: 'mb-mp',
    tip: 'm antes de p: tiem-po',
    hardIndex: 3,
  },
  {
    word: 'también',
    distractors: ['tanbién', 'tambien', 'tambíen'],
    emoji: '➕',
    rule: 'mb-mp',
    tip: 'también: mb + tilde',
    hardIndex: 2,
  },

  // —— que / qui ——
  {
    word: 'queso',
    distractors: ['keso', 'ceso', 'quéso'],
    emoji: '🧀',
    rule: 'que-qui',
    tip: 'que/qui: la u no suena',
    hardIndex: 0,
  },
  {
    word: 'máquina',
    distractors: ['makina', 'mákuina', 'maquina'],
    emoji: '⚙️',
    rule: 'que-qui',
    tip: 'má-qui-na: qui + tilde',
    hardIndex: 2,
  },
  {
    word: 'paquete',
    distractors: ['pakete', 'pacuete', 'paquette'],
    emoji: '📦',
    rule: 'que-qui',
    tip: 'pa-que-te con que',
    hardIndex: 2,
  },

  // —— gue / gui / gü ——
  {
    word: 'guitarra',
    distractors: ['gitarra', 'guitara', 'güitarra'],
    emoji: '🎸',
    rule: 'gue-gui',
    tip: 'gui: la u no suena',
    hardIndex: 2,
  },
  {
    word: 'pingüino',
    distractors: ['pinguino', 'pingino', 'pingüíno'],
    emoji: '🐧',
    rule: 'gue-gui',
    tip: 'Si la u suena → diéresis: ü',
    hardIndex: 3,
  },
  {
    word: 'vergüenza',
    distractors: ['verguenza', 'vergensa', 'vergüensa'],
    emoji: '😳',
    rule: 'gue-gui',
    tip: 'güe con diéresis',
    hardIndex: 3,
  },

  // —— c / z ——
  {
    word: 'zapato',
    distractors: ['sapato', 'çapato', 'zapatoh'],
    emoji: '👟',
    rule: 'c-z',
    tip: 'za, zo, zu con z',
    hardIndex: 0,
  },
  {
    word: 'lápiz',
    distractors: ['lapiz', 'lápis', 'lápizz'],
    emoji: '✏️',
    rule: 'c-z',
    tip: 'Aguda en z + tilde',
    hardIndex: 1,
  },
  {
    word: 'brazo',
    distractors: ['brasso', 'vrazo', 'braso'],
    emoji: '💪',
    rule: 'c-z',
    tip: 'brazo: z + grupo br',
    hardIndex: 3,
  },

  // —— tilde ——
  {
    word: 'árbol',
    distractors: ['arbol', 'àrbol', 'árboles'],
    emoji: '🌳',
    rule: 'tilde',
    tip: 'Esdrújulas: siempre tilde',
    hardIndex: 0,
  },
  {
    word: 'música',
    distractors: ['musica', 'músika', 'musíca'],
    emoji: '🎵',
    rule: 'tilde',
    tip: 'mú-si-ca es esdrújula',
    hardIndex: 1,
  },
  {
    word: 'camión',
    distractors: ['camion', 'kamión', 'cámion'],
    emoji: '🚛',
    rule: 'tilde',
    tip: 'Aguda en n: tilde',
    hardIndex: 4,
  },
  {
    word: 'café',
    distractors: ['cafe', 'cafè', 'kafe'],
    emoji: '☕',
    rule: 'tilde',
    tip: 'Aguda en vocal: tilde',
    hardIndex: 3,
  },
]
