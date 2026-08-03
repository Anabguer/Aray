# Feinetas — banco de ejercicios reutilizable (Aray)

Cada archivo `.json` de esta carpeta (o subcarpeta) describe **datos de juego revisados**.
El código de la app **no** lleva bancos educativos hardcodeados: siempre se leen desde aquí.

## Qué contiene cada archivo

| Bloque | Contenido |
|--------|-----------|
| **Ficha técnica** | Metadatos de pack / versión / nivel / objetivo |
| **Mecánica** (packs legacy) | Tipo de interacción cuando el JSON aún mezcla UX + datos |
| **Banco de datos** | Ítems tipados (`lemmas`, `items`, `palabras`, …) |

Los packs nuevos de familia (Ortografía, Palabras…) siguen el contrato editorial correspondiente: el JSON es **banco de conocimiento**; la mecánica vive en adaptadores.

## Archivos actuales (runtime)

| Archivo | Uso |
|---------|-----|
| `formar-palabras.json` | Formar palabras (familia Palabras; schema propio legacy) |
| `ortografia/*.json` | Packs de lemas y frases de Ortografía |

## Previsto — familia Palabras

Arquitectura: [`editorial/PALABRAS_MASTER.md`](./editorial/PALABRAS_MASTER.md) · [`editorial/PALABRAS_JSON_SPEC.md`](./editorial/PALABRAS_JSON_SPEC.md) · [`editorial/PALABRAS_PROGRESSION.md`](./editorial/PALABRAS_PROGRESSION.md).

Editorial Relaciones: [`editorial/BANCO_RELACIONES_SEMANTICAS.md`](./editorial/BANCO_RELACIONES_SEMANTICAS.md) (**congelado**; conectado: Sinónimos + Antónimos).  
Editorial Morfología: [`editorial/BANCO_MORFOLOGIA.md`](./editorial/BANCO_MORFOLOGIA.md) (**congelado**; conectado: Singular/plural + Masc/fem).

Bancos futuros bajo `palabras/` (un JSON **por banco editorial**, no por minijuego):

| Banco JSON | Estado | Alimenta |
|------------|--------|----------|
| `palabras/relaciones-semanticas.json` | **frozen** (conectado) | Sinónimos + Antónimos |
| `palabras/morfologia.json` | **frozen** (conectado) | Singular/plural + Masc/fem |
| `palabras/familias.json` | previsto | Familia de palabras |
| `palabras/campos-semanticos.json` | previsto | Campo semántico |
| `palabras/oraciones.json` | previsto | Ordenar frases |
| `palabras/listas-diccionario.json` | previsto | Orden alfabético |

`formar-palabras.json` **no** se rediseña ni se migra en v1; solo se integra en el hub de la familia.

**No** previstos bajo Palabras: `r-rr.json`, `h.json` (viven en Ortografía).  
**v2:** Definición ↔ palabra.

## Documentación editorial

Los borradores humanos viven en [`editorial/`](./editorial/). **No** los carga el juego.
Flujo: diseño → fichas del repo → Markdown editorial → revisión → JSON → runtime.
Metodología: [`editorial/README.md`](./editorial/README.md).

## Cómo se consume en código

```ts
import { loadFeineta, getFormarPalabrasBank } from '@/feinetas'

const bank = getFormarPalabrasBank() // siempre desde feinetas/formar-palabras.json
const meta = loadFeineta('formar-palabras')
```

Nuevos bancos: añade el `.json` y regístralo en `src/feinetas/registry.ts` (o el registry de familia correspondiente).
