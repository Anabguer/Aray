import fs from 'fs'

const mdPath = 'W:/Aray/feinetas/editorial/FRASES_COMPLETAR_ORTOGRAFIA.md'
let md = fs.readFileSync(mdPath, 'utf8')
const DROP = new Set(['frase-ay-02', 'frase-tiempo-01'])

for (const id of DROP) {
  const re = new RegExp(
    `\\n---\\n\\n## id\\n\\n${id}\\n[\\s\\S]*?(?=\\n---\\n\\n## id\\n|\\n# Congelación)`,
    'm',
  )
  if (re.test(md)) md = md.replace(re, '\n')
  else {
    const re2 = new RegExp(
      `## id\\n\\n${id}\\n[\\s\\S]*?(?=\\n---\\n\\n## id\\n|\\n# Congelación)`,
      'm',
    )
    md = md.replace(re2, '')
  }
}

const parts = md.split(/\n## id\n\n/)
const items = []
for (const part of parts.slice(1)) {
  if (part.startsWith('Congelación') || part.startsWith('Auditoría')) break
  const id = part.match(/^frase-[\w-]+/)?.[0]
  if (!id || DROP.has(id)) continue

  const fields = {}
  let cur = null
  let buf = []
  const flush = () => {
    if (cur) fields[cur] = buf.join('\n').trim()
    buf = []
  }
  for (const line of part.split('\n')) {
    if (line.startsWith('## ')) {
      flush()
      cur = line.slice(3).trim()
    } else if (line.trim() === '---') {
      flush()
      cur = null
    } else {
      buf.push(line)
    }
  }
  flush()

  const opts = (fields['Opciones'] || '')
    .split(/\n/)
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
  const correct = (fields['Correcta'] || '').trim()
  let correctIndex = opts.findIndex((o) => o === correct)
  if (correctIndex < 0) correctIndex = Number(fields['Índice correcta'] || 0)

  items.push({
    id,
    sentence: (fields['Frase'] || '').trim(),
    options: opts,
    correctIndex,
    ruleId: (fields['Regla principal'] || '').trim(),
    itemType:
      (fields['Tipo'] || '').trim() === 'homofonos' ? 'homophones' : 'spelling-in-context',
    difficulty: Number(fields['Dificultad'] || 1),
    explanation: (fields['Explicación'] || '').trim() || undefined,
    sourceNotes: (fields['Fuente'] || '').trim() || undefined,
    status: 'approved',
  })
}

for (const i of items) {
  if (i.options.length !== 4) throw new Error(`${i.id} opts ${JSON.stringify(i.options)}`)
  const block = parts.find((p) => p.startsWith(i.id))
  const blockCorrect = block?.match(/## Correcta\n\n([^\n]+)/)?.[1]?.trim()
  if (i.options[i.correctIndex] !== blockCorrect) {
    throw new Error(`mismatch ${i.id}: ${i.options[i.correctIndex]} vs ${blockCorrect}`)
  }
  if (!i.sentence.includes('___')) throw new Error(`${i.id} no hueco`)
}

const pack = {
  schemaVersion: 1,
  pack: {
    id: 'ortografia-frases-completar',
    title: 'Completa la frase',
    ownerBank: 'FRASES_COMPLETAR_ORTOGRAFIA.md',
    ruleFamily: 'mixed-ortografia',
    level: '3-primaria',
    locale: 'es-ES',
    revisionStatus: 'approved',
    contentVersion: 1,
    sourceEditorialPhase: 'fase-4-frases',
    notes:
      'Banco de frases MCQ con distractores fijos. Sustituye SPELL_CONTEXTS. Congelado tras auditoría final.',
  },
  items,
}

fs.writeFileSync(
  'W:/Aray/feinetas/ortografia/frases-completar.json',
  JSON.stringify(pack, null, 2) + '\n',
  'utf8',
)

md = md.replace(
  /# Congelación[\s\S]*$/,
  `# Congelación

- **Total:** ${items.length} frases aprobadas (congelado).
- Recorte de calidad al tope 24–30: eliminados frase-ay-02 (gemelo estructural) y frase-tiempo-01 (distractores de tilde débiles).
- Eliminados antes: frase-tierra-01; distractores perra/pedro, xirafa, guittarra; «a ver» forzado.
- Reescritos: frase-habia-01, frase-hablar-01 (infinitivo).
- Añadido: frase-carro-01.
- Sin -aba / bu-bur. Ortografía completa sobre contenido editorial aprobado.
`,
)

fs.writeFileSync(mdPath, md, 'utf8')
console.log('OK items', items.length)
console.log(items.map((i) => i.id).join(', '))
