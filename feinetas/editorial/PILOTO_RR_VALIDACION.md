# Piloto RR — informe de validación técnica

Fecha: 2026-08-01  
Pack: `feinetas/ortografia/rr.json`  
Spec: `JSON_SPEC.md` v1 (congelado)  
Ruta DEV (no flujo principal): `/dev/ortografia-rr`

## Veredicto

**PILOTO APROBADO.**

El `JSON_SPEC` v1 es **suficiente** para el banco de lemas.  
No falta ningún campo **imprescindible** para continuar convirtiendo el resto de bancos.

No se ha modificado el schema.  
No se ha conectado el pack al flujo principal de Ortografía.  
No se ha tocado el spelling legacy.

---

## Comprobaciones ejecutadas

| # | Comprobación | Resultado |
|---|--------------|-----------|
| 1 | JSON carga correctamente | OK |
| 2 | Todos los registros cumplen schema v1 | OK (`validateOrtographyLemmaPack` = 0 issues) |
| 3 | 21 lemas accesibles (= MD congelado) | OK |
| 4 | Sin ids duplicados | OK |
| 5 | Sin lemas duplicados | OK |
| 6 | Errores ≠ lema correcto (+ sin errores duplicados internos) | OK |
| 7 | Campos obligatorios presentes | OK |
| 8 | Opcionales (`tip`, `tags`, `secondaryRuleIds`, `notes`) OK si existen / ausentes | OK |
| 9 | Adaptadores de modos sin mutar JSON | OK (MCQ, missing, picture-pool, intruder, scramble) |
| 10 | Sin dependencias ocultas del legacy | OK (imports solo `feinetas/*` + JSON) |
| 11 | Rendimiento (200 rondas × 21) | OK (< 250 ms) |
| 12 | Schema suficiente para continuar conversión | OK |

Suite: `src/feinetas/ortografia.rr.validation.test.ts` (+ tests RR/MCQ previos).

---

## Campos futuros (NO añadir ahora)

Documentados por si más adelante hacen falta. **No bloquean** la conversión de otros bancos ni el schema v1.

### 1. `image.ref` con assets reales

- **Estado hoy:** `null` en los 21 lemas.
- **Por qué podría hacer falta:** modo «Imagen y palabra» con ilustración propia.
- **Minijuego:** picture / imagen y palabra.
- **Mitigación actual:** `image.recommended` ya permite filtrar el pool; el adaptador puede usar placeholder hasta que existan assets.
- **Acción ahora:** ninguna (el campo ya existe; solo falta contenido de assets).

### 2. `graphemeTargets` (opcional futuro)

- **Qué sería:** lista de grafemas “calientes” a ocultar (p. ej. `["rr"]`, `["r"]` tras n).
- **Por qué:** el modo «Letra que falta» hoy deriva el hueco por heurística en el adaptador.
- **Minijuego:** missing / letra de la regla.
- **¿Imprescindible?** No. La heurística funciona en los 21 lemas RR.
- **Acción ahora:** no añadir. Revisar solo si al conectar missing en producción la heurística falla en otros packs (H, C/Z/QU…).

### 3. Pack de contextos / frases

- **Qué sería:** archivo aparte de oraciones con hueco (no dentro del lemma).
- **Por qué:** modo «Completa la frase» del legacy.
- **Minijuego:** complete.
- **¿Imprescindible para bancos de lemas?** No. Es otra capa de datos.
- **Acción ahora:** ninguna.

### 4. `difficulty` rellenado

- **Estado:** campo opcional ausente en RR.
- **Por qué podría hacer falta:** muestreo por dificultad explícita.
- **Minijuego:** cualquier modo con cola de dificultad.
- **Mitigación:** derivar de `frequency` en adaptador (ya previsto en JSON_SPEC §4.8).
- **Acción ahora:** no rellenar.

---

## Conclusión operativa

1. El piloto RR queda **aprobado técnicamente**.
2. Se puede **continuar convirtiendo** el resto de bancos MD → `feinetas/ortografia/*.json` con el mismo schema.
3. La conexión al flujo principal de juego queda **para un paso posterior** (fuera de esta validación).
4. Cualquier campo nuevo exigirá subir `schemaVersion` y debate explícito; no se hace en este cierre.
