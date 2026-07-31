/**
 * Genera src/spelling/lemmas.generated.ts (~1000+ palabras de 3.º / cicle mitjà).
 * Uso: node scripts/gen-spell-lemmas.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))

function uniq(arr) {
  const s = new Set()
  const o = []
  for (const w of arr) {
    const k = String(w).trim()
    if (!k || s.has(k.toLowerCase())) continue
    s.add(k.toLowerCase())
    o.push(k)
  }
  return o
}

function stemAr(v) {
  return v.endsWith('ar') ? v.slice(0, -2) : v
}

/** Clasifica por rasgo ortográfico dominante (orden importa). */
function classify(word) {
  const w = word.toLowerCase()
  if (/rr/.test(w) || /[lns]r/.test(w)) return 'r-rr'
  if (/^(hie|hue)/.test(w)) return 'hie-hue'
  if (/m[bp]/.test(w)) return 'mb-mp'
  if (/ab(a|as|amos|an|ábamos|abais)\b/.test(w) || /ábamos|abas|aban|aba$/.test(w))
    return 'aba'
  if (/illo$|illa$|illos$|illas$/.test(w) || /ll/.test(w)) return 'll-illa'
  if (/^(bu|bur|bus|bo)/.test(w) && /b/.test(w)) return 'bu-bur'
  if (/g[eéií]|j[eéií]|j[aou]|g[aou]/.test(w) && /[gj]/.test(w)) {
    if (/gente|gira|girasol|gesto|general|gigante|gimnasio|gitano|germ|jefe|jirafa|jalea|jardín|jaula|joven|juego|jugo|julio|junio|junto|justo|pájaro|reloj|rojo|tejado|viaje|viejo|abeja|caja|ojo|mujer|naranja|espejo|hoja|mejor/.test(w))
      return 'g-j'
    if (/j[ei]|g[ei]/.test(w)) return 'g-j'
  }
  if (/z|c[ei]/.test(w) && /^(za|zo|zu|ce|ci|z)/.test(w) || /z$|zón$|ces$|ces\b/.test(w))
    return 'd-z'
  if (/^h/.test(w)) return 'haber-hablar'
  if (/b|v/.test(w)) return 'b-v'
  return null
}

const verbsAr = uniq([
  'cantar', 'jugar', 'saltar', 'dibujar', 'bailar', 'caminar', 'estudiar', 'mirar',
  'trabajar', 'cocinar', 'comprar', 'ayudar', 'llamar', 'llevar', 'llegar', 'nadar',
  'pintar', 'regalar', 'terminar', 'usar', 'viajar', 'ganar', 'guardar', 'lavar',
  'limpiar', 'montar', 'pasar', 'quitar', 'sacar', 'saludar', 'tomar', 'tocar',
  'volar', 'contar', 'mostrar', 'probar', 'sonar', 'buscar', 'cambiar', 'descansar',
  'escuchar', 'esperar', 'gritar', 'invitar', 'necesitar', 'olvidar', 'organizar',
  'preguntar', 'preparar', 'recordar', 'respetar', 'visitar', 'aceptar', 'animar',
  'arreglar', 'celebrar', 'completar', 'continuar', 'conversar', 'decidir',
  'descubrir', 'desear', 'entregar', 'explicar', 'felicitar', 'formar', 'imaginar',
  'indicar', 'intentar', 'inventar', 'mejorar', 'observar', 'ocupar', 'practicar',
  'presentar', 'realizar', 'recibir', 'reconocer', 'recuperar', 'repartir',
  'responder', 'reunir', 'revisar', 'seleccionar', 'separar', 'solucionar',
  'sugerir', 'superar', 'transformar', 'utilizar', 'valorar', 'cerrar', 'empezar',
  'encontrar', 'pensar', 'soñar', 'aparecer', 'averiguar', 'corregir', 'discutir',
  'elegir', 'ofrecer', 'permitir', 'preferir', 'proteger', 'seguir', 'significar',
])

const bags = {
  'r-rr': [
    'perro', 'carro', 'tierra', 'guerra', 'parra', 'torre', 'barro', 'cerro', 'gorro',
    'jarra', 'burro', 'correo', 'corral', 'corriente', 'carrera', 'carretera', 'cerradura',
    'correr', 'desarrollo', 'ferrocarril', 'garra', 'guerrilla', 'guitarra', 'horror',
    'irritar', 'marrón', 'morro', 'parrilla', 'porra', 'arriba', 'barrera', 'borracho',
    'borrador', 'carril', 'carroza', 'cerrado', 'cerrojo', 'derrame', 'derroche',
    'derrota', 'derribo', 'errores', 'error', 'garrote', 'horrendo', 'horripilante',
    'irritante', 'jarrón', 'marrano', 'parroquia', 'raro', 'recorrer', 'rebaño',
    'sarro', 'tarro', 'zorro', 'abarrotes', 'barriga', 'birrete', 'carrasca',
    'derrumbe', 'erizo', 'garrapata', 'irritación', 'porquería', 'urraca', 'zarza',
    'barranco', 'carroña', 'terremoto', 'carretilla', 'horroroso', 'barra', 'berrear',
    'borra', 'churro', 'curro', 'forro', 'garrafa', 'gorrión', 'arroz', 'barrote',
    'alrededor', 'sonreír', 'Enrique', 'honrado', 'Israel', 'enredo', 'enredar',
    'enrabiar', 'sonrisa', 'sonriente', 'honra', 'Enriqueta', 'alrededores',
    'enrojecer', 'enrollar', 'enroscar', 'enramada', 'enriquecer', 'honradez',
    'enredadera', 'honrar', 'honroso', 'enrollado', 'enroscado', 'enriquecido',
    'sonreía', 'Israelita', 'enrabietado', 'hierro', 'herrero', 'herradura',
    'torreón', 'cerrillo', 'corrompido', 'erróneo', 'irritable', 'párroco',
    'birria', 'borraja', 'chirria', 'corrijo', 'ferretería', 'gorrón', 'morrión',
    'párrafo', 'parranda', 'ristra', 'zarrapastroso', 'jarrete', 'horrorizado',
  ],
  'hie-hue': [
    'hierro', 'hierba', 'hielo', 'hiena', 'hiel', 'hiedra', 'hierbabuena', 'hiato',
    'hígado', 'hierbecilla', 'hielera', 'hueso', 'huevo', 'huella', 'hueco', 'huerta',
    'huelga', 'huérfano', 'huésped', 'huerto', 'huero', 'huida', 'huir', 'huelguista',
    'huesudo', 'huevito', 'huellita', 'huequito', 'huertano', 'huele', 'huelga',
    'huésped', 'huérfano', 'hierático',
  ],
  'haber-hablar': [
    'haber', 'hablar', 'hacer', 'hola', 'hermano', 'hora', 'hormiga', 'helado',
    'hospital', 'hoja', 'hermana', 'héroe', 'historia', 'hombre', 'hambre', 'hondo',
    'húmedo', 'humano', 'humilde', 'herramienta', 'hervir', 'hervido', 'higo', 'hilo',
    'hipopótamo', 'hogar', 'hoguera', 'hojita', 'holgado', 'honestidad', 'honor',
    'horario', 'horizonte', 'hormigón', 'horno', 'horrible', 'hoy', 'hoyo', 'huracán',
    'habitación', 'hacia', 'hada', 'hallar', 'hambriento', 'harina', 'hasta', 'haya',
    'heladería', 'helicóptero', 'herida', 'hervidor', 'hidrógeno', 'himno', 'hombro',
    'hotel', 'humo', 'hundir', 'había', 'hemos', 'habéis', 'han', 'hola',
  ],
  'mb-mp': [
    'también', 'hombre', 'tambor', 'cambiar', 'ambos', 'ambiente', 'bomba', 'bombero',
    'cambio', 'embudo', 'embarcación', 'embarcar', 'embestir', 'imborrable', 'lombriz',
    'miembro', 'nombre', 'sombrero', 'tumba', 'combate', 'combinar', 'combustible',
    'cumbre', 'embalse', 'embarazada', 'embargo', 'embeber', 'embelesar', 'embolsar',
    'emborrachar', 'emboscada', 'embrague', 'embriagar', 'embrión', 'empleo',
    'emplear', 'empleado', 'empresa', 'impreso', 'imprevisto', 'imprudente',
    'importante', 'importar', 'imposible', 'impresión', 'imprimir', 'improviso',
    'lámpara', 'limpieza', 'campo', 'tiempo', 'siempre', 'comprar', 'compota',
    'compañero', 'compañía', 'comparar', 'competir', 'completo', 'compás', 'campeón',
    'campeonato', 'campana', 'campamento', 'campesino', 'comprador', 'comprensión',
    'comprimir', 'compromiso', 'compuerta', 'computadora', 'empanada', 'empaquetar',
    'empatar', 'empeñar', 'empezar', 'empresario', 'impresora', 'impresionar',
    'limpiar', 'limpio', 'romper', 'rompeolas', 'tampoco', 'temperatura', 'tempestad',
    'temporada', 'temporal', 'temprano', 'vampiro', 'compartir', 'compasión',
    'compatible', 'competencia', 'complacer', 'complejo', 'complemento', 'complicado',
    'componer', 'comportamiento', 'composición', 'comprender', 'empacar', 'ambos',
  ],
  'b-v': [
    'caballo', 'árbol', 'abeja', 'libro', 'vaca', 'ventana', 'viaje', 'albóndiga',
    'barco', 'bola', 'bolsa', 'brazo', 'blanco', 'blusa', 'bloque', 'broma', 'brújula',
    'bebida', 'bebé', 'biblioteca', 'bicicleta', 'bien', 'bienvenida', 'boca',
    'bocadillo', 'boda', 'bolígrafo', 'borde', 'botella', 'botón', 'breve',
    'brillante', 'brincar', 'bufanda', 'cabeza', 'cable', 'calabaza', 'vaso',
    'velero', 'violín', 'vinagre', 'visera', 'navaja', 'clavar', 'voltereta',
    'volcán', 'avenida', 'vientre', 'navegar', 'verdad', 'verde', 'verdura',
    'vergüenza', 'vestido', 'vestir', 'vida', 'vidrio', 'viento', 'viernes',
    'villa', 'vino', 'visión', 'visita', 'visitar', 'vivir', 'vivo', 'volante',
    'volar', 'volumen', 'voluntad', 'volver', 'voto', 'voz', 'vuelo', 'vuelta',
    'abuelo', 'abuela', 'abrir', 'abril', 'absoluto', 'acabar', 'aceite', 'aceptar',
    'actividad', 'activo', 'actor', 'actriz', 'acuerdo', 'adelante', 'además',
    'adentro', 'admirar', 'adulto', 'afuera', 'agosto', 'agradable', 'agradecer',
    'agua', 'aguacate', 'águila', 'aguja', 'agujero', 'aire', 'ajedrez', 'ala',
    'alcalde', 'alcanzar', 'aldea', 'alegre', 'alegría', 'alfabeto', 'alimento',
    'alma', 'almacén', 'almohada', 'alto', 'altura', 'alumno', 'amanecer', 'amar',
    'amargo', 'amenaza', 'amigo', 'amistad', 'amor', 'amplio', 'ancho', 'anciano',
    'andar', 'anillo', 'animal', 'aniversario', 'anoche', 'anterior', 'antes',
    'antiguo', 'anunciar', 'añadir', 'año', 'apagar', 'aparato', 'aparecer',
    'apartamento', 'apellido', 'apenas', 'apetito', 'aplaudir', 'aplicar', 'apoyar',
    'aprender', 'aprovechar', 'aproximado', 'apuntar', 'aquí', 'araña', 'archivo',
    'arder', 'arena', 'argumento', 'arma', 'armar', 'armario', 'arquitecto',
    'arrancar', 'arreglar', 'arte', 'artículo', 'artista', 'asado', 'ascensor',
    'aseo', 'asiento', 'asistir', 'asombrar', 'aspecto', 'astronauta', 'asunto',
    'atacar', 'ataque', 'atar', 'atención', 'atento', 'aterrizar', 'atlas',
    'atleta', 'atrás', 'atreverse', 'aumentar', 'aunque', 'aurora', 'ausencia',
    'auténtico', 'autobús', 'automóvil', 'autor', 'autoridad', 'auxiliar',
    'avanzar', 'aventura', 'avisar', 'aviso', 'ayer', 'ayuda', 'ayudar',
    'ayuntamiento', 'vacaciones', 'vacío', 'valer', 'valiente', 'valle', 'valor',
    'vapor', 'vara', 'varios', 'vecino', 'vegetal', 'vehículo', 'veinte', 'vela',
    'velocidad', 'vena', 'vencer', 'venda', 'vender', 'veneno', 'venir', 'venta',
    'verano', 'verbo', 'verificar', 'verso', 'veterano', 'vez', 'vía', 'vibrar',
    'vicio', 'víctima', 'victoria', 'video', 'viejo', 'viga', 'vigilante', 'vigor',
    'viña', 'violencia', 'virgen', 'virtud', 'virus', 'víspera', 'vista', 'vital',
    'vitamina', 'viudo', 'vocabulario', 'vocación', 'vomitar', 'vulgar',
  ],
  'll-illa': [
    'amarillo', 'cucharilla', 'bolsillo', 'tortilla', 'camisilla', 'martillo',
    'mesilla', 'silla', 'orilla', 'mejillón', 'cepillo', 'castillo', 'cuchillo',
    'anillo', 'pasillo', 'llave', 'lluvia', 'llamar', 'llegar', 'lleno', 'llevar',
    'llorar', 'llano', 'llama', 'llanta', 'llegada', 'llorón', 'lluvioso',
    'vajilla', 'rodilla', 'mejilla', 'costilla', 'plantilla', 'pantalla', 'batalla',
    'callar', 'calle', 'callado', 'calleja', 'rollizo', 'rollo', 'rodillo',
    'tornillo', 'semilla', 'vainilla', 'villa', 'villano', 'villancico',
    'almohadilla', 'brillante', 'brillar', 'brillo', 'caballo', 'estrellita',
    'gavilla', 'mantilla', 'pandilla', 'quintilla', 'servilleta', 'sombrilla',
    'vainilla', 'zapatilla', 'mejilla', 'parrilla', 'cuadrilla', 'sencillo',
    'amarilla', 'amarillos', 'amarillas', 'bolsillos', 'castillos', 'cuchillos',
  ],
  'g-j': [
    'gente', 'girasol', 'jefe', 'jirafa', 'pájaro', 'ojo', 'general', 'generoso',
    'germinar', 'gesto', 'gigante', 'gimnasio', 'gira', 'girar', 'gitano', 'jalea',
    'jamón', 'jardín', 'jarra', 'jaula', 'joven', 'juego', 'jugo', 'julio', 'junio',
    'junto', 'justo', 'jirón', 'jornada', 'joya', 'joyero', 'juguete', 'juicio',
    'juntar', 'jurado', 'jurar', 'justicia', 'reloj', 'relojería', 'rojo', 'rojizo',
    'tejado', 'trabajo', 'viaje', 'viajero', 'viejo', 'abeja', 'abejorro', 'caja',
    'cajón', 'cojín', 'cojo', 'dejar', 'dibujo', 'dibujar', 'empuje', 'empujar',
    'espejo', 'espejismo', 'fijo', 'fijar', 'hoja', 'hojita', 'jengibre',
    'jilguero', 'joroba', 'lejano', 'lejos', 'mejor', 'mejorar', 'mensaje',
    'mujer', 'naranja', 'objeto', 'oreja', 'pasaje', 'peaje', 'gente', 'general',
  ],
  'bu-bur': [
    'bueno', 'buscar', 'burro', 'bosque', 'búho', 'bufanda', 'burbuja', 'burla',
    'burlón', 'buscador', 'búsqueda', 'buzón', 'buzo', 'botella', 'botón', 'bola',
    'bolsa', 'bolsillo', 'bomba', 'bombero', 'borde', 'borra', 'borrar', 'borracho',
    'borrador', 'bota', 'boxeo', 'brazo', 'breve', 'brillante', 'brincar', 'broma',
    'brújula', 'bulto', 'buque', 'bondad', 'bonito', 'borde', 'borrar', 'bosquejo',
    'bostezar', 'botánica', 'bote', 'botiquín', 'bóveda', 'brújula', 'bueno',
  ],
  'd-z': [
    'zapato', 'azul', 'lápiz', 'pez', 'cine', 'ciudad', 'corazón', 'zorro', 'zumo',
    'zona', 'zapatero', 'zanahoria', 'zancada', 'zanco', 'zángano', 'zapatear',
    'zarza', 'zarpar', 'zigzag', 'zodiaco', 'zona', 'zoo', 'zoológico', 'zorra',
    'zueco', 'zurcir', 'zurdo', 'azúcar', 'azote', 'azotea', 'azucena', 'azulejo',
    'cinta', 'cintura', 'circo', 'círculo', 'ciruela', 'cita', 'civil', 'caza',
    'cazar', 'cazador', 'cazo', 'cazuela', 'cebra', 'cebolla', 'ceja', 'celda',
    'celebrar', 'celeste', 'celos', 'cena', 'cenar', 'ceniza', 'centavo', 'centeno',
    'centímetro', 'central', 'centro', 'cepillo', 'cerca', 'cercano', 'cerebro',
    'cereza', 'cero', 'cerrar', 'cerveza', 'cesar', 'césped', 'cesta', 'cesto',
    'cicatriz', 'ciclo', 'ciego', 'cielo', 'ciencia', 'científico', 'ciento',
    'cierto', 'ciervo', 'cifra', 'cigarro', 'cima', 'cinco', 'ciprés', 'cirugía',
    'cisne', 'cocina', 'coger', 'conocer', 'crecer', 'cruz', 'dulzura', 'dureza',
    'felicidad', 'fuerza', 'luz', 'nariz', 'paz', 'pieza', 'plaza', 'pozo',
    'precio', 'príncipe', 'raza', 'razón', 'riqueza', 'suaveza', 'tristeza',
    'voz', 'cabeza', 'belleza', 'naturaleza', 'velocidad', 'capacidad',
  ],
  'hacer-echar': [
    'hecho', 'hecha', 'hechas', 'hechos', 'hacer', 'hacemos', 'hacen', 'hago',
    'haces', 'hace', 'hacía', 'hacías', 'hacíamos', 'hacían', 'hice', 'hiciste',
    'hizo', 'hicimos', 'hicieron', 'haré', 'harás', 'hará', 'haremos', 'harán',
    'haga', 'hagas', 'hagamos', 'hagan', 'echo', 'echa', 'echas', 'echamos',
    'echan', 'echaba', 'echabas', 'echábamos', 'echaban', 'eché', 'echaste',
    'echó', 'echaron', 'echaré', 'echarás', 'echará', 'echaremos', 'echarán',
    'eche', 'eches', 'echemos', 'echen', 'echado', 'echada', 'echados', 'echadas',
    'echar',
  ],
}

const lemmas = []
const seen = new Set()

function push(word, rule) {
  const k = word.toLowerCase()
  if (!word || seen.has(k)) return
  seen.add(k)
  lemmas.push({ word, rule })
}

for (const [rule, words] of Object.entries(bags)) {
  for (const w of uniq(words)) push(w, rule)
}

for (const v of verbsAr) {
  const s = stemAr(v)
  for (const form of [`${s}aba`, `${s}abas`, `${s}ábamos`, `${s}aban`]) {
    push(form, 'aba')
  }
}

// Vocabulario frecuente extra clasificado por patrón
const extra = uniq([
  ...bags['b-v'], ...bags['mb-mp'], ...bags['d-z'], ...bags['r-rr'],
  'escuela', 'maestro', 'alumno', 'cuaderno', 'lápiz', 'goma', 'regla', 'mochila',
  'recreo', 'patio', 'amigo', 'amiga', 'familia', 'padre', 'madre', 'hermano',
  'hermana', 'abuelo', 'abuela', 'casa', 'calle', 'pueblo', 'ciudad', 'país',
  'mundo', 'sol', 'luna', 'estrella', 'nube', 'lluvia', 'viento', 'nieve',
  'montaña', 'río', 'mar', 'playa', 'bosque', 'flor', 'árbol', 'hoja', 'fruta',
  'manzana', 'pera', 'plátano', 'naranja', 'uva', 'fresa', 'pan', 'leche',
  'agua', 'jugo', 'carne', 'pescado', 'huevo', 'queso', 'arroz', 'sopa',
  'perro', 'gato', 'pájaro', 'pez', 'caballo', 'vaca', 'oveja', 'cerdo',
  'conejo', 'ratón', 'león', 'tigre', 'elefante', 'jirafa', 'mono', 'oso',
  'coche', 'autobús', 'tren', 'avión', 'barco', 'bicicleta', 'moto',
  'rojo', 'azul', 'verde', 'amarillo', 'blanco', 'negro', 'gris', 'rosa',
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre', 'primavera', 'verano',
  'otoño', 'invierno', 'mañana', 'tarde', 'noche', 'hoy', 'ayer', 'mañana',
  'siempre', 'nunca', 'también', 'tampoco', 'mucho', 'poco', 'todo', 'nada',
  'grande', 'pequeño', 'alto', 'bajo', 'largo', 'corto', 'nuevo', 'viejo',
  'bonito', 'feo', 'bueno', 'malo', 'feliz', 'triste', 'rápido', 'lento',
  'fácil', 'difícil', 'caliente', 'frío', 'lleno', 'vacío', 'abierto', 'cerrado',
  'primero', 'segundo', 'tercero', 'último', 'mismo', 'otro', 'cada', 'todo',
])

for (const w of extra) {
  if (seen.has(w.toLowerCase())) continue
  const rule = classify(w)
  if (rule) push(w, rule)
}

// Recortar/balancear hacia ~1000–1200 priorizando reglas útiles
const TARGET = 1100
const byRule = new Map()
for (const l of lemmas) {
  if (!byRule.has(l.rule)) byRule.set(l.rule, [])
  byRule.get(l.rule).push(l)
}

const caps = {
  aba: 220,
  'b-v': 280,
  'r-rr': 140,
  'mb-mp': 120,
  'd-z': 100,
  'll-illa': 80,
  'g-j': 70,
  'haber-hablar': 70,
  'hacer-echar': 55,
  'hie-hue': 35,
  'bu-bur': 40,
  'hay-ahi-ay': 10,
}

let final = []
for (const [rule, list] of byRule) {
  const cap = caps[rule] ?? 50
  final.push(...list.slice(0, cap))
}
final = final.slice(0, TARGET)

const counts = {}
for (const l of final) counts[l.rule] = (counts[l.rule] || 0) + 1

const out = `/* AUTOGENERADO por scripts/gen-spell-lemmas.mjs — no editar a mano */
import type { SpellLemma } from '@/spelling/distract'

export const SPELL_LEMMAS: SpellLemma[] = ${JSON.stringify(final, null, 2)}
`

writeFileSync(join(__dir, '../src/spelling/lemmas.generated.ts'), out, 'utf8')
console.log('Wrote', final.length, 'lemmas')
console.log(counts)
