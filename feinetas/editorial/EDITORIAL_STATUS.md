# Estado editorial Aray — fotografía de cierre

**Fecha de cierre de fase:** 2026-08-02 (Ortografía / inglés v1) · **Mapa hub Inglés cerrado:** 2026-08-04  
**Alcance:** Ortografía (congelada + JSON en juego) · Inglés v1 archivado · **mapa hub:** 3 estaciones (Vocabulario / Gramática / Frases); hub app vacío hasta tandas.  
**Uso:** retomar el proyecto sin reabrir metodología ni bancos ya cerrados.

Este archivo **no es runtime**. Flujo general: [`README.md`](./README.md) · arquitectura inglés: [`INGLES_MASTER.md`](./INGLES_MASTER.md) · mapa hub: [`INGLES_CATEGORIAS_BORRADOR.md`](./INGLES_CATEGORIAS_BORRADOR.md).

---

# Bancos congelados

## Ortografía

Fuente editorial: `ERRORES_REALES_*.md` → JSON consumido por el juego.

| Banco | Archivo | Registros |
|-------|---------|-----------|
| H | `ERRORES_REALES_H.md` | 49 |
| BV | `ERRORES_REALES_BV.md` | 31 |
| GJ | `ERRORES_REALES_GJ.md` | 31 |
| RR | `ERRORES_REALES_RR.md` | 21 |
| LLY | `ERRORES_REALES_LLY.md` | 18 |
| CZQU | `ERRORES_REALES_CZQU.md` | 25 |
| MPMB | `ERRORES_REALES_MPMB.md` | 18 |
| HAY / AHÍ / AY | `ERRORES_REALES_HAY_AHI_AY.md` | 3 |
| TILDES | `ERRORES_REALES_TILDES.md` | 11 |
| GU / GÜ | `ERRORES_REALES_GU.md` | 9 |
| **Total Ortografía** | | **216** |

Complemento congelado (frases, no contado arriba como banco de lemas): `FRASES_COMPLETAR_ORTOGRAFIA.md`.

## Inglés

### Packs v1 (archivados, no runtime)

Fuente: `INGLES_*.md` · JSON en `feinetas/Ingles/_archivo/` · schema [`INGLES_JSON_SPEC.md`](./INGLES_JSON_SPEC.md).

| Banco | Archivo | Pack JSON | Registros |
|-------|---------|-----------|-----------|
| Colours & Numbers | `INGLES_COLOURS_NUMBERS.md` | `colours-numbers.json` | 30 |
| School | `INGLES_SCHOOL.md` | `school.json` | 26 |
| Family | `INGLES_FAMILY.md` | `family.json` | 18 |
| **Total Inglés v1** | | | **74** |

### Mapa hub (cerrado 2026-08-04)

Fuente: fichas `_inbox/` · documento [`INGLES_CATEGORIAS_BORRADOR.md`](./INGLES_CATEGORIAS_BORRADOR.md).

- **3 estaciones** (como Lengua/Mates): `vocabulary` (Vocabulario) · `grammar` (Gramática) · `phrases` (Frases).
- Temas del catálogo = **packs internos** (food, there-is, numbers…), no cartas del mapa.
- Hub app: **tandas 1–2 jugables** (16 packs · Empareja en Puedo/Rutinas/Transporte/Lugares).
- **Tanda 1:** food, numbers, there-is, prepositions, abilities, routines.
- **Tanda 2:** places, weather, characters, transport, money, possessives, present-simple, present-continuous, time, phrases.

---

# Metodología congelada

Reglas ya aprobadas; no reabrir sin decisión explícita de producto.

### Calidad antes que cantidad
- Los mínimos/máximos del master son **orientativos**.
- No rellenar listas típicas para alcanzar un cupo.
- Preferible un banco más corto y bien respaldado.

### Una palabra = un propietario
- Un lema pertenece a un pack (p. ej. *table* en SCHOOL aunque HOME pueda reutilizar contexto).
- Variantes EN distintas (*mum* / *mother*, *bag* / *rucksack*) no son duplicados: son lemas distintos si ambas están trabajadas.

### Jerarquía de evidencias
1. Vicens / coursebooks del repo (p. ej. Bugs World 3) y cuadernos 3.º.  
2. Fitxes y materiales propios del repositorio (incl. solucionari).  
3. Wonder u otras TRB: **apoyo**, no fuente principal de listados.  
4. OCR débil → revisión visual de PDF cuando haga falta.  
5. CLIL (mating8/11) **fuera** del alcance inglés inicial.

### Inglés en-GB
- Locale fijo: **en-GB** (*grey*, *rubber*, *mum*, *rucksack*, *auntie*, *granddad*…).
- Sin paralelos US (*gray*, *eraser*, *mom*, *backpack* como lema…).

### Glosas
- Solo español (`glossEs`).
- **Una sola forma principal** por lema.
- Notas de género/registro en observaciones cuando aporten (*cousin* → *primo*; EN sin género).

### Categorías
- Deben servir a juegos futuros (Intrusa / Match / filtros).
- Ejemplos ya usados: Colours / Numbers; Places / People / Objects; Family group / Core family / Extended family.

### Criterio de auditoría
Flujo fijo por banco:
1. Borrador v1 (Markdown).  
2. Auditoría crítica (Correctos / Revisar / Eliminar / Añadir / Estadísticas / decisiones).  
3. Comprobación de evidencia si hay bloque dudoso.  
4. Aplicación de decisiones → **Congelado**.  
5. Solo entonces JSON (hecho para los 3 packs inglés v1).

### Cuándo un lema entra
- Aparece trabajado en materiales de **3.º** del repo / pack aprobado.
- Nivel adecuado; glosa natural; imagen revisada; en-GB coherente.
- Dominio del pack (no colarse de body, verbs, colours, etc.).

### Cuándo un lema no entra
- Sin respaldo claro (solo costumbre o “lista típica”).
- Solo metalenguaje débil sin producción ni word bank (ej. *son* en Family).
- Otro pack propietario o fuera de alcance (verbos, CLIL, audio/phonics en esta ola).
- Inventado o copiado como ejercicio completo de libro.

### Formato de registro (Inglés)
`Inglés` · `Glosa` · `Categoría` · `Frecuencia` · `Imagen recomendable` · `Observaciones` (+ fuentes en cabecera del banco).

---

# Pendientes

Siguientes bancos previstos (solo estado):

| Orden | Banco / pack | Estado |
|-------|--------------|--------|
| 1 | Body (`INGLES_BODY.md`) | **congelado** (10 lemas; auditoría 2026-08-03) |
| 2 | Food (`INGLES_FOOD.md`) | **borrador** (24 lemas; pendiente auditoría) |
| 3 | Actions (forma base) | pendiente |
| 4 | Clothes | pendiente |
| 5 | Animals | pendiente |
| 6 | Home | pendiente |
| 7 | Time & Days | pendiente |
| 8 | Me & Chunks | pendiente |
| 9 | Feelings | pendiente |
| 10 | Weather | pendiente **auditoría de fuentes** (puede no crearse) |

Ritmo: máximo **dos** packs editoriales en paralelo. Imágenes / frases / listening / pronunciación = fases posteriores (`INGLES_ROADMAP_V2.md`).

Listening y Phonics siguen aplazados (Fases 5–6).

---

# Estado técnico

| Área | Estado |
|------|--------|
| **JSON Ortografía** | Terminado |
| **Integración Ortografía** | Completa |
| **JSON Inglés** | v1 archivado · **tanda 1 en runtime** (6 packs) · schema `INGLES_JSON_SPEC` |
| **Integración Inglés** | Hub 3 estaciones · packs bajo `/missions/english/pack/:id` |
| **Siguiente paso lógico** | Assets AFK + mecánicas match/drag; tanda 2 de packs |

---

## Referencias rápidas

| Documento | Rol |
|-----------|-----|
| `README.md` | Flujo editorial general |
| `INGLES_CATEGORIAS_BORRADOR.md` | **Mapa hub cerrado** (3 estaciones + packs internos + primera tanda) |
| `INGLES_JSON_SPEC.md` | Schema JSON inglés |
| `INGLES_MASTER.md` | Arquitectura packs inglés |
| `INGLES_COLOURS_NUMBERS.md` | Pack 1 congelado (v1 / archivo) |
| `INGLES_SCHOOL.md` | Pack 2 congelado (v1 / archivo) |
| `INGLES_FAMILY.md` | Pack 3 congelado (v1 / archivo) |
| `ERRORES_REALES_*.md` | Bancos ortografía congelados |
