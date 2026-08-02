# Estado editorial Aray — fotografía de cierre

**Fecha de cierre de fase:** 2026-08-02  
**Alcance:** Ortografía (congelada + JSON en juego) · Inglés (3 bancos + JSON en juego).  
**Uso:** retomar el proyecto sin reabrir metodología ni bancos ya cerrados.

Este archivo **no es runtime**. Flujo general: [`README.md`](./README.md) · arquitectura inglés: [`INGLES_MASTER.md`](./INGLES_MASTER.md).

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

Fuente editorial: `INGLES_*.md` → JSON en `feinetas/Ingles/` · schema [`INGLES_JSON_SPEC.md`](./INGLES_JSON_SPEC.md).

| Banco | Archivo | Pack JSON | Registros |
|-------|---------|-----------|-----------|
| Colours & Numbers | `INGLES_COLOURS_NUMBERS.md` | `colours-numbers.json` | 30 |
| School | `INGLES_SCHOOL.md` | `school.json` | 26 |
| Family | `INGLES_FAMILY.md` | `family.json` | 18 |
| **Total Inglés** | | | **74** |

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

Siguientes bancos previstos (solo estado; **no desarrollados**):

| Orden | Banco / pack | Estado |
|-------|--------------|--------|
| 1 | Body | pendiente |
| 2 | Food | pendiente |
| 3 | Me & Chunks | pendiente |
| 4 | Animals | pendiente |
| 5 | Clothes | pendiente |
| 6 | Home | pendiente |
| 7 | Feelings | pendiente |
| 8 | Time & Days | pendiente |
| 9 | Listening | pendiente |
| 10 | Phonics | pendiente |

Listening y Phonics siguen aplazados a fase con audio (ola offline actual = sin audio obligatorio). Detalle de arquitectura: `INGLES_MASTER.md`.

---

# Estado técnico

| Área | Estado |
|------|--------|
| **JSON Ortografía** | Terminado |
| **Integración Ortografía** | Completa |
| **JSON Inglés** | Terminado (3 packs, schema `INGLES_JSON_SPEC.md`) |
| **Integración Inglés** | Completa v1 · hub de repaso 3.º: **Colegio + Familia** (Colours & Numbers en banco, aparcado en UI) |
| **Siguiente paso lógico** | Bancos editoriales pendientes (Body, Food, …) o assets de imagen |

---

## Referencias rápidas

| Documento | Rol |
|-----------|-----|
| `README.md` | Flujo editorial general |
| `INGLES_JSON_SPEC.md` | Schema JSON inglés |
| `INGLES_MASTER.md` | Arquitectura packs inglés |
| `INGLES_COLOURS_NUMBERS.md` | Pack 1 congelado |
| `INGLES_SCHOOL.md` | Pack 2 congelado |
| `INGLES_FAMILY.md` | Pack 3 congelado |
| `ERRORES_REALES_*.md` | Bancos ortografía congelados |
