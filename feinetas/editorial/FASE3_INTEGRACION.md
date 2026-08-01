# Fase 3 — Integración Ortografía JSON

## Dos estados

### 1. Modos JSON

`correct`, `missing`, `picture`, `intruder`, y la parte JSON de `mix` / `review`.

- Fuente: unión de 10 packs en `feinetas/ortografia/*.json` vía `ortographyCorpus`.
- Prohibido: `SPELL_BANK`, `lemmas.generated.ts`, `makeDistractors`, fallback silencioso a legacy.
- `targetKey`: `{packId}:{lemmaId}` (ej. `ortografia-rr:rr-perro`).

### 2. `complete` legacy temporal

- Fuente: solo `SPELL_CONTEXTS` en `src/spelling/types.ts`.
- Puerta: `src/spelling/legacyComplete.ts` con `SPELL_COMPLETE_USES_LEGACY = true`.
- Catálogo: único `spelling-complete` con `source: 'legacy'` y `mechanicId: 'legacy-spell'`.
- En `mix`: slots `complete` llaman explícitamente a `legacyComplete` (no a bank).
- En `review`: claves `ctx:*` solo regeneran frases; no cruzan con JSON.

## Ruta de retirada de `complete`

1. Banco editorial de frases auditado (fichas 3.º).
2. Pack JSON de frases + schema.
3. Adaptador `complete` desde pack.
4. `SPELL_COMPLETE_USES_LEGACY = false`.
5. Borrar `SPELL_CONTEXTS`, `legacyComplete`, `legacy-spell` del catálogo.
6. Si no quedan consumidores: retirar `lemmas.generated.ts` / `bank.ts` / `distract.ts`.

## Tests de arquitectura

`src/minigames/ortografia.architecture.test.ts` garantiza que los adaptadores JSON no importan el bank legacy.
