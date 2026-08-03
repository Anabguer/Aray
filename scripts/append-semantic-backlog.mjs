/**
 * Append BACKLOG synonym/antonym pairs (dedupe undirected).
 */
import fs from 'node:fs'

const p = 'feinetas/palabras/relaciones-semanticas.json'
const j = JSON.parse(fs.readFileSync(p, 'utf8'))

function fold(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function ukey(rel, a, b) {
  const pair = [fold(a), fold(b)].sort()
  return `${rel}|${pair[0]}|${pair[1]}`
}

const have = new Set(j.items.map((i) => ukey(i.relation, i.anchor, i.target)))
const add = []

function push(item) {
  const k = ukey(item.relation, item.anchor, item.target)
  if (have.has(k)) return
  // also skip if distractors insufficient
  if (!item.distractors || item.distractors.length < 1) return
  have.add(k)
  add.push(item)
}

const ants = [
  ['rizado', 'liso', ['verdad', 'aburrido'], 'BACKLOG 15'],
  ['mentira', 'verdad', ['liso', 'primero'], 'BACKLOG 15'],
  ['primero', 'último', ['divertido', 'libre'], 'BACKLOG 15'],
  ['divertido', 'aburrido', ['rizado', 'ocupado'], 'BACKLOG 15'],
  ['luminoso', 'oscuro', ['amplio', 'silencioso'], 'BACKLOG 45'],
  ['reducido', 'amplio', ['oscuro', 'ordenado'], 'BACKLOG 45'],
  ['ordenado', 'destartalado', ['luminoso', 'amplio'], 'BACKLOG 45'],
  ['lleno', 'vacío', ['largo', 'malo'], 'BACKLOG 78'],
  ['largo', 'corto', ['lleno', 'bueno'], 'BACKLOG 78'],
  ['bueno', 'malo', ['lleno', 'corto'], 'BACKLOG 78'],
  ['cerrado', 'abierto', ['lleno', 'malo'], 'BACKLOG 78'],
  ['sincero', 'embustero', ['callado', 'entretenido'], 'BACKLOG 89'],
  ['parlanchín', 'callado', ['sincero', 'monótono'], 'BACKLOG 89'],
  ['monótono', 'entretenido', ['callado', 'fortuito'], 'BACKLOG 89'],
  ['fortuito', 'preparado', ['sincero', 'entretenido'], 'BACKLOG 89'],
  ['entrar', 'salir', ['fuerte', 'hablar'], 'BACKLOG 92'],
  ['fuerte', 'débil', ['entrar', 'soso'], 'BACKLOG 92'],
  ['abrir', 'cerrar', ['entrar', 'débil'], 'BACKLOG 92'],
  ['callar', 'hablar', ['fuerte', 'soso'], 'BACKLOG 92'],
  ['sabroso', 'soso', ['débil', 'salir'], 'BACKLOG 92'],
]

for (const [a, t, d, n] of ants) {
  push({
    id: `rel-${fold(a)}-${fold(t)}`,
    anchor: a,
    target: t,
    relation: 'antonym',
    distractors: d,
    difficulty: 2,
    category: 'cualidad',
    notes: n,
  })
}

const syns = [
  ['divertido', 'gracioso', ['risueño', 'cordial'], 'BACKLOG 43'],
  ['sonriente', 'risueño', ['gracioso', 'espléndido'], 'BACKLOG 43'],
  ['generoso', 'espléndido', ['cordial', 'gracioso'], 'BACKLOG 43'],
  ['amable', 'cordial', ['risueño', 'espléndido'], 'BACKLOG 43'],
  ['débil', 'frágil', ['veloz', 'amar'], 'BACKLOG 91'],
  ['rápido', 'veloz', ['frágil', 'querer'], 'BACKLOG 91'],
  ['querer', 'amar', ['frágil', 'veloz'], 'BACKLOG 91'],
  ['feliz', 'contento', ['veloz', 'frágil'], 'BACKLOG 91'],
]

for (const [a, t, d, n] of syns) {
  push({
    id: `rel-${fold(a)}-${fold(t)}`,
    anchor: a,
    target: t,
    relation: 'synonym',
    distractors: d,
    difficulty: 2,
    category: 'cualidad',
    notes: n,
  })
}

j.items.push(...add)
j.pack.contentVersion = (j.pack.contentVersion || 1) + 1
j.pack.revisionStatus = 'approved'
fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
console.log(`added ${add.length} total ${j.items.length}`)
