# Colisiones de id — lote LLY / CZQU / MPMB / RR

Al convertir los packs restantes (y alinear RR a `approved`):

| Pack | Prefijo | Ítems | Colisiones de slug |
|------|---------|-------|--------------------|
| `rr.json` | `rr-` | 21 | ninguna |
| `lly.json` | `lly-` | 18 | ninguna |
| `czqu.json` | `czqu-` | 25 | ninguna |
| `mpmb.json` | `mpmb-` | 18 | ninguna |

Política (igual que H/BV/GJ): slug ASCII sin diacríticos; si chocaran dos lemas, el que lleva tilde usaría `-tilde`; si aún hubiera choque, `-2`, `-3`…

**No fue necesario aplicar ningún sufijo de colisión en este lote.**  
Los lemas con tilde quedan p. ej. `czqu-lapiz`, `mpmb-tambien`, `rr-marron` (sin choque con otro lema del mismo pack).
