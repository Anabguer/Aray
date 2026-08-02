# Especificación JSON — Inglés (vocabulario)

Documento de **diseño técnico**. No es un pack jugable.  
Hermano de [`JSON_SPEC.md`](./JSON_SPEC.md) (Ortografía): mismo patrón **banco de lemas ≠ vista de mecánica**.

**Estado:** schemaVersion **1** · packs congelados Colours & Numbers · School · Family.  
**Actualizado:** 2026-08-02.

---

## 1. Principio rector

| Capa | Qué contiene | Quién la consume |
|------|----------------|------------------|
| **Banco de lemas** (este spec) | lemma EN, glosa ES, categoría, frecuencia, imagen, notes | Adaptadores de minijuegos inglés |
| **Vista de mecánica** | Pregunta, opciones, distractores, hueco… | Un minijuego concreto |

El JSON oficial es **solo banco de lemas**.  
**No** incluye: `errors[]`, `ruleId`, `ruleText`, `opciones`, `correctIndex`, enunciados de UI ni distractores.

```
Markdown editorial (congelado)
        │
        ▼
  Pack JSON de lemas  ←── schemaVersion (este documento)
        │
        ├── adaptador meaning (¿Qué significa?)
        ├── adaptador translate (¿Cómo se dice?)
        ├── adaptador intrusa
        ├── adaptador letra que falta
        ├── adaptador mezcla
        └── adaptador mis fallos
```

---

## 2. Estructura de un pack

```
EnglishLemmaPack
├── schemaVersion
├── pack (metadatos)
└── lemmas[]
```

### 2.1 Metadatos (`pack`)

| Campo | Obligatorio | Tipo | Descripción |
|-------|-------------|------|-------------|
| `id` | sí | string | Id estable, p. ej. `ingles-school` |
| `title` | sí | string | Nombre humano, p. ej. `School` |
| `ownerBank` | sí | string | MD fuente, p. ej. `INGLES_SCHOOL.md` |
| `topicFamily` | sí | string | Familia temática, p. ej. `school` |
| `level` | sí | string | `3-primaria` |
| `locale` | sí | string | **`en-GB`** |
| `revisionStatus` | sí | enum | `draft` \| `approved` \| `frozen` |
| `contentVersion` | sí | number | Sube al editar lemas |
| `sourceEditorialPhase` | no | string | p. ej. `ingles-editorial-v1` |
| `notes` | no | string | Notas de pack |

### 2.2 Raíz

| Campo | Obligatorio | Tipo |
|-------|-------------|------|
| `schemaVersion` | sí | number (`1`) |
| `pack` | sí | object |
| `lemmas` | sí | array |

---

## 3. Registro (`lemma`)

### 3.1 Obligatorios

| Campo | Origen editorial | Tipo | Notas |
|-------|------------------|------|--------|
| `id` | derivado | string | `{packShort}-{lemmaSlug}` p. ej. `school-pencil-case` |
| `lemma` | Inglés | string | Forma en-GB |
| `glossEs` | Glosa | string | **Una** forma principal en español |
| `category` | Categoría | string | Taxonomía del pack (ver §5) |
| `frequency` | Frecuencia | enum | `muy_frecuente` \| `frecuente` \| `poco_frecuente` |
| `image` | Imagen recomendable | object | `{ recommended: boolean, ref: string \| null }` |

### 3.2 Opcionales

| Campo | Tipo | Notas |
|-------|------|--------|
| `notes` | string | Observaciones editoriales; no mostrar al alumno por defecto |
| `tags` | `string[]` | Extensible |
| `status` | enum | `active` (default) \| `deprecated` |

### 3.3 Qué NO va en el lema

- `errors`, `ruleId`, `ruleText` (Ortografía)
- Distractores / opciones de MCQ
- `audio.ref` en v1 (fase posterior)
- Campos de UI

---

## 4. Frecuencia

| Editorial MD | JSON |
|--------------|------|
| Muy frecuente | `muy_frecuente` |
| Frecuente | `frecuente` |
| Menos frecuente / Poco frecuente | `poco_frecuente` |

---

## 5. Categorías por pack (v1)

| Pack `id` | Categorías permitidas |
|-----------|------------------------|
| `ingles-colours-numbers` | `Colours`, `Numbers` |
| `ingles-school` | `Places`, `People`, `Objects` |
| `ingles-family` | `Family group`, `Core family`, `Extended family` |

Packs futuros añadirán su propio conjunto cerrado en el validador.

---

## 6. Identidad y mis fallos

```text
missKey = packId + ':' + lemma.id
```

Persistir también el **modo** fallado (`meaning` \| `translate` \| `intruder` \| `missing` \| …) para reconstruir la misma mecánica.  
Store: local (`afk.english.misses.v1.{playerId}`). Sin sync entre dispositivos en v1.  
Clear tras **3** aciertos seguidos sin nuevo fallo.

---

## 7. Imagen

- `image.recommended` refleja el MD (Sí/No).
- `image.ref` = `null` hasta assets reales.
- **No** hay modo Imagen en la UI mientras `ref` sea null.

---

## 8. Archivos previstos

| MD editorial | JSON |
|--------------|------|
| `INGLES_COLOURS_NUMBERS.md` | `feinetas/ingles/colours-numbers.json` |
| `INGLES_SCHOOL.md` | `feinetas/ingles/school.json` |
| `INGLES_FAMILY.md` | `feinetas/ingles/family.json` |

---

## 9. Mecánicas (fuera del banco)

Los adaptadores generan opciones:

| Modo | UI | Comportamiento |
|------|-----|----------------|
| `meaning` | ¿Qué significa? | EN → opciones ES (`glossEs`) |
| `translate` | ¿Cómo se dice? | ES → opciones EN (`lemma`) |
| `intruder` | Palabra intrusa | 3 de una categoría + 1 de otra **del mismo pack** |
| `missing` | Letra que falta | Hueco en `lemma` EN |
| `mix` | Mezcla | Subconjunto de modos anteriores |
| `review` | Mis fallos | Solo con fallos pendientes del pack |

Sin: Imagen, frases, listening, phonics, audio.
