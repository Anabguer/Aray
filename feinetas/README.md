# Feinetas — banco de ejercicios reutilizable (Aray)

Cada archivo `.json` de esta carpeta describe **un minijuego reutilizable**.
El código de la app **no** lleva bancos de palabras/ejercicios hardcodeados:
siempre se leen desde aquí.

## Qué contiene cada archivo

| Bloque | Contenido |
|--------|-----------|
| **Ficha técnica** | `nombre`, `version`, `nivel`, `objetivo` |
| **Mecánica** | Tipo de interacción (p. ej. `drag_drop`), casillas, persistencia al fallar |
| **Reglas / corrección** | Acierto, fallo, contadores |
| **UX / ayudas** | Pistas tras N fallos, feedback visual/sonoro |
| **Banco de datos** | Lista tipada de ítems (`palabras`, ítems de regla, etc.) |

## Archivos actuales

| Archivo | Minijuego |
|---------|-----------|
| `formar-palabras.json` | Ordenar letras para formar la palabra |

## Archivos previstos

- `completar-palabra.json`
- `r-rr.json`
- `h.json`
- `familias-palabras.json`
- `sinonimos.json`

## Documentación editorial

Los borradores humanos viven en [`editorial/`](./editorial/). **No** los carga el juego.
Flujo: diseño → Markdown editorial → revisión → JSON → runtime.

## Cómo se consume en código

```ts
import { loadFeineta, getFormarPalabrasBank } from '@/feinetas'

const bank = getFormarPalabrasBank() // siempre desde feinetas/formar-palabras.json
const meta = loadFeineta('formar-palabras')
```

Nuevos bancos: añade el `.json` aquí y regístralo en `src/feinetas/registry.ts`.
