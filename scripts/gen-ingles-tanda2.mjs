import fs from 'fs'

const dir = 'feinetas/Ingles'

function slug(lemma) {
  return lemma
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function writePack(id, title, topic, lemmas, notes) {
  const data = {
    schemaVersion: 1,
    pack: {
      id,
      title,
      ownerBank: 'INGLES_CATEGORIAS_BORRADOR.md',
      topicFamily: topic,
      level: '3-primaria',
      locale: 'en-GB',
      revisionStatus: 'approved',
      contentVersion: 1,
      sourceEditorialPhase: 'ingles-hub-tanda-2',
      notes,
    },
    lemmas: lemmas.map(([lemma, glossEs, category, frequency = 'frecuente']) => ({
      id: `${topic}-${slug(lemma)}`,
      lemma,
      glossEs,
      category,
      frequency,
      image: { recommended: true, ref: null },
    })),
  }
  fs.writeFileSync(`${dir}/${topic}.json`, JSON.stringify(data, null, 2) + '\n')
  const counts = {}
  for (const L of data.lemmas) counts[L.category] = (counts[L.category] || 0) + 1
  console.log(id, data.lemmas.length, counts)
}

writePack(
  'ingles-places',
  'Places',
  'places',
  [
    ['park', 'parque', 'Camp', 'muy_frecuente'],
    ['mountains', 'montañas', 'Camp', 'muy_frecuente'],
    ['beach', 'playa', 'Camp', 'muy_frecuente'],
    ['country', 'campo', 'Camp', 'frecuente'],
    ['lake', 'lago', 'Camp', 'muy_frecuente'],
    ['swimming pool', 'piscina', 'Camp', 'muy_frecuente'],
    ['river', 'río', 'Landscape', 'frecuente'],
    ['valley', 'valle', 'Landscape', 'poco_frecuente'],
    ['sea', 'mar', 'Landscape', 'muy_frecuente'],
    ['forest', 'bosque', 'Landscape', 'frecuente'],
    ['town', 'pueblo', 'Settlement', 'frecuente'],
    ['village', 'aldea', 'Settlement', 'frecuente'],
  ],
  'Vocabulario. Ej. 17–21.',
)

writePack(
  'ingles-weather',
  'Weather',
  'weather',
  [
    ['hot', 'caluroso', 'Weather', 'muy_frecuente'],
    ['cold', 'frío', 'Weather', 'muy_frecuente'],
    ['sunny', 'soleado', 'Weather', 'muy_frecuente'],
    ['raining', 'lloviendo', 'Weather', 'muy_frecuente'],
    ['snowing', 'nevando', 'Weather', 'frecuente'],
    ['cloudy', 'nublado', 'Weather', 'muy_frecuente'],
    ['foggy', 'con niebla', 'Weather', 'poco_frecuente'],
    ['summer', 'verano', 'Season', 'muy_frecuente'],
    ['winter', 'invierno', 'Season', 'muy_frecuente'],
    ['spring', 'primavera', 'Season', 'frecuente'],
    ['autumn', 'otoño', 'Season', 'frecuente'],
  ],
  'Vocabulario + frases. Ej. 22, 40.',
)

writePack(
  'ingles-characters',
  'Characters',
  'characters',
  [
    ['King', 'rey', 'People', 'muy_frecuente'],
    ['Queen', 'reina', 'People', 'muy_frecuente'],
    ['Princess', 'princesa', 'People', 'muy_frecuente'],
    ['Father', 'padre', 'People', 'frecuente'],
    ['crown', 'corona', 'Clothes', 'muy_frecuente'],
    ['boots', 'botas', 'Clothes', 'muy_frecuente'],
    ['dress', 'vestido', 'Clothes', 'muy_frecuente'],
    ['socks', 'calcetines', 'Clothes', 'frecuente'],
    ['shoes', 'zapatos', 'Clothes', 'muy_frecuente'],
    ['coat', 'abrigo', 'Clothes', 'frecuente'],
    ['hat', 'sombrero', 'Clothes', 'frecuente'],
    ['T-shirt', 'camiseta', 'Clothes', 'muy_frecuente'],
    ['jeans', 'vaqueros', 'Clothes', 'muy_frecuente'],
    ['handsome', 'guapo', 'Adjectives', 'frecuente'],
    ['beautiful', 'bonita', 'Adjectives', 'muy_frecuente'],
    ['young', 'joven', 'Adjectives', 'frecuente'],
    ['old', 'viejo', 'Adjectives', 'frecuente'],
    ['rich', 'rico', 'Adjectives', 'frecuente'],
    ['poor', 'pobre', 'Adjectives', 'frecuente'],
    ['clever', 'listo', 'Adjectives', 'poco_frecuente'],
  ],
  'Personajes + ropa + adj. Ej. 24–29.',
)

writePack(
  'ingles-possessives',
  'Possessives',
  'possessives',
  [
    ["Jose's", 'de Jose', 'Possessive s', 'muy_frecuente'],
    ["Rebecca's", 'de Rebecca', 'Possessive s', 'frecuente'],
    ["David's", 'de David', 'Possessive s', 'frecuente'],
    ["Sarah's", 'de Sarah', 'Possessive s', 'frecuente'],
    ['his', 'su (de él)', 'Adj', 'muy_frecuente'],
    ['her', 'su (de ella)', 'Adj', 'muy_frecuente'],
    ['my', 'mi', 'Adj', 'muy_frecuente'],
    ['your', 'tu', 'Adj', 'muy_frecuente'],
    ['shirt', 'camisa', 'Things', 'frecuente'],
    ['jumper', 'jersey', 'Things', 'frecuente'],
    ['bag', 'bolsa', 'Things', 'frecuente'],
    ['skirt', 'falda', 'Things', 'frecuente'],
  ],
  'Gramática posesión. Ej. 36, 39.',
)

writePack(
  'ingles-transport',
  'Transport',
  'transport',
  [
    ['train', 'tren', 'Vehicle', 'muy_frecuente'],
    ['bike', 'bici', 'Vehicle', 'muy_frecuente'],
    ['car', 'coche', 'Vehicle', 'muy_frecuente'],
    ['bus', 'autobús', 'Vehicle', 'muy_frecuente'],
    ['underground', 'metro', 'Vehicle', 'frecuente'],
    ['walk', 'andar', 'Manner', 'muy_frecuente'],
    ['by train', 'en tren', 'Phrase', 'muy_frecuente'],
    ['by bike', 'en bici', 'Phrase', 'muy_frecuente'],
    ['by car', 'en coche', 'Phrase', 'muy_frecuente'],
    ['by bus', 'en autobús', 'Phrase', 'muy_frecuente'],
  ],
  'Vocabulario + frases. Ej. 41–42.',
)

writePack(
  'ingles-money',
  'Money',
  'money',
  [
    ['euro', 'euro', 'Currency', 'muy_frecuente'],
    ['coin', 'moneda', 'Currency', 'frecuente'],
    ['note', 'billete', 'Currency', 'poco_frecuente'],
    ['ticket', 'entrada', 'Things', 'frecuente'],
    ['pen', 'boli', 'Things', 'muy_frecuente'],
    ['ball', 'pelota', 'Things', 'muy_frecuente'],
    ['book', 'libro', 'Things', 'muy_frecuente'],
    ['How much', '¿cuánto cuesta?', 'Phrase', 'muy_frecuente'],
    ["It's 2 euros", 'cuesta 2 euros', 'Phrase', 'frecuente'],
    ["It's 5 euros", 'cuesta 5 euros', 'Phrase', 'frecuente'],
  ],
  'Vocabulario precios. Ej. 43.',
)

writePack(
  'ingles-present-simple',
  'Present simple',
  'present-simple',
  [
    ['brush', 'cepillar', 'Verbs', 'muy_frecuente'],
    ['do', 'hacer', 'Verbs', 'muy_frecuente'],
    ['eat', 'comer', 'Verbs', 'muy_frecuente'],
    ['play', 'jugar', 'Verbs', 'muy_frecuente'],
    ['swim', 'nadar', 'Verbs', 'muy_frecuente'],
    ['Do', '¿…? (tú/ellos)', 'Aux', 'muy_frecuente'],
    ['Does', '¿…? (él/ella)', 'Aux', 'muy_frecuente'],
    ["don't", 'no (yo/tú/ellos)', 'Aux', 'muy_frecuente'],
    ["doesn't", 'no (él/ella)', 'Aux', 'muy_frecuente'],
    ['on Mondays', 'los lunes', 'Time', 'frecuente'],
    ['on Fridays', 'los viernes', 'Time', 'frecuente'],
    ['on Sundays', 'los domingos', 'Time', 'frecuente'],
  ],
  'Gramática. Ej. 44–45.',
)

writePack(
  'ingles-present-continuous',
  'Present continuous',
  'present-continuous',
  [
    ['painting', 'pintando', 'Actions', 'muy_frecuente'],
    ['reading', 'leyendo', 'Actions', 'muy_frecuente'],
    ['watching TV', 'viendo la tele', 'Actions', 'muy_frecuente'],
    ['listening to music', 'escuchando música', 'Actions', 'muy_frecuente'],
    ['roller skating', 'patinando', 'Actions', 'frecuente'],
    ['Is she', '¿está ella…?', 'Question', 'muy_frecuente'],
    ['Are they', '¿están ellos…?', 'Question', 'muy_frecuente'],
    ['Am I', '¿estoy…?', 'Question', 'frecuente'],
    ['Yes, she is', 'sí, lo está', 'Short', 'muy_frecuente'],
    ["No, he isn't", 'no, no lo está', 'Short', 'muy_frecuente'],
    ['Yes, they are', 'sí, lo están', 'Short', 'frecuente'],
    ["No, I'm not", 'no, no lo estoy', 'Short', 'frecuente'],
  ],
  'Gramática. Ej. 46.',
)

writePack(
  'ingles-phrases',
  'Phrases',
  'phrases',
  [
    ["I can't speak German", 'no sé hablar alemán', 'Can', 'frecuente'],
    ['You have got a book', 'tienes un libro', 'Have got', 'muy_frecuente'],
    ['Can you play piano', '¿sabes tocar el piano?', 'Can', 'frecuente'],
    ['She can sing well', 'ella canta bien', 'Can', 'frecuente'],
    ['She is my friend', 'ella es mi amiga', 'Be', 'muy_frecuente'],
    ['I like', 'me gusta', 'Like', 'muy_frecuente'],
    ["I don't like", 'no me gusta', 'Like', 'muy_frecuente'],
    ["I've got", 'tengo', 'Have got', 'muy_frecuente'],
    ['but', 'pero', 'Link', 'muy_frecuente'],
    ['well', 'bien', 'Link', 'frecuente'],
  ],
  'Frases. Ej. 04, 23, 48.',
)

writePack(
  'ingles-time',
  'Time',
  'time',
  [
    ["o'clock", 'en punto', 'Clock', 'muy_frecuente'],
    ['half past', 'y media', 'Clock', 'muy_frecuente'],
    ['What time is it', '¿qué hora es?', 'Question', 'muy_frecuente'],
    ['Is it', '¿son las…?', 'Question', 'muy_frecuente'],
    ['Yes, it is', 'sí', 'Short', 'muy_frecuente'],
    ["No, it isn't", 'no', 'Short', 'muy_frecuente'],
    ['at eight o\'clock', 'a las ocho', 'Phrase', 'frecuente'],
    ['at half past seven', 'a las siete y media', 'Phrase', 'frecuente'],
    ['morning', 'mañana', 'Part', 'muy_frecuente'],
    ['afternoon', 'tarde', 'Part', 'muy_frecuente'],
    ['evening', 'noche', 'Part', 'frecuente'],
    ['today', 'hoy', 'Part', 'muy_frecuente'],
  ],
  'Gramática · puente Horas. Ej. 12, 15–16.',
)
