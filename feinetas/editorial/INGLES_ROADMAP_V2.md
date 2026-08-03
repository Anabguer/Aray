# Inglés — Roadmap v2 (vocabulario · imágenes · frases)

**Estado:** plan técnico + editorial · **sin JSON nuevo** · **sin bancos nuevos** · **sin cambios de juego**.  
**Actualizado:** 2026-08-03.  
**Complementa:** [`INGLES_MASTER.md`](./INGLES_MASTER.md) · [`INGLES_JSON_SPEC.md`](./INGLES_JSON_SPEC.md) · [`EDITORIAL_STATUS.md`](./EDITORIAL_STATUS.md).  
**No es runtime.** Flujo: [`README.md`](./README.md).

---

## 1. Estado actual

| Capa | Qué hay hoy |
|------|-------------|
| Editorial congelado | Colours & Numbers (30) · School (26) · Family (18) = **74** lemas |
| JSON | `feinetas/Ingles/{colours-numbers,school,family}.json` · `schemaVersion: 1` |
| Contrato lema | `id` · `lemma` (en-GB) · `glossEs` · `category` · `frequency` · `image: { recommended, ref }` |
| Imágenes | Campo listo; **todos** los `image.ref = null` · modos Imagen **desactivados** |
| Juego | Hub Inglés · packs School + Family en UI de repaso · modos: meaning · translate · intruder · missing · mix · review |
| Fuera de v1 | Audio · phonics · listening · CLIL · frases · match imagen |

**Fuentes ya usadas / disponibles en el repo (no inventar fuera de ellas):**

| Fuente | Rol |
|--------|-----|
| Vicens Vives `angles_mating3` (+ BEX `03_angles.md`) | Temas y estructuras (school, home, family, animals/can, food/clothes/actions, *there is*, *I like*) |
| Cuaderno verano inglés 3 EP | Colores, días, cara/cuerpo, word banks cortos |
| Wonder 3 TRB (apoyo) | Food, animals, feelings — **no** fuente principal de listados |
| `feinetas/Ingles/*.pdf` (si presentes) | Revisión visual de mesa |
| Decret 175/2022 · temario ciclo medio | Calibrado de nivel |

**No** esperar libros nuevos. **No** mating8/11 (CLIL).

---

## 2. Objetivo final (v2)

Módulo Inglés **sólido** para 3.º (Cataluña), offline-first:

1. **Vocabulario:** ~**300–500** lemas en-GB con glosa ES única, solo con respaldo de fuentes del repo. Calidad > cupo.
2. **Imágenes:** cada lema jugable **puede** llevar imagen; mecánicas imagen↔palabra cuando el asset esté aprobado.
3. **Frases:** frases muy cortas **editoriales** (no generadas en runtime) construidas **solo** con lemas ya congelados + plantillas gramaticales respaldadas por fuentes.

Fuera de este objetivo: listening, phonics, speak, diálogos largos, generación libre de frases, vocabulario inventado.

---

## 3. Roadmap por fases

```
Fase A — Vocabulario offline (bancos MD → JSON → hub)
Fase B — Arquitectura + assets de imagen (contrato cerrado → piloto → cobertura)
Fase C — Frases editoriales (schema → bloques → mecánicas frase)
Fase D — Audio / phonics / listening   ← fuera de v2; solo se menciona
```

Orden **duro:** no abrir frases de un bloque hasta que sus lemas prerequisito estén **frozen**.  
Imágenes pueden ir **en paralelo** a vocabularios (piloto sobre packs ya frozen), pero no bloquean congelar un banco MD.

| Fase | Entregable | Criterio de cierre |
|------|------------|--------------------|
| **A0** | Este roadmap aprobado | Decisiones §10 cerradas |
| **A1** | Packs imprescindibles MD → frozen → JSON | Body, Food, Clothes, Animals, Home, Days, (+ Actions si se aprueba) |
| **A2** | Packs secundarios + Me-chunks | Feelings, Weather (si cabe), Me & useful phrases |
| **B0** | Contrato imagen + carpeta + naming + licencia | Spec actualizado; 0 assets aún OK |
| **B1** | Piloto imágenes (1 pack frozen, p. ej. Colours o School) | `ref` reales + mecánicas imagen en hub piloto |
| **B2** | Cobertura imagen packs A1 | Fallback documentado; auditoría visual |
| **C0** | Schema frases + checklist editorial | Sin frases escritas aún |
| **C1** | Bloques frase 1–3 (prerequisitos OK) | JSON frases + 1–2 mecánicas |
| **C2** | Resto de bloques frase | Mix / Mis fallos frase |

---

## 4. Packs de vocabulario propuestos

### 4.1 Ya hechos (no reabrir sin producto)

| Pack `id` | Lemas | Notas |
|-----------|------:|-------|
| `ingles-colours-numbers` | 30 | Colores + 1–20 · frozen |
| `ingles-school` | 26 | Places / People / Objects · frozen |
| `ingles-family` | 18 | Core / extended · frozen |
| **Subtotal** | **74** | |

### 4.2 Decisión por candidato (fuentes → keep / merge / drop)

| Candidato | Evidencia en repo | Decisión v2 | Prioridad | Tamaño orientativo | Notas |
|-----------|-------------------|-------------|-----------|--------------------:|-------|
| **Body** | Cuaderno (cara/ojos/nariz…); Vicens (knees/sport) | **Imprescindible** | Alta | 14–24 | Cara + cuerpo cotidiano; sin anatomía escolar |
| **Food** | Wonder food; Vicens classify food; *I like* | **Imprescindible** | Alta | 28–40 | Lemas + chunks cortos del pack |
| **Clothes** | Vicens (sweater, jeans, jacket…) | **Imprescindible** | Alta | 18–30 | Ropa cotidiana; invierno básico si sale en ficha |
| **Animals** | Vicens animals + *I can* | **Imprescindible** | Alta | 22–36 | Pets/farm/wild **solo** si aparecen; *can* como chunks del pack |
| **Home** | Vicens living room / house / *there is* / prep. | **Imprescindible** | Alta | 24–38 | Habitaciones + objetos; prep. *in/on/under* como lemas o tags |
| **Time & Days** | Cuaderno days of week | **Imprescindible** | Media | 12–18 | 7 días + estaciones si hay evidencia; **sin** hora hablada |
| **Actions básicas** | Vicens “actions” + swimming/flying/jumping; daily routines | **Imprescindible (pack propio)** | Alta | 16–28 | Verbos de acción cotidianos **en forma base** o -ing según ficha; no conjugación libre |
| **Me & chunks** | Vicens/BEX: age, *I like*, presentaciones | **Imprescindible** | Alta | 16–28 | Casi todo **chunks fijos**; no lemas sueltos inventados |
| **Feelings** | Wonder (apoyo); descripción | **Secundario** | Media | 14–24 | Tras Body/Clothes; no inflar con lista típica |
| **Weather** | Evidencia débil/parcial en extracciones actuales | **Secundario / condicional** | Baja | 8–14 | Solo si auditoría visual de PDF/cuaderno lo respalda; si no → **descartar** |
| **Transport** | Escasa en mating3 / cuaderno | **Descartar v2** | — | — | Reabrir solo con fuente clara |
| **Nature** | Taxonomy científica Vicens (viviparous…) | **Descartar** | — | — | CLIL / ciencia; fuera de alcance |
| **Sports** | Menciones sueltas (football, basketball) | **No pack propio** | — | — | Absorber 2–4 lemas en **Actions** o **Home/leisure** si hay evidencia |
| **Toys** | No consolidado en extracciones | **Descartar v2** | — | — | Reabrir con fuente |
| **City** | Solo contraste city/country house | **Descartar** | — | — | No hay word bank de ciudad |
| **Jobs** | People de school ya cubre teacher… | **Descartar pack** | — | — | Nuevos oficios solo si salen en ficha → School/People |

### 4.3 Índice v2 (packs a construir)

| # | Pack `id` | Nombre | Prioridad | Lemas orient. | Depende de (pedagógico) |
|---|-----------|--------|-----------|--------------:|-------------------------|
| 4 | `ingles-body` | Body & face | Alta | 14–24 | — |
| 5 | `ingles-food` | Food | Alta | 28–40 | Colours útil, no bloqueante |
| 6 | `ingles-actions` | Actions | Alta | 16–28 | — |
| 7 | `ingles-clothes` | Clothes | Alta | 18–30 | Body recomendable |
| 8 | `ingles-animals` | Animals & can | Alta | 22–36 | Actions útil para *can* |
| 9 | `ingles-home` | Home | Alta | 24–38 | School opcional |
| 10 | `ingles-time-days` | Days & seasons | Media | 12–18 | — |
| 11 | `ingles-me-chunks` | Me & useful phrases | Alta | 16–28 | Family + Colours + School recomendados |
| 12 | `ingles-feelings` | Feelings & looks | Media | 14–24 | Body + Clothes |
| 13 | `ingles-weather` | Weather | Baja / condicional | 8–14 | — |

**Phonics / Listening:** siguen **aplazados** (Fase D). No cuentan para el cupo 300–500 offline.

### 4.4 Totales orientativos

| Escenario | Lemas (aprox.) |
|-----------|----------------|
| Actual | 74 |
| + imprescindibles A1 (Body…Home + Actions + Days) | ~74 + 130–210 ≈ **200–280** |
| + Me-chunks + Feelings (+ Weather si entra) | ≈ **230–340** |
| Techo sano sin inventar | **~300–380** |
| Cupo 500 | **Solo** si fuentes reales lo permiten; **no** rellenar |

Si al auditar fuentes el techo real queda bajo 300, **se acepta**: calidad > número. El “300–500” es brújula, no KPI obligatorio.

### 4.5 Orden de desarrollo editorial (Markdown)

| Paso | Pack | Motivo |
|-----:|------|--------|
| 1 | Body | Banco visual corto; cuaderno claro |
| 2 | Food | Alto enganche; *I like* |
| 3 | Actions | Desbloquea *can* / rutinas / frases |
| 4 | Clothes | Descripción |
| 5 | Animals | + chunks *I can* |
| 6 | Home | *there is/are* + prep. |
| 7 | Time & Days | Banco pequeño, cerrado |
| 8 | Me & chunks | Cierra “puedo presentarme” |
| 9 | Feelings | Cierra ola secundaria |
| 10 | Weather | Solo si auditoría de fuente OK |

Misma metodología que packs 1–3: borrador → auditoría → congelado → JSON.

### 4.6 Reglas de propiedad (sin cambio)

- Una palabra EN-GB = **un pack propietario** (salvo chunks vs lema: chunk en Me-chunks, lema en su tema).
- Variantes distintas (*mum* / *mother*) = lemas distintos si ambas están trabajadas.
- No colar verbos en Food ni colores en Body.

---

## 5. Arquitectura de imágenes

### 5.1 Objetivo de producto

Cada lema con `image.recommended: true` debe poder tener un asset aprobado.  
Los modos **Imagen → palabra** y **Palabra → imagen** solo se activan si `image.ref` apunta a un archivo existente y validado.

### 5.2 Contrato (extensión de schema; diseño)

Mantener `schemaVersion: 1` compatibles; ampliar el objeto `image` en una **revisión de spec** (sin romper packs frozen: `ref` sigue permitiendo `null`).

```text
image: {
  recommended: boolean,     // ya existe
  ref: string | null,       // id lógico estable, no URL absoluta
  alt?: string,             // accesible; default = glossEs o "lemma — glossEs"
  kind?: "object" | "icon" | "scene" | "composition",
  license?: string,         // código corto: aray-own | cc0 | paid-pack-X
  sourceNote?: string       // editorial; no UI
}
```

**`image.ref` (naming estable):**

```text
en/{topicFamily}/{lemmaSlug}
```

Ejemplos: `en/colours-numbers/red` · `en/school/pencil-case` · `en/family/mum`

- Sin extensión en el `ref` (la resolución añade `.webp` o `.png` en código).
- Slug = mismo que en `lemma.id` tras el prefijo de pack.
- **Un ref = un archivo** en el catálogo de assets.

### 5.3 Archivos y carpeta

| Decisión propuesta | Valor |
|--------------------|--------|
| Carpeta canónica | `src/assets/english/lemmas/` (import Vite, como `modes/`) **o** `public/assets/english/lemmas/` si se prefiere URL estática |
| Formato | **WebP** preferido; PNG aceptado si transparencia compleja |
| Tamaño | Lienzo **512×512** (o 1024×1024 fuente → export 512) |
| Fondo | **Transparente** para objetos/iconos; escena puede ser fondo oscuro sólido estilo hub |
| Peso objetivo | &lt; 150 KB por asset (ideal &lt; 80 KB) |
| Manifest opcional | `feinetas/ingles/_image-manifest.json` (ref → archivo, license, auditStatus) — fase B0 |

**Reutilización sin duplicar archivo:** varios lemas **no** comparten el mismo concepto visual distinto; si dos lemas son el mismo referente visual improbable. Si un pack necesita la misma ilustración (raro), **mismo `ref`** apunta al mismo archivo — no copiar PNG.

### 5.4 Fallback

| Situación | Comportamiento |
|-----------|----------------|
| `ref === null` | Lema jugable en modos texto; **excluido** de muestreo imagen |
| `ref` set pero archivo ausente | Tratar como null + warning en tests/smoke |
| Pack sin ningún `ref` | No mostrar modos imagen en el selector de ese pack |
| Mezcla | No incluir ítems imagen hasta que el lema tenga `ref` válido |

Alineado con el criterio actual de Ortografía (“sin emoji genérico”).

### 5.5 Homónimos y ambigüedad

| Caso | Regla |
|------|--------|
| Homónimo EN distinto sentido | Lemas **distintos** + imágenes **distintas**; si no hay evidencia de ambos sentidos en 3.º, **no** incluir el segundo |
| Imagen ambigua (manzana roja vs “red”) | Preferir referente **prototípico** del lema; colores abstractos → swatch/icono, no objeto engañoso |
| Plural vs singular | Una imagen clara del número pretendido; no mezclar *cat/cats* en el mismo asset |
| Chunks (*I like apples*) | Imagen **opcional** de escena; no obligatoria en v2 |

### 5.6 Varias imágenes por lema

**v2: una imagen primaria por lema** (`ref` único).  
Lista `refs[]` = **fuera de alcance** hasta que producto lo pida (accesibilidad / variedad).

### 5.7 Lemas difíciles de representar

| Tipo | Ejemplos típicos | Estrategia |
|------|------------------|------------|
| Abstractos / feelings | *happy, bored* | **Icono** facial/emoji-style Aray **o** escena simple; si no hay calidad → `recommended: false` |
| Días / estaciones | *Monday, summer* | Icono calendario / estación; no foto literal |
| Números | *seven* | Glifo tipográfico + marca Aray; o puntos/contadores |
| Preposiciones | *under, behind* | **Composición** (objeto + relación espacial) |
| Verbos de acción | *jump, swim* | Icono de acción o escena; evitar foto ambigua |
| Chunks | *How old are you?* | Sin imagen, o escena genérica de diálogo |

### 5.8 Licencia / procedencia (decisión de producto)

Opciones a **aprobar** (§10):

1. **Aray-own** — encargar / generar set coherente con estilo hub (recomendado para marca).  
2. **CC0 / dominio público** — solo con registro de fuente en `sourceNote`.  
3. **Pack comercial** con licencia educativa explícita.

**Prohibido:** scrapear Google/Pinterest; usar capturas de libros del repo (copyright).

### 5.9 Validación visual antes de aprobar

Checklist editorial (humano):

1. ¿Se reconoce el lema **sin leer** el texto EN?  
2. ¿La glosa ES sigue siendo la misma idea?  
3. ¿Fondo limpio / recorte claro a 512?  
4. ¿No introduce vocabulario extra no enseñado (carteles, marcas)?  
5. ¿Homónimo / confusión de color-objeto descartada?  
6. ¿Licencia anotada?  
7. ¿Pasa revisión en móvil (tamaño chip de misión)?

Estados sugeridos en manifest: `draft` → `visual-ok` → `linked` (ref en JSON).

**No** descargar ni generar assets en esta fase de plan.

---

## 6. Arquitectura de frases

### 6.1 Principios

- Contenido **editorial revisado**; **cero** generación libre en producción.  
- Cada frase declara los **lemma ids** (y chunk ids) que usa.  
- Solo estructuras **aparecidas en fuentes** del repo (Vicens / cuaderno / Wonder apoyo).  
- Traducción ES para adulto/ayuda; no sustituye la práctica EN.

### 6.2 Schema propuesto (`packKind: english-sentence` o pack de frases)

Diseño (aún no JSON):

```text
EnglishSentencePack
├── schemaVersion
├── pack { id, title, ownerBank, level: 3-primaria, locale: en-GB, revisionStatus, contentVersion }
└── sentences[]
```

Registro `sentence`:

| Campo | Oblig. | Tipo | Notas |
|-------|--------|------|-------|
| `id` | sí | string | `sent-{blockShort}-{slug}` estable |
| `textEn` | sí | string | Frase en-GB natural, corta |
| `textEs` | sí | string | Traducción ES única |
| `lemmaIds` | sí | `string[]` | Ids de lemas **frozen** usados (contenido léxico) |
| `chunkIds` | no | `string[]` | Si reutiliza chunk de Me-chunks |
| `patternId` | sí | string | Plantilla gramatical (§6.4) |
| `difficulty` | sí | 1–3 | 1=patrón + 1 lema nuevo; 3=varios lemas/combinación |
| `image` | no | mismo contrato reducido | Escena opcional |
| `audio` | no | `{ ref: null }` | Reserva futura; no obligatorio v2 |
| `tipEs` | no | string | Ayuda breve |
| `tags` | no | `string[]` | p. ej. `affirmative`, `negative`, `question` |
| `status` | no | `active` \| `deprecated` | |

**Prohibido en el registro:** distractores, `correctIndex`, opciones MCQ (van al adaptador).

### 6.3 Relación frase ↔ lemas

- Validación: **todo** `lemmaId` debe existir en corpus frozen y `status !== deprecated`.  
- Una frase no introduce lema “fantasma”.  
- Functors (*a, the, is, my, this…*) pueden listarse como `functionWords[]` **del pack de frases** (lista cerrada respaldada) **o** embebidos solo en `patternId` sin ser lemas de vocabulario — **decidir en §10**.

### 6.4 Patrones gramaticales permitidos (solo si hay evidencia)

| `patternId` | Ejemplo de forma | Evidencia típica | Prerequisitos de packs |
|-------------|------------------|------------------|------------------------|
| `this-is-my` | This is my… | Family / school | Family (+ School) |
| `i-have-got` | I have got… / I've got… | Family, school objects | Family o School |
| `i-like` | I like… | Food, Vicens | Food (+ Colours opcional) |
| `i-dont-like` | I don't like… | Food / Wonder | Food |
| `the-is` | The … is … | Colours + noun | Colours + School/Food… |
| `my-is` | My … is … | Family / colours | Family + Colours |
| `there-is` | There is… | Home Vicens | Home |
| `there-are` | There are… | Home | Home |
| `he-is` / `she-is` / `it-is` | He is… | Family / feelings | Family; Feelings para adj. |
| `can-you-see` | Can you see…? | Classroom | School + Body/Objects |
| `where-is` | Where is…? | Home / school | Home o School |
| `prep-loc` | It's in/on/under… | Home | Home (+ Objects) |
| `i-can` / `i-cant` | I can… / I can't… | Animals Vicens | Animals + Actions |

**No incluir** (sin evidencia clara en fuentes 3.º usadas): present continuous libre, *going to*, comparativos, pasados, *must/should*, relative clauses, etc.

### 6.5 Bloques de frases (orden pedagógico)

No escribir frases aún — solo bloques:

| Bloque | `patternIds` | Prerequisitos frozen | Tamaño orient. | Prioridad |
|--------|--------------|----------------------|---------------:|-----------|
| **S1 Identity** | `this-is-my`, `my-is`, `i-have-got` | Family + Colours (+ School) | 20–35 | Alta |
| **S2 Likes** | `i-like`, `i-dont-like` | Food (+ Colours) | 20–35 | Alta |
| **S3 Describe** | `the-is`, `he-is`, `she-is`, `it-is` | Colours + Body/Clothes/Family | 20–30 | Media |
| **S4 Place** | `there-is`, `there-are`, `where-is`, `prep-loc` | Home (+ School) | 25–40 | Alta |
| **S5 Ability** | `i-can`, `i-cant`, `can-you-see` | Animals + Actions (+ School) | 20–30 | Media |

**Me & chunks** alimenta S1 (saludos/edad) como chunks citados, no como frases generadas.

### 6.6 Audio futuro

Campo `audio.ref` reservado; **no** bloquea C1–C2. Listening pack sigue en Fase D.

---

## 7. Dependencias (vocabulario · imágenes · frases)

```
Packs lemas frozen ──► corpus EN
        │
        ├──► assets imagen (ref) ──► modos imagen
        │
        └──► sentence packs (lemmaIds ⊆ corpus) ──► modos frase

Me-chunks ──► S1 / presentaciones
Actions + Animals ──► S5
Home ──► S4
Food ──► S2
```

**Regla de oro:** congelar lemas → (opcional) imágenes → frases del bloque.  
Nunca frases antes que sus packs.

---

## 8. Orden recomendado de implementación

1. **Aprobar** este roadmap (§10).  
2. **A1 vocabulario:** Body → Food → Actions → Clothes → Animals → Home → Days.  
3. **B0:** cerrar contrato imagen + licencia + carpeta (actualizar `INGLES_JSON_SPEC.md`).  
4. **B1:** piloto imagen en **Colours** o **School** (ya frozen) + activar mecánicas imagen solo en packs con cobertura.  
5. **A2:** Me-chunks → Feelings → (Weather?).  
6. **B2:** imágenes packs A1.  
7. **C0:** schema frases + lista `functionWords` / patterns.  
8. **C1:** S1 + S2 + mecánicas frase básicas.  
9. **C2:** S3–S5 + Mix/Mis fallos frase.  
10. **Hub:** decidir qué packs nuevos entran al hub de repaso (hoy School+Family).

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cupo 300–500 exige inventar | Calidad baja | Techo real por fuentes; aceptar &lt;300 |
| Wonder como listado principal | Vocabulario no calibrado | Wonder = apoyo; Vicens/cuaderno = evidencia |
| Imágenes ambiguas | Aprendizaje erróneo | Checklist §5.9; `recommended: false` |
| Frases con lemas no frozen | Bugs / spoilers | Validador duro lemmaIds |
| Pack Actions solapa Animals | Duplicados *swim* | Propietario único; chunk vs lemma |
| Inflar Home con *made of* materials | Fuera de nivel útil | No pack Materials; solo si sale y cabe |
| Copyright assets | Legal | Licencia explícita; nada de libros escaneados |
| Scope creep audio | Retrasa v2 | Phonics/Listening fuera |
| UI hub saturada | UX | Meter packs al hub por oleadas |

---

## 10. Decisiones que necesitas aprobar

1. **Pack Actions** como pack propio (recomendado) vs absorber en Animals/Home.  
2. **Weather:** auditar y decidir keep pequeño vs descartar.  
3. **Techo de lemas:** ¿aceptamos cerrar v2 en ~300–380 si las fuentes no dan más?  
4. **Licencia de imágenes:** Aray-own vs CC0 vs pack pagado.  
5. **Carpeta de assets:** `src/assets/english/lemmas` vs `public/assets/english/…`.  
6. **Function words** en frases: lista cerrada en pack de frases vs solo `patternId`.  
7. **Forma verbal en Actions:** base (*jump*) vs -ing (*jumping*) según ficha — fijar regla.  
8. **Hub:** ¿Colours & Numbers vuelve a UI? ¿Cuántos packs nuevos se muestran a la vez?  
9. **Piloto imagen:** Colours vs School primero.  
10. **¿Una o dos mecánicas frase en C1?** (ordenar vs completar vs elegir imagen).

---

## 11. Qué se reutiliza del sistema actual

| Pieza | Reuso |
|-------|--------|
| Flujo MD → auditoría → frozen → JSON | Igual |
| `englishLemmaPack` + registry + corpus | Extender categorías por pack |
| Modos meaning / translate / intruder / missing / mix / review | Igual para lemas nuevos |
| `image.recommended` + `ref` nullable | Base del contrato imagen |
| Miss store inglés (`packId:lemmaId` + mode) | Extender a sentenceId más adelante |
| StageSelect / hub packs | Añadir packs al catálogo |
| Metodología en-GB + glossEs única | Sin cambio |
| Patrón Ortografía “sin imagen genérica” | Igual espíritu |

---

## 12. Qué requiere código nuevo (más adelante; no ahora)

| Área | Trabajo futuro |
|------|----------------|
| Spec | Ampliar `INGLES_JSON_SPEC` (image kind/alt/license; sentence pack) |
| Validador | lemmaIds en frases; ref→archivo existe; categorías packs nuevos |
| Adaptadores | Imagen→palabra · palabra→imagen · ordenar frase · completar frase · match frase/imagen |
| Catálogo minijuegos | Nuevos `english-*` / skillIds frases |
| Hub UI | Oleadas de packs; badge “con imagen” opcional |
| Tests | Smoke por pack; corpus picture-ready; sentence integrity |
| Assets pipeline | Import/manifest; fallback |

---

## 13. Fuera de alcance (v2)

- Listening / phonics / speak / dictado.  
- CLIL / science English (Nature taxonomy).  
- Packs Transport, City, Jobs, Toys (salvo reapertura con fuente).  
- Generación automática de frases o distractores en runtime.  
- Audio obligatorio.  
- Varias imágenes por lema.  
- US English.  
- Glosas catalanas.  
- Números 30–100 (sigue fuera del primer bloque numérico).  
- Copiar ejercicios de editorial.

---

## 14. Mecánicas futuras (mapa; no implementar)

| Mecánica | Entrada | Requiere | Notas |
|----------|---------|----------|-------|
| EN → ES | lemma | — | Ya existe (`meaning`) |
| ES → EN | lemma | — | Ya existe (`translate`) |
| Imagen → palabra | lemma + `ref` | B1+ | Nueva |
| Palabra → imagen | lemma + `ref` | B1+ | Nueva |
| Intrusa | lemma + category | — | Ya existe |
| Letra que falta | lemma | — | Ya existe |
| Mezcla | modos pack | — | Extender con imagen/frase cuando existan |
| Mis fallos | missKey | — | Extender a sentence |
| Ordenar frase | sentence | C1 | Tokens = palabras de `textEn` |
| Completar frase | sentence + hueco editorial | C1 | Hueco fijado en MD, no procedural ciego |
| Elegir imagen correcta | sentence o lemma + `ref` | B1/C1 | |
| Relacionar frase e imagen | sentence + `ref` | C2 | |

---

## 15. Checklist de siguiente paso humano

- [ ] Aprobar o ajustar decisiones §10  
- [ ] Abrir `INGLES_BODY.md` (primer banco A1) **solo tras OK**  
- [ ] No JSON / no assets / no frases hasta bancos y specs acordados  

---

## 16. Resumen ejecutivo

Inglés v2 amplía el MVP de **74** lemas hacia un módulo con **más vocabulario respaldado**, **imágenes con contrato serio** y **frases editoriales** ligadas a lemas frozen.  
Packs **imprescindibles:** Body, Food, Actions, Clothes, Animals, Home, Days, Me-chunks.  
**Secundarios:** Feelings, Weather (condicional).  
**Descartados v2:** Nature (CLIL), City, Jobs pack, Transport, Toys; Sports sin pack propio.  
Techo realista **~300–380** lemas sin inventar; 500 solo si las fuentes lo dan.  
Imágenes y frases tienen arquitectura propia pero **dependen** del corpus de lemas.  
Sin programación ni bancos en esta entrega: solo plan para aprobar.
