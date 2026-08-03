# Plan de implementación — Lengua (fichas → Aray)

Acordado con el usuario (ago 2026). Catálogo de fichas: [`BACKLOG.md`](./BACKLOG.md).  
**No** clonar cada ficha como minijuego: pocos modos + bancos.

## Menú Palabras (objetivo)

| Apartado | Qué pasa |
|----------|----------|
| Formar palabras | Se queda |
| **Clasifica** *(nuevo)* | Sustituye Singular/plural + Masculino/femenino |
| Sinónimos | Se queda MCQ + se añade modo unir |
| Antónimos | Se queda MCQ + se añade modo unir |
| **Monta la frase** *(nuevo)* | Ordenar palabras (con amigos de Aray) |
| Ortografía *(estación aparte)* | + lemas de fichas |
| Varios *(después)* | Quién hace qué, une frase, campos… |

---

## Fase A — Clasifica

**Quitar:** MCQ “¿plural de abeja? → abeja / abejas” y el equivalente de género (absurdo).

**Poner:** un solo botón **«Clasifica»**. Dentro, rondas (aleatorias o por tipo):

1. **Una / Muchas** — arrastrar varios nombres a 2 bandos  
2. **El / La** — arrastrar a masculino / femenino  
3. **Artículos** — ¿qué le pones delante? (el / la / los / las)  
4. *(opcional)* **Género + número** — tabla 2×2  

**Bancos desde fichas (sin duplicar):** backlog 02, 11, 13, 16, 26, 61, 62, 73, 79, 100, 102…

**To-do**
- [ ] Quitar entradas de menú `singular-plural` y `masculino-femenino` (o redirigir a Clasifica)
- [ ] UI arrastrar / tocar→destino (2–4 bandos)
- [ ] Generador de rondas (número · género · artículo · mix)
- [ ] Bancos + dedupe vs `morfologia.json` actual
- [ ] Ayuda «?» (qué es género / número / artículo)
- [ ] Tests + commit/push/deploy

---

## Fase B — Monta la frase

**Modo:** tocar/arrastrar palabras en orden (sin escribir).

**Contenido**
- Frases de fichas (01, 52, 57…)
- Frases nuevas inventadas, tono jovial, con amigos:  
  **Aray, Alma, Erik, Carlos, Ángel, Luca, Mark, Enzo, Erika, Axel**  
  Temas: Roblox, parque, playa, 99 noches, colegio…

**To-do**
- [ ] Minijuego `order-sentence` + ruta en Palabras (o Frases)
- [ ] Banco JSON (fichas + amigos)
- [ ] Validar orden + mayúscula/punto
- [ ] Tests + commit/push/deploy

---

## Fase C — Ortografía (lemas de fichas)

Misma mecánica actual (`missing`, `correct`, `complete`…).  
Solo **palabras nuevas** por regla (trampas de fichas).

**Reglas a revisar en backlog:** r-rr, b-v / -bir--vir, mb-mp-nv, g-j, gu-gue, c-z-qu, d-z, ha/a, bl-br, tildes…

**To-do**
- [ ] Extraer lemas “aportan” del BACKLOG (omitir duplicados marcados)
- [ ] Meter en packs `feinetas/ortografia/*.json` (+ frases ha/a si aplica)
- [ ] Regenerar / tests ortografía
- [ ] Commit/push/deploy

---

## Fase D — Antónimos y sinónimos (segunda forma)

**Mantener** MCQ actual (ancla + 3 opciones).  
**Añadir** modo unir/arrastrar parejas (fichas 15, 43, 45, 78, 89, 91, 92…).

En la ronda pueden salir los dos estilos (aleatorio).

**To-do**
- [ ] UI Empareja (tocar A→B o arrastrar)
- [ ] Ampliar `relaciones-semanticas.json` con pares nuevos (dedupe)
- [ ] Alternar formato MCQ / Empareja en antónimos y en sinónimos
- [ ] Tests + commit/push/deploy

---

## Fase E — Después (Varios)

Si no cabe en Clasifica / Monta / Ortografía / Antó-Sino:

- Quién hace qué (pronombre↔verbo / acción↔quien) — 33, 80, 82, 94, 98  
- Une la frase 3/4 columnas — 04, 05, 20, 84  
- Campos semánticos / intrusa sentido / familias — 41, 64, 65, 70, 71, 75, 76, 85  
- Aumentativos, tiempos verbales, común↔propio — 86, 95, 90, 99  
- Completa tablero compartido — 58, 72  

**To-do**
- [ ] Decidir si menú «Varios» o estación «Frases»
- [ ] Priorizar 1–2 minijuegos cuando A–D estén estables

---

## Orden de trabajo acordado

1. **Clasifica**  
2. **Monta la frase**  
3. **Ortografía** (lemas)  
4. **Antónimos / sinónimos** (unir)  
5. **Varios** (si hace falta)

Cada fase estable → commit + push + deploy (`deploy/winscp_deploy.ps1`).

---

## Nombres de amigos (Monta la frase)

Aray · Alma · Erik · Carlos · Ángel · Luca · Mark · Enzo · Erika · Axel  
Temas: Roblox · parque · playa · 99 noches · colegio / bici…
