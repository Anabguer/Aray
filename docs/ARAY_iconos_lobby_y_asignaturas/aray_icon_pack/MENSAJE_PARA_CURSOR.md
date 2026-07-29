Te adjunto una carpeta con nueve iconos nuevos para ARAY. Integra los recursos incluidos en `icons/` y corrige también la composición de escritorio. No sustituyas estas imágenes por emojis, iconos de librería ni reinterpretaciones.

## 1. Problema de escritorio

En la captura de ordenador, el contenido útil ocupa una columna central de unos 690 px dentro de una pantalla de casi 1.900 px. En móvil funciona bien, pero en PC parece una versión móvil colocada en medio de un fondo enorme.

No soluciones esto estirando todas las tarjetas verticales a todo el ancho. Crea una composición responsive específica:

- Mantén intacto el buen comportamiento móvil.
- Desde `1024px`, usa un contenedor fluido de aproximadamente `min(1240px, calc(100vw - 64px))`.
- En pantallas grandes, deja márgenes laterales equilibrados, no un `max-width` estrecho de móvil/tablet.
- La cabecera de bienvenida puede organizarse en dos zonas: saludo/Lumo a la izquierda y avatar de ARAY más progreso resumido a la derecha.
- La zona principal debe usar una cuadrícula de escritorio:
  - Misión de hoy como tarjeta protagonista, ocupando aproximadamente dos tercios.
  - Próximo drop como tarjeta secundaria, ocupando aproximadamente un tercio.
  - Los accesos a Misiones y Mi colección deben aparecer después como tarjetas jugables, no como texto perdido al final.
- En tablet puede pasar a dos columnas equilibradas.
- En móvil debe volver a una sola columna sin scroll horizontal.
- No hagas las líneas de texto excesivamente largas. Aprovechar el ancho significa mejorar la composición, no convertir cada párrafo en una autopista.
- Prueba expresamente a 1366×768, 1440×900, 1920×1080, tablet y móvil.

## 2. Jerarquía de iconos

No uses el mismo tipo de icono para conceptos diferentes:

- `matematicas.png`: representa la asignatura Matemáticas.
- `tablas.png`: representa específicamente la actividad Tablas de multiplicar y sustituye la calculadora lineal actual de “Tu misión de hoy”.
- Los futuros ejercicios de Reloj, Cálculo, Problemas, etc. deben tener sus propios iconos de actividad, aunque pertenezcan a Matemáticas.
- `catalan.png`, `castellano.png`, `ingles.png` y `medi.png`: representan las asignaturas.
- `misiones.png`: acceso principal a Misiones.
- `coleccion.png`: acceso a Mi colección.
- `drop_robot.png`: sustituye a Lumo dentro de “Próximo drop”. Es una cápsula/robot de recompensa y hace que el objetivo se entienda visualmente.

Lumo no debe utilizarse como icono genérico de todo. Debe seguir siendo el compañero que saluda, reacciona y celebra. Si aparece también en cada tarjeta, pierde personalidad y confunde la función de los elementos.

## 3. Portada / lobby

Convierte la portada en un lobby de juego, manteniendo la dirección ya acordada: fondo oscuro y tecnológico; contenido vivo, colorido y jugable.

- Da más presencia visual a “Tu misión de hoy”.
- Usa `tablas.png` en un tamaño protagonista, no dentro de un cuadradito minúsculo.
- Muestra la recompensa de forma directa: XP y energía disponibles.
- Usa un botón principal claro: `JUGAR`.
- Reduce o traslada a una ayuda `i` el texto permanente:
  `XP y monedas son para jugar. El drop de Robux se carga con energía...`
- En “Próximo drop”, usa `drop_robot.png`, muestra con claridad el objetivo, la energía actual y la barra de progreso.
- No muestres el valor aproximado en euros a Aray en el lobby. Esa información es para la zona adulta.
- Añade accesos visuales a Misiones y Mi colección usando sus imágenes.
- Conserva contraste, foco de teclado y textos accesibles. Las imágenes decorativas deben usar `alt=""`; las que transmiten función deben tener un nombre accesible adecuado sin repetir el texto visible.

## 4. Pantalla de Misiones y asignaturas

Los iconos actuales de Matemáticas, Catalán, Castellano, Inglés y Medi son demasiado genéricos y feos respecto a la nueva dirección visual. Sustitúyelos por los recursos adjuntos.

- Cada asignatura debe parecer una zona o mundo jugable.
- Usa una tarjeta con color de acento propio, imagen grande, nombre, progreso visible y llamada breve.
- No coloques el icono nuevo dentro de otra cajita oscura diminuta: deja que sobresalga visualmente y tenga volumen.
- Mantén una familia coherente, pero no hagas todas las tarjetas idénticas.
- En escritorio, muestra una cuadrícula de 3 columnas cuando haya espacio; 2 en tablet y 1 o 2 en móvil según el ancho real.
- No dependas solo del color para indicar estado.

Colores sugeridos:

- Matemáticas: cian + violeta.
- Catalán: azul + amarillo/rojo como pequeños acentos, sin convertirlo en una bandera.
- Castellano: coral + naranja.
- Inglés: azul eléctrico + amarillo.
- Medi: verde lima + azul.

## 5. Estados y movimiento

- Hover de escritorio: elevación corta, halo y desplazamiento máximo de 2–4 px.
- Pulsación: ligera compresión.
- Tarjeta seleccionada: borde/halo y marca que no dependan únicamente del color.
- Drop cercano: pulso suave de la energía; no hagas temblar permanentemente el robot.
- Respeta `prefers-reduced-motion`.
- Evita animaciones infinitas en todas las tarjetas a la vez.

## 6. Integración técnica

- Optimiza los PNG para web sin degradar sus bordes transparentes.
- Reserva dimensiones mediante `width`, `height` o `aspect-ratio` para evitar saltos de layout.
- Carga prioritariamente solo el icono visible en la misión principal; el resto puede cargarse de forma diferida.
- Centraliza la relación entre identificador e imagen en un mapa/registro tipado, no disperses rutas literales por componentes.
- Si falta una imagen, usa un fallback coherente y registra el error; no muestres un emoji.
- No alteres progreso, recompensas, reglas del drop ni datos guardados durante este rediseño.

## 7. Entrega y comprobación

Antes de darlo por terminado, enséñame:

- Captura completa del lobby a 1366×768 y 1920×1080.
- Captura móvil para confirmar que no se ha estropeado.
- Captura de Misiones con las cinco asignaturas.
- Qué archivos has modificado o creado.
- Resultado de TypeScript, lint, tests y build.
- Confirmación de que no hay scroll horizontal ni saltos de layout al cargar imágenes.

No rediseñes las actividades interiores en esta tarea. No cambies a Lumo ni las imágenes de los niveles 2–9. El objetivo es corregir la composición de PC e integrar esta familia de iconos en lobby, Misiones, Mi colección y Próximo drop.
