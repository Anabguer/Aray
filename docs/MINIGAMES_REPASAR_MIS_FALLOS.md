# Diseño definitivo — Minijuegos Aray

Complemento obligatorio al diseño técnico aprobado (minijuego → mecánica → pack).

---

## Repasar mis fallos (requisito obligatorio)

### Qué es (producto)

- Modo **visible** en el catálogo del área/categoría correspondiente (p. ej. Ortografía).
- Nombre de UI: **«Repasar mis fallos»**.
- **No** es un banco educativo independiente.
- **No** genera preguntas nuevas, distractores, frases ni opciones.

### Qué no es

| No es | Motivo |
|-------|--------|
| Pack JSON propio | No tiene ítems propios; solo referencias |
| Generador / builder procedural | Prohibido en el modelo definitivo |
| “Mis fallos” como mecánica inventada | Usa la **misma mecánica** del minijuego original |

### Persistencia (modelo definitivo = miss store v2)

Al fallar un ítem procedente de un **pack JSON**, guardar siempre:

| Campo | Descripción |
|-------|-------------|
| `packId` | Pack de origen |
| `itemId` | Ítem exacto dentro del pack |
| `minigameId` | Minijuego desde el que se falló |
| `misses` | Número de fallos acumulados |
| `streakHits` | Aciertos **posteriores** seguidos desde el último fallo |
| `lastMissAt` | Fecha/hora del último fallo |

Campos opcionales útiles (no sustituyen la identidad): `hits` totales, `updatedAt` genérico.

**Identidad global del fallo:** `(packId, itemId)`.  
`minigameId` indica con qué motor/UX se reexponen (misma mecánica del original).

### Al entrar en «Repasar mis fallos»

1. Leer solo entradas **pendientes** del miss store v2.
2. Resolver cada una con `getItem(packId, itemId)` desde el pack original.
3. Construir la ronda pasando el ítem **tal cual** al engine de la mecánica del `minigameId` (o de la mecánica registrada del minijuego).
4. **Prohibido:** regenerar distractores, frases u opciones; barajar opciones **solo** si el ítem ya las trae completas y la mecánica lo permite (mismo criterio que el minijuego original).
5. **Priorización** de la cola:
   - primero más `misses`;
   - a igualdad, más recientes por `lastMissAt`.

### Superación del ítem (racha)

- Un acierto **no** retira el ítem.
- Se considera **superado** tras **3 aciertos posteriores seguidos** sin volver a fallarlo (`streakHits >= 3` → eliminar de pendientes).
- Si vuelve a fallar:
  - `streakHits = 0`;
  - `misses += 1`;
  - actualizar `lastMissAt`;
  - sigue pendiente.

Constante alineada con legacy actual: `CLEAR_STREAK = 3` (hoy `SPELL_MISS_CLEAR_STREAK` en `src/spelling/missStore.ts`).

### Estado vacío (UI)

Si no hay fallos pendientes, mostrar estado positivo:

> **¡Repaso limpio! No tienes errores pendientes.**

Sin inventar ejercicios de relleno.

### Registro en el catálogo de minijuegos

```text
id:            repasar-mis-fallos   (o spelling-review / words-review por categoría)
titulo UI:     Repasar mis fallos
mecanica:      review                 (orquestador de replay)
source:        misses                 (no "pack" ni "legacy-generator")
packIds:       []                     # no tiene banco propio
```

Un área puede tener un «Repasar mis fallos» por categoría (Ortografía, Palabras, …) filtrando misses por `minigameId` / categoría.

---

## Encaje con miss store v2 (plan de migración)

| Pieza | Relación |
|-------|----------|
| **Fase 0 (hecha)** | Catálogo + `buildRound`; Ortografía sigue en adaptador legacy. Miss store **v1** intacto (`key` / `ctx:…`). |
| **Miss store v2** | Schema nuevo: `packId` + `itemId` + `minigameId` + contadores + `lastMissAt`. Storage p. ej. `afk.minigame.misses.v2.{playerId}` (o evolución versionada del actual). |
| **Compatibilidad legacy** | Durante la migración: dual-read. Fallos v1 (`targetKey`) siguen alimentando el review legacy vía generator **solo** mientras el minijuego sea `source: legacy`. |
| **Minijuegos JSON nuevos** | **Obligatorio** grabar y reponer solo con `packId` + `itemId`. Nunca reconstruir la pregunta con generadores. |
| **Modelo definitivo** | Solo v2 + replay desde packs. Retirar reconstrucción por generators al cutover de Ortografía. |

### Mapeo con el store legacy actual (`missStore` v1)

| Legacy v1 | Definitivo v2 |
|-----------|----------------|
| `key` (palabra / `ctx:id`) | Sustituido por `packId` + `itemId` |
| `rule?` | Metadato editorial opcional; no identidad |
| `misses` | `misses` |
| `streakHits` | `streakHits` (mismos 3 para limpiar) |
| `hits` | Conservable |
| `updatedAt` | Preferir `lastMissAt` en fallo; `updatedAt` en cualquier cambio |
| `(mode)` al registrar | `minigameId` explícito |

Migración best-effort v1→v2: solo si existe mapa estable `targetKey` → `(packId, itemId)`; si no, la entrada permanece en vía legacy hasta caducar o cutover.

### Relación con `buildRound`

```text
buildRound('…-repasar-mis-fallos' | review)
  → carga misses pendientes (v2)
  → ordena por misses ↓, lastMissAt ↓
  → para cada ref: load pack item + engine(minigameId)
  → NUNCA llama a generators de contenido
```

En Fase 0 / legacy: el adaptador `legacy-spell` + `spelling-review` puede seguir delegando en `buildSpellRound('review', …)` hasta que ese minijuego migre a packs.

---

## Checklist de aceptación (cuando se implemente)

- [ ] Cartel visible «Repasar mis fallos»
- [ ] Fallo JSON → persiste `packId`, `itemId`, `minigameId`, misses, streakHits, lastMissAt
- [ ] Replay = mismo ítem, misma mecánica; sin generators
- [ ] Prioridad: más fallos, luego más recientes
- [ ] Clear solo con 3 aciertos seguidos; fallo reinicia racha
- [ ] Vacío → «¡Repaso limpio! No tienes errores pendientes.»
- [ ] Legacy v1 compatible temporalmente; JSON solo v2
- [ ] Tests: persistencia, prioridad, clear streak, empty state, no regeneración

---

## Fase de implementación

**No forma parte de la Fase 0** (ya cerrada).

Implementar junto a **miss store v2** (plan: tras piloto MCQ con pack JSON; antes o en paralelo al review 100 % JSON).

Hasta entonces: este documento es la fuente de verdad del requisito; el runtime sigue en miss store v1 + review legacy.
