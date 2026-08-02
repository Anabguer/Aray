# Banco editorial — Relaciones semánticas

**Pack previsto:** `feinetas/palabras/relaciones-semanticas.json`  
**packKind:** `semantic-relation`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** borrador editorial · **pendiente de revisión humana** · sin JSON aún  
**Productos:** Sinónimos (`relation: synonym`) · Antónimos (`relation: antonym`) · Mix  
**Normas:** [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) · [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md) · [`PALABRAS_PROGRESSION.md`](./PALABRAS_PROGRESSION.md)

---

## Objetivo

Recoger **pares de sinónimos y antónimos** reales de materiales de 3.º de Primaria (Cataluña / castellano) para Aray.

- Un ítem = una relación (`anchor` → `target` + `relation` + distractores).  
- **No** copiar enunciados de editorial.  
- **No** inventar parejas ni distractores.  
- El mismo lema puede aparecer también en Formar palabras u otros bancos Palabras si el objetivo es otro (PROGRESSION §3).

---

## Plantilla de registro

```
## Relación

### Id
rel-{anchor}-{target}

### Anchor
…

### Target
…

### Relation
synonym | antonym

### Distractores
… (mín. 2, uno por línea)

### Dificultad
1–4

### Categoría
…

### Observaciones
fuentes / cruces multi-banco
```

---

## Fuentes revisadas

| Fuente | Qué aporta |
|--------|------------|
| `verano_aray/fichas_repaso/02_castellano/fitxa_03_sinonimos_contexto.md` | Sinónimos en contexto (tienda, contento, comprar, grande, lugar) |
| `verano_aray/fichas_repaso/02_castellano/fitxa_04_sinonimos_definicion.md` | alzar/sanar/aroma/bonito + parejas |
| `verano_aray/fichas_repaso/solucionari_adults.md` | Soluciones válidas fitxa 03–04 |
| `verano_aray/banc_exercicis/02_castellano.md` | LES-003 / LES-004 tipología |
| `verano_aray/banc_exercicis/_extraccio_raw/castellano_Lengua_3º-ANAYA_refuerzo.txt` | comercio, disgustado, partir; antónimos tacaño/apagar; adjetivos ocupado/claro/ruidoso/superficial; prefijos des-/in- |
| `verano_aray/banc_exercicis/_extraccio_raw/castellano_Lengua_3º-ANAYA_ampliacion.txt` | flaca, abecedario, complicada; tabla veloz/lento/difícil/fácil/disfrutar/sufrir/vencer/perder + sinónimos cruzados |
| `verano_aray/capitulos/cap_03/05_mision_el_pack_final.md` | contento, difíciles, rápidamente, grande |
| `verano_aray/capitulos/cap_03/solucionario.md` | feliz/alegre como sinónimos razonables |
| `verano_aray/capitulos/cap_04/solucionario.md` | tienda; enfadado/triste; cortar |
| `feinetas/formar-palabras.json` | Cruces multi-banco (grande, pequeño, alto, bajo, noche…) — no es fuente de pares nuevos |

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
Fitxa 03; solucionari feliz/alegre; cap_03 misión. Distractores: triste (contraste emocional en solucionari cap_04); grande (misma fitxa 03, otro eje).

---

## Relación

### Id
rel-contento-feliz

### Anchor
contento

### Target
feliz

### Relation
synonym

### Distractores
enfadado
difícil

### Dificultad
1

### Categoría
emociones

### Observaciones
Solucionari cap_03 (feliz/alegre). Anchor repetido con target distinto = dos relaciones pedagógicas. Distractores: enfadado (solucionari cap_04); difícil (cap_03).

---

## Relación

### Id
rel-tienda-comercio

### Anchor
tienda

### Target
comercio

### Relation
synonym

### Distractores
lugar
perfume

### Dificultad
2

### Categoría
escuela-ciudad

### Observaciones
Fitxa 03 (tienda); ANAYA refuerzo (comercio). Solucionari adultos: comercio/negocio.

---

## Relación

### Id
rel-comercio-negocio

### Anchor
comercio

### Target
negocio

### Relation
synonym

### Distractores
abecedario
aroma

### Dificultad
2

### Categoría
escuela-ciudad

### Observaciones
Solucionari fitxa 03 (comercio/negocio). ANAYA refuerzo ancla comercio.

---

## Relación

### Id
rel-comprar-adquirir

### Anchor
comprar

### Target
adquirir

### Relation
synonym

### Distractores
sanar
partir

### Dificultad
3

### Categoría
acciones

### Observaciones
Fitxa 03 (comprar); solucionari (adquirir).

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
Fitxa 03; solucionari enorme/inmenso. **Multi-banco:** `grande` también en `formar-palabras.json` (scramble) — objetivo distinto.

---

## Relación

### Id
rel-grande-inmenso

### Anchor
grande

### Target
inmenso

### Relation
synonym

### Distractores
bajo
fácil

### Dificultad
2

### Categoría
tamaño

### Observaciones
Solucionari fitxa 03 (inmenso). Segundo sinónimo de grande.

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
comercio
veloz

### Dificultad
1

### Categoría
espacio

### Observaciones
Fitxa 03 (lugar); solucionari sitio/zona.

---

## Relación

### Id
rel-lugar-zona

### Anchor
lugar

### Target
zona

### Relation
synonym

### Distractores
bonito
tacaño

### Dificultad
2

### Categoría
espacio

### Observaciones
Solucionari fitxa 03 (zona).

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
Fitxa 04 + ANAYA refuerzo (alzar / levantar).

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
negocio

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
Fitxa 04. Distractor *feo*: antónimo escolar habitual del eje bonito/hermoso (pareja de la misma ficha); *ruidoso* de ANAYA adjetivos.

---

## Relación

### Id
rel-flaca-delgada

### Anchor
flaca

### Target
delgada

### Relation
synonym

### Distractores
ocupada
clara

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA ampliación: «Mi vecina está muy flaca» → sinónimo. Target *delgada* = solución escolar habitual del ejercicio de sustitución (no se copia la frase).

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
comercio
lista

### Dificultad
2

### Categoría
escuela

### Observaciones
ANAYA ampliación: «El abecedario tiene 27 letras». Distractor *lista*: del entorno escolar de orden alfabético (BEX LES-001 tipología); no es sinónimo.

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
ANAYA ampliación: «tarea complicada». Acento en *difícil*.

---

## Relación

### Id
rel-dificil-complicado

### Anchor
difícil

### Target
complicado

### Relation
synonym

### Distractores
lento
alegre

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA ampliación (columna: difícil / complicado como equivalentes en la tabla de relaciones). Cap_03: pruebas difíciles.

---

## Relación

### Id
rel-disfrutar-gozar

### Anchor
disfrutar

### Target
gozar

### Relation
synonym

### Distractores
sufrir
perder

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA ampliación: disfrutar ↔ gozar en la tabla de relaciones (sinónimos cruzados del ejercicio de antónimos).

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
ANAYA ampliación: vencer ↔ triunfar.

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
ANAYA ampliación: veloz ↔ rápido. Cap_03: rápidamente (mismo eje).

---

## Relación

### Id
rel-partir-cortar

### Anchor
partir

### Target
cortar

### Relation
synonym

### Distractores
curar
levantar

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA refuerzo: «parto el pan»; solucionari cap_04: cortar (con romper como alternativa razonable — aquí se fija *cortar*).

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
ANAYA refuerzo: disgustado. Solucionari cap_04: enfadado/triste. Se elige *enfadado* como target canónico.

---

## Relación

### Id
rel-disgustado-triste

### Anchor
disgustado

### Target
triste

### Relation
synonym

### Distractores
alegre
ocupado

### Dificultad
2

### Categoría
emociones

### Observaciones
Segunda lectura válida del solucionari cap_04 (triste).

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
Eje de tamaño en fichas de adjetivos / Formar palabras (`grande`, `pequeño`). **Multi-banco:** scramble en formar-palabras + sinónimos de grande en este banco — objetivos distintos. Distractor *enorme* = sinónimo de grande (mismo banco), no antónimo.

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
**Multi-banco:** ambos lemas en `formar-palabras.json`. Contraste de tamaño/altura escolar.

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
ANAYA ampliación: veloz ↔ lento. Distractor *rápido* = sinónimo de veloz (mismo banco).

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
complicado
veloz

### Dificultad
1

### Categoría
cualidad

### Observaciones
ANAYA ampliación: difícil ↔ fácil.

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
gozar
vencer

### Dificultad
3

### Categoría
acciones

### Observaciones
ANAYA ampliación: disfrutar ↔ sufrir.

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
gozar

### Dificultad
2

### Categoría
acciones

### Observaciones
ANAYA ampliación: vencer ↔ perder.

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
formal

### Dificultad
3

### Categoría
cualidad

### Observaciones
ANAYA refuerzo: sustituir *tacaño* por su antónimo en el texto del tío.

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
partir

### Dificultad
2

### Categoría
acciones

### Observaciones
ANAYA refuerzo: *apagué* las velas → antónimo *encender* (forma de lema en infinitivo, como el resto del banco).

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
ANAYA refuerzo: «Escribe el antónimo… ocupado». Target escolar habitual *libre*.

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
superficial
ocupado

### Dificultad
2

### Categoría
cualidad

### Observaciones
ANAYA refuerzo: antónimo de *claro*.

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
ANAYA refuerzo: antónimo de *ruidoso*.

---

## Relación

### Id
rel-superficial-profundo

### Anchor
superficial

### Target
profundo

### Relation
antonym

### Distractores
ruidoso
delgada

### Dificultad
3

### Categoría
cualidad

### Observaciones
ANAYA refuerzo: antónimo de *superficial*.

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
Cierre del eje emocional: alegre (target de sinónimos) ↔ triste (solucionari cap_04). Distractores = sinónimos de alegre/contento (mismo banco), no antónimos.

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
componer
leer

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: prefijo *des-* → antónimo de *montar*. Nivel 4 (PROGRESSION).

---

## Relación

### Id
rel-movil-inmovil

### Anchor
móvil

### Target
inmóvil

### Relation
antonym

### Distractores
formal
culto

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: prefijo *in-* → *móvil*.

---

## Relación

### Id
rel-formal-informal

### Anchor
formal

### Target
informal

### Relation
antonym

### Distractores
acuerdo
móvil

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: prefijo *in-* → *formal*.

---

## Relación

### Id
rel-acuerdo-desacuerdo

### Anchor
acuerdo

### Target
desacuerdo

### Relation
antonym

### Distractores
montar
comunicado

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: prefijo *des-* → *acuerdo*.

---

## Relación

### Id
rel-enganar-desenganar

### Anchor
engañar

### Target
desengañar

### Relation
antonym

### Distractores
componer
calentar

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: *des-* + engañar. Distractor *calentar*: mismo bloque de prefijos (*re-calentar*), no antónimo de engañar.

---

## Relación

### Id
rel-culto-inculto

### Anchor
culto

### Target
inculto

### Relation
antonym

### Distractores
formal
comunicado

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: *in-* + culto.

---

## Relación

### Id
rel-comunicado-incomunicado

### Anchor
comunicado

### Target
incomunicado

### Relation
antonym

### Distractores
acuerdo
móvil

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: *in-* + comunicado.

---

## Relación

### Id
rel-componer-descomponer

### Anchor
componer

### Target
descomponer

### Relation
antonym

### Distractores
montar
engañar

### Dificultad
4

### Categoría
prefijos

### Observaciones
ANAYA refuerzo: *des-* + componer.

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
Antónimo escolar del eje fitxa 04 (bonito/hermoso). Distractor *hermoso* = sinónimo de bonito.

---

# Resumen editorial

## Conteos

| Relation | Ítems |
|----------|------:|
| synonym | 23 |
| antonym | 22 |
| **Total** | **45** |

| Dificultad | Ítems (aprox.) |
|------------|----------------:|
| 1 | 10 |
| 2 | 18 |
| 3 | 9 |
| 4 | 8 |

Volumen dentro del rango MASTER (40–70).

## Criterios de selección

1. Solo pares con respaldo en fitxes Aray, solucionari, BEX LES-003/004 o ANAYA 3.º (refuerzo/ampliación).  
2. Distractores tomados del propio banco o del mismo eje de ficha (nunca relleno libre).  
3. Infinitivo en verbos para lema estable (`apagar`/`encender`, no formas conjugadas del texto fuente).  
4. Prefijos *des-*/ *in-* = dificultad 4, cuota limitada.  
5. Lemas compartidos con Formar palabras anotados donde aplica (`grande`, `alto`, `bajo`, `pequeño`).

## Fuera de este banco (consciente)

| Candidato | Motivo |
|-----------|--------|
| Definiciones tipo fitxa 04 (ejercicio “¿qué significa?”) | Producto **Definición ↔ palabra = v2** |
| *romper* como sinónimo de partir | Alternativa del solucionari; se fijó *cortar* para no duplicar ancla |
| Antónimo de *flaca* (*gorda*) | No forzar; sin drill explícito de antónimo en la ficha |
| Homófonos / ortografía | Ortografía |

## Próximo paso humano

- [ ] Revisar parejas y distractores  
- [ ] Aprobar o pedir recortes (sobre todo nivel 4 / prefijos)  
- [ ] Congelar MD → entonces JSON `palabras/relaciones-semanticas.json`  
- [ ] Siguiente banco editorial: `BANCO_MORFOLOGIA.md`
