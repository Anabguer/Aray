# Fase 4 — Completa la frase editorial

## Estado

**Cerrado.** Ortografía funciona íntegramente sobre contenido editorial aprobado (packs de lemas + pack de frases).

| Pieza | Ubicación |
|-------|-----------|
| Markdown congelado | `FRASES_COMPLETAR_ORTOGRAFIA.md` |
| JSON | `feinetas/ortografia/frases-completar.json` |
| Adaptador | `src/minigames/adapters/ortografiaComplete.ts` |

## Legacy retirado

- `SPELL_CONTEXTS` vacío (sin frases TS).
- Eliminados `legacyComplete.ts` y `legacySpell.ts`.
- Catálogo: ningún `spelling-*` es `source: 'legacy'`.
- Miss keys de frase: `ortografia-frases-completar:frase-*`.
- Claves `ctx:*` antiguas se ignoran en review.

## Condición cumplida

≥ 24 frases aprobadas → legacy de complete retirado.
