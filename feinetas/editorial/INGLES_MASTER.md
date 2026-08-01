# Inglés — Banco maestro editorial (3.º Primaria · Cataluña)

**Estado:** diseño editorial · **no** es contenido jugable · **no** hay JSON · **no** hay pantallas.  
**Fecha:** 2026-08-01  
**Decisión de producto:** el siguiente gran módulo tras Ortografía / Mates (calidad) es **Inglés**.  
**Problemas verbales:** **fuera del roadmap** como siguiente bloque (no desarrollar).

Este documento **no lo usa el juego en runtime**. Sigue el flujo de [`README.md`](./README.md):

1. Diseño (este archivo) → 2. Bancos Markdown → 3. Revisión humana → 4. JSON → 5. Adaptadores / minijuegos.

---

## 1. Objetivo y límites

### Qué es
Arquitectura editorial del módulo de **Llengua Estrangera (inglés)** para el perfil Aray: niño ~9 años, **3.º de Primaria Cataluña** (ciclo medio **3.º–4.º**, Decret 175/2022).

### Qué no es
- No copiar ejercicios de fichas ni editoriales.
- No generar vocabulario cerrado todavía.
- No crear packs JSON, mecánicas ni pantallas.
- No modificar `MINIGAME_CATALOG`, Matemáticas ni Ortografía.

### Principio pedagógico (igual que Ortografía)
Las fichas del repo y las editoriales son **referencia de temas, nivel y tipología**.  
Aray enseñará **los mismos contenidos** con formato de videojuego, no fotocopia digital.

---

## 2. Fuentes revisadas

### 2.1 Currículum oficial (Cataluña)

| Fuente | Uso |
|--------|-----|
| **Decret 175/2022** (educació bàsica) | Área **Llengua Estrangera**; 3.º = **segon cicle** (3r–4t) |
| Annex 2 — competències específiques LE | Comunicación oral/escrita, mediación, plurilingüismo, reflexión sobre el aprendizaje |
| Sabers LE (segon cicle) | Uso en aula, comprensión/producción guiada, léxico de vida cotidiana, estrategias, aspectos socioculturales básicos |
| [`docs/TEMARIO_3_PRIMARIA_CATALUNYA.md`](../../docs/TEMARIO_3_PRIMARIA_CATALUNYA.md) | Calibrado de nivel ciclo medio (hoy centrado en mates/lengua; este MD amplía inglés) |

**Lectura operativa para Aray (ciclo medio):**

- Inglés = **comunicación funcional** (saludos, preguntar/responder, describir lo cercano), no gramática explícita tipo ESO.
- Prioridad: **léxico + estructuras fijas** + comprensión con apoyo visual.
- Oral/listening aparecen en currículum → en producto: **fase 1 offline (lectura/imagen)**; **audio en fase posterior**.
- Error = parte del aprendizaje (alineado con Mis fallos futuros).

### 2.2 Materiales del repositorio

| Ubicación | Editorial / tipo | Qué aporta | Límite |
|-----------|------------------|------------|--------|
| `feinetas/Ingles/*.pdf` (`1`–`8`, `01.pdf`) | Fichas escaneadas en repo | Nivel 3.º visual; **OCR vacío** (imagen) | Hay que revisar en mesa / OCR futuro; **no inventar** vocabulario solo desde el nombre del archivo |
| `verano_aray/banc_exercicis/03_angles.md` | Índice BEX | Tipología EN-001… tipificada | Enunciados resumidos; no copiar |
| `…/_extraccio_raw/angles_cuaderno-de-verano-ingles-3-ep.txt` | Cuaderno verano 3 EP (PlanetaSaber / genérico) | Colores, números 1–10, familia, ropa, frutas, colegio, estaciones, cuerpo, días | Buen banco de **temas base** |
| `…/angles_mating3.txt` | **Vicens Vives** (reinforcement/extension) | School areas, house/materials, family, safety gear, food scramble, animals/can, clothes, routines/time | Fuente **principal** de unidades 0–6 tipo curso |
| `…/angles_Mc-Millan-wonder-3-teacher-resource.txt` | **Wonder 3** · Richmond / **Santillana** | Feelings, appearance (`have got`), food (sweet/sour/salty), winter sports/clothes, instruments + prepositions, farm animals… | Fuente **principal** de tipología “coursebook moderno” + **phonics/listening** (reservado audio) |
| `…/angles_mating8.txt`, `angles_mating11.txt` | Vicens (marcado ©) | Contenido tipo **Science/CLIL** (huesos, músculos, school staff…) | **No** usar como núcleo de Inglés L2; opcional “English across the curriculum” mucho más tarde |
| Índice `indice_pdfs.md` | Inventario | Lista PDFs `Ingles\mating*.pdf`, cuaderno verano | Orientativo |

### 2.3 Editoriales pedidas (cobertura real en repo)

| Editorial | Hallazgo en repo | Uso editorial propuesto |
|-----------|------------------|-------------------------|
| **Vicens Vives** | Fuerte (`mating3` y familia) | Ancla de **unidades temáticas** y estructuras (`have got`, `there is/are`, `can`, school) |
| **Santillana / Richmond (Wonder 3)** | Fuerte (Teacher Resource) | Ancla de **feelings, food, phonics, skills** (R/W/L/S) |
| **SM** | Poco inglés L2 explícito en extracciones; SM aparece más en mates/medi | Consultar fichas físicas / futuros PDF; **no forzar** vocabulario SM sin fuente |
| **ANAYA** | Extracciones ANAYA del repo = lengua/mates/medi, **no** inglés L2 claro | Igual: pendiente de material inglés ANAYA si se añade al repo |
| **Savia** | Presente en medi/naturales (atención a la diversidad), **no** como coursebook inglés | No mezclar con packs de Inglés salvo CLIL medi en inglés (fuera de v1) |

**Conclusión de cobertura:** el diseño v1 se apoya en **Vicens + Wonder/Santillana + cuaderno verano + fichas `feinetas/Ingles`**. ANAYA / SM / Savia se documentan como **huecos a completar** cuando haya PDFs de inglés en el repo (sin inventar listas).

---

## 3. Bloques de contenido (mapa editorial)

Bloques = **familias de léxico / uso**, no “unidades de libro” copiadas.  
Orden = progresión recomendada para Aray (de más concreto / visual a más estructural).

| # | Bloque editorial | ID propuesto | Temas (síntesis de fuentes) | Offline v1 | Audio futuro |
|---|------------------|--------------|-----------------------------|:----------:|:------------:|
| B1 | Yo y saludos | `en-me` | name, age, hello/bye, I am… | ✅ | 🎧 diálogos |
| B2 | Colores y números | `en-colours-numbers` | colours; 1–20 (hasta ~100 lectura en Vicens U5) | ✅ | 🎧 |
| B3 | Colegio y aula | `en-school` | classroom objects, school areas, teacher… | ✅ | 🎧 |
| B4 | Familia | `en-family` | mum, dad, sister…; “He’s my…” | ✅ | 🎧 |
| B5 | Cuerpo y cara | `en-body` | eyes, nose, hair… | ✅ | 🎧 |
| B6 | Ropa | `en-clothes` | dress, shoes, hat, gloves…; I’m wearing… | ✅ | 🎧 |
| B7 | Casa y habitaciones | `en-home` | rooms; there is/are; prepositions (on/under/behind) | ✅ | 🎧 |
| B8 | Comida | `en-food` | fruit, sandwich, sweet/salty…; I like / Can I have… | ✅ | 🎧 |
| B9 | Animales y habilidades | `en-animals-can` | pets/farm; I can / can’t | ✅ | 🎧 |
| B10 | Días, estaciones, rutinas | `en-time-routines` | days, seasons; It’s … o’clock + acción | ✅ parcial | 🎧 fuerte |
| B11 | Sentimientos y descripción | `en-feelings` | happy, sad, scared…; has got glasses/hair | ✅ | 🎧 |
| B12 | Frases útiles (chunks) | `en-chunks` | What’s your name?, How old…?, Have you got…? | ✅ texto | 🎧 **prioridad** |
| B13 | Phonics (sonidos) | `en-phonics` | sonidos iniciales (Wonder) | ⚠️ solo visual | 🎧 **obligatorio** |
| B14 | Listening / Speaking | `en-oral` | skills worksheets Wonder | ❌ | 🎧 **núcleo** |

**Fuera de v1 (explícito):**

- CLIL ciencia en inglés (mating8/11: huesos, músculos…).
- Writing libre largo / surveys de compañeros (EN-001) → no encaja en minijuego corto.
- Draw & colour como mecánica principal (se puede sustituir por elegir imagen).

---

## 4. Orden recomendado de publicación

### Fase E0 — Diseño (ahora)
Este `INGLES_MASTER.md` + decisión de packs. Sin JSON.

### Fase E1 — Vocabulario visual offline (MVP jugable futuro)
Orden de packs a llenar (Markdown → JSON **después**):

1. `en-colours-numbers`  
2. `en-school`  
3. `en-family`  
4. `en-body`  
5. `en-clothes`  
6. `en-food`  
7. `en-animals-can`  
8. `en-me` + `en-chunks` (mínimo de frases fijas)

Mecánicas: **MCQ / match palabra–imagen / ordenar letras** (reuso).

### Fase E2 — Casa, rutinas, feelings
9. `en-home`  
10. `en-time-routines` (sin reloj hablado)  
11. `en-feelings`

### Fase E3 — Audio
12. `en-chunks` con audio  
13. `en-phonics`  
14. `en-oral` (listening MCQ)

### No planificar aún
Problemas verbales (mates), CLIL medi en inglés, segunda lengua extranjera.

---

## 5. Qué reutiliza el motor de Ortografía

El pipeline Ortografía ya separa **banco de lemas** vs **vista de mecánica** ([`JSON_SPEC.md`](./JSON_SPEC.md)).

| Capacidad Ortografía / minijuegos | Reutilizable en Inglés | Cómo |
|-----------------------------------|------------------------|------|
| Pack JSON + `buildRound` + adaptadores | ✅ | Nuevo `mechanicId` o categoría `english` con source `pack` (más adelante; **no ahora**) |
| MCQ “elige la correcta” | ✅ | Lema EN + distractores **editoriales** (nunca inventados) |
| Letra que falta / scramble (`ordenar-letras`) | ✅ | Spelling de palabras EN cortas (school objects, colours) |
| La intrusa | ✅ | 3 palabras del campo semántico + 1 fuera |
| Completa la frase | ✅ parcial | Solo con **frases plantilla** del pack `en-chunks` / `en-food` |
| Imagen y palabra (`picture`) | ✅ **prioridad EN** | Hoy coming-soon en orto; en inglés es **mecánica estrella** si hay `image.ref` |
| Mis fallos (streak clear) | ✅ patrón | Keys por `lemmaId` / `chunkId` (como `targetKey` orto) |
| Distractores ortográficos ES (b/v, h…) | ❌ | No aplicar reglas de castellano a inglés |

**Contrato de lema inglés (propuesta, no JSON aún):**

- `id`, `lemma` (EN), `glossEs` y/o `glossCa` (para adulto/ayuda), `topicIds[]`, `image.ref?`, `audio.ref?`, `chunk?`, `level: 3-primaria`, `locale: en-GB` (o `en-US` — **duda editorial**).

---

## 6. Qué necesita mecánica propia

| Mecánica | Por qué no basta Ortografía | Offline | Audio |
|----------|----------------------------|---------|-------|
| **Match palabra ↔ imagen** (grid) | Ortografía picture aún no productiva; inglés es L2 + iconografía | ✅ | opcional |
| **Listen & choose** | Requiere clip + timing | ❌ | ✅ |
| **Say & check** (hablar) | STT / adulto / futuro | ❌ | ✅ |
| **Phonics: sonido → letra/palabra** | Distinto de “letra que falta” ES | parcial | ✅ |
| **Prepositions on picture** | “The ball is under the table” + hotspots | ✅ | opcional |
| **Have you got…? cards** | Microdiálogo 2 turnos | texto ✅ | 🎧 mejor |

---

## 7. Imágenes y audio

### Imágenes (v1 offline)
Campos semánticos **claramente ilustrables**: colours, school objects, body, clothes, food, animals, rooms, feelings (caras).  
Regla: cada lema jugable en modo imagen **debe** tener `image.ref` aprobado (mismo rigor que ortografía picture).

### Audio (futuro)
Obligatorio para: listening, phonics, pronunciación de chunks, dictado suave.  
Conveniente para: feedback Lumo en inglés, “repeat after me”.  
Arquitectura futura: `audio.ref` en lema/chunk; **no** bloquear E1 offline.

---

## 8. Propuesta de packs editoriales

Un pack = un archivo JSON futuro bajo p. ej. `feinetas/ingles/…` (ruta orientativa).

| Pack ID | Título humano | Bloque | Ítems aprox. | Notas |
|---------|---------------|--------|-------------:|-------|
| `ingles-colours-numbers` | Colours & numbers | B2 | 25–40 | Colores + 1–20 (+ decenas) |
| `ingles-school` | School | B3 | 30–50 | Objetos + áreas (Vicens) |
| `ingles-family` | Family | B4 | 15–25 | Relaciones básicas |
| `ingles-body` | Body & face | B5 | 15–25 | |
| `ingles-clothes` | Clothes | B6 | 20–35 | + winter clothes Wonder |
| `ingles-home` | Home | B7 | 25–40 | Rooms + prepositions set |
| `ingles-food` | Food | B8 | 30–45 | + I like / Can I have… chunks |
| `ingles-animals` | Animals & can | B9 | 25–40 | Pets/farm + verbos can |
| `ingles-me-chunks` | Me & useful phrases | B1+B12 | 20–35 | Frases fijas cerradas |
| `ingles-time-days` | Days & seasons | B10 | 15–25 | |
| `ingles-feelings` | Feelings & looks | B11 | 20–30 | Wonder U1 |
| `ingles-phonics-a` | Phonics starter | B13 | 12–20 | **Solo con audio** |
| `ingles-listening-a` | Listening pack A | B14 | 10–15 escenas | **Solo con audio** |

**Tamaño total v1 (E1+E2, sin phonics/listening):** ~240–380 lemas/chunks.  
**Con E3 audio:** +30–50 ítems orales.

---

## 9. Propuesta de IDs y categorías

### 9.1 IDs de contenido
- Lema: `en:{packShort}:{slug}` — ej. `en:school:pencil-case`
- Chunk: `en:chunk:{slug}` — ej. `en:chunk:whats-your-name`
- Miss key: mismo id (estable; no texto visible solo)

### 9.2 Categorías de producto (futuro catálogo — **no implementar ahora**)

Alineado con bloques ya esbozados en curriculum (`vocabulary`, `word-image`, `simple-phrases` = future):

| category | title (producto) | Presentación |
|----------|------------------|--------------|
| `english-vocab` | Vocabulario | MCQ / scramble |
| `english-picture` | Palabra e imagen | Match / picture MCQ |
| `english-phrases` | Frases útiles | Complete / order words |
| `english-listen` | Escucha (futuro) | Listen MCQ |
| `english-review` | Mis fallos | Review bank |

### 9.3 skillIds curriculares (orientativos, sin tocar `catalog.ts` ahora)
- `english-vocab-core`
- `english-vocab-school`
- `english-phrases-basic`
- `english-listen-a` (futuro)

---

## 10. Offline vs audio — frontera clara

| Completamente offline (E1–E2) | Dejar para versión con audio (E3+) |
|-------------------------------|-------------------------------------|
| Vocab MCQ con texto + imagen | Listening comprehension |
| Match palabra–imagen | Phonics por sonido |
| Ordenar letras de lemas EN | “Repeat / speak” |
| Completar chunk escrito | Dictation |
| True/false sobre frase corta escrita | Pronunciation feedback |
| Prepositions sobre ilustración estática | Diálogos largos orales |

**Regla de producto:** ningún pack E1 debe **requerir** `audio.ref` para ser jugable.

---

## 11. Relación con el curriculum interno actual

En `src/curriculum/catalog.ts` (solo lectura; **no modificado en esta entrega**):

- Subject `english` ya existe (`/missions/english`).
- Bloques `vocabulary`, `word-image`, `simple-phrases` están en `future`.

Este master **valida** esos tres bloques como fachada de producto y los desglosa en packs editoriales anteriores.  
Cuando se active el módulo, se mapearán packs → actividades **sin** inventar un cuarto bloque “Problemas” en mates.

---

## 12. Dudas editoriales (para decidir antes de bancos)

1. **Variedad EN:** ¿`en-GB` (Vicens/Wonder UK) o `en-US`? Recomendación: **en-GB** coherente con fichas Vicens/Wonder.
2. **Glosas:** ¿ayuda en castellano, catalán o ambas? (Perfil Cataluña → **CA + ES** en metadatos adulto.)
3. **Números:** ¿tope 1–20 en E1 o incluir decenas 30–100 (Vicens U5)? Recomendación: **1–20 en E1**; 30–100 en E2.
4. **ANAYA / SM / Savia inglés:** ¿se añadirán PDFs al repo antes de congelar packs? Si no, congelar solo con Vicens + Wonder + verano + `feinetas/Ingles`.
5. **OCR `feinetas/Ingles`:** priorizar mesa de revisión visual vs OCR batch.
6. **Phonics:** ¿entrar en E3 o nunca en Aray móvil sin micrófono?
7. **CLIL (mating8/11):** ¿descartado definitivo o “English Club” opcional años después?
8. **Locale de imágenes:** ¿pack de iconos propio Aray o banco con licencia clara?

---

## 13. Resumen ejecutivo

- **Siguiente módulo grande = Inglés**; problemas verbales **no** son el siguiente bloque.
- Currículum Cataluña (Decret 175/2022) pide LE comunicativa en ciclo medio → Aray debe priorizar **léxico + chunks + imagen**, y dejar **listening/speaking/phonics** para cuando haya audio.
- Fuentes fuertes en repo: **Vicens (`mating3`)**, **Wonder 3 (Santillana/Richmond)**, **cuaderno verano 3 EP**, fichas `feinetas/Ingles` (escaneadas).
- **ANAYA / SM / Savia** aún no aportan coursebook de inglés usable en extracciones → hueco documentado.
- Reutilizar pipeline Ortografía (packs, MCQ, scramble, miss store, picture).
- Mecánicas propias: match imagen, listening, phonics, prepositions hotspot.
- ~**12 packs** editoriales; **~240–380** ítems offline antes de audio.

---

## 14. Checklist de siguiente paso editorial (humano)

- [ ] Resolver dudas §12 (locale, glosas, tope números).
- [ ] Revisar visualmente `feinetas/Ingles/01.pdf` y `1.pdf`–`8.pdf`.
- [ ] Abrir primer banco Markdown p. ej. `BANCO_INGLES_COLOURS_NUMBERS.md` (aún no).
- [ ] Congelar lemas solo con respaldo de ficha (regla README editorial).
- [ ] Solo entonces JSON + adaptadores (otra fase de ingeniería).

---

## 15. Cambio de planificación (registro)

| Antes | Ahora |
|-------|--------|
| Siguiente bloque mates ≈ Problemas verbales | **Cancelado** como siguiente gran módulo |
| — | **Inglés** = siguiente gran módulo de contenido |
| — | Mates: calidad UX / packs futuros sin problemas |
| — | Ortografía: intacta |
