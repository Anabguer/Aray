# Especificación JSON — Ortografía (Fase piloto)

Documento de **diseño técnico**. No es un pack jugable.  
No convierte los bancos Markdown. No define contenido educativo nuevo.

**Estado de los bancos fuente (Fase Editorial Base — congelados):**

| Archivo editorial | Pack JSON previsto (futuro) |
|-------------------|-----------------------------|
| `ERRORES_REALES_H.md` | `feinetas/ortografia/h.json` |
| `ERRORES_REALES_BV.md` | `feinetas/ortografia/bv.json` |
| `ERRORES_REALES_GJ.md` | `feinetas/ortografia/gj.json` |
| `ERRORES_REALES_RR.md` | `feinetas/ortografia/rr.json` ← **piloto** |
| `ERRORES_REALES_LLY.md` | `feinetas/ortografia/lly.json` |
| `ERRORES_REALES_CZQU.md` | `feinetas/ortografia/czqu.json` |
| `ERRORES_REALES_MPMB.md` | `feinetas/ortografia/mpmb.json` |

Pendientes (no congelados): `ERRORES_REALES_TILDES.md`, `ERRORES_REALES_HAY_AHI_AY.md`, y temas futuros (-aba, bu/bur, gu/gü…).

---

## 1. Principio rector

Separar **dos capas**:

| Capa | Qué contiene | Quién la consume |
|------|----------------|------------------|
| **Banco de lemas** (este spec) | Palabra, errores reales, regla, metadatos editoriales | Todos los minijuegos de ortografía vía adaptadores |
| **Vista de mecánica** | Pregunta, opciones, hueco, scramble, frase… | Un minijuego concreto |

El JSON oficial de feinetas será **solo banco de lemas**.  
Los minijuegos **no** deben exigir campos como `hardIndex`, `opciones[4]`, `correctIndex` o `emoji` dentro del banco.

Así evitamos rehacer ~175–200 registros cuando aparezca un minijuego nuevo.

```
Markdown editorial (congelado)
        │
        ▼
  Pack JSON de lemas  ←── schemaVersion (este documento)
        │
        ├── adaptador MCQ / correcta
        ├── adaptador letra que falta
        ├── adaptador imagen y palabra
        ├── adaptador la intrusa
        ├── adaptador ordenar letras
        └── futuros modos…
```

---

## 2. Estructura de un pack

Un archivo = **un banco propietario** (misma frontera que el Markdown).

```
OrtographyLemmaPack
├── schemaVersion
├── pack (metadatos del banco)
└── lemmas[]  (registros)
```

### 2.1 Metadatos del pack (`pack`)

| Campo | Obligatorio | Tipo | Descripción |
|-------|-------------|------|-------------|
| `id` | sí | string | Id estable del pack, p. ej. `ortografia-mpmb` |
| `title` | sí | string | Nombre humano, p. ej. `MP / MB / NV` |
| `ownerBank` | sí | string | Nombre del MD fuente, p. ej. `ERRORES_REALES_MPMB.md` |
| `ruleFamily` | sí | string | Familia de regla (ver §5) |
| `level` | sí | string | Nivel curricular, p. ej. `3-primaria` |
| `locale` | sí | string | `es-ES` (castellano) |
| `revisionStatus` | sí | enum | `draft` \| `approved` \| `frozen` |
| `contentVersion` | sí | number | Versión del **contenido** (sube al editar lemas) |
| `sourceEditorialPhase` | no | string | P. ej. `fase-editorial-base` |
| `notes` | no | string | Notas de pack (no por lema) |

### 2.2 Raíz del archivo

| Campo | Obligatorio | Tipo | Descripción |
|-------|-------------|------|-------------|
| `schemaVersion` | sí | number | Versión del **formato** (este spec). Empieza en `1` |
| `pack` | sí | object | Metadatos (§2.1) |
| `lemmas` | sí | array | Lista de registros (§3) |

---

## 3. Estructura de un registro (`lemma`)

Cada elemento de `lemmas` representa **una palabra correcta** del banco editorial.

### 3.1 Campos obligatorios

| Campo JSON | Origen editorial | Tipo | Notas |
|------------|------------------|------|--------|
| `id` | (derivado) | string | Id estable único en el pack. Formato: `{packShort}-{lemmaSlug}` p. ej. `mpmb-tambien` |
| `lemma` | Correcta | string | Forma ortográfica correcta, minúsculas salvo nombres (no habrá nombres en estos bancos) |
| `errors` | Error frecuente 1 / 2 | `string[]` | 1–N errores reales. Vacío **prohibido** en packs `approved`/`frozen`. Si Error 2 vacío en MD → array de un solo elemento |
| `ruleId` | (mapeo de banco) | string | Id de regla consumible por app (ver §5). Un lema → una regla propietaria |
| `ruleText` | Regla | string | Texto pedagógico corto del MD |
| `frequency` | Frecuencia | enum | `muy_frecuente` \| `frecuente` \| `poco_frecuente` |
| `category` | Categoría | enum | Taxonomía cerrada (§6) |
| `image` | Imagen recomendable | object | Ver §4.5 |

### 3.2 Campos opcionales

| Campo JSON | Origen / uso | Tipo | Notas |
|------------|--------------|------|--------|
| `tip` | Pista corta para UI | string | Si falta, el adaptador puede usar `ruleText` o tip genérico por `ruleId` |
| `notes` | Observaciones | string | Solo editorial / depuración; **no** mostrar al alumno por defecto |
| `tags` | Etiquetas futuras | `string[]` | Extensible sin romper schema (ver §7) |
| `difficulty` | Dificultad derivada o editorial | number `1`–`4` | Opcional en v1; ver §4.8 |
| `secondaryRuleIds` | Cruces documentados | `string[]` | P. ej. tilde en *también*; **no** duplica el lema en otro pack |
| `status` | Ciclo de vida del ítem | enum | `active` (default) \| `deprecated` |
| `legacyWordKey` | Compatibilidad | string | Si hace falta mapear al `word` del SPELL_BANK legacy |

---

## 4. Representación campo a campo

### 4.1 Palabra correcta

```text
"lemma": "tambor"
```

- Una sola forma canónica.
- Sin artículos (`el tambor` ✗).
- Identidad pedagógica = `lemma`; identidad técnica = `id`.

### 4.2 Errores

```text
"errors": ["tanbor"]
```

- Solo errores **infantiles reales** del MD.
- Orden: el más frecuente primero (= Error frecuente 1).
- Error frecuente 2 vacío en MD → no inventar segundo error en la conversión.
- Los adaptadores MCQ pueden **completar** distractores algorítmicos **solo** si el modo lo exige y **sin** persistirlos en el pack (derivados en runtime).

### 4.3 Regla

Dos representaciones complementarias:

| Campo | Rol |
|-------|-----|
| `ruleId` | Filtrado, progreso, miss-store, rivalidad entre ítems |
| `ruleText` | Explicación al alumno (texto del MD) |

No sustituir `ruleText` por plantillas genéricas del código si el MD ya trae texto específico.

### 4.4 Categoría

```text
"category": "objetos"
```

Enum cerrado (slug ASCII), mapeo desde MD:

| MD | JSON |
|----|------|
| Animales | `animales` |
| Casa | `casa` |
| Colegio | `colegio` |
| Comida | `comida` |
| Objetos | `objetos` |
| Naturaleza | `naturaleza` |
| Acciones | `acciones` |
| Ciudad | `ciudad` |
| Cuerpo | `cuerpo` |
| Otros | `otros` |

No crear categorías nuevas en la conversión sin decisión editorial.

### 4.5 Frecuencia

| MD | JSON |
|----|------|
| Muy frecuente | `muy_frecuente` |
| Frecuente | `frecuente` |
| Poco frecuente | `poco_frecuente` |

Uso previsto: ponderación de muestreo en rondas, no dificultad automática obligatoria.

### 4.6 Imagen

El MD solo dice Sí/No. El pack no debe acoplarse a emoji ni a un asset concreto aún inexistente.

```text
"image": {
  "recommended": true,
  "ref": null
}
```

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `recommended` | sí | `true` si MD = Sí; `false` si No |
| `ref` | no | Id/ruta futura de asset (`null` mientras no haya ilustraciones) |
| `emoji` | no | **Deprecated-ready**: no preferido; solo puente temporal con legacy `picture` |

Los modos “imagen y palabra” deben:

1. Preferir `image.ref` si existe.
2. Si no, y `recommended === true`, usar placeholder / emoji de familia de regla (lógica del adaptador, no del pack).
3. Si `recommended === false`, ese lema **no** entra en pools de modo imagen (o entra con fallback explícito documentado en el adaptador).

### 4.7 Pistas (`tip`)

Campo **opcional**. Reglas oficiales:

1. Nunca revelar la respuesta.
2. Nunca contener el lema correcto.
3. Recordar únicamente la regla ortográfica.
4. Si no existe una pista útil → **omitir** el campo (no enviar `""`).

Prioridad si hace falta pista en UI y no hay `tip`:

| Prioridad | Fuente |
|-----------|--------|
| 1 | `tip` (si existe) |
| 2 | Tip genérico por `ruleId` en el adaptador (sin citar el lema) |

`ruleText` puede usarse como `tip` **solo** si no contiene el lema.  
`notes` (Observaciones) **no** es pista para el alumno.

### 4.8 Dificultad

En v1 del schema:

- **No obligatoria.**
- Si se incluye, escala `1`–`4` alineada con `formar-palabras.json`.
- Derivación sugerida (adaptador o pipeline de conversión, no inventar en MD):

| frequency | difficulty sugerida |
|-----------|---------------------|
| `muy_frecuente` | 1 |
| `frecuente` | 2 |
| `poco_frecuente` | 3 |

Subir a 4 solo con criterio editorial explícito (palabra larga, cruce de reglas, etc.).

### 4.9 Observaciones

```text
"notes": "ANAYA refuerzo; lista mb…"
```

Solo trazabilidad. Excluir del HUD del juego salvo modo debug interno.

### 4.10 Etiquetas futuras (`tags`)

Array abierto de strings cortos. Ejemplos reservados (no obligatorios en v1):

| Tag | Uso posible |
|-----|-------------|
| `calendario` | noviembre, meses |
| `infinitivo` | verbos en infinitivo |
| `tilde` | lema con tilde (foco ortográfico sigue siendo el pack) |
| `homofono` | cruce documentado |
| `piloto` | subset del piloto |

Los minijuegos **ignoran** tags desconocidos. Añadir tags **no** requiere subir `schemaVersion`.

---

## 5. Familias de regla (`ruleFamily` / `ruleId`)

Mapeo estable MD → ids de app (compatibles con el espíritu de `SpellRuleId` actual, sin acoplar 1:1 a cada archivo legacy):

| Pack / MD | `ruleFamily` | `ruleId` por defecto de sus lemas |
|-----------|--------------|-----------------------------------|
| H | `h` | `h` (subtipos opcionales vía tags: `hie-hue`, `hacer-echar`, …) |
| BV | `b-v` | `b-v` |
| GJ | `g-j` | `g-j` |
| RR | `r-rr` | `r-rr` |
| LL/Y | `ll-y` | `ll-y` |
| C/Z/QU | `c-z-qu` | `c-z-qu` |
| MP/MB/NV | `mb-mp-nv` | `mb-mp-nv` |
| HAY/AHÍ/AY (futuro) | `hay-ahi-ay` | `hay-ahi-ay` |
| TILDES (futuro) | `tilde` | `tilde` |

**Decisión:** en v1, un lema lleva **un** `ruleId` propietario (= banco).  
Matices (hacer/echar dentro de H, soft-r dentro de RR) van en `tags` o, si hiciera falta más adelante, en `secondaryRuleIds` — **sin** partir el lema en dos packs.

Puente legacy: tabla de equivalencias en código (`mb-mp-nv` ↔ `mb-mp`, `ll-y` ↔ `ll-illa`, etc.) hasta retirar `lemmas.generated.ts`.

---

## 6. Compatibilidad con futuros minijuegos

### 6.1 Qué NO va en el JSON de lemas

- `opciones`, `correctIndex`, `enunciado`
- `hardIndex` / máscara de hueco
- `distractors` algorítmicos de relleno
- `mecanica`, `drag_drop`, timings de UI
- Frases de contexto completas (irán en packs de **contextos** aparte, si se reactivan)

### 6.2 Adaptadores (responsabilidad del código)

| Modo / mecánica | Entrada del banco | Derivado en adaptador |
|-----------------|-------------------|------------------------|
| Elige la correcta (MCQ) | `lemma` + `errors` | Completar hasta N opciones si hace falta |
| Letra que falta | `lemma` + `ruleId` | Calcular índice/graphema a ocultar |
| Imagen y palabra | `lemma` + `image` | Resolver asset / fallback |
| La intrusa | varios `lemma` misma `category`/`ruleId` | Elegir rival |
| Ordenar letras | `lemma` | Scramble |
| Formar palabras (futuro unificado) | `lemma` + `category` | Mapear a `grupo` UI |

### 6.3 Identidad para fallos / progreso

Usar siempre:

```text
packId + lemma.id
```

No usar solo la cadena `lemma` (homógrafos futuros / packs distintos).

Alineado con el plan miss-store v2 (`packId` + `itemId` + `minigameId`).

### 6.4 Extensión sin romper JSON

1. Campos nuevos **opcionales** → no rompen lectores v1.
2. `tags` nuevos → libres.
3. Cambio incompatible → subir `schemaVersion` y documentar migración en este archivo.
4. `pack.contentVersion` sube cuando cambia el contenido; `schemaVersion` solo cuando cambia el formato.

---

## 7. Versionado (`schemaVersion`)

| Valor | Significado |
|-------|-------------|
| `1` | Primer formato oficial (este documento) |

Reglas:

1. Lectores deben rechazar packs con `schemaVersion` mayor que la soportada.
2. Lectores pueden aceptar menor si hay migración explícita.
3. **No** reutilizar `pack.version` ambiguo: se llama `contentVersion` a propósito.
4. Cualquier renombre de campo obligatorio o cambio de enum → `schemaVersion + 1`.

---

## 8. Qué podría sobrar / faltar

### 8.1 Candidatos a sobrar (no meter en v1)

| Tentación | Motivo para excluir |
|-----------|---------------------|
| `emoji` obligatorio | Acopla a un solo modo visual |
| `hardIndex` | Solo “letra que falta” |
| `letras` / `length` | Redundante con `lemma` |
| `distractors` fijos a 3 | Impone MCQ de 4 opciones |
| `grupo` estilo formar-palabras | Taxonomía distinta; mapear desde `category` |
| `observaciones` como tip | Contamina la UI |
| Mezclar `mecanica` en el pack de lemas | Impide reutilizar el banco |

### 8.2 Candidatos a faltar (valorar en piloto)

| Campo | Por qué podría hacer falta |
|-------|----------------------------|
| `tip` editorial explícito | Si `ruleText` es demasiado seco o largo |
| `graphemeTargets` | Lista de grafemas “calientes” para missing (alternativa a hardIndex mágico) |
| Pack de **contextos** separado | Frases tipo modo `complete` |
| `audioRef` | Dictado futuro |
| `image.ref` reales | Cuando existan assets |
| `lemmaDisplay` | Si alguna vez se muestra capitalización distinta |

Decisión v1: **no** añadir `graphemeTargets` ni contextos hasta que el piloto lo pida con evidencia.

---

## 9. Convenciones de conversión (cuando se autorice)

1. Un MD congelado → un JSON.
2. No inventar errores, lemas ni categorías.
3. `id` estable: slug ASCII del lemma (`también` → `tambien`); si hubiera colisión, sufijo `-2` (no debería ocurrir: propietario único).
4. Error 2 vacío → omitir.
5. `revisionStatus`: piloto = `draft` o `approved`; tras validación en juego = `frozen` alineado al MD.
9. Conversión piloto: `feinetas/ortografia/rr.json` desde `ERRORES_REALES_RR.md`.
10. No conectar el JSON a minijuegos hasta validar el pack y sus tests.

---

## 10. Relación con sistemas actuales

| Sistema actual | Relación con este spec |
|----------------|------------------------|
| `SpellLemma` / `SPELL_BANK` | Legacy; puente por `ruleId` + `legacyWordKey` hasta apagado |
| `DataPack` / `McqPackItem` | El pack de lemas **no** es un `McqPackItem`; el adaptador MCQ **genera** ítems MCQ |
| `formar-palabras.json` | Sigue siendo pack de mecánica propia hasta unificación futura por `category`/`tags` |
| Markdown editorial | Fuente de verdad humana; JSON es proyección aprobada |

---

## 11. Decisiones tomadas

1. **Banco de lemas ≠ pack de mecánica.**
2. **`schemaVersion` + `contentVersion`** separados.
3. **Errores reales del MD** son fuente primaria; distractores algorítmicos solo en adaptadores.
4. **Un lema / un `ruleId` propietario**; cruces en `tags` / `secondaryRuleIds`.
5. **Imagen** como `{ recommended, ref? }`, no emoji obligatorio.
6. **Piloto oficial:** convertir primero RR → `feinetas/ortografia/rr.json`; no convertir los otros bancos hasta validar el piloto.
7. **`tags` abiertos** para no reventar el schema.
8. **Identidad de progreso:** `packId` + `lemma.id`.
9. Bancos MD de la Fase Editorial Base permanecen **congelados**; el JSON se deriva, no se reedita el MD salvo error editorial grave en pruebas.
10. Este documento (`JSON_SPEC.md`) queda **congelado** hasta cerrar el piloto RR.

---

## 12. Decisiones oficiales (congeladas — piloto RR)

Este spec queda **congelado** hasta terminar el piloto RR. No reabrir debates de formato.

| # | Decisión |
|---|----------|
| 1 | **Pack piloto** = `ERRORES_REALES_RR.md` → `feinetas/ortografia/rr.json`. MP/MB descartado como piloto. |
| 2 | **`tip` opcional.** Nunca revelar la respuesta; nunca contener el lema correcto; solo recordar la regla; si no hay pista útil, omitir el campo. |
| 3 | **Sin subtipos obligatorios.** Solo `ruleId` + `tags` (p. ej. en H: `h-inicial`, `hie-hue`, `hacer-echar`, `haber-hablar`). |
| 4 | **Tildes:** un propietario; cruces con `secondaryRuleIds` + `tags`; nunca duplicar registros. |
| 5 | **Imágenes piloto RR:** `image.recommended` según MD; `image.ref` = `null`. Sin assets. |
| 6 | **Formar palabras** no se migra; independiente; solo comparte `schemaVersion` / `contentVersion` / ids estables. |
| 7 | **Ubicación:** `feinetas/ortografia/*.json` (no `packs/`). |

---

## 13. Ejemplo (pack piloto RR)

Referencia: `feinetas/ortografia/rr.json` (archivo real del piloto).

```json
{
  "schemaVersion": 1,
  "pack": {
    "id": "ortografia-rr",
    "title": "R / RR",
    "ownerBank": "ERRORES_REALES_RR.md",
    "ruleFamily": "r-rr",
    "level": "3-primaria",
    "locale": "es-ES",
    "revisionStatus": "draft",
    "contentVersion": 1
  },
  "lemmas": [
    {
      "id": "rr-perro",
      "lemma": "perro",
      "errors": ["pero"],
      "ruleId": "r-rr",
      "ruleText": "Entre vocales, el sonido fuerte de la r se escribe rr.",
      "frequency": "muy_frecuente",
      "category": "animales",
      "image": { "recommended": true, "ref": null },
      "tip": "Entre vocales, el sonido fuerte de la r se escribe rr.",
      "tags": ["rr-entre-vocales"]
    }
  ]
}
```

---

## 14. Criterio de éxito del formato

El formato es correcto si, sin tocar los JSON de lemas, se puede:

1. Alimentar los modos actuales de Ortografía vía adaptadores.
2. Añadir “ordenar letras” u otro modo nuevo.
3. Filtrar por `frequency` / `category` / `tags`.
4. Registrar fallos con `packId` + `lemma.id`.
5. Incorporar TILDES / HAY-AHÍ-AY como packs nuevos con el mismo schema.

Si alguna de esas cinco cosas obliga a reeditar masivamente los ~200 registros, el formato ha fallado y hay que subir `schemaVersion` **antes** de convertir el resto de bancos.
