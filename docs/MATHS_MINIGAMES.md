# Matemáticas en MINIGAME_CATALOG (Fase 4)

## Objetivo

Registrar Tablas, Cálculo, Dinero y Horas como minijuegos de primera clase,
**sin** migrar contenido a packs JSON ni cambiar UX/rutas/XP.

## Arquitectura

```
catalog (maths-legacy, source:legacy)
    → buildRound(minigameId)
    → adapters/maths{Calc,Money,Clocks,Tables}.ts
    → generadores actuales (sin cambios)
    → MathsQuestion (contrato común)
```

Las pantallas de `features/maths/*` **siguen** llamando a los generadores
directamente. `buildRound` es el punto de entrada unificado para tests y
futuras migraciones de UI.

## Contrato `MathsQuestion`

`questionId`, `skillId`, `modeId`, `prompt`, `options`, `answer`,
`difficulty?`, `metadata`.

## Presentaciones (`presentation`)

Etiquetado de mecánicas reutilizables (sin extraer pantallas todavía):
`mcq` · `match` · `learn` · `timer` · `build` · `order` · `compare` ·
`truefalse` · `review` · `summary`.

Helper compartido: `isMcqIndexCorrect`.

## Fuera de alcance

Packs JSON, editorial, divisiones/problemas/geometría/medidas,
cambios visuales, recompensas, daily.
