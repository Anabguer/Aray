# Fase 3 — Integración Ortografía JSON

**Actualización Fase 4:** Completa la frase ya no es legacy. Ver [`FASE4_FRASES_COMPLETAR.md`](./FASE4_FRASES_COMPLETAR.md).

## Estado final Ortografía

Todos los modos (`correct`, `missing`, `picture`, `intruder`, `complete`, `mix`, `review`) usan packs JSON aprobados.

- Lemas: `feinetas/ortografia/{rr,h,bv,…}.json`
- Frases: `feinetas/ortografia/frases-completar.json`
- Sin `SPELL_BANK` / `makeDistractors` / `SPELL_CONTEXTS` en el pipeline de juego.
