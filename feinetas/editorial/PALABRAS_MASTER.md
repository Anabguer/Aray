# Palabras — Banco maestro editorial (3.º Primaria · Cataluña)

**Estado:** Fase 1 arquitectura **cerrada** · Fase Editorial **abierta** (Relaciones semánticas).  
**No** es contenido jugable · **no** hay JSON de packs nuevos todavía.  
**Actualizado:** 2026-08-02 (progresión + lemas multi-banco + inicio editorial).

Este documento **no lo usa el juego en runtime**. Flujo: [`README.md`](./README.md).  
Contrato técnico: [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md).  
Progresión / dificultad: [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md).

---

## 0. Decisiones cerradas (Fase 1 · revisión)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Idioma | Castellano **`es-ES`**, nivel **`3-primaria`** (Cataluña / ciclo medio, Decret 175/2022) |
| 2 | Modelo de datos | **Bancos editoriales reutilizables**, no un JSON por producto. Un mismo registro puede alimentar varios juegos vía adaptadores |
| 3 | Modelo de producto | **Un minijuego = un producto** en el hub. Cada producto **lee** uno o más bancos; no es dueño exclusivo del dato |
| 4 | Contenido | **100 % editorial** en los ítems. Procedural **solo** presentación (barajar letras/tokens/opciones, comprobar orden) |
| 5 | Fuentes | Fichas del repo + BEX castellano + temario. **Prohibido inventar** vocabulario, distractores o frases |
| 6 | Formar palabras | Entra en la familia Palabras **sin rediseño**: mismo pack, misma mecánica, mismo comportamiento. Solo aparece en el hub/catálogo de la familia |
| 7 | Ortografía | **No** reentrar reglas h / rr / bv / g-j / ll-y / c-z-qu / mb-mp / tildes / hay-ahí-ay / gu |
| 8 | ABC / alfabeto | Letras y vecinos → bloque Alphabet. **Orden alfabético de palabras** (diccionario, nivel 3.º) → Palabras |
| 9 | Skills | Skills propios bajo `blockId: 'words'` (Integración; hoy Formar palabras usa `spelling-words` por error) |
| 10 | Mix / Mis fallos | Obligatorios: `words-mix`, `words-review` · miss store v2 |
| 11 | Definición ↔ palabra | **v2** — fuera del alcance inicial |
| 12 | Campo semántico | **Producto v1** (banco propio reutilizable; ver §3 y §5) |
| 13 | Antes de JSON | Currículum §4 + progresión aprobados → Fase Editorial (MD) → solo después JSON / código |
| 14 | Progresión | Escala **difficulty 1–4** común · ver [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md) |
| 15 | Lema multi-banco | En Palabras, el **mismo lema puede** aparecer en **varios bancos** si el objetivo pedagógico es distinto (contrario a Ortografía). Detalle en PROGRESSION §3 |

---

## 1. Principio rector: bancos ≠ productos

Igual que en Ortografía el banco de lemas alimenta Intrusa, Correcta, Missing…, en Palabras el **conocimiento vive en bancos** y los **juegos son vistas**.

```
Markdown editorial (bancos)
        │
        ▼
  Packs JSON por banco   ←── schemaVersion (PALABRAS_JSON_SPEC)
        │
        ├── adaptador Sinónimos
        ├── adaptador Antónimos
        ├── adaptador Singular/plural
        ├── adaptador Masculino/femenino
        ├── adaptador Familia de palabras
        ├── adaptador Campo semántico
        ├── adaptador Ordenar frases
        ├── adaptador Orden alfabético
        ├── Mix / Review
        └── Formar palabras (pack legacy propio, sin tocar)
```

**Prohibido:** duplicar el mismo par sinónimo en dos JSON “de producto”.  
**Obligatorio:** un registro canónico **por relación/ítem** en su banco; los juegos lo proyectan.  
**Permitido:** el mismo lema (forma escrita) en **otro** banco Palabras si el objetivo cambia (p. ej. `grande` en Formar palabras y en Relaciones como antónimo). Ver [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md) §3.

### Qué es / qué no es esta fase

| Es | No es |
|----|--------|
| Arquitectura + currículum editorial cerrado | Listas de palabras / pares / frases |
| Diseño de bancos y mapa banco→juego | JSON, pantallas, catálogo runtime nuevo |
| Fronteras Ortografía / Alphabet / v2 | Rediseño de Formar palabras |

---

## 2. Fuentes (cerradas para construcción)

| Fuente | Rol |
|--------|-----|
| [`docs/TEMARIO_3_PRIMARIA_CATALUNYA.md`](../../docs/TEMARIO_3_PRIMARIA_CATALUNYA.md) | Suelo curricular; “reflexión sobre la lengua”; alfabeto solo como herramienta |
| BEX [`verano_aray/banc_exercicis/02_castellano.md`](../../verano_aray/banc_exercicis/02_castellano.md) | Tipología de ejercicios (no copiar) |
| `verano_aray/fichas_repaso/02_castellano/` | Fitxes propias (p. ej. ordenar palabras) |
| `verano_aray/banc_exercicis/_extraccio_raw/` | Extracciones ANAYA / SM / Vicens |
| `feinetas/lengua/` | PDFs lengua / repaso 3.º |
| `feinetas/formar-palabras.json` | Pack vivo de Formar palabras (**no migrar ni reescribir** en v1) |

Referencias BEX (tipología):

| Código | Encaje |
|--------|--------|
| LES-003 / LES-004 | Relaciones semánticas (sinónimos; definición → **v2**) |
| LES-005 | Oraciones para ordenar |
| LES-001 / LES-002 | Orden diccionario (palabras, no solo letras) |
| LES-011 | Campos semánticos |

---

## 3. Productos v1 (hub Palabras)

Catálogo de **juegos** visibles. Ninguno “posee” un JSON exclusivo salvo Formar palabras (pack ya existente).

| # | Producto UI | Bancos que consume | Mecánica | Notas |
|---|-------------|--------------------|----------|-------|
| 1 | **Formar palabras** | Pack actual `formar-palabras` | `ordenar-letras` | Sin rediseño |
| 2 | **Sinónimos** | `relaciones-semanticas` (`relation: synonym`) | MCQ | |
| 3 | **Antónimos** | `relaciones-semanticas` (`relation: antonym`) | MCQ | Mismo banco que sinónimos |
| 4 | **Singular / plural** | `morfologia` (`axis: number`) | MCQ / elegir forma | |
| 5 | **Masculino / femenino** | `morfologia` (`axis: gender`) | MCQ / elegir forma | Mismo banco morph |
| 6 | **Ordenar frases** | `oraciones` | `ordenar-tokens` (nueva) | |
| 7 | **Familia de palabras** | `familias-lexicas` | MCQ / grupo | |
| 8 | **Orden alfabético** | `listas-diccionario` | ordenar / `ordenar-tokens` | Nivel diccionario 3.º |
| 9 | **Campo semántico** | `campos-semanticos` | MCQ / conjunto (incl. vista “intrusa”) | Producto v1 |
| — | **Random / Mix** | Unión de bancos v1 (+ Formar palabras si se desea) | orquestador | |
| — | **Repasar mis fallos** | Miss store v2 → ítem del banco origen | replay | |

### Fuera de v1 (aplazado)

| Producto / tema | Motivo |
|-----------------|--------|
| **Definición ↔ palabra** | Explícitamente **v2** |
| Predicado / sujeto, tipos de oración | Gramática de oración → otra área / más adelante |
| Comprensión de texto largo | Escritura/lectura `future` en temario |
| Sílaba tónica como producto | No estrella de Palabras; solapa fonología |
| Completar hueco ortográfico | Ortografía |
| Listening / audio | Fuera |

### Vista “intrusa” dentro de Campo semántico

No es un producto hub aparte en v1.  
El banco `campos-semanticos` permite:

- elegir palabras del campo;
- o marcar la **intrusa** (mecánica de presentación del mismo dato).

Si en playtesting hace falta cartel propio, se decide en Integración **sin** duplicar banco.

---

## 4. Currículum editorial (qué entra en 3.º)

Fuente de verdad pedagógica para abrir (o no) registros en Fase Editorial.  
Alineado con temario Aray + práctica escolar de ciclo medio castellano + tipología BEX.

### 4.1 Entra en Palabras v1

| Eje | Qué sí | Criterio de nivel |
|-----|--------|-------------------|
| **Relaciones semánticas** | Sinónimos y antónimos **frecuentes**, vocabulario escolar cotidiano | Parejas que aparecen en refuerzo 3.º; no léxico literario/raro |
| **Morfología número** | Singular↔plural de nombres habituales; irregulares **atestiguados** en fichas (*pez/peces*, *lápiz/lápices*…) | Evitar paradigmas académicos completos |
| **Morfología género** | Pares claros (*niño/niña*, *gato/gata*…) y casos escolares frecuentes | Sin doctrina de género gramatical avanzada ni excepciones de lingüística |
| **Familias léxicas** | Raíz transparente + derivados evidentes (*mar → marina, marinero…*) | 3–6 miembros; sin etimología culta |
| **Campos semánticos** | Campos cerrados del entorno del niño (colores, escuela, casa, animales, comida, cuerpo, ropa, ciudad…) | 4–8 palabras/campo; intrusa inequívoca |
| **Orden de oración** | Frases **cortas** (≈5–9 tokens), enunciativas, vocabulario conocido | Mayúscula inicial / punto como norma de superficie; sin subordinadas largas |
| **Orden diccionario** | Listas de **4–6 palabras** de vocabulario 3.º; A→Z (Z→A opcional minoritario) | No enseñar el abecedario; sí usarlo como herramienta |
| **Formar palabras** | Vocabulario ya cargado (250) | Sin cambiar alcance ni dificultad del pack actual |

### 4.2 No entra (descartado o aplazado)

| Tema | Veredicto | Motivo (estilo Ortografía Fase 2) |
|------|-----------|-----------------------------------|
| Definiciones formales / glosas tipo diccionario como juego | **v2** | Decisión de producto; LES-004 tipología útil más adelante |
| Homófonos / parónimos como eje Palabras | **No en v1** | Cruce con Ortografía; riesgo de duplicar foco |
| Prefijos/sufijos como teoría (lista de afijos) | **No** | Por encima o paralelo; familias cubren el uso sin metalingüística |
| Categorías gramaticales (sustantivo/adjetivo/verbo) como drill | **No en v1** | Reflexión útil en clase; no tipología BEX fuerte aquí; otro módulo |
| Concordancia oración completa (género/número en sintagma largo) | **No** | Más gramática que “palabras”; temario lo cita; Palabras se queda en pares |
| Puntuación / modalidades (¿¡) como producto | **No** | Ortografía / expresión; no banco Palabras |
| Ordenar **letras** sueltas A–Z | **Alphabet** | Por debajo de 3.º como contenido estrella |
| Léxico catalán / bilingüe en packs | **No en v1** | Familia castellano `es-ES` (como Ortografía actual) |
| Inventar plurals/géneros “regulares” sin ficha | **Prohibido** | Misma regla que no inventar errores ortográficos |
| Oraciones subordinadas / relativas largas | **No** | Nivel y UX de ordenar tokens |
| Campos semánticos abstractos (emociones filosóficas, ciencia avanzada) | **No** | Fuera del entorno 3.º salvo evidencia fuerte en ficha |

### 4.3 Fronteras con otras familias

| Si el foco es… | Va a… |
|----------------|-------|
| Cómo se **escribe** (regla ortográfica, error real) | **Ortografía** |
| Qué **significa** / cómo se **relaciona** / cómo se **ordena** la palabra o la frase corta | **Palabras** |
| Letra suelta, vecino, cadena ABC | **Alphabet** |
| Definición formal como ejercicio principal | **Palabras v2** |

### 4.4 Criterios de calidad al abrir un registro (Fase Editorial)

1. Existe ejemplo equivalente o vocabulario habitual en fichas/BEX/temario del repo.  
2. No se copia el enunciado literal de la editorial.  
3. Distractores / intrusos / tokens vienen del MD; **nunca** del adaptador.  
4. Si no hay evidencia → **no entra** (mejor banco corto que relleno).  
5. Cada banco MD termina con resumen: fuentes revisadas, temas, criterios de selección.

---

## 5. Índice definitivo de bancos editoriales

Un banco = futuro MD + un JSON bajo `feinetas/palabras/`.  
**No** hay `sinonimos.json` / `antonimos.json` separados.

| Banco | `pack.id` previsto | `packKind` | MD editorial | Productos que lo leen |
|-------|--------------------|------------|--------------|------------------------|
| Relaciones semánticas | `palabras-relaciones-semanticas` | `semantic-relation` | `BANCO_RELACIONES_SEMANTICAS.md` | Sinónimos, Antónimos, Mix |
| Morfología | `palabras-morfologia` | `morph-pair` | `BANCO_MORFOLOGIA.md` | Singular/plural, Masc/fem, Mix |
| Familias léxicas | `palabras-familias` | `word-family` | `BANCO_FAMILIAS_LEXICAS.md` | Familia de palabras, Mix |
| Campos semánticos | `palabras-campos` | `semantic-field` | `BANCO_CAMPOS_SEMANTICOS.md` | Campo semántico (y vista intrusa), Mix |
| Oraciones | `palabras-oraciones` | `sentence-order` | `BANCO_ORACIONES.md` | Ordenar frases, Mix |
| Listas diccionario | `palabras-diccionario` | `word-sort-list` | `BANCO_LISTAS_DICCIONARIO.md` | Orden alfabético, Mix |
| *(legacy)* Formar palabras | `formar-palabras` | *(schema actual)* | — | Formar palabras **tal cual** |

### Volúmenes objetivo (orientativos; se congelan en Editorial)

| Banco | Ítems (mín–máx) | Notas |
|-------|----------------:|-------|
| Relaciones semánticas | 40–70 | Mezcla synonym + antonym; un registro = una relación |
| Morfología | 40–70 | Mezcla number + gender |
| Familias léxicas | 16–28 | Una familia = un ítem |
| Campos semánticos | 18–30 | Un campo = un ítem |
| Oraciones | 20–30 | Una oración = un ítem |
| Listas diccionario | 20–32 | Una lista = un ítem |
| Formar palabras | 250 | Sin cambiar |

### Dependencias entre bancos

Ninguna dependencia técnica bloqueante.  
Pedagógico: conviene abrir **Relaciones** y **Morfología** antes que Mix; **Campos** y **Familias** son independientes; **Oraciones** y **Diccionario** independientes.

---

## 6. Matriz banco → juego (reuso)

| Banco | Sinónimos | Antónimos | Sing/Pl | Masc/Fem | Familia | Campo sem. | Ord. frases | Ord. alfa | Mix |
|-------|:---------:|:---------:|:-------:|:--------:|:-------:|:----------:|:-----------:|:---------:|:---:|
| Relaciones | ● filtro synonym | ● filtro antonym | | | | | | | ● |
| Morfología | | | ● number | ● gender | | | | | ● |
| Familias | | | | | ● | | | | ● |
| Campos | | | | | | ● | | | ● |
| Oraciones | | | | | | | ● | | ● |
| Diccionario | | | | | | | | ● | ● |
| Formar palabras | | | | | | | | | ○ opcional |

● = consumo principal · ○ = opcional en Mix.

**Editorial vs procedural (igual para todos los bancos nuevos):**

| Editorial | Procedural |
|-----------|------------|
| Pares, miembros, campos, tokens, listas, distractores/intrusos | Shuffle, scramble de letras (solo Formar palabras), check de orden |

---

## 7. Formar palabras (regla especial)

- **No** se redefine el schema.  
- **No** se migra a `feinetas/palabras/` en v1.  
- **No** se reescribe el banco de 250 palabras.  
- **Sí** se trata como producto de la familia en hub, Mix (si se incluye) y skills `words-*` en Integración.  
- Cualquier unificación de schema queda **fuera de v1** (decisión futura explícita).

---

## 8. Arquitectura técnica prevista (solo diseño)

| Pieza | Rol |
|-------|-----|
| `feinetas/palabras/{banco}.json` | Packs por banco (§5) |
| `wordsRegistry.ts` / `wordsCorpus.ts` | Registro + índice `packId:itemId` |
| `adapters/palabras*.ts` | Un adaptador (o familia) por **producto**, leyendo el banco filtrado |
| `WORDS_EXERCISES` | Catálogo hub v1 (§3) |
| MechanicIds | Reuso `mcq`, `ordenar-letras`; nueva `ordenar-tokens` |
| Miss keys | `packId` + `itemId` (+ `minigameId`) |

Detalle de campos por `packKind`: [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md).

---

## 9. Roadmap de fases

| Fase | Entrega | Criterio de cierre |
|------|---------|-------------------|
| **1 · Arquitectura** | Este MASTER + JSON_SPEC + índices README | Currículum §4 + bancos §5 aprobados por ti |
| **2 · Editorial** | MD por banco (`BANCO_*`) | Revisables; fichas citadas; sin inventar; **sin** JSON aún hasta tu OK del MD |
| **3 · Implementación** | JSON approved + registry + adapters + UI + tests | Productos v1 jugables (Formar palabras intacto) |
| **4 · Auditoría** | Pedagógica + técnica | Nivel 3.º; sin leaks Ortografía; sin duplicados entre juegos |
| **5 · Integración** | Skills, Mix/Review, miss v2, Alphabet redirect, deploy | Familia cerrada en producción |

Docs-only (Arquitectura / Editorial): commit/push **sin** deploy.  
Implementación/Integración estables: commit + push + deploy.

**No** se abre Fase Editorial hasta que apruebes esta arquitectura.

---

## 10. Orden editorial (cuando se autorice Fase 2)

| Paso | Banco MD | Motivo |
|-----:|----------|--------|
| 1 | `BANCO_RELACIONES_SEMANTICAS.md` | Alimenta dos productos; BEX fuerte |
| 2 | `BANCO_MORFOLOGIA.md` | Dos productos morph |
| 3 | `BANCO_CAMPOS_SEMANTICOS.md` | Producto Campo semántico |
| 4 | `BANCO_FAMILIAS_LEXICAS.md` | Familias |
| 5 | `BANCO_ORACIONES.md` | Ordenar frases |
| 6 | `BANCO_LISTAS_DICCIONARIO.md` | Orden alfabético |
| — | Formar palabras | Sin banco MD nuevo en v1 |

---

## 11. Checklist — siguiente paso humano

- [x] Modelo bancos reutilizables (no JSON por producto)  
- [x] Currículum §4 (entra / no entra / fronteras)  
- [x] Productos v1 (Campo semántico sí; Definición no)  
- [x] Formar palabras sin rediseño  
- [x] Contrato JSON de bancos (`PALABRAS_JSON_SPEC.md`)  
- [x] Progresión (`PALABRAS_PROGRESSION.md`) + norma lema multi-banco  
- [x] Arquitectura aprobada para abrir Editorial  
- [ ] Congelar `BANCO_RELACIONES_SEMANTICAS.md` tras revisión humana  
- [ ] Resto de bancos MD (§10)  
- [ ] Solo después: JSON + ingeniería  

---

## 12. Resumen

Palabras v1 = **6 bancos editoriales nuevos** + Formar palabras **intacta**.  
**9 productos** de hub (+ Mix/Review) leen bancos compartidos; Sinónimos/Antónimos y Sing-Pl/Masc-Fem **no duplican datos**.  
Currículum 3.º cerrado en §4: relaciones, morfología básica, familias, campos, oraciones cortas, diccionario; **no** definiciones (v2), no gramática de oración, no ortografía.  
Sin JSON ni implementación hasta tu aprobación de esta fase.
