# Piloto RR — notas de validación en juego

Ruta temporal: `/dev/ortografia-rr`  
Pack: `feinetas/ortografia/rr.json`  
Spec: `JSON_SPEC.md` (congelado)

## Qué valida esta pantalla

- Carga y `assertValidOrtographyLemmaPack`
- Ronda MCQ con las **21** palabras
- Corrección (ok/bad + `ruleText`)
- Uso de `tip` cuando existe (sin filtrar el lema)
- Distractores solo desde `errors` del pack (adaptador; no se inventan)

## Campos del schema usados

| Campo | Uso en piloto |
|-------|----------------|
| `schemaVersion` / `pack.*` | Banner + validación |
| `lemma` / `id` | Correcta + HUD |
| `errors` | Distractores |
| `ruleText` | Feedback tras responder |
| `tip` | Pista bajo el enunciado (si existe) |
| `image` | No usado en este modo MCQ (esperado) |
| `frequency` / `category` / `tags` | No usados en UI piloto (sí en validación de pack) |

## ¿Falta algún campo imprescindible en el schema?

**No**, para el modo «¿Cuál está bien escrita?» el `JSON_SPEC` v1 es suficiente.

Validación exhaustiva y veredicto: ver [`PILOTO_RR_VALIDACION.md`](./PILOTO_RR_VALIDACION.md) — **piloto aprobado**.

Pendientes de otros modos (no bloquean conversión de bancos):

- `image.ref` real → modo imagen
- posible `graphemeTargets` → modo letra que falta (sigue siendo derivable en adaptador)

## Fuera de alcance

- No toca `/missions/languages/spelling/*`
- No registra el pack en el catálogo de minijuegos
- No convierte otros bancos
