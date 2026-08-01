# Feinetas — documentación editorial

Esta carpeta **no la usa el juego en runtime**.

Son documentos de trabajo editorial para preparar bancos educativos.
El cliente **solo** consume JSON revisados (p. ej. `feinetas/*.json` o packs futuros).

## Flujo oficial del proyecto

1. **Diseño del ejercicio** (aprobado).
2. **Banco editorial en Markdown** (esta carpeta).
3. **Revisión humana**.
4. **Conversión a JSON** (pack de datos).
5. **El juego consume únicamente el JSON**.

## Reglas para Cursor / agentes

- **Nunca** generar contenido educativo automáticamente.
- **Nunca** inventar distractores.
- **Nunca** inventar frases.
- **Todo** el contenido del juego procederá de documentos editoriales **aprobados**.

Hasta que un documento de esta carpeta esté revisado y convertido a JSON, no forma parte del producto jugable.

## Documentos

| Archivo | Uso editorial |
|---------|----------------|
| `BANCO_MAESTRO_ORTOGRAFIA.md` | Índice / maestro de Ortografía |
| `ERRORES_REALES_H.md` | Errores reales — h |
| `ERRORES_REALES_BV.md` | Errores reales — b/v |
| `ERRORES_REALES_GJ.md` | Errores reales — g/j |
| `ERRORES_REALES_RR.md` | Errores reales — r/rr |
| `ERRORES_REALES_MPMB.md` | Errores reales — mp/mb |
| `ERRORES_REALES_LLY.md` | Errores reales — ll/y |
| `ERRORES_REALES_CZQU.md` | Errores reales — c/z/qu |
| `ERRORES_REALES_TILDES.md` | Errores reales — tildes |
| `ERRORES_REALES_HAY_AHI_AY.md` | Errores reales — hay / ahí / ay |

Los archivos de errores empiezan vacíos a propósito: se rellenan en el proceso editorial, no por generación automática.
