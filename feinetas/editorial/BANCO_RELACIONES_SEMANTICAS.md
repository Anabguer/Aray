# Banco editorial — Relaciones semánticas

**Pack:** `feinetas/palabras/relaciones-semanticas.json`  
**packKind:** `semantic-relation`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** **congelado · aprobado** (2026-08-02) · JSON generado · **conectado** (Sinónimos + Antónimos)  
**Productos previstos:** Sinónimos · Antónimos · Mix  
**Normas:** [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) · [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md) · [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md)

---

## Objetivo

Pares de **sinónimos y antónimos** de materiales de 3.º de Primaria (Cataluña / castellano) para Aray.

- Un ítem = una relación (`anchor` → `target` + `relation` + distractores).  
- Sin copiar enunciados; sin inventar parejas ni distractores.  
- Lema multi-banco permitido si el objetivo pedagógico difiere (PROGRESSION §3).

---

## Decisiones de cierre (2026-08-02)

**Mantener:** contento / alegre.

**Eliminar (cierre):** contento/feliz, tienda/comercio, flaca/delgada, grande/inmenso, difícil/complicado, superficial/profundo.

**Eliminados antes:** prefijos abstractos; adquirir; disfrutar/gozar; comercio/negocio; partir/cortar; disgustado/triste; lugar/zona.

**Sin relaciones nuevas** para compensar el recorte.

---

## Fuentes revisadas

| Fuente | Rol |
|--------|-----|
| Fitxes 03–04 + solucionari adultos | Sinónimos base |
| ANAYA refuerzo / ampliación (extracción BEX) | Antónimos, veloz, vencer, montar… |
| Capítulos 03–04 (misiones / solucionario) | contento, difícil, grande |
| `formar-palabras.json` | Cruces multi-banco (anotados) |

---

# SINÓNIMOS

---

## Relación

### Id
rel-contento-alegre

### Anchor
contento

### Target
alegre

### Relation
synonym

### Distractores
triste
grande

### Dificultad
1

### Categoría
emociones

### Observaciones
Fitxa 03; solucionari; cap_03. Pareja emocional canónica del banco.

---

## Relación

### Id
rel-grande-enorme

### Anchor
grande

### Target
enorme

### Relation
synonym

### Distractores
pequeño
lento

### Dificultad
1

### Categoría
tamaño

### Observaciones
Fitxa 03; solucionari. **Multi-banco:** `grande` en formar-palabras.

---

## Relación

### Id
rel-lugar-sitio

### Anchor
lugar

### Target
sitio

### Relation
synonym

### Distractores
veloz
bonito

### Dificultad
1

### Categoría
espacio

### Observaciones
Fitxa 03; solucionari.

---

## Relación

### Id
rel-alzar-levantar

### Anchor
alzar

### Target
levantar

### Relation
synonym

### Distractores
curar
apagar

### Dificultad
3

### Categoría
acciones

### Observaciones
Fitxa 04 + ANAYA refuerzo.

---

## Relación

### Id
rel-sanar-curar

### Anchor
sanar

### Target
curar

### Relation
synonym

### Distractores
alzar
vencer

### Dificultad
2

### Categoría
acciones

### Observaciones
Fitxa 04 + ANAYA refuerzo.

---

## Relación

### Id
rel-aroma-perfume

### Anchor
aroma

### Target
perfume

### Relation
synonym

### Distractores
hermoso
rápido

### Dificultad
3

### Categoría
sentidos

### Observaciones
Fitxa 04 + ANAYA refuerzo.

---

## Relación

### Id
rel-bonito-hermoso

### Anchor
bonito

### Target
hermoso

### Relation
synonym

### Distractores
feo
ruidoso

### Dificultad
1

### Categoría
cualidad

### Observaciones
Fitxa 04.

---

## Relación

### Id
rel-abecedario-alfabeto

### Anchor
abecedario

### Target
alfabeto

### Relation
synonym

### Distractores
aroma
lugar

### Dificultad
2

### Categoría
colegio

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-complicada-dificil

### Anchor
complicada

### Target
difícil

### Relation
synonym

### Distractores
fácil
veloz

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA ampliación. (Espejo `difícil/complicado` eliminado.)

---

## Relación

### Id
rel-vencer-triunfar

### Anchor
vencer

### Target
triunfar

### Relation
synonym

### Distractores
perder
sufrir

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-veloz-rapido

### Anchor
veloz

### Target
rápido

### Relation
synonym

### Distractores
lento
enorme

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-disgustado-enfadado

### Anchor
disgustado

### Target
enfadado

### Relation
synonym

### Distractores
contento
generoso

### Dificultad
2

### Categoría
emociones

### Observaciones
ANAYA refuerzo; solucionari cap_04.

---

# ANTÓNIMOS

---

## Relación

### Id
rel-grande-pequeno

### Anchor
grande

### Target
pequeño

### Relation
antonym

### Distractores
enorme
alto

### Dificultad
1

### Categoría
tamaño

### Observaciones
**Multi-banco:** formar-palabras.

---

## Relación

### Id
rel-alto-bajo

### Anchor
alto

### Target
bajo

### Relation
antonym

### Distractores
grande
rápido

### Dificultad
1

### Categoría
tamaño

### Observaciones
**Multi-banco:** formar-palabras.

---

## Relación

### Id
rel-veloz-lento

### Anchor
veloz

### Target
lento

### Relation
antonym

### Distractores
rápido
difícil

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-dificil-facil

### Anchor
difícil

### Target
fácil

### Relation
antonym

### Distractores
complicada
veloz

### Dificultad
1

### Categoría
cualidad

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-disfrutar-sufrir

### Anchor
disfrutar

### Target
sufrir

### Relation
antonym

### Distractores
vencer
perder

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-vencer-perder

### Anchor
vencer

### Target
perder

### Relation
antonym

### Distractores
triunfar
alegre

### Dificultad
2

### Categoría
acciones

### Observaciones
ANAYA ampliación.

---

## Relación

### Id
rel-tacano-generoso

### Anchor
tacaño

### Target
generoso

### Relation
antonym

### Distractores
disgustado
ruidoso

### Dificultad
3

### Categoría
cualidad

### Observaciones
ANAYA refuerzo.

---

## Relación

### Id
rel-apagar-encender

### Anchor
apagar

### Target
encender

### Relation
antonym

### Distractores
alzar
sanar

### Dificultad
2

### Categoría
acciones

### Observaciones
ANAYA refuerzo.

---

## Relación

### Id
rel-ocupado-libre

### Anchor
ocupado

### Target
libre

### Relation
antonym

### Distractores
claro
ruidoso

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA refuerzo.

---

## Relación

### Id
rel-claro-oscuro

### Anchor
claro

### Target
oscuro

### Relation
antonym

### Distractores
ocupado
ruidoso

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA refuerzo.

---

## Relación

### Id
rel-ruidoso-silencioso

### Anchor
ruidoso

### Target
silencioso

### Relation
antonym

### Distractores
bonito
claro

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA refuerzo.

---

## Relación

### Id
rel-alegre-triste

### Anchor
alegre

### Target
triste

### Relation
antonym

### Distractores
feliz
contento

### Dificultad
1

### Categoría
emociones

### Observaciones
Eje emocional del banco.

---

## Relación

### Id
rel-montar-desmontar

### Anchor
montar

### Target
desmontar

### Relation
antonym

### Distractores
apagar
encender

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA refuerzo; uso real infantil. Dificultad 3.

---

## Relación

### Id
rel-bonito-feo

### Anchor
bonito

### Target
feo

### Relation
antonym

### Distractores
hermoso
aroma

### Dificultad
1

### Categoría
cualidad

### Observaciones
Eje fitxa 04.

---

# Resumen editorial (congelado)

## Conteos finales

| Relation | Ítems |
|----------|------:|
| synonym | **12** |
| antonym | **14** |
| **Total** | **26** |

| Dificultad | Ítems |
|------------|------:|
| 1 | 9 |
| 2 | 11 |
| 3 | 6 |
| 4 | 0 |

## Distribución temática

| Tema | Syn | Ant | Total |
|------|----:|----:|------:|
| Cualidad | 3 | 7 | **10** |
| Acciones | 3 | 4 | **7** |
| Tamaño | 1 | 2 | **3** |
| Emociones | 2 | 1 | **3** |
| Espacio | 1 | 0 | **1** |
| Colegio | 1 | 0 | **1** |
| Sentidos | 1 | 0 | **1** |
| Animales / naturaleza / objetos / comida | 0 | 0 | **0** |

Suma = 26. Sesgo hacia cualidad/acciones/emociones (tipología ficha); huecos temáticos → Campos / Familias.

## Runtime

| Pieza | Estado |
|-------|--------|
| Markdown | **frozen / approved** |
| JSON | `feinetas/palabras/relaciones-semanticas.json` |
| Hub / adaptadores | **Conectado** (sinonimos, antonimos) |
| Mix / Mis fallos | **No** |
