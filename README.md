# ARAY

Espacio digital personal de **Aray**. Aplicación web bajo la ruta `/aray/`.

URL prevista: `https://intocables13.com/aray/`

## Estado de esta fase

Portada con **Lumo**, barra de meta **500 Robux** (puntos de recompensa independientes), Misiones y módulo jugable de **tablas de multiplicar** (Aprende / Entrena / Reto rápido), con progreso en `localStorage`.

**Sistemas separados:** XP · monedas · dominio · puntos de recompensa.

Incluye **Mi colección** con insignias, tablas domadas, pistas de desbloqueo y premios reclamables.

**No incluye todavía:** personalización completa de Lumo, otras materias, backend, MySQL, login, PWA, Capacitor, Roblox ni despliegue.

## Material anterior

El contenido educativo previo permanece intacto en:

`verano_aray/`

Bancos de ejercicios, capítulos, fichas y generadores Python. No forma parte del build de la web; se reutilizará más adelante.

**No mover, renombrar, borrar ni reorganizar `verano_aray/`** salvo indicación explícita.

## Orden de desarrollo (acordado)

1. Terminar y revisar la base visual actual (portada, navegación, Misiones, móvil).
2. Diseñar el sistema de práctica de **tablas de multiplicar** (propuesta + decisiones antes de programar).
3. Crear **un único** minijuego de multiplicaciones, bien terminado.
4. Probarlo con Aray y mejorarlo según su reacción.
5. Solo después reutilizar la arquitectura para otras actividades.

**Primera actividad jugable (tras aprobar el diseño):** Matemáticas → tablas de multiplicar.

Por ahora no desarrollar: lengua, catalán, inglés, medio, relojes, dinero, geometría ni otras competencias.

## Arquitectura futura de actividades (solo orientación)

Separar **mecánica** y **contenido**. Mecánicas reutilizables previstas a largo plazo (no construirlas aún):

- Arrastrar y soltar, respuesta rápida, memory, revienta globos, carrera, clasificación, ordenar, construir/desbloquear, contrarreloj.

Ejemplo: la misma mecánica «revienta la respuesta correcta» podrá usarse luego con multiplicaciones, horas, vocabulario u ortografía.

## Recursos para fases futuras

Referencia pedagógica (fichas 3.º Primaria / cicle mitjà). **No copiar** textos, ilustraciones ni ejercicios; no incorporar PDF a la app. Usar solo para identificar habilidades y estructura, y crear actividades originales para ARAY.

- https://fitxes.cat/category/cicle-mitja/3r-primaria/#fitxes

No descargar masivamente ni analizar PDF uno a uno. Si hace falta estudiar una competencia concreta, preguntar antes y usar solo lo estrictamente necesario.

## Desarrollo local

```bash
cd W:\Aray
npm install
npm run dev
```

Abre la URL que muestre Vite, preferiblemente con barra final:

`http://localhost:5173/aray/`

Si entras a `/aray` sin barra, el servidor te redirige a `/aray/`.

### Desde un móvil en la misma Wi‑Fi

```bash
npm run dev -- --host
```

En el móvil, entra a `http://TU_IP_LOCAL:5173/aray/` (la IP aparece en la terminal).

### Comprobaciones

```bash
npm run build
npm run lint
npm test
npm run preview
```

## Estructura principal

- `src/` — React + TypeScript (UI)
- `api/` — stubs PHP futuros
- `includes/` — paths y ejemplo de BD (sin secretos)
- `database/` — notas del prefijo `arayapp_`
- `verano_aray/` — material educativo anterior (no tocar en el build)
- `.htaccess` — SPA bajo `/aray/`
- `public/` — estáticos

## Stack

React, TypeScript, Vite, React Router. PHP/PDO y MySQL previstos para fases posteriores.
