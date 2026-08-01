# Fase 4 — Completa la frase editorial

## Estado

**Cerrado.** Ortografía funciona íntegramente sobre contenido editorial aprobado (packs de lemas + pack de frases).

| Pieza | Ubicación |
|-------|-----------|
| Markdown congelado | `FRASES_COMPLETAR_ORTOGRAFIA.md` |
| JSON | `feinetas/ortografia/frases-completar.json` |
| Adaptador | `src/minigames/adapters/ortografiaComplete.ts` |

## Legacy retirado

- `SPELL_CONTEXTS` / `SpellContext` eliminados (no stub vacío).
- Eliminados `legacyComplete.ts` y `legacySpell.ts`.
- Catálogo: todos los `spelling-*` son `source: 'pack'` con `spellPlayMode`.
- Miss keys de frase: `ortografia-frases-completar:frase-*`.
- Claves `ctx:*` antiguas se ignoran en review.
- Ortografía del juego = packs editoriales aprobados (lemas + frases).

## Hotfix calidad (post v1.0)

- Modo **Imagen** desactivado (`coming-soon`) y fuera de Mezcla hasta `image.ref` reales.
- Distractores de lema: solo `errors[]` del propio ítem (sin heurísticas `-ón` / otros lemas).
- Lemas con errores ambiguos (palabra real / homófono) excluidos de Forma correcta e Intrusa.

## Condición cumplida

≥ 24 frases aprobadas → legacy de complete retirado.
