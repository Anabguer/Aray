/**
 * One-shot: append BACKLOG orthography lemmas (dedupe by folded lemma).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('feinetas/ortografia')

function fold(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function append(file, items) {
  const p = path.join(root, file)
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  const have = new Set(j.lemmas.map((l) => fold(l.lemma)))
  let added = 0
  let skipped = 0
  for (const item of items) {
    if (have.has(fold(item.lemma))) {
      skipped += 1
      continue
    }
    j.lemmas.push(item)
    have.add(fold(item.lemma))
    added += 1
  }
  j.pack.contentVersion = (j.pack.contentVersion || 1) + 1
  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`)
  console.log(`${file}: +${added} skip ${skipped} total ${j.lemmas.length}`)
}

const tipR =
  'Al principio de palabra el sonido fuerte se escribe con una sola r.'
const tipRr =
  'Entre vocales, el sonido fuerte de la r se escribe rr.'
const tipRsoft =
  'Entre vocales, el sonido suave de la r se escribe con una sola r.'
const tipGj = 'Ante e/i, mira si es g o j.'
const tipBir =
  'Los verbos terminados en -bir se escriben con b.'
const tipMp = 'Antes de b o p se escribe m.'
const tipNv = 'Antes de v se escribe n.'

append('rr.json', [
  { id: 'rr-rueda', lemma: 'rueda', errors: ['ruedda', 'rrueda'], ruleId: 'r-rr', ruleText: tipR, frequency: 'muy_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.59' },
  { id: 'rr-rodilla', lemma: 'rodilla', errors: ['rrodilla', 'rodila'], ruleId: 'r-rr', ruleText: tipR, frequency: 'frecuente', category: 'cuerpo', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.59' },
  { id: 'rr-corredor', lemma: 'corredor', errors: ['coredor', 'corrredor'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.59' },
  { id: 'rr-reno', lemma: 'reno', errors: ['rreno'], ruleId: 'r-rr', ruleText: tipR, frequency: 'poco_frecuente', category: 'animales', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.59' },
  { id: 'rr-barrendero', lemma: 'barrendero', errors: ['barendero', 'barrenderro'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'poco_frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.59' },
  { id: 'rr-ruisenor', lemma: 'ruiseñor', errors: ['rruiseñor', 'ruisenor'], ruleId: 'r-rr', ruleText: tipR, frequency: 'poco_frecuente', category: 'animales', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.59', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'rr-rugir', lemma: 'rugir', errors: ['rrugir', 'rujir'], ruleId: 'r-rr', ruleText: tipR, frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.59' },
  { id: 'rr-cerrajero', lemma: 'cerrajero', errors: ['cerajero'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'poco_frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.69' },
  { id: 'rr-cierra', lemma: 'cierra', errors: ['ciera', 'cierrra'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'muy_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.69' },
  { id: 'rr-raton', lemma: 'ratón', errors: ['rratón', 'raton'], ruleId: 'r-rr', ruleText: tipR, frequency: 'muy_frecuente', category: 'animales', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.69', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'rr-rabudo', lemma: 'rabudo', errors: ['rrabudo', 'ravudo'], ruleId: 'r-rr', ruleText: tipR, frequency: 'poco_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.69' },
  { id: 'rr-roba', lemma: 'roba', errors: ['rroba', 'rova'], ruleId: 'r-rr', ruleText: tipR, frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.69' },
  { id: 'rr-madura', lemma: 'madura', errors: ['madurra'], ruleId: 'r-rr', ruleText: tipRsoft, frequency: 'frecuente', category: 'comida', image: { recommended: false, ref: null }, tip: tipRsoft, notes: 'BACKLOG ej.69' },
  { id: 'rr-ruido', lemma: 'ruido', errors: ['rruido'], ruleId: 'r-rr', ruleText: tipR, frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.93' },
  { id: 'rr-cacharro', lemma: 'cacharro', errors: ['cacharo', 'cacharrro'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-aburrido', lemma: 'aburrido', errors: ['aburido'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-barato', lemma: 'barato', errors: ['barrato'], ruleId: 'r-rr', ruleText: tipRsoft, frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipRsoft, notes: 'BACKLOG ej.93' },
  { id: 'rr-carruaje', lemma: 'carruaje', errors: ['caruaje'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'poco_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-sierra', lemma: 'sierra', errors: ['siera'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-rocio', lemma: 'Rocío', errors: ['Rrocío', 'Rocio'], ruleId: 'r-rr', ruleText: tipR, frequency: 'poco_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.93', tags: ['tilde', 'nombre-propio'], secondaryRuleIds: ['tilde'] },
  { id: 'rr-radio', lemma: 'radio', errors: ['rradio'], ruleId: 'r-rr', ruleText: tipR, frequency: 'muy_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.93' },
  { id: 'rr-ramo', lemma: 'ramo', errors: ['rramo'], ruleId: 'r-rr', ruleText: tipR, frequency: 'frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.93' },
  { id: 'rr-terraza', lemma: 'terraza', errors: ['teraza'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-raiz', lemma: 'raíz', errors: ['rraíz', 'raiz'], ruleId: 'r-rr', ruleText: tipR, frequency: 'frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: tipR, notes: 'BACKLOG ej.93', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'rr-aire', lemma: 'aire', errors: ['airre', 'ayre'], ruleId: 'r-rr', ruleText: tipRsoft, frequency: 'muy_frecuente', category: 'naturaleza', image: { recommended: false, ref: null }, tip: tipRsoft, notes: 'BACKLOG ej.93' },
  { id: 'rr-rapido', lemma: 'rápido', errors: ['rrápido', 'rapido'], ruleId: 'r-rr', ruleText: tipR, frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipR, notes: 'BACKLOG ej.93', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'rr-arruga', lemma: 'arruga', errors: ['aruga'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'frecuente', category: 'cuerpo', image: { recommended: false, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-pizarra', lemma: 'pizarra', errors: ['pizara'], ruleId: 'r-rr', ruleText: tipRr, frequency: 'muy_frecuente', category: 'colegio', image: { recommended: true, ref: null }, tip: tipRr, notes: 'BACKLOG ej.93' },
  { id: 'rr-aereo', lemma: 'aéreo', errors: ['arréreo', 'aereo'], ruleId: 'r-rr', ruleText: tipRsoft, frequency: 'poco_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipRsoft, notes: 'BACKLOG ej.93', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
])

append('gj.json', [
  { id: 'gj-jabon', lemma: 'jabón', errors: ['gabón', 'jabon'], ruleId: 'g-j', ruleText: 'Jabón se escribe con j.', frequency: 'frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.69', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-callejon', lemma: 'callejón', errors: ['callegón', 'callejon'], ruleId: 'g-j', ruleText: 'Callejón se escribe con j.', frequency: 'poco_frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.69', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-agente', lemma: 'agente', errors: ['ajente'], ruleId: 'g-j', ruleText: 'Agente se escribe con g.', frequency: 'frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-giro', lemma: 'giro', errors: ['jiro'], ruleId: 'g-j', ruleText: 'Giro se escribe con g.', frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-berenjena', lemma: 'berenjena', errors: ['berengena'], ruleId: 'g-j', ruleText: 'Berenjena se escribe con j.', frequency: 'frecuente', category: 'comida', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-tejido', lemma: 'tejido', errors: ['tegido'], ruleId: 'g-j', ruleText: 'Tejido se escribe con j.', frequency: 'frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-astrologia', lemma: 'astrología', errors: ['astrolojía', 'astrologia'], ruleId: 'g-j', ruleText: 'Astrología se escribe con g.', frequency: 'poco_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-masajista', lemma: 'masajista', errors: ['masagista'], ruleId: 'g-j', ruleText: 'Masajista se escribe con j.', frequency: 'poco_frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-digestion', lemma: 'digestión', errors: ['dijestión', 'digestion'], ruleId: 'g-j', ruleText: 'Digestión se escribe con g.', frequency: 'frecuente', category: 'cuerpo', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-cojin', lemma: 'cojín', errors: ['cogín', 'cojin'], ruleId: 'g-j', ruleText: 'Cojín se escribe con j.', frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-agujetas', lemma: 'agujetas', errors: ['agugetas'], ruleId: 'g-j', ruleText: 'Agujetas se escribe con j.', frequency: 'poco_frecuente', category: 'cuerpo', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-angel', lemma: 'Ángel', errors: ['Ánjel', 'Angel'], ruleId: 'g-j', ruleText: 'Ángel se escribe con g.', frequency: 'frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88', tags: ['tilde', 'nombre-propio'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-estrategia', lemma: 'estrategia', errors: ['estratejia'], ruleId: 'g-j', ruleText: 'Estrategia se escribe con g.', frequency: 'poco_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.88' },
  { id: 'gj-garaje', lemma: 'garaje', errors: ['garage'], ruleId: 'g-j', ruleText: 'Garaje se escribe con g y j.', frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-canjear', lemma: 'canjear', errors: ['cangear'], ruleId: 'g-j', ruleText: 'Canjear se escribe con j.', frequency: 'poco_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-esponja', lemma: 'esponja', errors: ['esponga'], ruleId: 'g-j', ruleText: 'Esponja se escribe con j.', frequency: 'frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-encaje', lemma: 'encaje', errors: ['encage'], ruleId: 'g-j', ruleText: 'Encaje se escribe con j.', frequency: 'poco_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-lejia', lemma: 'lejía', errors: ['legía', 'lejia'], ruleId: 'g-j', ruleText: 'Lejía se escribe con j.', frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'gj-germen', lemma: 'germen', errors: ['jermen'], ruleId: 'g-j', ruleText: 'Germen se escribe con g.', frequency: 'poco_frecuente', category: 'naturaleza', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-aligerar', lemma: 'aligerar', errors: ['alijerar'], ruleId: 'g-j', ruleText: 'Aligerar se escribe con g.', frequency: 'poco_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
  { id: 'gj-agencia', lemma: 'agencia', errors: ['ajencia'], ruleId: 'g-j', ruleText: 'Agencia se escribe con g.', frequency: 'frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipGj, notes: 'BACKLOG ej.101' },
])

append('czqu.json', [
  { id: 'czqu-cuentos', lemma: 'cuentos', errors: ['cuentoz', 'qüentos'], ruleId: 'c-z-qu', ruleText: 'Ante ue/ua el sonido /k/ se escribe c (cuentos).', frequency: 'muy_frecuente', category: 'colegio', image: { recommended: true, ref: null }, tip: 'Ante ue/ua el sonido /k/ se escribe c.', notes: 'BACKLOG ej.69' },
  { id: 'czqu-cuantos', lemma: 'cuántos', errors: ['kuántos', 'cuantos'], ruleId: 'c-z-qu', ruleText: 'Ante ua el sonido /k/ se escribe c (cuántos).', frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: 'Ante ua el sonido /k/ se escribe c.', notes: 'BACKLOG ej.69', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'czqu-cuando', lemma: 'cuando', errors: ['kuando', 'quando'], ruleId: 'c-z-qu', ruleText: 'Ante ua el sonido /k/ se escribe c (cuando).', frequency: 'muy_frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: 'Ante ua el sonido /k/ se escribe c.', notes: 'BACKLOG ej.69' },
  { id: 'czqu-cubo', lemma: 'cubo', errors: ['zubo', 'kubo'], ruleId: 'c-z-qu', ruleText: 'Ante u el sonido /k/ se escribe c (cubo).', frequency: 'muy_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: 'Ante a, o, u el sonido /k/ se escribe c.', notes: 'BACKLOG ej.74' },
])

append('gu.json', [
  { id: 'gu-hoguera', lemma: 'hoguera', errors: ['hogera', 'joguera'], ruleId: 'gu-gue', ruleText: 'Gue, gui suenan /ge/ /gi/; hoguera se escribe con gu.', frequency: 'frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: 'Antes de e o i hace falta la u.', notes: 'BACKLOG ej.81' },
  { id: 'gu-manguito', lemma: 'manguito', errors: ['mangito', 'manjuito'], ruleId: 'gu-gue', ruleText: 'Gue, gui suenan /ge/ /gi/; manguito se escribe con gu.', frequency: 'poco_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: 'Antes de e o i hace falta la u.', notes: 'BACKLOG ej.81' },
  { id: 'gu-trigo', lemma: 'trigo', errors: ['triguo', 'trijo'], ruleId: 'gu-gue', ruleText: 'Ante a, o, u se escribe g (trigo).', frequency: 'frecuente', category: 'comida', image: { recommended: true, ref: null }, tip: 'Ante a, o, u se escribe g (sin u intermedia).', notes: 'BACKLOG ej.81' },
  { id: 'gu-bodega', lemma: 'bodega', errors: ['bodegua', 'vodega'], ruleId: 'gu-gue', ruleText: 'Ante a, o, u se escribe g (bodega).', frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: 'Ante a, o, u se escribe g (sin u intermedia).', notes: 'BACKLOG ej.81' },
  { id: 'gu-malaga', lemma: 'Málaga', errors: ['Málagua', 'Malaga'], ruleId: 'gu-gue', ruleText: 'Ante a, o, u se escribe g (Málaga).', frequency: 'poco_frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: 'Ante a, o, u se escribe g (sin u intermedia).', notes: 'BACKLOG ej.81', tags: ['tilde', 'nombre-propio'], secondaryRuleIds: ['tilde'] },
  { id: 'gu-agujero', lemma: 'agujero', errors: ['agjero', 'ajujero'], ruleId: 'gu-gue', ruleText: 'Gue, gui suenan /ge/ /gi/; agujero se escribe con gu.', frequency: 'frecuente', category: 'objetos', image: { recommended: false, ref: null }, tip: 'Antes de e o i hace falta la u.', notes: 'BACKLOG ej.81' },
])

append('bv.json', [
  { id: 'bv-sucumbir', lemma: 'sucumbir', errors: ['sucumvir'], ruleId: 'b-v', ruleText: 'Los verbos terminados en -bir se escriben con b (excepto vivir, servir, hervir).', frequency: 'poco_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipBir, notes: 'BACKLOG ej.83' },
  { id: 'bv-suscribir', lemma: 'suscribir', errors: ['suscrivir'], ruleId: 'b-v', ruleText: 'Los verbos terminados en -bir se escriben con b (excepto vivir, servir, hervir).', frequency: 'poco_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipBir, notes: 'BACKLOG ej.83' },
  { id: 'bv-inscribir', lemma: 'inscribir', errors: ['inscrivir'], ruleId: 'b-v', ruleText: 'Los verbos terminados en -bir se escriben con b (excepto vivir, servir, hervir).', frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipBir, notes: 'BACKLOG ej.103' },
  { id: 'bv-describir', lemma: 'describir', errors: ['descrivir'], ruleId: 'b-v', ruleText: 'Los verbos terminados en -bir se escriben con b (excepto vivir, servir, hervir).', frequency: 'muy_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipBir, notes: 'BACKLOG ej.103' },
  { id: 'bv-prescribir', lemma: 'prescribir', errors: ['prescrivir'], ruleId: 'b-v', ruleText: 'Los verbos terminados en -bir se escriben con b (excepto vivir, servir, hervir).', frequency: 'poco_frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipBir, notes: 'BACKLOG ej.103' },
])

append('mpmb.json', [
  { id: 'mpmb-alfombra', lemma: 'alfombra', errors: ['alfonbra'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (alfombra).', frequency: 'frecuente', category: 'casa', image: { recommended: true, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-ambulancia', lemma: 'ambulancia', errors: ['anbulancia'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (ambulancia).', frequency: 'frecuente', category: 'ciudad', image: { recommended: false, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-alambre', lemma: 'alambre', errors: ['alanbre'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (alambre).', frequency: 'frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-bambu', lemma: 'bambú', errors: ['banbú', 'bambu'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (bambú).', frequency: 'poco_frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87', tags: ['tilde'], secondaryRuleIds: ['tilde'] },
  { id: 'mpmb-bombacho', lemma: 'bombacho', errors: ['bonbacho'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (bombacho).', frequency: 'poco_frecuente', category: 'objetos', image: { recommended: true, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-invitar', lemma: 'invitar', errors: ['imvitar'], ruleId: 'mb-mp-nv', ruleText: 'Antes de v se escribe n (invitar).', frequency: 'frecuente', category: 'acciones', image: { recommended: false, ref: null }, tip: tipNv, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-asombro', lemma: 'asombro', errors: ['asonbro'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (asombro).', frequency: 'frecuente', category: 'otros', image: { recommended: false, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
  { id: 'mpmb-chumbera', lemma: 'chumbera', errors: ['chunbera'], ruleId: 'mb-mp-nv', ruleText: 'Antes de b se escribe m (chumbera).', frequency: 'poco_frecuente', category: 'naturaleza', image: { recommended: true, ref: null }, tip: tipMp, notes: 'BACKLOG ej.87' },
])

const frasesPath = path.join(root, 'frases-completar.json')
const frases = JSON.parse(fs.readFileSync(frasesPath, 'utf8'))
const fraseHave = new Set(frases.items.map((i) => i.id))
const newFrases = [
  { id: 'frase-ha-a-01', sentence: 'María ___ estudiado.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha es forma de haber + participio.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-02', sentence: 'Ana ___ comido.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha es forma de haber + participio.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-03', sentence: 'Pablo ___ jugado.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha es forma de haber + participio.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-04', sentence: 'Andrés ___ leído.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha es forma de haber + participio.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-05', sentence: 'He visto ___ Cristina.', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'A es preposición (ver a alguien).', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-06', sentence: 'Voy ___ casa de Pedro.', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'A es preposición (ir a un sitio).', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-07', sentence: '___ mí me gusta cantar.', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'A mí: preposición + pronombre.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-08', sentence: '¿Vamos ___ llamar a Juan?', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ir a + infinitivo lleva a.', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-09', sentence: '¿Vamos a llamar ___ Juan?', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'A + persona (complemento).', sourceNotes: 'BACKLOG ej.66', status: 'approved' },
  { id: 'frase-ha-a-10', sentence: 'Mi madre ___ ido al cine.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha + participio (haber).', sourceNotes: 'BACKLOG ej.68', status: 'approved' },
  { id: 'frase-ha-a-11', sentence: 'Juan va ___ ir al circo.', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Va a + infinitivo: preposición a.', sourceNotes: 'BACKLOG ej.68', status: 'approved' },
  { id: 'frase-ha-a-12', sentence: 'Hoy va ___ venir un profesor nuevo.', options: ['a', 'ha', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Va a + infinitivo: preposición a.', sourceNotes: 'BACKLOG ej.68', status: 'approved' },
  { id: 'frase-ha-a-13', sentence: 'Alba ___ jugado al parchís.', options: ['ha', 'a', 'ah', 'há'], correctIndex: 0, ruleId: 'haber-hablar', itemType: 'homophones', difficulty: 1, explanation: 'Ha + participio (haber).', sourceNotes: 'BACKLOG ej.68', status: 'approved' },
]
let fa = 0
for (const f of newFrases) {
  if (fraseHave.has(f.id)) continue
  frases.items.push(f)
  fraseHave.add(f.id)
  fa += 1
}
frases.pack.contentVersion = (frases.pack.contentVersion || 1) + 1
fs.writeFileSync(frasesPath, `${JSON.stringify(frases, null, 2)}\n`)
console.log(`frases-completar.json: +${fa} total ${frases.items.length}`)
