# Sistema de diseño ARAY

Documento de referencia visual y de interacción. Las pantallas deben reutilizar estos tokens y patrones; no improvisar estilos sueltos.

## Personalidad

ARAY es una app de videojuego moderna para un niño de ~9 años aficionado a Roblox, Fortnite y juegos competitivos ligeros. Debe sentirse:

- Dinámica, luminosa y táctil.
- Clara y legible (también para adultos).
- Motivadora, nunca punitiva.

No es: campus escolar, web corporativa, mascota bebé, ni copia de Roblox/Minecraft.

## Público

- Principal: Aray (9 años).
- Secundario: adulto que valida el drop y revisa progreso.

## Paleta (tokens CSS en `:root`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-deep` | `#071528` | Fondo base |
| `--bg-panel` | `#0b1f3a` | Paneles / tarjetas |
| `--bg-panel-2` | `#10284a` | Elevación |
| `--sky` | `#38bdf8` | Acentos claros |
| `--sky-strong` | `#0ea5e9` | CTAs primarios |
| `--cyan` | `#22d3ee` | Energía / brillos |
| `--violet` | `#a78bfa` | Acento secundario |
| `--violet-hot` | `#8b5cf6` | Gradientes |
| `--lilac` | `#c4b5fd` | Badges / meta |
| `--text` | `#eef7ff` | Texto principal |
| `--text-muted` | `#9db6d4` | Texto secundario |
| `--ok` | `#4ade80` | Acierto |
| `--warn` | `#fbbf24` | Tiempo medio |
| `--urgent` | `#fb7185` | Últimos segundos / error suave |
| `--shadow` | `0 18px 40px rgba(0,8,24,.45)` | Profundidad |

## Tipografía

- Display: **Outfit** (`--font-display`) — títulos, operaciones, CTAs.
- Cuerpo: **Nunito** (`--font-body`) — textos de apoyo.

### Jerarquía y tamaños

| Rol | Rango | Notas |
|-----|-------|-------|
| Marca / saludo | `clamp(1.7rem, 5vw, 2.35rem)` | Hero |
| Operación matemática | `clamp(1.75rem, 7vw, 2.75rem)` | Nunca invade toda la pantalla |
| Título de sección | `1.15–1.45rem` | |
| Cuerpo | `0.9–1rem` | |
| Meta / captions | `0.75–0.85rem` | |
| Mínimo táctil de texto en botones | `1rem` | |

## Espaciado y forma

- Escala: `0.35 / 0.55 / 0.75 / 1 / 1.25 / 1.5 rem`.
- Radios: `--radius-sm` 0.75rem, `--radius-md` 1rem, `--radius-lg` 1.35rem.
- Target táctil mínimo: `--touch` 3rem (48px).
- Safe areas: `--safe-top`, `--safe-bottom`.

## Componentes reutilizables

- `AppShell` — topbar + fondo.
- `BrandLogo` — marca oficial PNG (`src/assets/brand/aray-logo.png`).
- `btn` / `btn-primary` / `btn-secondary` / `btn-ghost` / `btn-block`.
- `zone-card`, `subject-card`, `table-chip`, `mode-card`.
- `ModeIcon` — iconos SVG de modos (`src/components/ModeIcon.tsx`).
- `answer-btn` + `answer-grid`.
- `goal-card` (barra de energía / drop).
- `Lumo` — estados documentados en `src/lumo/`.
- `FeedbackBanner`, `FactPrompt`, `MuteToggle`.
- Barra de tiempo de reto: `.timer-bar` + estados `ok` / `warn` / `urgent`.

No duplicar botones o barras con estilos one-off si ya existe el patrón.

## Marca / logo

| Uso | Ruta |
|-----|------|
| Componente app | `src/components/BrandLogo.tsx` → `src/assets/brand/aray-logo.png` |
| Copia estática (APK / hosting) | `public/brand/aray-logo.png` |
| Favicon | `public/favicon.png` |
| Apple touch | `public/apple-touch-icon.png` |
| Iconos PWA / Android | `public/icons/icon-{16…512}.png` |
| Manifest | `public/site.webmanifest` |

Variantes CSS: `.brand-logo--hero` (inicio, dentro de máscara orgánica), `--compact` (topbar), `--mark` (marca suelta).

En la home el logo va a la **derecha** del saludo, con máscara redondeada orgánica (`.hero__logo-wrap` / `.lobby__logo`) y **borde neón animado**.

## Layout responsive (contenedor)

| Viewport | `.app-main` |
|----------|-------------|
| &lt; 1024px | `min(720px, 100%)` — columna móvil/tablet |
| ≥ 1024px | `min(1240px, calc(100vw - 64px))` — lobby de escritorio |

Lobby PC: cabecera 2 zonas; misión (~2/3) + drop (~1/3); debajo Misiones / Mi colección. Móvil: una columna.

## Iconos de lobby y asignaturas

Familia PNG (`418×418`, fondo transparente) en `src/assets/icons/hub/`.

Registro tipado: `hubIconUrl()` + componente `ArayHubIcon`.

| Archivo | Uso |
|---------|-----|
| `tablas.png` | Misión de hoy (actividad) |
| `drop_robot.png` | Próximo drop |
| `misiones.png` | Acceso Misiones |
| `coleccion.png` | Mi colección |
| `matematicas.png` | Asignatura Matemáticas |
| `catalan.png` | Catalán |
| `castellano.png` | Castellano |
| `ingles.png` | Inglés |
| `medi.png` | Medi |

No sustituir por emojis ni iconos genéricos. Lumo es el compañero, no el icono de cada tarjeta.

## Iconos de modos (tablas)

Familia SVG propia de ARAY. Ubicación: `src/assets/icons/modes/`.

| Archivo | Modo | Componente |
|---------|------|------------|
| `aprende.svg` | Aprende | `<ModeIcon mode="aprende" />` |
| `entrena.svg` | Entrena | `<ModeIcon mode="entrena" />` |
| `reto-rapido.svg` | Reto rápido | `<ModeIcon mode="reto-rapido" />` |
| `mis-fallos.svg` | Practicar mis fallos | `<ModeIcon mode="mis-fallos" />` |
| `empareja.svg` | Empareja la tabla | `<ModeIcon mode="empareja" />` |
| `mision-random.svg` | Misión random | `<ModeIcon mode="mision-random" />` |

### Uso

- Un solo componente reutilizable: `ModeIcon`. No incrustar el SVG en cada tarjeta ni duplicar variantes.
- El icono va a la izquierda del título/descripción (`.mode-card`) o del label (`.mode-action`).
- Decorativo: `aria-hidden="true"` en el contenedor; el nombre accesible lo aporta la tarjeta/botón.
- `reto-rapido.svg` ya incluye el distintivo `×2`. No añadir otra insignia grande que repita eso; el texto de la tarjeta sí puede indicar “XP ×2”.

### Tamaños

| Viewport | Tamaño |
|----------|--------|
| Móvil | 44–50 px (actual: 46 px / `2.875rem`) |
| Tablet y escritorio (≥768px) | 52–60 px (actual: 56 px / `3.5rem`) |
| Tope absoluto | 60 px (`max-width` / `max-height: 3.75rem`) |

Nunca deben crecer para rellenar el espacio disponible. En acciones inferiores (`.mode-action`) se usa un tamaño ligeramente menor para no hinchar el botón.

### Estados

| Estado | Icono | Tarjeta / acción |
|--------|-------|------------------|
| Normal | sin transform | borde estándar |
| Hover | `translateY(-2px) scale(1.04)` + halo suave (`--mode-accent`) | brillo de borde existente |
| Focus (`:focus-visible`) | igual que hover | `outline: 2px solid var(--cyan)` + offset |
| Seleccionado (`.is-selected` / `[aria-pressed="true"]`) | igual que hover | borde cian + anillo; no solo color |

Sin giros, rebotes ni animaciones en bucle.

### Movimiento reducido

Con `prefers-reduced-motion: reduce` se elimina la elevación y la escala del icono (el halo/filtro puede permanecer; las transitions globales ya se anulan).

### Prohibiciones

- No sustituir estos SVG por emojis.
- No mezclar iconos genéricos de otra librería en las tarjetas de modo.
- No redibujar ni recolorear trazo a trazo: mantener la familia visual del paquete.

## Lumo

Compañero de luz de ARAY. SVG/CSS editable (`src/lumo/`), nunca imagen fija ni GIF. Las partes se animan por clase CSS; el estado lo gobierna `useLumoController` (un solo temporizador).

### Anatomía (viewBox 120×120)

| Parte | Clase | Rol |
|-------|-------|-----|
| Sombra | `.lumo__shadow` | Elipse inferior; se comprime al saltar |
| Orejitas | `.lumo__ear--l` / `--r` | Extensiones cortas redondeadas, inclinadas ~32°, mismo degradado del cuerpo |
| Cuerpo | `.lumo__body` | Cápsula redondeada, degradado `#7dd3fc → #38bdf8 → #6366f1` |
| Brazo izq./der. | `.lumo__arm--l` / `--r` | Muñones ovalados a los lados; animables por separado |
| Barriga | `.lumo__belly` | Óvalo de energía en la **mitad inferior** |
| Pulso barriga | `.lumo__belly-glow` | Anillo que se expande una vez al ganar energía |
| Patita izq./der. | `.lumo__leg--l` / `--r` | Óvalos bajos; no ensanchan mucho la silueta en reposo |
| Ojos / pupilas | `.lumo__eye*` / `.lumo__pupils` | Parpadeo y mirada vía CSS (sin re-render de pantalla) |
| Boca | `.lumo__mouth` / `.lumo__mouth-oops` | Trazo pequeño independiente, **por encima** de la barriga |
| Aura / sparks | `.lumo__aura` / `.lumo__spark` | Brillo ambiental y partículas puntuales |

Orden de pintura: orejitas → brazos → cuerpo → barriga → patitas → cara.

### Proporciones

- Centro del cuerpo ≈ `(60, 58)`; base del cuerpo ≈ `y=100`.
- Ojos ≈ `y=46`; boca ≈ `y=58` (sonrisa corta).
- Barriga: centro `(60, 84)`, `rx≈16`, `ry≈12` — **no invade** la zona de ojos; separación clara respecto a la boca (~y=57).
- Orejitas: picos ~`y=6–12`, cortas; deben leerse también en `sm`.
- Extremidades: brazos ~`y=70`, patitas ~`y=102`; formas blandas sin dedos.
- Tono barriga en idle: azulado (`#a8d8f0 → #6bc4e8`), **nunca blanco puro** (evitar aspecto de hocico/barba).

### Tamaños recomendados

| Token | CSS | Uso |
|-------|-----|-----|
| `sm` (mín. recomendado) | `3.75rem` (60px) | GoalCard, Empareja |
| `md` | `5.5rem` (88px) | Entrena, Reto |
| `lg` (máx. habitual) | `7rem` (112px) | Hero portada, resumen |

No subir la altura del topbar ni del hero para “hacer caber” a Lumo: el viewBox ya incluye orejitas y patitas.

Galería de QA visual (desarrollo): ruta `/dev/lumo` (`LumoGallery`).

### Estados visuales y animaciones

| Estado | Situación | Qué se mueve | Duración aprox. |
|--------|-----------|--------------|-----------------|
| `idle` | Reposo | Respiración suave; parpadeo; mirada ocasional al lado y vuelta | Continuo (breathe 3.6s, blink 5.5s, glance 8s) |
| `thinking` | Esperando respuesta | Mirada rápida L↔R; manitas y patitas fidget **pocas repeticiones** luego quietas; squish 1 vez | Fidget ~1.6s; mirada continúa mientras espera |
| `correct` | Acierto | Saltito; manitas arriba; ojos alegres (entrecerrados); pulso barriga | **700ms** (`lumoDurations.correct`) |
| `incorrect` | Fallo + reintento | Cabeza inclinada; mirada hacia la zona de respuestas; una manita cerca de la cara; boca “hmm” | **900ms** → vuelve a `thinking` |
| `streak` | Energía / racha 3–5 | Hop + brillo barriga + un pulso expandible + sparks **una vez** | **1100ms** |
| `celebration` | Racha 10 / récord / meta | Celebrate + brazos + ojos alegres + pulso; sparks limitados (no loop eterno) | **1800ms** |

Intensidad (`0–4`): escala el brillo de la barriga y, en `i3`/`i4`, el aura. Umbrales de reacción: racha 3 / 5 / 10 en `reactionFromAnswer`.

Reglas de tono:

- Error: nunca llanto, enfado ni rojo agresivo; inclinación pensativa y vuelta a atención.
- Thinking: gracioso, no ansiedad.
- Energía: pulso puntual, sin destellos constantes.
- Feedback textual (`lumo-caption` / mensajes) obligatorio además de la animación.

### Movimiento reducido (`prefers-reduced-motion: reduce`)

- Se anulan las animaciones ornamentales.
- Sustitución: expresión estática (ojos alegres / cabeza inclinada / manita pensativa) y mayor luminosidad de barriga/aura.
- El controller acorta reacciones a ≤200ms.

### API

```ts
<Lumo state="idle" intensity={0} size="md" label="…" />
```

Controller: `useLumoController` — un timer; no dispersar `setTimeout` por pantallas.

## Animaciones

- Cortas (≤ 1.2s salvo celebración).
- Sin loops agresivos.
- Con `prefers-reduced-motion: reduce` → sin movimiento ornamental.

## Responsive

| Viewport | Reglas |
|----------|--------|
| Móvil | 1 columna Explora; tarjetas compactas; Empareja en rondas de máx. 5 |
| Tablet | 2 columnas zonas; tablas en rejilla 4; Empareja ops + resultados en 2 columnas |
| Desktop | Aprovechar ancho; tablas 4×2; Empareja sigue en rondas compactas (máx. 5) |

## Conceptos visibles (niño)

- **Lumo** — compañero.
- **Energía** — carga del drop (no “puntos de recompensa”).
- **Drop** — recompensa al llegar a 300 de energía.
- **XP** — progreso general.
- **Dominio** — solo donde aporte (cartas de nivel).
- **Misión random** — acceso aleatorio a modos ya terminados.
- **Cajas** — sorpresa extra al completar; no se compran.

Monedas internas pueden existir, pero **no** llenan el drop.

## Lobby y niveles

- Portada = lobby compacto: identidad + misión de hoy + accesos + stats (XP/monedas/energía/cajas).
- Explicaciones largas van en `<details>` / ayuda, no en el primer viewport.
- Selección de tablas = mapa de **cartas de nivel** (`TableLevelCard`) con arte `src/assets/tables/tabla-N.png` (`object-fit: cover`).
- Estados HTML: Nueva, En marcha, Casi/Sólida, ¡Domada!, Domada · Conviene repasar, Necesita entreno.
- Modos = miniportadas con `ModeIcon` y color propio; texto corto escaneable.

## Cajas

- Arte: `src/assets/rewards/caja-*.png` (`object-fit: contain`).
- Rarezas visuales: normal (cian), especial (violeta), épica (dorado).
- Animación CSS (entrada / temblor / apertura / revelado); sin editar PNG.
- Persistencia e idempotencia: ver `docs/CRATES.md`.

## Matemáticas en pantalla

- Unidades de “Aprende”: tamaño acotado (`--learn-unit-min` / `--learn-unit-max`), cuadrícula compacta.
- No rellenar el viewport con cuadrados gigantes.
- Tabla inferior visible; scroll de página, no cajitas internas minúsculas.

## Barra de tiempo (Reto)

- Llena al inicio → se vacía de forma continua (`performance.now`).
- Estados: ok (cian/verde), warn (ámbar), urgent (coral + pulso suave).
- Texto de segundos siempre visible (no solo color).

## Tarjetas arrastrables (Empareja)

Validación **inmediata** al soltar / tocar / teclado. Sin botón «Comprobar».

### Cabecera compacta
- Icono de Empareja + «Tabla del N» + «Ronda X de Y · a/b parejas» + energía máxima.
- Indicaciones cortas junto a Lumo (`sm`); la ayuda larga solo al inicio.

### Rondas
- Máximo 5 parejas por ronda (`MATCH_MAX_PER_ROUND`).
- Rango global `matchFactorRange` (por defecto 1–10): ronda 1 = factores 1–5, ronda 2 = 6–10.
- Si el rango llega a 12: tercera ronda 11–12, o distribución 4+4+4 cuando hay exactamente 12.
- Al completar: celebración + resumen de intentos/correcciones → «Siguiente ronda» / «¡Tabla emparejada!».
- No avanzar con parejas pendientes.

### Operaciones (tarjetas de misión)
- Compactas, táctiles, acentos rotativos: cian / violeta / lima / naranja / coral.
- Hueco amplio de destino: borde discontinuo + texto «Arrastra aquí» (no un guion mínimo).
- Estados: idle, target (resultado seleccionado), filled breve, locked-correct (✓ + color ok + pop), wrong (borde coral + shake corto).

### Resultados (piezas coleccionables)
- Bloques redondeados con color, volumen (sombra inferior) y brillo.
- Acentos sky / violet / lime / amber / coral (no azul oscuro idéntico).
- Seleccionado: se eleva + outline ámbar + texto «Resultado seleccionado».
- Fallo: bounce-back al pool; sigue interactivo.

### Validación
- Acierto: fija la pareja, pop, sonido `correct`, Lumo acierto, recompensa de sesión una sola vez al terminar.
- Fallo: mensaje «Ahí no… prueba otra vez» (`aria-live`); sin revelar la respuesta; sin restar energía.
- Pistas: 2.º fallo → «Piensa en la tabla del N»; 3.º → rango («mayor que… menor que…»).
- Registrar intentos incorrectos para progreso / «Practicar mis fallos».
- `busyRef` + `lockedRef` evitan eventos simultáneos y recompensas duplicadas.

### Accesibilidad y movimiento
- Ratón, táctil, tap-to-assign y teclado (Tab + Enter/Espacio).
- Feedback no solo por color (✓, texto, shake, outline).
- `prefers-reduced-motion`: sin pop/shake/bounce; cambios de borde/outline.

Clases: `.match-screen`, `.match-header`, `.match-op` / `--cyan|violet|lime|orange|coral`, `.match-product` / `--sky|…`, `.match-op__slot`, `.match-round-end`.


## Feedback de error con reintento (Entrena)

1. Fallo → marca breve, Lumo suave, misma operación.
2. Sin revelar el producto al primer fallo.
3. Solo tras acertar → avanzar (y mostrar igualdad si hubo fallo previo).

## Dominio de tablas

- **¡Domada!** = mejor ronda histórica ≥ 8/10 a la primera (`everMastered` / `bestRoundScore`).
- Una ronda posterior < 8/10 → aviso temporal **Domada · Conviene repasar** (`consecutiveLowRounds = 1`).
- Dos rondas bajas consecutivas → estado principal **Necesita entreno**.
- Un 8/10+ limpia el aviso y reinicia la racha baja.
- Campos: `bestRoundScore`, `lastRoundScore`, `consecutiveLowRounds`, `everMastered` (`src/math/tableMastery.ts`).

## Tokens centralizados

Archivo: `src/index.css` (`:root`) y `src/config/playConfig.ts`.

- Color / tipografía / radios / touch / learn-unit
- `challengeModeConfig` (duración, countdown, umbrales, multiplicadores)
- `matchFactorRange` / `MATCH_MAX_PER_ROUND`
- `learnLayout` / `learnUnitSizePx`
- `energyCopy` / `rewardGoalConfig` / `matchSessionMeta`

## Componentes a reutilizar

`AppShell`, `btn*`, `GoalCard`, `Lumo`, `AnswerGrid`, `FactPrompt`, `FeedbackBanner`, `MuteToggle`, `.timer-bar`, `.table-chip`, `.mode-card`, `.match-op` / `.match-product`.

## Pantallas alineadas

Portada (GoalCard + Lumo), selección de tablas, modos, Aprende, Entrena, Reto, Empareja, Resumen.

## Pendiente de pulido visual

- Mi colección (próximamente): sin tokens de juego activos.
- Hub de materias no jugables: copy genérico, sin barra de tiempo ni Empareja.
