# Feinetas — documentación editorial

Esta carpeta **no la usa el juego en runtime**.

Son documentos de trabajo editorial para preparar bancos educativos.
El cliente **solo** consume JSON revisados (p. ej. `feinetas/*.json` o packs futuros).

## Flujo oficial del proyecto

1. **Diseño del ejercicio** (aprobado).
2. **Banco editorial en Markdown** (esta carpeta), a partir de las **fichas del repositorio**.
3. **Revisión humana**.
4. **Conversión a JSON** (pack de datos).
5. **El juego consume únicamente el JSON**.

## Metodología: fichas del repositorio primero

Dentro del repo hay fichas y materiales de **3.º de Primaria (Cataluña)**.  
Esos materiales son la **referencia principal** para construir los bancos editoriales.

### Reglas obligatorias

1. **Antes** de añadir un registro al Banco Maestro / errores reales, revisar si existe un ejemplo equivalente en las fichas del repositorio.
2. Usar esas fichas para identificar:
   - vocabulario habitual;
   - errores ortográficos realmente trabajados;
   - nivel de dificultad;
   - progresión pedagógica.
3. **NO** copiar literalmente los ejercicios.
4. Extraer únicamente el **conocimiento pedagógico**:
   - qué palabras trabajan;
   - qué errores aparecen;
   - qué reglas se practican;
   - qué nivel corresponde a 3.º de Primaria.
5. Adaptar ese contenido al **formato editorial de Aray** (plantillas de esta carpeta).
6. Si una palabra o un tipo de error **no** aparece habitualmente en esas fichas, **evitar** incluirlo salvo razón clara documentada en Observaciones.
7. Al completar un documento editorial (p. ej. `ERRORES_REALES_H.md`), incluir al final un resumen:
   - número de fichas / fuentes revisadas;
   - temas encontrados;
   - criterios seguidos para seleccionar el vocabulario.

### Objetivo pedagógico

No copiar las fichas.  
Conseguir que **Aray enseñe los mismos contenidos** con formato de videojuego.

### Fuentes habituales en el repo (orientativas)

| Ubicación | Qué aporta |
|-----------|------------|
| `feinetas/lengua/` | PDFs de lengua / repaso 3.º |
| `feinetas/WEB/fitxes-ortografia-*.pdf` | Fitxes d’ortografia 3r–4t |
| `verano_aray/banc_exercicis/` | Índice BEX + extracciones de editoriales (ANAYA, SM, Vicens Vives…) |
| `verano_aray/fichas_repaso/` | Fitxes de repaso propias |
| `docs/TEMARIO_3_PRIMARIA_CATALUNYA.md` | Calibrado de nivel ciclo medio |

Al citar una fuente en Observaciones o en el resumen final, indicar ruta o nombre de ficha/PDF, no pegar el ejercicio completo.

## Reglas para Cursor / agentes

- **Nunca** generar contenido educativo automáticamente «de la nada».
- **Nunca** inventar distractores.
- **Nunca** inventar frases.
- **Nunca** inventar vocabulario que no esté respaldado por fichas/temario del repo (salvo excepción justificada).
- **Todo** el contenido del juego procederá de documentos editoriales **aprobados** tras revisión humana.

Hasta que un documento de esta carpeta esté revisado y convertido a JSON, no forma parte del producto jugable.

## Documentos

| Archivo | Uso editorial |
|---------|----------------|
| `PALABRAS_MASTER.md` | **Diseño maestro Palabras 3.º (Cataluña)** — bancos reutilizables, currículum, productos v1 |
| `PALABRAS_JSON_SPEC.md` | Contrato técnico de packs por banco (no por producto) |
| `PALABRAS_PROGRESSION.md` | Dificultad 1–4 · lema multi-banco · muestreo |
| `BANCO_RELACIONES_SEMANTICAS.md` | Banco Relaciones **congelado / aprobado** → `palabras/relaciones-semanticas.json` (conectado: Sinónimos + Antónimos) |
| `BANCO_MORFOLOGIA.md` | Banco Morfología **congelado / aprobado** → `palabras/morfologia.json` (conectado: Singular/plural + Masc/fem) |
| `INGLES_MASTER.md` | **Diseño maestro Inglés 3.º (Cataluña)** — arquitectura de packs; sin JSON aún |
| `BANCO_MAESTRO_ORTOGRAFIA.md` | Índice / maestro de Ortografía |
| `JSON_SPEC.md` | Contrato JSON Ortografía (lemas) |
| `ERRORES_REALES_H.md` | Errores reales — h |
| `ERRORES_REALES_BV.md` | Errores reales — b/v |
| `ERRORES_REALES_GJ.md` | Errores reales — g/j |
| `ERRORES_REALES_RR.md` | Errores reales — r/rr |
| `ERRORES_REALES_MPMB.md` | Errores reales — mp/mb |
| `ERRORES_REALES_LLY.md` | Errores reales — ll/y |
| `ERRORES_REALES_CZQU.md` | Errores reales — c/z/qu |
| `ERRORES_REALES_TILDES.md` | Errores reales — tildes |
| `ERRORES_REALES_HAY_AHI_AY.md` | Errores reales — hay / ahí / ay |
| `ERRORES_REALES_GU.md` | Errores reales — gu / gü |

Los archivos de errores / bancos se rellenan con la metodología de fichas; no por generación libre de listas.
