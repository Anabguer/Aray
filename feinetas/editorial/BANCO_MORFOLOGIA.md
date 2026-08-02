# Banco editorial — Morfología

**Pack previsto:** `feinetas/palabras/morfologia.json`  
**packKind:** `morph-pair`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** **borrador editorial** · pendiente de auditoría humana · **sin JSON** · **no conectado al juego**  
**Productos previstos:** Singular/plural (`axis: number`) · Masculino/femenino (`axis: gender`) · Mix  
**Normas:** [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) · [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md) · [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md)

---

## Objetivo

Pares morfológicos de **número** (singular↔plural) y **género** (masculino↔femenino) para 3.º de Primaria (castellano), a partir de fichas y editoriales del repo.

- Un ítem = un **par** (`formA` / `formB` + `axis`).  
- Identidad pedagógica = el par completo (no el lema suelto).  
- El mismo lema puede vivir en Relaciones / Formar palabras si el objetivo cambia.  
- **No** verbos, sujeto/predicado, pronombres, determinantes ni análisis gramatical.

---

## Plantilla de registro

```
## Par

### Id
morph-{num|gen}-{slugA}-{slugB}

### Axis
number | gender

### Forma A
…   (singular o masculino)

### Forma B
…   (plural o femenino)

### PromptSide
a | b | either

### Dificultad
1–4

### Tema
…

### Fuente
…

### Observaciones
…

### Estado
draft
```

**Convención:**  
- `number`: A = singular, B = plural.  
- `gender`: A = masculino, B = femenino.  
- `promptSide: either` solo si A→B y B→A son inequívocos (sin doble respuesta).

---

## Fuentes revisadas

| Fuente | Aporte |
|--------|--------|
| Vicens Vives — `castellano_refuerzo_ampliacion_lengua_3.txt` (tema 4) | Drill «Forma el plural»: pez, red, silla, mesa, gorro, camión, lombriz, jugador |
| Vicens Vives — mismo extracto (tema 3) | Clasificación M/F (gata, perro…); «profesor o profesora»; «Mi abuela…» |
| ANAYA refuerzo — `castellano_Lengua_3º-ANAYA_refuerzo.txt` | Paradigma `amigo amiga amigos amigas`; plurales (pez/red, hoja del árbol, actriz…) |
| ANAYA ampliación — `castellano_Lengua_3º-ANAYA_ampliacion.txt` | Cambiar número: avestruz, redes, perdices, camión |
| Lenguaje 3 tomo 2 — `castellano_lenguaje3_tomo2_pdf.txt` | Plural en -z: lápiz, perdiz, cruz, luz; niños y niñas |
| `feinetas/formar-palabras.json` | Lemas duales ya en producto (niño/niña, abuelo/abuela, profesor/profesora, gato…) — apoyo de vocabulario, no inventa el par |
| Fitxes catalanas 05–06 | **Solo tipología** (género/número); **no** se copian lemas catalanes al banco castellano |
| [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) / PROGRESSION | Criterio de nivel (*casa/casas*, *pez/peces*, *niño/niña*…) |

---

# NÚMERO (singular / plural)

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
Vicens VV — forma el plural (`mesa`)

### Observaciones
Plural en -s. Cotidiano.

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
Vicens VV — forma el plural (`silla`)

### Observaciones
Plural en -s. También en formar-palabras (scramble).

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
Vicens VV — forma el plural (`gorro`)

### Observaciones
Plural en -s.

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
Mismo lema en ítem de género `amigo/amiga` (objetivo distinto).

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
ANAYA refuerzo — paradigma `amigo amiga amigos amigas`

### Observaciones
Paralelo femenino del paradigma ANAYA.

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
Vicens VV (`red`); ANAYA refuerzo («El pez cayó en la red» → plural); ANAYA ampliación (`redes`)

### Observaciones
Plural en -es (consonante).

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
Vicens VV — forma el plural (`jugador`)

### Observaciones
Plural en -es. No se añade aún jugador/jugadora (género): tipología fuerte en catalán, no en drill castellano de este extracto.

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
Vicens VV (`pez`); ANAYA refuerzo (oración en plural)

### Observaciones
z → ces. Cotidiano. En formar-palabras (scramble).

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
Lenguaje 3 tomo 2 — plural de palabras en -z (`lápiz`); Vicens lista M/F (`lápiz`)

### Observaciones
z → ces. Vocabulario escolar. En formar-palabras.

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
ANAYA refuerzo — plural de «La hoja del árbol»; Savia (árbol/árboles en materiales de lengua)

### Observaciones
Plural en -es; la tilde se mantiene (no es el caso problemático de pérdida de tilde). En formar-palabras.

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
Vicens VV — forma el plural (`lombriz`)

### Observaciones
z → ces. Menos frecuente que pez/lápiz; nivel 3.

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
ANAYA refuerzo (oración); ANAYA ampliación (`perdices`); Lenguaje 3 tomo 2 (`perdiz`)

### Observaciones
z → ces. Vocabulario de ficha; no extranjerismo.

### Estado
draft

---

## Par

### Id
morph-num-cruz-cruces

### Axis
number

### Forma A
cruz

### Forma B
cruces

### PromptSide
either

### Dificultad
3

### Tema
objetos

### Fuente
Lenguaje 3 tomo 2 — plural en -z (`cruz`)

### Observaciones
z → ces. Cotidiano en entorno escolar/cultural.

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
Lenguaje 3 tomo 2 (`luz`); ANAYA refuerzo («Se encendió la luz» en bloque de plural)

### Observaciones
z → ces. Muy cotidiano.

### Estado
draft

---

## Par

### Id
morph-num-avestruz-avestruces

### Axis
number

### Forma A
avestruz

### Forma B
avestruces

### PromptSide
either

### Dificultad
3

### Tema
animales

### Fuente
ANAYA ampliación — cambiar el número (`avestruz`)

### Observaciones
z → ces. Menos habitual; se mantiene por drill explícito (no nivel 4).

### Estado
draft

---

# GÉNERO (masculino / femenino)

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
ANAYA refuerzo — paradigma `amigo amiga amigos amigas`

### Observaciones
Cambio -o / -a transparente. Cruce con ítems de número del mismo paradigma.

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
Lenguaje 3 / materiales 3.º (niños y niñas); ambos lemas en `formar-palabras.json`

### Observaciones
Par canónico de 3.º. Multi-banco scramble.

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
Vicens VV («Mi abuela se llama…»); ambos lemas en formar-palabras

### Observaciones
Cotidiano y claro.

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
Vicens VV («tu profesor o profesora»); ambos lemas en formar-palabras

### Observaciones
Sufijo -a sobre base en -or; habitual en aula.

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
Vicens VV (clasificación M/F: `gata`); `gato` en formar-palabras; ejemplo MASTER

### Observaciones
Par claro -o/-a. No se fuerza caballo/yegua ni toro/vaca.

### Estado
draft

---

# Resumen del borrador

## Conteos

| Axis | Pares |
|------|------:|
| number (singular/plural) | **15** |
| gender (masculino/femenino) | **5** |
| **Total** | **20** |

## Distribución por niveles

| Dificultad | Nº | Notas |
|------------|---:|-------|
| 1 | 9 | -s transparentes + géneros -o/-a básicos |
| 2 | 6 | -es, z→ces frecuentes, profesor/profesora |
| 3 | 5 | z→ces menos habituales (lombriz, perdiz, cruz, avestruz) + — |
| 4 | **0** | Ninguno forzado |

## Distribución temática

| Tema | Nº | Pares |
|------|---:|-------|
| personas | 6 | amigo/amigos, amiga/amigas, amigo/amiga, niño/niña, jugador/jugadores, profesor/profesora |
| casa | 3 | mesa, silla, luz |
| animales | 4 | pez, perdiz, avestruz, gato/gata |
| naturaleza | 2 | árbol, lombriz |
| colegio | 2 | lápiz, profesor/profesora* |
| objetos | 2 | red, cruz |
| ropa | 1 | gorro |
| familia | 1 | abuelo/abuela |

\*profesor cuenta en personas y colegio en la lectura pedagógica; en la tabla se asigna a **colegio** (1) y niño/amigo/jugador a **personas**. Recuento estricto sin doble conteo:

| Tema (asignación única) | Nº |
|-------------------------|---:|
| personas | 5 |
| animales | 4 |
| casa | 3 |
| naturaleza | 2 |
| objetos | 2 |
| colegio | 2 |
| ropa | 1 |
| familia | 1 |
| **Total** | **20** |

Huecos conscientes: comida, ciudad (sin drill castellano fuerte de `ciudad/ciudades` en extractos).

## Pares descartados (y motivo)

| Par / candidata | Motivo |
|-----------------|--------|
| camión / camiones | Vicens/ANAYA lo piden, pero **cambia la tilde** (camión→camiones): excluido por norma del encargo |
| campeón / campeones | Misma razón de tilde; aparece junto al bloque ANAYA |
| actriz / actrices (número) o actor / actriz (género) | ANAYA trae *actriz*; cambio de lema / cautela del encargo — no hinchar cantidad |
| rey / reina, caballo / yegua, toro / vaca | Cambio total de lema; sin necesidad pedagógica prioritaria |
| perro / perra | Vicens clasifica *perro*; no hay drill explícito del par de género |
| jugador / jugadora | Género fuerte en fitxa **catalana**; no forzar al banco castellano |
| casa / casas, gato / gatos, libro / libros (número) | Cotidianos y en formar-palabras, pero **sin drill de plural** en extractos castellanos revisados → no inventar |
| ciudad / ciudades | Ejemplo del brief; **sin evidencia** de drill en fuentes abiertas del repo |
| hoj a / hojas, teléfono… | Expresiones ANAYA en plural de sintagma; se priorizó el núcleo *árbol* |
| Pares solo catalanes (lleó, peix, motxilla…) | Fuera de locale `es-ES` |
| Verbos / adjetivos como producto / pronombres | Fuera de alcance |

## Dudas editoriales (para auditoría humana)

1. **¿Reabrir `camión/camiones` en nivel 3** pese al cambio de tilde, por estar en Vicens+ANAYA? Ahora está fuera.  
2. **¿Añadir `gato/gatos` y `casa/casas`** como número usando solo vocabulario de formar-palabras + criterio MASTER, sin drill explícito? Ahora fuera (anti-invención).  
3. **Volumen:** 20 pares (bajo el rango orientativo MASTER 40–70). ¿Ampliar en una segunda pasada solo con nuevas fichas PDF, o congelar corto y de calidad?  
4. **`cruz/cruces`:** ¿demasiado “simbólico” / poco lúdico frente a pez/lápiz?  
5. **`avestruz`:** ¿mantener nivel 3 o cortar por baja frecuencia infantil?  
6. **Ortografía:** pez/lápiz/luz tocan z→ces (también regla ortográfica). Se dejan en Morfología porque el **objetivo es número**, no la regla ortográfica de Ortografía — confirmar frontera.

## Autoauditoría previa

| Comprobación | Resultado |
|--------------|-----------|
| Sin duplicados de par | OK |
| Sin espejos innecesarios (A→B y B→A como dos ítems) | OK (`promptSide: either`) |
| Una sola respuesta por dirección | OK |
| Vocabulario 3.º | OK (con dudas 4–5) |
| Equilibrio 1 / 2 / 3 | OK (9 / 6 / 5); nivel 4 = 0 |
| Temas | Sesgo personas/animales/casa; sin comida |
| Fuentes documentadas | OK |
| Sin verbos / análisis | OK |
| Cautela género irregular | OK (descartados) |
| No se tocó Relaciones Semánticas | OK |

## Runtime (esta entrega)

| Pieza | Estado |
|-------|--------|
| Markdown | borrador |
| JSON | **no** |
| Juego / hub | **no conectado** |
| Tests de pack morph | **no** (sin JSON aún) |
| Siguiente | auditoría humana → luego JSON |

---

## Próximo paso humano

- [ ] Resolver dudas editoriales §  
- [ ] Aprobar o recortar ítems nivel 3  
- [ ] Decidir si se amplía volumen con más PDF  
- [ ] Solo entonces: congelar → JSON `palabras/morfologia.json`  
- [ ] **No** conectar al juego hasta fase de implementación de productos morph
