# Inglés — Banco maestro editorial (3.º Primaria · Cataluña)

**Estado:** Fase 1 · arquitectura editorial **cerrada** · listo para abrir el primer banco Markdown.  
**No** es contenido jugable · **no** hay JSON · **no** hay pantallas · **no** hay vocabulario todavía.  
**Actualizado:** 2026-08-01 (Fase 1 — decisiones cerradas).

Este documento **no lo usa el juego en runtime**. Flujo: [`README.md`](./README.md).

---

## 0. Decisiones editoriales cerradas (Fase 1)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Idioma base | **Inglés británico (`en-GB`)** |
| 2 | Glosas | **Solo español (`glossEs`)**. Sin catalán. |
| 3 | Números | Primer pack de números: **solo 1–20**. Sin decenas 30–100 en E1. |
| 4 | Fuentes | **No esperar libros nuevos.** Vicens + Wonder + material ya en el repo. |
| 5 | Imágenes | Capacidad **futura** del sistema: el lema *puede* llevar `image.ref`; **origen de assets no decidido**. |
| 6 | Listening / Phonics | **Fase posterior.** Primera versión = **100 % offline, sin audio**. |
| 7 | CLIL | **Fuera de alcance** inicial (mating8/11 ciencia en inglés descartados). |

**Contrato de lema (diseño; sin JSON aún):**

`id` · `lemma` (EN-GB) · `glossEs` · `topicIds[]` · `image.ref?` · `audio.ref?` (solo packs futuros) · `level: 3-primaria` · `locale: en-GB`

---

## 1. Objetivo y límites

### Qué es
Arquitectura editorial del módulo **Llengua Estrangera (inglés)** para Aray: ~9 años, **3.º Primaria Cataluña** (ciclo medio 3.º–4.º, Decret 175/2022).

### Qué no es (esta fase)
- No copiar ejercicios.
- No listar palabras ni distractores.
- No crear Markdown de banco ni JSON.
- No pantallas, catálogo, Matemáticas ni Ortografía.

### Principio
Las fichas son referencia de **temas y nivel**. Aray enseña lo mismo en formato videojuego.

### Planificación de producto
| Antes | Ahora |
|-------|--------|
| Problemas verbales como siguiente gran bloque | **Cancelado** |
| — | **Inglés** = siguiente gran módulo de contenido |

---

## 2. Fuentes (cerradas para construcción)

| Fuente | Rol |
|--------|-----|
| Decret 175/2022 · Llengua Estrangera | Marco competencial ciclo medio |
| Vicens Vives (`angles_mating3`) | Unidades temáticas y estructuras |
| Wonder 3 · Richmond/Santillana | Feelings, food, tipología coursebook |
| Cuaderno verano 3 EP | Temas base (colores, familia, ropa…) |
| `feinetas/Ingles/*.pdf` | Revisión visual de mesa (escaneos; sin OCR usable) |
| BEX `03_angles.md` | Tipología de ejercicios (no copiar) |

**No** se espera ANAYA / SM / Savia inglés para congelar packs.  
**No** se usan mating8/11 (CLIL).

---

## 3. Índice definitivo de packs

Un pack = futuro archivo editorial → JSON bajo ruta orientativa `feinetas/ingles/`.  
**Ningún pack de la ola offline requiere audio para ser jugable.**

### Leyenda

- **Reuso Ortografía:** sí = MCQ / scramble / intrusa / miss-keys vía mismo estilo de adaptadores; parcial = solo algunas mecánicas; no = necesita motor distinto o audio.
- **Imagen:** el campo `image.ref` es opcional en el contrato; la mecánica Imagen/Match se activa cuando existan assets (origen TBD).

---

### Pack 1 — `ingles-colours-numbers`

| Campo | Valor |
|-------|--------|
| **Nombre** | Colours & numbers (1–20) |
| **Objetivo** | Colores básicos + números **one–twenty** (lectura/escritura de palabra). Base visual y ortográfica corta. |
| **Prioridad** | **Alta** (primer pack a construir) |
| **Tamaño** | mín. **28** · máx. **40** (≈ 10–12 colores + 20 números; sin 30–100) |
| **Mecánicas compatibles** | MCQ · Scramble · Intrusa · Imagen (futuro) · Match (futuro) |
| **Audio futuro** | Conveniente (pronunciación); **no bloqueante** |
| **Reuso Ortografía** | **Sí, completo** (mismo patrón de lemas) |
| **Depende de** | — (pack raíz) |

---

### Pack 2 — `ingles-school`

| Campo | Valor |
|-------|--------|
| **Nombre** | School |
| **Objetivo** | Objetos de aula y zonas del colegio (classroom, playground, library…). |
| **Prioridad** | **Alta** |
| **Tamaño** | mín. **28** · máx. **45** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match · Completar (frases muy cortas del propio pack) |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí, completo** |
| **Depende de** | Ideal tras Pack 1 (mismas mecánicas; no dependencia de lemas) |

---

### Pack 3 — `ingles-family`

| Campo | Valor |
|-------|--------|
| **Nombre** | Family |
| **Objetivo** | Miembros de la familia y relaciones simples (*mum, dad, sister…*). |
| **Prioridad** | **Alta** |
| **Tamaño** | mín. **14** · máx. **24** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí, completo** |
| **Depende de** | — (independiente de lemas; conviene tras Pack 1–2 por hábito de juego) |

---

### Pack 4 — `ingles-body`

| Campo | Valor |
|-------|--------|
| **Nombre** | Body & face |
| **Objetivo** | Partes del cuerpo y cara (*eyes, nose, hair…*). |
| **Prioridad** | **Alta** |
| **Tamaño** | mín. **14** · máx. **24** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí, completo** |
| **Depende de** | — |

---

### Pack 5 — `ingles-clothes`

| Campo | Valor |
|-------|--------|
| **Nombre** | Clothes |
| **Objetivo** | Ropa cotidiana (+ invierno básico: *hat, gloves…* según Wonder/Vicens). |
| **Prioridad** | **Media** |
| **Tamaño** | mín. **18** · máx. **32** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match · Completar (*I'm wearing…* plantillas del pack) |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí** (Completar = parcial, plantillas del pack) |
| **Depende de** | Pack 4 recomendable antes si se cruzan *hair/eyes* en descripción; **no obligatorio** |

---

### Pack 6 — `ingles-food`

| Campo | Valor |
|-------|--------|
| **Nombre** | Food |
| **Objetivo** | Alimentos frecuentes; gustos (*I like / I don't like*); petición simple (*Can I have…?*) como chunks del pack. |
| **Prioridad** | **Alta** |
| **Tamaño** | mín. **28** · máx. **42** (lemas + pocos chunks) |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match · Completar |
| **Audio futuro** | Muy útil en chunks; **no bloqueante** en v1 |
| **Reuso Ortografía** | **Sí** (Completar parcial) |
| **Depende de** | Pack 1 útil si se cruzan colores (*a red apple*); **no obligatorio** |

---

### Pack 7 — `ingles-animals`

| Campo | Valor |
|-------|--------|
| **Nombre** | Animals & can |
| **Objetivo** | Animales (pets/farm) + verbos de habilidad en chunks cortos (*I can swim*). |
| **Prioridad** | **Media** |
| **Tamaño** | mín. **22** · máx. **38** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match · Completar |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí** (Completar parcial) |
| **Depende de** | — |

---

### Pack 8 — `ingles-me-chunks`

| Campo | Valor |
|-------|--------|
| **Nombre** | Me & useful phrases |
| **Objetivo** | Saludos y **chunks fijos** (*What's your name?, How old are you?, Have you got…?*). Lista cerrada, no escritura libre. |
| **Prioridad** | **Alta** |
| **Tamaño** | mín. **16** · máx. **30** (casi todo chunks) |
| **Mecánicas** | Completar · Ordenar palabras · MCQ de respuesta fija · (Imagen solo si hay escena) |
| **Audio futuro** | **Alta prioridad** cuando exista audio; v1 = solo texto |
| **Reuso Ortografía** | **Parcial** (Completar / ordenar como frases; no scramble de letra suelta como lema corto) |
| **Depende de** | Packs 1–3 **recomendados** (edad, colores, familia refuerzan contexto); chunks pueden existir solos |

---

### Pack 9 — `ingles-home`

| Campo | Valor |
|-------|--------|
| **Nombre** | Home |
| **Objetivo** | Habitaciones y objetos de casa; *there is/are*; preposiciones (*on / under / behind*) en MCQ o escena. |
| **Prioridad** | **Media** |
| **Tamaño** | mín. **24** · máx. **40** |
| **Mecánicas** | MCQ · Scramble · Intrusa · Imagen · Match · Completar · **Prepositions** (mecánica propia futura, opcional) |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Parcial** (léxico sí; preposiciones hotspot = propia) |
| **Depende de** | Pack 2 (school) opcional por contraste *classroom/house* |

---

### Pack 10 — `ingles-time-days`

| Campo | Valor |
|-------|--------|
| **Nombre** | Days & seasons |
| **Objetivo** | Días de la semana y estaciones. **Sin** listening de la hora; reloj hablado fuera de esta ola. |
| **Prioridad** | **Media** |
| **Tamaño** | mín. **12** · máx. **20** (7 días + 4 estaciones ± extras) |
| **Mecánicas** | MCQ · Scramble · Intrusa · Completar · (Imagen débil salvo iconos estación) |
| **Audio futuro** | Útil (días); no bloqueante |
| **Reuso Ortografía** | **Sí** |
| **Depende de** | — |

---

### Pack 11 — `ingles-feelings`

| Campo | Valor |
|-------|--------|
| **Nombre** | Feelings & looks |
| **Objetivo** | Emociones (*happy, sad, scared…*) y descripción simple (*has got glasses / long hair*). |
| **Prioridad** | **Media** |
| **Tamaño** | mín. **18** · máx. **30** |
| **Mecánicas** | MCQ · Intrusa · Imagen · Match · Completar |
| **Audio futuro** | Conveniente |
| **Reuso Ortografía** | **Sí** (Completar parcial) |
| **Depende de** | Pack 4–5 recomendables (*hair, glasses, clothes*) |

---

### Pack 12 — `ingles-phonics-a` · **APLAZADO**

| Campo | Valor |
|-------|--------|
| **Nombre** | Phonics starter |
| **Objetivo** | Sonidos iniciales (estilo Wonder). |
| **Prioridad** | **Baja** (fuera de la primera versión offline) |
| **Tamaño** | mín. **12** · máx. **20** |
| **Mecánicas** | Phonics sonido→opción (**propia**) |
| **Audio futuro** | **Obligatorio** |
| **Reuso Ortografía** | **No** |
| **Depende de** | Infra audio + decisión de producto |

---

### Pack 13 — `ingles-listening-a` · **APLAZADO**

| Campo | Valor |
|-------|--------|
| **Nombre** | Listening pack A |
| **Objetivo** | Comprensión oral con escenas cortas. |
| **Prioridad** | **Baja** (fase audio) |
| **Tamaño** | mín. **10** · máx. **15** escenas |
| **Mecánicas** | Listen & choose (**propia**) |
| **Audio futuro** | **Obligatorio** |
| **Reuso Ortografía** | **No** |
| **Depende de** | Infra audio; conviene tener Packs 1–8 con lemas ya congelados |

---

### Totales orientativos

| Ámbito | Packs | Ítems (suma mín–máx) |
|--------|------:|----------------------|
| Offline construibles ahora (1–11) | 11 | **~232 – 365** |
| Aplazados audio (12–13) | 2 | ~22 – 35 |

---

## 4. Orden recomendado de desarrollo (editorial)

Solo packs **offline**. Sin palabras todavía: este orden es el de **abrir bancos Markdown**.

| Paso | Pack | Prioridad | Motivo |
|-----:|------|-----------|--------|
| 1 | `ingles-colours-numbers` | Alta | Raíz; números acotados 1–20; palabras cortas |
| 2 | `ingles-school` | Alta | Volumen alto; muy presente en Vicens |
| 3 | `ingles-family` | Alta | Banco pequeño; rápido de congelar |
| 4 | `ingles-body` | Alta | Visual; refuerza descripción |
| 5 | `ingles-food` | Alta | Enganche + chunks cortos |
| 6 | `ingles-me-chunks` | Alta | Frases útiles; cierra el “puedo presentarme” |
| 7 | `ingles-clothes` | Media | Amplía descripción |
| 8 | `ingles-animals` | Media | Variedad y *can* |
| 9 | `ingles-home` | Media | Estructuras *there is* / prep. |
| 10 | `ingles-time-days` | Media | Banco pequeño |
| 11 | `ingles-feelings` | Media | Cierra ola offline |
| — | `ingles-phonics-a` | Baja | Tras audio |
| — | `ingles-listening-a` | Baja | Tras audio |

---

## 5. Dependencias entre packs

```
ingles-colours-numbers          (raíz)
        │
        ├─(recomendado)──► ingles-school
        │
        ├─(recomendado)──► ingles-food  (colores en comida)
        │
ingles-family ──┐
ingles-body ────┼─(recomendado)──► ingles-me-chunks
ingles-school ──┘                  ingles-feelings
ingles-clothes ───────────────────► ingles-feelings
ingles-body / clothes ─(recomendado)► ingles-feelings

ingles-home          (casi independiente; opcional tras school)
ingles-animals       (independiente)
ingles-time-days     (independiente)

ingles-phonics-a     ── requiere audio (no depende de lemas concretos)
ingles-listening-a   ── requiere audio + conviene lemas 1–8 congelados
```

**Regla:** ninguna dependencia es bloqueante técnica para escribir un banco; las flechas son **pedagógicas** (mejor experiencia si el niño ya vio el léxico previo).

---

## 6. Mecánicas: mapa global

| Mecánica | Packs offline | Reuso Ortografía | Notas |
|----------|---------------|------------------|-------|
| MCQ | 1–11 | Sí | Distractores **solo** editoriales del pack |
| Scramble / letra que falta | 1–7, 9–10 | Sí | Palabras cortas EN-GB |
| Intrusa | 1–7, 9–11 | Sí | Mismo campo semántico |
| Completar frase | 5–9, 11 | Parcial | Plantillas cerradas del pack |
| Ordenar palabras | 8 | Parcial | Chunks |
| Imagen / Match | 1–7, 9, 11 | Sí cuando haya `image.ref` | Origen assets **TBD** |
| Prepositions hotspot | 9 | No (propia) | Futuro; mientras tanto MCQ texto |
| Phonics / Listen | 12–13 | No | Fuera de v1 |

---

## 7. Offline vs audio (frontera fija)

| Incluido en primera versión | Aplazado |
|-----------------------------|----------|
| Packs 1–11 | Packs 12–13 |
| Texto + glosa ES | Listening |
| Mecánicas tipo Ortografía | Phonics por sonido |
| `image.ref` opcional (sin decidir assets) | Speak / dictado |
| Sin `audio.ref` obligatorio | Diálogos orales |

---

## 8. IDs y categorías (futuro producto — no implementar)

- Lema: `en:{packShort}:{slug}` → `en:school:pencil-case`
- Chunk: `en:chunk:{slug}` → `en:chunk:whats-your-name`
- Miss key = mismo id

Categorías futuras (sin tocar catálogo ahora): `english-vocab` · `english-picture` · `english-phrases` · `english-listen` · `english-review`

Curriculum interno ya tiene bloques `vocabulary` / `word-image` / `simple-phrases` en `future` — este master los respalda.

---

## 9. Dudas editoriales pendientes

Solo quedan puntos **no bloqueantes** para abrir el Pack 1:

1. **Origen de assets de imagen** (cuándo se active Imagen/Match): pack propio Aray vs banco con licencia — **aplazado a propósito**.
2. **Revisión visual** de `feinetas/Ingles/*.pdf` en mesa al llenar cada banco (proceso, no decisión abierta).

**Cerradas y no reabrir sin cambio de producto:** locale `en-GB`, glosas solo ES, números 1–20 en primer pack, fuentes actuales, sin audio/phonics/listening/CLIL en v1.

---

## 10. Checklist — siguiente paso humano

- [x] Decisiones §0 cerradas  
- [x] Índice definitivo de packs  
- [x] Orden y dependencias  
- [ ] Abrir `BANCO_INGLES_COLOURS_NUMBERS.md` (o nombre acordado) — **aún no en esta entrega**  
- [ ] Congelar lemas Pack 1 con respaldo de ficha  
- [ ] Solo después: JSON + ingeniería de juego  

---

## 11. Resumen

Arquitectura editorial de Inglés **cerrada para Fase 1**.  
**11 packs offline** listos para bancos Markdown; **2 aplazados** (phonics/listening).  
Primer desarrollo: **`ingles-colours-numbers`** (colores + **1–20**).  
Motor Ortografía reusable en la mayoría de packs léxicos; chunks = parcial; audio = fase aparte.  
Sin JSON, sin pantallas, sin vocabulario todavía.
