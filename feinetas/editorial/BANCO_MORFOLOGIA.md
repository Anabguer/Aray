# Banco editorial — Morfología

**Pack:** `feinetas/palabras/morfologia.json`  
**packKind:** `morph-pair`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** **congelado · aprobado** (2026-08-02) · JSON generado · **conectado** (Singular/plural + Masculino/femenino)  
**Productos previstos:** Singular/plural (`axis: number`) · Masculino/femenino (`axis: gender`) · Mix  
**Normas:** [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) · [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md) · [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md)

---

## Objetivo

Pares morfológicos de **número** y **género** para 3.º de Primaria (castellano).

- Identidad = el **par** completo.  
- Lema multi-banco OK si cambia el objetivo pedagógico.  
- Sin verbos, análisis gramatical ni excepciones de género.

---

## Frontera congelada con Ortografía

Los cambios ortográficos derivados de formar el plural (*pez*→*peces*, *lápiz*→*lápices*, *luz*→*luces*…) pertenecen a **Morfología** cuando el objetivo del ejercicio es el **número gramatical**.  
La regla ortográfica correspondiente sigue perteneciendo **exclusivamente a Ortografía**.

---

## Decisiones de cierre (auditoría)

**Eliminados:** `morph-num-lombriz-lombrices`, `morph-num-perdiz-perdices`.

**Mantenidos expresamente:** ventana/ventanas, primo/prima, jugador/jugadores, pez/peces, lápiz/lápices, luz/luces.

**Sin pares nuevos** en el cierre.

---

## Fuentes

| Fuente | Aporte |
|--------|--------|
| Vicens VV `castellano_refuerzo_ampliacion_lengua_3.txt` | Plural drill; M/F; profesor/profesora; abuela |
| ANAYA refuerzo / ampliación | Paradigma amigo…; pez/red; árbol; tío; casa |
| Lenguaje 3 tomo 2 | Plural -z (lápiz, luz); niño/niña; hermano/hermana |
| Savia | casa, libros, alumnos |
| `formar-palabras.json` | Lemas cotidianos duales / entorno |

---

# NÚMERO (singular / plural) — 18

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
Savia / ANAYA / Lenguaje 3; formar-palabras

### Observaciones
Plural regular -s.

### Estado
frozen

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
Vicens VV — forma el plural

### Observaciones
Plural -s. Drill explícito.

### Estado
frozen

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
frozen

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
Vicens VV lista M/F; formar-palabras

### Observaciones
Plural regular -s.

### Estado
frozen

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
ANAYA ampliación; formar-palabras

### Observaciones
Plural regular -s.

### Estado
frozen

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
formar-palabras; entorno doméstico en fichas

### Observaciones
Mantenido tras auditoría.

### Estado
frozen

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
Vicens; Savia; formar-palabras

### Observaciones
Plural regular -s.

### Estado
frozen

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
frozen

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
formar-palabras

### Observaciones
Plural regular -s.

### Estado
frozen

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
Lenguaje 3; formar-palabras; Vicens (*gata*)

### Observaciones
Cruce con género `gato/gata`.

### Estado
frozen

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
ANAYA refuerzo — paradigma

### Observaciones
Cruce con género `amigo/amiga`.

### Estado
frozen

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
ANAYA refuerzo — paradigma

### Observaciones
Paralelo femenino del paradigma.

### Estado
frozen

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
Vicens VV; ANAYA

### Observaciones
Plural regular -es.

### Estado
frozen

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
Mantenido tras auditoría. Sin ítem de género.

### Estado
frozen

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
ANAYA refuerzo; formar-palabras

### Observaciones
Plural -es; tilde estable.

### Estado
frozen

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
Vicens VV; ANAYA; formar-palabras

### Observaciones
z→ces por **número** (frontera Ortografía congelada).

### Estado
frozen

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
Lenguaje 3 tomo 2; Vicens; formar-palabras

### Observaciones
z→ces por número.

### Estado
frozen

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
Lenguaje 3 tomo 2; ANAYA refuerzo

### Observaciones
z→ces por número. (*cruz* / *avestruz* / *lombriz* / *perdiz* fuera.)

### Estado
frozen

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
ANAYA refuerzo — paradigma

### Observaciones
-o / -a.

### Estado
frozen

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
Lenguaje 3; formar-palabras

### Observaciones
Par canónico.

### Estado
frozen

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
Vicens; formar-palabras

### Observaciones
Cotidiano.

### Estado
frozen

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
Vicens / ANAYA / Lenguaje 3 / Savia; formar-palabras

### Observaciones
-o / -a.

### Estado
frozen

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
ANAYA refuerzo; formar-palabras

### Observaciones
—

### Estado
frozen

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
formar-palabras (grupo familia)

### Observaciones
Mantenido tras auditoría.

### Estado
frozen

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
Savia; formar-palabras

### Observaciones
Entorno escolar.

### Estado
frozen

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
Vicens; formar-palabras

### Observaciones
-or + -a.

### Estado
frozen

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
Vicens (*gata*); Lenguaje 3 / formar-palabras (*gato*)

### Observaciones
Par claro.

### Estado
frozen

---

# Resumen congelado

## Conteos finales

| Axis | Ítems |
|------|------:|
| number (singular/plural) | **18** |
| gender (masculino/femenino) | **9** |
| **Total** | **27** |

| Dificultad | Ítems |
|------------|------:|
| 1 | 18 |
| 2 | 9 |
| 3 | 0 |
| 4 | 0 |

## Distribución temática

| Tema | Nº |
|------|---:|
| casa | 7 |
| personas | 5 |
| familia | 4 |
| colegio | 4 |
| animales | 3 |
| ropa | 2 |
| naturaleza | 1 |
| objetos | 1 |
| **Total** | **27** |

## Runtime

| Pieza | Estado |
|-------|--------|
| Markdown | **frozen / approved** |
| JSON | `feinetas/palabras/morfologia.json` |
| Hub / adaptadores | **Conectado** (singular-plural, masculino-femenino) |
| Mix / Mis fallos | **No** |
| Siguiente producto editorial | pendiente |
