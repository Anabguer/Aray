# Banco editorial — Morfología

**Pack previsto:** `feinetas/palabras/morfologia.json`  
**packKind:** `morph-pair`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** **borrador editorial v2** (ampliado) · pendiente de auditoría humana · **sin JSON** · **no conectado al juego**  
**Productos previstos:** Singular/plural (`axis: number`) · Masculino/femenino (`axis: gender`) · Mix  
**Normas:** [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) · [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md) · [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md)

---

## Objetivo

Pares morfológicos de **número** y **género** para 3.º de Primaria (castellano).

- Identidad = el **par** completo.  
- Lema multi-banco OK si cambia el objetivo pedagógico.  
- Sin verbos, análisis gramatical, excepciones de género ni plurales con tilde problemática.

---

## Criterio de ampliación (v2)

Se admiten plurales **totalmente regulares** (`-s` / `-es` / `z→ces` estándar) si el lema está en materiales del repo (fichas, editoriales o `formar-palabras.json`), aunque no haya un ejercicio solo de «forma el plural».

**Siguen fuera:** actor/actriz, rey/reina, caballo/yegua, toro/vaca, camión/camiones, avestruz, cruz; padre/madre (no son -o/-a transparentes); perro/perra y oso/osa (sin forma B atestiguada).

---

## Plantilla

```
## Par
### Id / Axis / Forma A / Forma B / PromptSide / Dificultad / Tema / Fuente / Observaciones / Estado
```

- `number`: A singular, B plural.  
- `gender`: A masculino, B femenino.  
- `promptSide: either` si no hay ambigüedad.

---

## Fuentes revisadas

| Fuente | Aporte |
|--------|--------|
| Vicens VV `castellano_refuerzo_ampliacion_lengua_3.txt` | Plural drill; lista M/F (`gata`, `mesas`, `cama`…); profesor/profesora; abuela; maestra; hermano |
| ANAYA refuerzo / ampliación | Paradigma amigo/amiga/amigos/amigas; pez/red; árbol; perdiz; tío; casa; mesa; hermana |
| Lenguaje 3 tomo 2 | Plural -z (lápiz, perdiz, luz); niño/niña; hermano/hermana; gato; casa; libro |
| Savia `castellano_lengua_3_savia.txt` | casa, libros, amigos, hermana, alumnos |
| `feinetas/formar-palabras.json` | Lemas cotidianos duales y singulares de entorno (casa, libro, gato, puerta…) |

---

# NÚMERO (singular / plural) — 20

---

## Par

### Id
morph-num-casa-casas

### Axis
number

### Forma A
casa

### Forma B
casas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
Savia / ANAYA / Lenguaje 3 (lema *casa*); formar-palabras

### Observaciones
Plural regular -s. Ampliación v2 (lema presente; sin drill exclusivo).

### Estado
draft

---

## Par

### Id
morph-num-mesa-mesas

### Axis
number

### Forma A
mesa

### Forma B
mesas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
Vicens VV — forma el plural; lista M/F trae *mesas*

### Observaciones
Plural -s. Drill explícito.

### Estado
draft

---

## Par

### Id
morph-num-silla-sillas

### Axis
number

### Forma A
silla

### Forma B
sillas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
Vicens VV — forma el plural; formar-palabras

### Observaciones
Plural -s.

### Estado
draft

---

## Par

### Id
morph-num-cama-camas

### Axis
number

### Forma A
cama

### Forma B
camas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
Vicens VV lista M/F (`cama`); formar-palabras

### Observaciones
Plural regular -s. Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-num-puerta-puertas

### Axis
number

### Forma A
puerta

### Forma B
puertas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
ANAYA ampliación (*puerta*); formar-palabras

### Observaciones
Plural regular -s. Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-num-ventana-ventanas

### Axis
number

### Forma A
ventana

### Forma B
ventanas

### PromptSide
either

### Dificultad
1

### Tema
casa

### Fuente
formar-palabras (grupo casa); entorno doméstico en fichas de lengua

### Observaciones
Plural regular -s. Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-num-libro-libros

### Axis
number

### Forma A
libro

### Forma B
libros

### PromptSide
either

### Dificultad
1

### Tema
colegio

### Fuente
Vicens (*libro*); Savia (*libros*); formar-palabras

### Observaciones
Plural regular -s. Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-num-gorro-gorros

### Axis
number

### Forma A
gorro

### Forma B
gorros

### PromptSide
either

### Dificultad
1

### Tema
ropa

### Fuente
Vicens VV — forma el plural; formar-palabras

### Observaciones
Plural -s.

### Estado
draft

---

## Par

### Id
morph-num-zapato-zapatos

### Axis
number

### Forma A
zapato

### Forma B
zapatos

### PromptSide
either

### Dificultad
1

### Tema
ropa

### Fuente
formar-palabras; Vicens lista próxima (*zapatillas*)

### Observaciones
Plural regular -s. Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-num-gato-gatos

### Axis
number

### Forma A
gato

### Forma B
gatos

### PromptSide
either

### Dificultad
1

### Tema
animales

### Fuente
Lenguaje 3 (*El gato*); formar-palabras; Vicens (*gata* en clasificación)

### Observaciones
Plural regular -s. Ampliación v2. Cruce con género `gato/gata`.

### Estado
draft

---

## Par

### Id
morph-num-amigo-amigos

### Axis
number

### Forma A
amigo

### Forma B
amigos

### PromptSide
either

### Dificultad
1

### Tema
personas

### Fuente
ANAYA refuerzo — paradigma `amigo amiga amigos amigas`

### Observaciones
Cruce con género `amigo/amiga`.

### Estado
draft

---

## Par

### Id
morph-num-amiga-amigas

### Axis
number

### Forma A
amiga

### Forma B
amigas

### PromptSide
either

### Dificultad
1

### Tema
personas

### Fuente
ANAYA refuerzo — paradigma completo

### Observaciones
Paralelo femenino del paradigma.

### Estado
draft

---

## Par

### Id
morph-num-red-redes

### Axis
number

### Forma A
red

### Forma B
redes

### PromptSide
either

### Dificultad
2

### Tema
objetos

### Fuente
Vicens VV; ANAYA refuerzo / ampliación

### Observaciones
Plural regular -es (consonante).

### Estado
draft

---

## Par

### Id
morph-num-jugador-jugadores

### Axis
number

### Forma A
jugador

### Forma B
jugadores

### PromptSide
either

### Dificultad
2

### Tema
personas

### Fuente
Vicens VV — forma el plural

### Observaciones
Plural -es. Sin ítem de género (jugadora no forzada desde catalán).

### Estado
draft

---

## Par

### Id
morph-num-arbol-arboles

### Axis
number

### Forma A
árbol

### Forma B
árboles

### PromptSide
either

### Dificultad
2

### Tema
naturaleza

### Fuente
ANAYA refuerzo («La hoja del árbol» → plural); formar-palabras

### Observaciones
Plural -es; tilde se mantiene (no es el caso camión→camiones).

### Estado
draft

---

## Par

### Id
morph-num-pez-peces

### Axis
number

### Forma A
pez

### Forma B
peces

### PromptSide
either

### Dificultad
2

### Tema
animales

### Fuente
Vicens VV; ANAYA refuerzo; formar-palabras

### Observaciones
Regla regular z→ces (no irregularidad léxica).

### Estado
draft

---

## Par

### Id
morph-num-lapiz-lapices

### Axis
number

### Forma A
lápiz

### Forma B
lápices

### PromptSide
either

### Dificultad
2

### Tema
colegio

### Fuente
Lenguaje 3 tomo 2; Vicens lista; formar-palabras

### Observaciones
z→ces escolar.

### Estado
draft

---

## Par

### Id
morph-num-luz-luces

### Axis
number

### Forma A
luz

### Forma B
luces

### PromptSide
either

### Dificultad
2

### Tema
casa

### Fuente
Lenguaje 3 tomo 2; ANAYA refuerzo (oración con *luz* en bloque de plural)

### Observaciones
z→ces cotidiano. (*cruz* y *avestruz* excluidos a propósito.)

### Estado
draft

---

## Par

### Id
morph-num-lombriz-lombrices

### Axis
number

### Forma A
lombriz

### Forma B
lombrices

### PromptSide
either

### Dificultad
3

### Tema
naturaleza

### Fuente
Vicens VV — forma el plural

### Observaciones
z→ces; menos frecuente → nivel 3.

### Estado
draft

---

## Par

### Id
morph-num-perdiz-perdices

### Axis
number

### Forma A
perdiz

### Forma B
perdices

### PromptSide
either

### Dificultad
3

### Tema
animales

### Fuente
ANAYA refuerzo / ampliación; Lenguaje 3 tomo 2

### Observaciones
z→ces de ficha; nivel 3.

### Estado
draft

---

# GÉNERO (masculino / femenino) — 9

---

## Par

### Id
morph-gen-amigo-amiga

### Axis
gender

### Forma A
amigo

### Forma B
amiga

### PromptSide
either

### Dificultad
1

### Tema
personas

### Fuente
ANAYA refuerzo — paradigma `amigo amiga…`

### Observaciones
-o / -a transparente.

### Estado
draft

---

## Par

### Id
morph-gen-nino-nina

### Axis
gender

### Forma A
niño

### Forma B
niña

### PromptSide
either

### Dificultad
1

### Tema
personas

### Fuente
Lenguaje 3 / materiales 3.º; ambos en formar-palabras

### Observaciones
Par canónico.

### Estado
draft

---

## Par

### Id
morph-gen-abuelo-abuela

### Axis
gender

### Forma A
abuelo

### Forma B
abuela

### PromptSide
either

### Dificultad
1

### Tema
familia

### Fuente
Vicens («Mi abuela…»); ambos en formar-palabras

### Observaciones
Cotidiano.

### Estado
draft

---

## Par

### Id
morph-gen-hermano-hermana

### Axis
gender

### Forma A
hermano

### Forma B
hermana

### PromptSide
either

### Dificultad
1

### Tema
familia

### Fuente
Vicens / ANAYA / Lenguaje 3 / Savia; ambos en formar-palabras

### Observaciones
Ampliación v2. -o / -a.

### Estado
draft

---

## Par

### Id
morph-gen-tio-tia

### Axis
gender

### Forma A
tío

### Forma B
tía

### PromptSide
either

### Dificultad
1

### Tema
familia

### Fuente
ANAYA refuerzo («Mi tío…»); ambos en formar-palabras

### Observaciones
Ampliación v2.

### Estado
draft

---

## Par

### Id
morph-gen-primo-prima

### Axis
gender

### Forma A
primo

### Forma B
prima

### PromptSide
either

### Dificultad
1

### Tema
familia

### Fuente
ambos lemas en formar-palabras (grupo familia); vocabulario escolar habitual

### Observaciones
Ampliación v2. -o / -a transparente.

### Estado
draft

---

## Par

### Id
morph-gen-alumno-alumna

### Axis
gender

### Forma A
alumno

### Forma B
alumna

### PromptSide
either

### Dificultad
2

### Tema
colegio

### Fuente
Savia (*alumnos*); ambos en formar-palabras

### Observaciones
Ampliación v2. Entorno escolar.

### Estado
draft

---

## Par

### Id
morph-gen-profesor-profesora

### Axis
gender

### Forma A
profesor

### Forma B
profesora

### PromptSide
either

### Dificultad
2

### Tema
colegio

### Fuente
Vicens («profesor o profesora»); ambos en formar-palabras

### Observaciones
Base en -or + -a.

### Estado
draft

---

## Par

### Id
morph-gen-gato-gata

### Axis
gender

### Forma A
gato

### Forma B
gata

### PromptSide
either

### Dificultad
1

### Tema
animales

### Fuente
Vicens VV lista M/F (`gata`); Lenguaje 3 / formar-palabras (`gato`)

### Observaciones
Par claro. Sin caballo/yegua ni toro/vaca.

### Estado
draft

---

# Resumen del borrador v2

## Conteos

| Axis | Pares |
|------|------:|
| number (singular/plural) | **20** |
| gender (masculino/femenino) | **9** |
| **Total** | **29** |

Objetivo pedido: 18–20 número · 8–10 género → **cumplido**.

## Distribución por niveles

| Dificultad | Nº |
|------------|---:|
| 1 | 18 |
| 2 | 8 |
| 3 | 3 |
| 4 | 0 |

Más peso en nivel 1 tras la ampliación de regulares cotidianos (deseable para 3.º).

## Distribución temática (asignación única)

| Tema | Nº |
|------|---:|
| casa | 7 |
| personas | 5 |
| familia | 4 |
| animales | 4 |
| colegio | 4 |
| naturaleza | 2 |
| ropa | 2 |
| objetos | 1 |
| **Total** | **29** |

Mejor equilibrio casa/familia/colegio respecto a v1. Sigue sin comida como eje.

## Cambios respecto a v1

| Acción | Ítems |
|--------|--------|
| **Eliminados** | `cruz/cruces`, `avestruz/avestruces` |
| **Añadidos número** | casa, cama, puerta, ventana, libro, zapato, gato/gatos |
| **Añadidos género** | hermano/hermana, tío/tía, primo/prima, alumno/alumna |
| **Siguen fuera** | camión, actor/actriz, rey/reina, caballo/yegua, toro/vaca, padre/madre, perro/perra, maestro/maestra (sin *maestro* en formar-palabras) |

## Descartados (motivo)

| Candidato | Motivo |
|-----------|--------|
| camión/camiones | Cambio de tilde |
| cruz, avestruz | Encargo explícito / poca cotidianidad |
| actor/actriz, rey/reina, caballo/yegua, toro/vaca | Cambio de lema |
| padre/madre | No son morfología -o/-a regular |
| perro/perra, oso/osa | Forma B no atestiguada en materiales abiertos |
| maestro/maestra | Solo *maestra* en Vicens; sin *maestro* en formar-palabras |
| jugador/jugadora | Género no forzado desde catalán |
| pantalón/pantalones | Posible tilde / menos limpio que zapato |

## Dudas editoriales abiertas

1. **`ventana/ventanas`:** lema fuerte en formar-palabras; ¿OK sin mención abundante en extractos ANAYA/Vicens?  
2. **`primo/prima`:** ambos en formar-palabras; poca cita en extractos de lengua — ¿mantener o cortar?  
3. **`lombriz` / `perdiz`:** ¿se quedan en nivel 3 o se recortan para dejar el banco aún más “cotidiano”?  
4. **Frontera z→ces vs Ortografía:** pez/lápiz/luz/lombriz/perdiz siguen aquí porque el foco es **número**.

## Autoauditoría previa

| Check | Resultado |
|-------|-----------|
| Sin duplicados de par | OK |
| Sin espejos como dos ítems | OK |
| Sin excepciones de género | OK |
| Sin camión/cruz/avestruz | OK |
| Vocabulario 3.º | OK (dudas 1–3) |
| Niveles | Más 1; sin 4 |
| Fuentes | Documentadas |
| Relaciones Semánticas | No tocado |

## Runtime

| Pieza | Estado |
|-------|--------|
| Markdown | borrador v2 |
| JSON / juego | **no** |
| Siguiente | tu OK → auditoría → JSON |
