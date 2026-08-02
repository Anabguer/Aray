# Palabras — Progresión y dificultad (3.º Primaria)

**Estado:** Norma editorial de familia · Fase Editorial.  
**No** es contenido jugable.  
**Actualizado:** 2026-08-02.

Complementa [`PALABRAS_MASTER.md`](./PALABRAS_MASTER.md) y [`PALABRAS_JSON_SPEC.md`](./PALABRAS_JSON_SPEC.md).

---

## 1. Escala común (todos los bancos Palabras)

Cada ítem editorial lleva **`difficulty`** entero **1–4** (mismo espíritu que `formar-palabras.json` y el campo opcional de Ortografía).

| Nivel | Etiqueta interna | Uso pedagógico |
|------:|------------------|----------------|
| **1** | Básico | Parejas / listas / campos **muy frecuentes** del entorno del niño; contraste inequívoco |
| **2** | Ciclo medio | Vocabulario **escolar habitual** de 3.º; aún transparente |
| **3** | Reto | Menos frecuentes, verbos, o matiz que exige leer con calma |
| **4** | Avanzado | Prefijos (*des-*/ *in-*), pares con más carga léxica; **uso limitado** en v1 |

**Reglas:**

1. El nivel es **editorial** (se escribe en el MD). No lo inventa el adaptador.  
2. Sirve para **muestreo** de rondas (más 1–2 al inicio; 3–4 con moderación), no para bloquear productos.  
3. Un mismo producto (p. ej. Sinónimos) mezcla niveles; Mix puede ponderar.  
4. Si hay duda entre dos niveles → **elegir el inferior** (mejor fácil que frustrante).  
5. Formar palabras conserva su `dificultad` 1–4 actual; **no** se recalibra en v1.

---

## 2. Criterios por tipo de banco

### 2.1 Relaciones semánticas (`semantic-relation`)

| Nivel | Sinónimos | Antónimos |
|------:|-----------|-----------|
| 1 | Adjetivos/nombres cotidianos (*contento/alegre*, *grande/enorme*) | Contrarios básicos (*grande/pequeño*, *alto/bajo*) |
| 2 | Léxico de ficha escolar (*comercio/negocio*, *difícil/complicado*) | Contrarios escolares (*fácil/difícil*, *veloz/lento*) |
| 3 | Verbos o menos frecuentes (*alzar/levantar*, *aroma/perfume*) | Verbos de resultado (*vencer/perder*, *encender/apagar*) |
| 4 | Solo con evidencia fuerte | Antónimos por prefijo atestiguados (*montar/desmontar*) — pocos |

**Distractores:** siempre del mismo banco o del mismo ejercicio fuente; nunca “palabras inventadas para rellenar”. Preferir:

- otro ítem del banco (ancla o target ajeno);
- el antónimo/sinónimo “espejo” solo si no revela la respuesta de forma tramposa.

### 2.2 Morfología

| Nivel | Criterio |
|------:|----------|
| 1 | Regular transparente (*casa/casas*, *niño/niña*) |
| 2 | Ortografía de plural habitual (*lápiz/lápices*, *pez/peces*) |
| 3 | Menos frecuentes o cambio de raíz atestiguado |
| 4 | Evitar en v1 salvo evidencia explícita |

### 2.3 Familias léxicas / campos semánticos

| Nivel | Criterio |
|------:|----------|
| 1 | Familia/campo de 3–4 miembros muy claros; intrusa obvia |
| 2 | 4–6 miembros; intrusa del entorno próximo pero fuera del campo |
| 3 | Miembros menos literales o campo más amplio |
| 4 | Evitar en v1 |

### 2.4 Oraciones / listas diccionario

| Nivel | Oraciones (tokens) | Listas diccionario |
|------:|--------------------|--------------------|
| 1 | 5–6 tokens; SVO simple | 4 palabras; iniciales distintas |
| 2 | 6–8 tokens | 5 palabras; alguna misma inicial |
| 3 | 8–9 tokens; orden menos obvio | 6 palabras; desempate por 2.ª letra |
| 4 | Evitar subordinadas largas | Evitar en v1 |

---

## 3. Lema en varios bancos (norma Palabras)

### Contraste con Ortografía

| Familia | Norma |
|---------|--------|
| **Ortografía** | Un lema → **un** banco propietario (regla ortográfica). No se duplica. |
| **Palabras** | Un **mismo lema** (misma forma escrita) **puede** aparecer en **varios bancos** si el **objetivo pedagógico** es distinto. |

### Qué está permitido

Ejemplos válidos:

| Lema | Banco A | Objetivo A | Banco B | Objetivo B |
|------|---------|------------|---------|------------|
| `grande` | Formar palabras | Ordenar letras | Relaciones | Sinónimo / antónimo |
| `grande` | Relaciones (`grande`↔`pequeño`) | Antónimo | Campos semánticos | Miembro del campo *tamaños* |
| `niño` | Morfología | Singular/plural o género | Familias | Derivados (*niñez*…) si la ficha lo respalda |

### Qué está prohibido

1. **Duplicar el mismo registro pedagógico** dentro del **mismo** banco (dos ítems idénticos `anchor+target+relation`).  
2. Copiar el mismo par sinónimo a un segundo JSON “de producto” (no hay JSON por producto).  
3. Usar un lema en otro banco **sin** objetivo distinto (relleno).  
4. Inventar cruces “porque queda bien” sin ficha/temario.

### Identidad técnica (miss store)

```text
packId + item.id
```

Dos apariciones del lema `grande` en bancos distintos = **dos ítems** distintos (`palabras-relaciones-…` vs `formar-palabras`).  
El Review reexpone el ítem del pack donde se falló, no “todas las caras” del lema.

### Criterio editorial al reutilizar un lema

Anotar en Observaciones del ítem:

- en qué otro banco/pack aparece (si se conoce);
- por qué el objetivo es distinto.

No hace falta listar todos los cruces con Formar palabras (250 lemas); sí los cruces **relevantes** entre bancos nuevos de Palabras.

---

## 4. Progresión de producto (rondas)

Orientación para Implementación (no código aún):

| Momento | Mix de dificultad sugerido |
|---------|----------------------------|
| Primeras sesiones / modo fácil | ~70 % nivel 1 · 25 % nivel 2 · 5 % nivel 3 |
| Sesión estándar 3.º | ~40 % 1 · 40 % 2 · 15 % 3 · 5 % 4 |
| Reto / Mix avanzado | ~20 % 1 · 35 % 2 · 35 % 3 · 10 % 4 |

Si un banco tiene pocos ítems de nivel 4, **no rellenar** con invención: bajar la cuota de 4.

---

## 5. Checklist al asignar dificultad

- [ ] ¿Aparece en fichas/BEX de 3.º?  
- [ ] ¿El contraste es inequívoco para ~9 años?  
- [ ] ¿Los distractores/intrusos son editoriales?  
- [ ] ¿Si el lema ya está en otro banco, el objetivo es distinto y está anotado?  
- [ ] ¿Ante la duda, nivel inferior?

---

## 6. Resumen

Escala **1–4** común a la familia.  
**Palabras permite el mismo lema en varios bancos** cuando cambia el objetivo pedagógico; Ortografía no.  
La dificultad es dato editorial para muestrear, no para inventar contenido.
