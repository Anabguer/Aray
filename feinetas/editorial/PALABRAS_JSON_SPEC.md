# Especificación JSON — Palabras (bancos reutilizables)

Documento de **diseño técnico**. No es un pack jugable.  
No convierte bancos Markdown. No define contenido educativo.

**Estado:** Fase 1 · alineado con [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) y [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md).  
**Actualizado:** 2026-08-02.

---

## 1. Principio rector

| Capa | Qué contiene | Quién la consume |
|------|----------------|------------------|
| **Banco JSON** (`packKind`) | Conocimiento editorial reutilizable | Varios productos vía adaptadores |
| **Vista de mecánica** | MCQ, ordenar tokens, conjunto/intrusa… | Un minijuego concreto |

Un archivo JSON = **un banco propietario** (misma frontera que el Markdown), **no** un producto del hub.

```
BANCO_RELACIONES_SEMANTICAS.md  →  palabras-relaciones-semanticas.json
        │
        ├── adaptador Sinónimos   (filtra relation=synonym)
        └── adaptador Antónimos   (filtra relation=antonym)
```

**Formar palabras:** fuera de este schema en v1. Sigue en `feinetas/formar-palabras.json` sin migración.

---

## 2. Raíz común de todo pack Palabras (v1)

```
WordsBankPack
├── schemaVersion
├── pack (metadatos)
└── items[]
```

### 2.1 Metadatos (`pack`)

| Campo | Obligatorio | Tipo | Descripción |
|-------|-------------|------|-------------|
| `id` | sí | string | Id estable, p. ej. `palabras-relaciones-semanticas` |
| `title` | sí | string | Nombre humano del banco |
| `ownerBank` | sí | string | MD fuente, p. ej. `BANCO_RELACIONES_SEMANTICAS.md` |
| `packKind` | sí | enum | Ver §3 |
| `level` | sí | string | `3-primaria` |
| `locale` | sí | string | `es-ES` |
| `revisionStatus` | sí | enum | `draft` \| `approved` \| `frozen` |
| `contentVersion` | sí | number | Sube al editar ítems |
| `sourceEditorialPhase` | no | string | p. ej. `fase-editorial-palabras` |
| `notes` | no | string | Notas de pack |

### 2.2 Raíz

| Campo | Obligatorio | Tipo |
|-------|-------------|------|
| `schemaVersion` | sí | number (empieza en `1`) |
| `pack` | sí | object |
| `items` | sí | array |

### 2.3 Identidad y miss keys

```text
packId + item.id
```

Al fallar: persistir `packId`, `itemId`, `minigameId` (miss store v2).  
El **mismo** ítem fallado desde Sinónimos o desde Mix comparte identidad de banco; `minigameId` indica con qué UX se reexpone.

### 2.4 Qué NO va en el banco

- `opciones` / `correctIndex` / `enunciado` de UI
- Timings, drag_drop, colores de acierto/fallo
- Distractores inventados en runtime
- Campos solo de un producto si el dato es compartible (usar filtros: `relation`, `axis`)

---

## 3. Kinds de banco (`packKind`)

| `packKind` | Banco | Productos consumidores |
|------------|-------|------------------------|
| `semantic-relation` | Relaciones semánticas | Sinónimos, Antónimos |
| `morph-pair` | Morfología | Singular/plural, Masc/fem |
| `word-family` | Familias léxicas | Familia de palabras |
| `semantic-field` | Campos semánticos | Campo semántico (+ vista intrusa) |
| `sentence-order` | Oraciones | Ordenar frases |
| `word-sort-list` | Listas diccionario | Orden alfabético |

**v2 (no schema v1):** `definition-lemma` (Definición ↔ palabra).

---

## 4. Contratos por `packKind`

Campos comunes de ítem:

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| `id` | sí | Estable: `{packShort}-{slug}` |
| `status` | no | `active` (default) \| `deprecated` |
| `notes` | no | Solo editorial / debug |
| `tags` | no | Extensible; no rompe schema |
| `difficulty` | sí (Palabras v1) | `1`–`4` · ver [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md) |

### 4.0 Lema en varios bancos

A diferencia de Ortografía, **no** hay propietario único de lema entre bancos Palabras.  
La misma forma (`grande`, `niño`…) puede figurar en Formar palabras, Relaciones, Campos, etc., si el objetivo pedagógico difiere.  
La identidad de fallo sigue siendo `packId` + `item.id` (no la cadena del lema sola).

### 4.1 `semantic-relation`

Un ítem = una relación entre dos palabras.

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `anchor` | sí | string | Palabra presentada |
| `target` | sí | string | Sinónimo o antónimo correcto |
| `relation` | sí | `synonym` \| `antonym` | Filtro de producto |
| `distractors` | sí | `string[]` | ≥2; **editoriales**; no inventar en adaptador |
| `difficulty` | sí | `1`–`4` | Progresión familia |
| `category` | no | string | Taxonomía corta (emociones, tamaño, escuela…) |
| `ruleText` | no | string | Pista pedagógica corta (sin revelar `target`) |

**Adaptadores:**

- Sinónimos: `items` donde `relation === 'synonym'` → MCQ (`anchor` + opciones = `target` + `distractors`).
- Antónimos: idem con `antonym`.

### 4.2 `morph-pair`

Un ítem = un par de formas.

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `formA` | sí | string | p. ej. singular o masculino |
| `formB` | sí | string | p. ej. plural o femenino |
| `axis` | sí | `number` \| `gender` | Filtro de producto |
| `promptSide` | sí | `a` \| `b` \| `either` | Qué lado se muestra; `either` = el adaptador elige |
| `distractors` | no | `string[]` | Si el modo MCQ lo necesita; si falta, el adaptador solo usa el par (2 opciones) **sin inventar** terceros |
| `note` | no | string | Irregularidad documentada |

**Adaptadores:**

- Singular/plural: `axis === 'number'`.
- Masculino/femenino: `axis === 'gender'`.

### 4.3 `word-family`

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `root` | sí | string | Raíz o palabra base |
| `members` | sí | `string[]` | ≥2 derivados/miembros |
| `intruders` | sí | `string[]` | ≥1; no pertenecen a la familia |
| `gloss` | no | string | Glosa corta editorial |

El adaptador construye MCQ o “elige los del grupo” **solo** con `members` + `intruders`.

### 4.4 `semantic-field`

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `field` | sí | string | Nombre del campo (p. ej. `colores`, `escuela`) |
| `fieldLabel` | no | string | Etiqueta UI si distinta del id |
| `members` | sí | `string[]` | 3–8 palabras del campo |
| `intruder` | sí | string | Una intrusa clara |
| `extraIntruders` | no | `string[]` | Reserva editorial para variantes de ronda |

Vistas del producto **Campo semántico**:

- “¿Cuál no pertenece?” → opciones = subset de `members` + `intruder`.
- “¿Cuáles son del campo X?” → selección entre `members` + distractores del propio ítem (`intruder` / `extraIntruders`).

### 4.5 `sentence-order`

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `tokens` | sí | `string[]` | Orden **correcto**; 5–9 tokens tipicamente |
| `surface` | no | string | Frase completa de referencia (puntuación) |
| `hint` | no | string | Pista sin revelar el orden completo |

Adaptador: baraja `tokens`, comprueba igualdad de secuencia.  
**No** generar tokens desde `surface` en runtime si `tokens` ya viene editorial.

### 4.6 `word-sort-list`

| Campo | Obligatorio | Tipo | Notas |
|-------|-------------|------|-------|
| `words` | sí | `string[]` | 4–6 palabras |
| `direction` | sí | `az` \| `za` | Default editorial `az` |

Adaptador: UI de ordenar; check lexicográfico según `direction` (locale `es`).  
Las palabras del array son el contenido; **no** sustituir por muestreo procedural de otro banco en v1.

---

## 5. Mapa archivo previsto

| MD | JSON | `packKind` |
|----|------|------------|
| `BANCO_RELACIONES_SEMANTICAS.md` | `feinetas/palabras/relaciones-semanticas.json` | `semantic-relation` |
| `BANCO_MORFOLOGIA.md` | `feinetas/palabras/morfologia.json` | `morph-pair` |
| `BANCO_FAMILIAS_LEXICAS.md` | `feinetas/palabras/familias.json` | `word-family` |
| `BANCO_CAMPOS_SEMANTICOS.md` | `feinetas/palabras/campos-semanticos.json` | `semantic-field` |
| `BANCO_ORACIONES.md` | `feinetas/palabras/oraciones.json` | `sentence-order` |
| `BANCO_LISTAS_DICCIONARIO.md` | `feinetas/palabras/listas-diccionario.json` | `word-sort-list` |
| — | `feinetas/formar-palabras.json` | *(legacy; no este schema)* |

---

## 6. Versionado

| Campo | Rol |
|-------|-----|
| `schemaVersion` | Formato (este documento). v1 = primer formato oficial Palabras |
| `pack.contentVersion` | Contenido del banco |

Reglas:

1. Rechazar `schemaVersion` mayor que la soportada.
2. Campos opcionales nuevos no suben `schemaVersion`.
3. Cambio incompatible de enum/`packKind` → `schemaVersion + 1`.
4. **No** crear JSON hasta MD aprobado y arquitectura cerrada.

---

## 7. Convenciones de conversión (cuando se autorice)

1. Un MD congelado → un JSON de banco.  
2. No inventar ítems, distractores, intrusos ni tokens.  
3. `id` estable ASCII; colisión → sufijo `-2`.  
4. Sinónimos y antónimos **en el mismo** archivo si comparten MD.  
5. Número y género **en el mismo** archivo morph.  
6. `revisionStatus`: `draft` → `approved` tras revisión; `frozen` alineado al MD.  
7. Tests de arquitectura futuras: un producto no debe importar un JSON “de otro producto”; solo bancos + filtros.

---

## 8. Relación con sistemas actuales

| Sistema | Relación |
|---------|----------|
| `formar-palabras.json` | Independiente en v1; producto de la familia sin este schema; lemas pueden solaparse (objetivo scramble ≠ semántica) |
| Ortografía `OrtographyLemmaPack` | Schema distinto; lema con **propietario único** (norma Ortografía, no Palabras) |
| `DataPack` / `McqPackItem` | El banco **no** es MCQ; el adaptador proyecta MCQ |
| Miss store v2 | `packId` + `itemId` + `minigameId` |
| Alphabet `order-words` | Candidato a deprecación/redirect hacia producto Orden alfabético (Integración) |
| [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md) | Dificultad y lema multi-banco |

---

## 9. Decisiones congelables con el MASTER

1. Bancos reutilizables; **no** un JSON por producto.  
2. `relation` / `axis` como filtros de producto sobre bancos compartidos.  
3. Distractores e intrusos **solo** editoriales.  
4. Formar palabras **fuera** de este schema en v1.  
5. `definition-lemma` **no** forma parte de schema v1 (producto v2).  
6. Campo semántico = `semantic-field`; la intrusa es vista, no banco aparte.  
7. Identidad de progreso: `packId` + `item.id`.  
8. `difficulty` 1–4 obligatorio en ítems Palabras v1 (PROGRESSION).  
9. Mismo lema permitido en varios bancos Palabras si el objetivo pedagógico es distinto.

---

## 10. Ejemplo ilustrativo (no contenido real)

```json
{
  "schemaVersion": 1,
  "pack": {
    "id": "palabras-relaciones-semanticas",
    "title": "Relaciones semánticas",
    "ownerBank": "BANCO_RELACIONES_SEMANTICAS.md",
    "packKind": "semantic-relation",
    "level": "3-primaria",
    "locale": "es-ES",
    "revisionStatus": "draft",
    "contentVersion": 1
  },
  "items": [
    {
      "id": "rel-alegre-contento",
      "anchor": "alegre",
      "target": "contento",
      "relation": "synonym",
      "distractors": ["triste", "alto"],
      "notes": "Ejemplo de formato; no usar como contenido aprobado"
    }
  ]
}
```

El ejemplo **no** es vocabulario aprobado. Solo muestra forma.

---

## 11. Criterio de éxito del formato

El formato es correcto si, **sin duplicar registros**:

1. Sinónimos y Antónimos leen el mismo JSON filtrando `relation`.  
2. Singular/plural y Masc/fem leen el mismo JSON morph filtrando `axis`.  
3. Campo semántico puede cambiar de vista (intrusa vs pertenencia) sin nuevo banco.  
4. Se pueden añadir productos futuros sobre un banco existente solo con adaptador.  
5. Fallos se registran con `packId` + `item.id` independientemente del minijuego.

Si un producto nuevo obliga a copiar ítems a otro archivo, el formato ha fallado.
