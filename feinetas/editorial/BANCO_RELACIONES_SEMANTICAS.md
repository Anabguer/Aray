# Banco editorial — Relaciones semánticas

**Pack previsto:** `feinetas/palabras/relaciones-semanticas.json`  
**packKind:** `semantic-relation`  
**Nivel:** 3-primaria · `es-ES`  
**Estado:** borrador post-auditoría · **4 ítems en revisión aparte** · sin JSON aún  
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
| `verano_aray/banc_exercicis/_extraccio_raw/castellano_Lengua_3º-ANAYA_refuerzo.txt` | comercio, disgustado; antónimos tacaño/apagar; adjetivos; montar/desmontar |
| `verano_aray/banc_exercicis/_extraccio_raw/castellano_Lengua_3º-ANAYA_ampliacion.txt` | flaca, abecedario, complicada; tabla veloz/lento/difícil/fácil/vencer… |
| `verano_aray/capitulos/cap_03/05_mision_el_pack_final.md` | contento, difíciles, grande |
| `verano_aray/capitulos/cap_03/solucionario.md` | feliz/alegre |
| `verano_aray/capitulos/cap_04/solucionario.md` | tienda; enfadado |
| `feinetas/formar-palabras.json` | Cruces multi-banco (grande, pequeño, alto, bajo…) |

---

## Correcciones aplicadas (auditoría 2026-08-02)

**Eliminados — prefijos abstractos:** formal/informal, acuerdo/desacuerdo, comunicado/incomunicado, culto/inculto, engañar/desengañar, componer/descomponer, móvil/inmóvil.

**Eliminados — otros:** comprar/adquirir, disfrutar/gozar, comercio/negocio, partir/cortar, disgustado/triste, lugar/zona.

**Mantenidos explícitamente:** bonito/hermoso, grande/enorme, aroma/perfume, vencer/triunfar.

**Revisión aparte (siguen en el banco, marcados):** tienda/comercio, flaca/delgada, contento/feliz, contento/alegre.

**Ajuste:** `montar/desmontar` se mantiene (uso real infantil); dificultad **3** (ya no 4).

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
**REVISIÓN APARTE.** Fitxa 03; solucionari feliz/alegre; cap_03. Pendiente decidir convivencia con `rel-contento-feliz`.

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
**REVISIÓN APARTE.** Solucionari cap_03. Pendiente decidir convivencia con `rel-contento-alegre`.

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
colegio-ciudad

### Observaciones
**REVISIÓN APARTE.** Fitxa 03 (tienda); ANAYA refuerzo (comercio). Valorar formalidad de `comercio` vs uso infantil de `tienda`.

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
Fitxa 03; solucionari. Matiz de intensidad aceptado. **Multi-banco:** `grande` en formar-palabras.

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
Fitxa 03; solucionari sitio. (`lugar/zona` eliminado en auditoría.)

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
negocio

### Dificultad
3

### Categoría
sentidos

### Observaciones
Fitxa 04 + ANAYA refuerzo. Mantenido tras auditoría.

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
Fitxa 04. Mantenido tras auditoría.

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
**REVISIÓN APARTE.** ANAYA ampliación. Valorar sensibilidad / carga de `flaca` y que el target sea solución habitual inferida.

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
aroma

### Dificultad
2

### Categoría
colegio

### Observaciones
ANAYA ampliación. Distractores del propio banco (se retiró `lista` por apoyo débil).

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
ANAYA ampliación: «tarea complicada».

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
ANAYA ampliación; cap_03 pruebas difíciles.

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
ANAYA ampliación. Mantenido tras auditoría.

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
ANAYA ampliación; cap_03 (eje rapidez).

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
ANAYA refuerzo; solucionari cap_04. (`disgustado/triste` eliminado.)

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
**Multi-banco:** formar-palabras. Distractor *enorme* = sinónimo de grande.

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
**Multi-banco:** ambos en formar-palabras.

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
complicado
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
ANAYA ampliación. (`disfrutar/gozar` eliminado; distractor ya no usa *gozar*.)

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
ANAYA refuerzo. Distractor *formal* retirado (ítem prefijo eliminado).

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
ANAYA refuerzo (velas). Lema en infinitivo.

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
ANAYA refuerzo. Polisemia de *ocupado* a vigilar en UI.

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
ANAYA refuerzo. Polisemia de *claro* a vigilar en UI.

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
ANAYA refuerzo. Más abstracto; se mantiene pendiente de criterio futuro (no estaba en el lote de eliminación directa).

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
ANAYA refuerzo (*des-* + montar). Uso real infantil (juguetes). Baja de nivel 4 → **3**. Prefijos abstractos del mismo ejercicio ANAYA: eliminados.

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

# Resumen editorial

## Conteos (post-auditoría)

| Relation | Ítems |
|----------|------:|
| synonym | 17 |
| antonym | 15 |
| **Total** | **32** |

| Dificultad | Ítems |
|------------|------:|
| 1 | 9 |
| 2 | 14 |
| 3 | 9 |
| 4 | **0** |

De los 32, **4** están en **revisión aparte** (no congelar hasta decisión).

## Ítems en revisión aparte

| Id | Motivo de la espera |
|----|---------------------|
| `rel-contento-alegre` | Convivencia / posible duplicado con contento→feliz |
| `rel-contento-feliz` | Idem |
| `rel-tienda-comercio` | Formalidad de `comercio` vs uso infantil |
| `rel-flaca-delgada` | Sensibilidad + target inferido |

## Eliminados en esta pasada

| Par | Motivo |
|-----|--------|
| Prefijos abstractos (7) | Deducción mecánica / poco uso 3.º |
| comprar / adquirir | Formal |
| disfrutar / gozar | `gozar` poco habitual |
| comercio / negocio | Sinonimia parcial |
| partir / cortar | Solo contexto “partir el pan” |
| disgustado / triste | No son sinónimos reales |
| lugar / zona | Más débil que lugar/sitio |

## Próximo paso humano

- [ ] Decidir los **4 ítems en revisión aparte**  
- [ ] Revisar si se mantiene `grande/inmenso` y `superficial/profundo` (no tocados en esta pasada)  
- [ ] Congelar MD → JSON  
- [ ] **No** abrir Morfología hasta congelar este banco  

---

# Auditoría — distribución temática

Comprobación de equilibrio del banco **tras las correcciones** (32 ítems; un ítem cuenta en una sola categoría principal).

| Tema | Sinónimos | Antónimos | Total | Ítems |
|------|----------:|----------:|------:|-------|
| **Emociones** | 3 | 1 | **4** | contento↔alegre*, contento↔feliz*, disgustado↔enfadado, alegre↔triste |
| **Cualidad** (aspecto, dificultad, sonido, luz, carácter) | 5 | 8 | **13** | syn: bonito/hermoso, flaca/delgada*, complicada/difícil, difícil/complicado, veloz/rápido · ant: veloz/lento, difícil/fácil, tacaño/generoso, ocupado/libre, claro/oscuro, ruidoso/silencioso, superficial/profundo, bonito/feo |
| **Tamaño / dimensión** | 2 | 2 | **4** | grande/enorme, grande/inmenso; grande/pequeño, alto/bajo |
| **Acciones** | 3 | 4 | **7** | alzar/levantar, sanar/curar, vencer/triunfar; disfrutar/sufrir, vencer/perder, apagar/encender, montar/desmontar |
| **Espacio** | 1 | 0 | **1** | lugar/sitio |
| **Colegio / ciudad** | 2 | 0 | **2** | tienda/comercio*, abecedario/alfabeto |
| **Sentidos** | 1 | 0 | **1** | aroma/perfume |
| **Animales** | 0 | 0 | **0** | — |
| **Naturaleza** | 0 | 0 | **0** | — |
| **Objetos** | 0 | 0 | **0** | — |
| **Comida** | 0 | 0 | **0** | — |
| **Cuerpo** (explícito) | 0 | 0 | **0** | (`flaca/delgada` va en cualidad; revisión aparte) |

Suma de totales temáticos: 4+13+4+7+1+2+1 = **32**.

\* = revisión aparte.

### Lectura de equilibrio

| Fortalezas | Huecos / descompensación |
|------------|---------------------------|
| Bien cubierto: **cualidad**, **acciones**, **tamaño**, **emociones** | Sin ítems de **animales**, **naturaleza**, **objetos**, **comida** |
| Eje emocional usable para Sinónimos + Antónimos | **Espacio** y **sentidos** con un solo par cada uno |
| Colegio presente (abecedario; tienda pendiente) | Si se cortan los 4 de revisión aparte, emociones bajan a 2 y colegio-ciudad a 1 |

### Conclusión temática

El banco **no está vacío de temas escolares centrales**, pero **sí está sesgado** hacia adjetivos de cualidad/tamaño y verbos de acción. No es un banco “de vocabulario temático” (animales, comida, objetos): es un banco de **relaciones léxicas** tipología BEX/ANAYA. Eso es coherente con la fuente, pero conviene:

1. No rellenar con inventarios temáticos ajenos a las fichas.  
2. En bancos posteriores (campos semánticos, familias) cubrir animales/comida/objetos.  
3. Tras la revisión aparte, recontar emociones/colegio.

**No congelar** hasta resolver los 4 ítems marcados. **No** pasar a Morfología todavía.
