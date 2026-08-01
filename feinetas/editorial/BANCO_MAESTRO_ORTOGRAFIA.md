# Banco maestro — Ortografía

Índice editorial (no lo usa el juego en runtime).

## Metodología

Ver [`README.md`](./README.md) y [`JSON_SPEC.md`](./JSON_SPEC.md).

## Documentos de errores reales

| Documento | Estado | JSON | Ítems |
|-----------|--------|------|------:|
| `ERRORES_REALES_H.md` | Congelado | `ortografia/h.json` | 49 |
| `ERRORES_REALES_BV.md` | Congelado | `ortografia/bv.json` | 31 |
| `ERRORES_REALES_GJ.md` | Congelado | `ortografia/gj.json` | 31 |
| `ERRORES_REALES_RR.md` | Congelado | `ortografia/rr.json` | 21 |
| `ERRORES_REALES_LLY.md` | Congelado | `ortografia/lly.json` | 18 |
| `ERRORES_REALES_CZQU.md` | Congelado | `ortografia/czqu.json` | 25 |
| `ERRORES_REALES_MPMB.md` | Congelado | `ortografia/mpmb.json` | 18 |
| `ERRORES_REALES_HAY_AHI_AY.md` | Congelado (Fase 2) | `ortografia/hay-ahi-ay.json` | 3 |
| `ERRORES_REALES_TILDES.md` | Congelado (Fase 2) | `ortografia/tildes.json` | 11 |
| `ERRORES_REALES_GU.md` | Congelado (Fase 2) | `ortografia/gu.json` | 9 |

**Total lemas JSON:** 216.

## Fase 3 (integración juego)

Ver [`FASE3_INTEGRACION.md`](./FASE3_INTEGRACION.md).  
Modos Ortografía (salvo `complete`) consumen el corpus JSON. `complete` permanece legacy temporal (`SPELL_CONTEXTS`).

## Descartados / no creados

Ver [`FASE2_BANCOS_OPCIONALES.md`](./FASE2_BANCOS_OPCIONALES.md): **-aba** y **bu/bur** sin banco (falta lista cerrada / sin drill).
