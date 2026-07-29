Te adjunto `ARAY_niveles_y_cajas.zip`. Contiene las imágenes definitivas de las tablas 2–9 y tres cajas de recompensa con fondo transparente. Quiero utilizar este paquete para dar una dirección visual de videojuego a ARAY y dejar de retocar pantallas de forma aislada.

No sustituyas estas imágenes por emojis, iconos genéricos ni imágenes nuevas. No copies Roblox ni ninguna marca. Conserva la identidad azul/violeta de ARAY, pero transforma la experiencia en un juego de niveles: oscuro y tecnológico como base, con cartas vivas, recompensas claras, profundidad, movimiento breve y mucho menos texto permanente.

# 1. Integración de recursos

Descomprime y guarda los archivos en una ruta reutilizable, por ejemplo:

- `src/assets/tables/tabla-2.png` … `tabla-9.png`
- `src/assets/rewards/caja-normal.png`
- `src/assets/rewards/caja-especial.png`
- `src/assets/rewards/caja-epica.png`

Crea mapas tipados para resolver las imágenes por número y rareza. No disperses imports condicionales por varios componentes.

Los números son imágenes cuadradas con fondo y deben mostrarse con `object-fit: cover`. Las cajas ya tienen transparencia y deben mostrarse completas con `object-fit: contain`. No deformes ninguna imagen.

# 2. Convertir la selección de tablas en un mapa de niveles

La pantalla de selección de tablas no debe parecer una cuadrícula de configuración. Cada tabla del 2 al 9 debe ser una carta de nivel con su imagen como protagonista.

Cada carta debe incluir mediante HTML, no dentro de la imagen:

- `TABLA DEL 2`, etc.
- Estado de dominio.
- Último resultado evaluable.
- Barra o anillo de progreso.
- Recompensa disponible o siguiente objetivo.
- Acción principal clara.

Estados:

- Sin probar: imagen algo atenuada, pero todavía atractiva; texto “Nueva”.
- Entrenando: barra visible y detalle de color activo.
- Casi domada: borde luminoso y resultado, por ejemplo `8/10`.
- Domada: escudo `DOMADA`, marca adicional y celebración visual breve.
- Domada · Conviene repasar: conserva el logro histórico y añade un aviso naranja de repaso.

No elimines “Domada” por una única ronda mala. Guarda por separado mejor resultado histórico, último resultado evaluable y número de rondas bajas consecutivas. Solo pasa al estado principal “Necesita entreno” tras dos rondas evaluables consecutivas por debajo del umbral configurado. Si vuelve a obtener 8/10 o más, elimina el aviso de repaso.

Al seleccionar varias tablas, conserva claramente el orden escogido. En modos secuenciales, se recorre la primera tabla completa y después la siguiente; no se muestran botones para saltar arbitrariamente entre ellas.

Diseño responsive:

- Móvil: una columna o carrusel accesible sin esconder estados.
- Tablet: dos o tres columnas.
- Escritorio: cuatro columnas si caben sin reducir demasiado las imágenes.
- La imagen debe ocupar aproximadamente el 45–55 % visual de la carta.
- Mantén buen contraste, focos de teclado visibles y objetivos táctiles adecuados.

# 3. Portada como lobby de juego

Reorganiza la portada como un lobby compacto:

- Aray/Lumo como identidad del juego, sin ocupar toda la pantalla.
- Una tarjeta protagonista “MISIÓN DE HOY”.
- Miniatura grande de la actividad.
- Recompensa visible: XP, monedas o energía.
- Botón directo `JUGAR`.
- Debajo, accesos secundarios a Tablas, Inglés, Reloj y futuras materias.
- Zona pequeña de “Próximo desbloqueo”.
- Indicadores de monedas, XP, energía y cajas sin párrafos explicativos.

La explicación larga sobre XP, monedas o Robux no debe aparecer permanentemente en portada. Muévela a información contextual, ayuda o primera visita. El niño debe entender primero qué puede jugar y qué puede conseguir.

# 4. Rediseño de Aprende, Entrena, Reto y Empareja

En la selección de modo, reduce el texto y convierte cada opción en una miniportada jugable:

- APRENDE — `Sin tiempo · Con pistas`
- ENTRENA — `10 preguntas · +energía`
- RETO RÁPIDO — `60 segundos · XP ×2`
- EMPAREJA — `Une las piezas · +energía`
- MIS FALLOS — `Refuerza lo difícil`
- MISIÓN RANDOM — `Sorpresa`

Usa los iconos SVG ya existentes, color propio por modo, volumen suave, halos y un botón/acción clara. Evita seis rectángulos azules idénticos. El texto sobre recompensas debe ser corto y escaneable.

## Aprende

Aprende debe ser un recorrido guiado, no una respuesta resuelta con botón “Siguiente”.

- Recorre las tablas seleccionadas en orden.
- Dentro de cada tabla recorre desde ×1 hasta el máximo global.
- Centraliza el rango en una constante compartida como `MAX_MULTIPLIER`.
- Los indicadores superiores muestran completada, activa y pendiente, pero no permiten saltarse tablas.
- Muestra `Tabla 1 de 3 · Operación 4 de 12`.
- Representa grupos claramente separados.
- Conecta grupos → suma repetida → multiplicación.
- Antes de revelar el resultado, pregunta cuántos hay.
- Permite elegir o escribir.
- Si falla, ofrece una pista y permite reintentar.
- Solo al acertar muestra la igualdad completa y activa el avance.
- Al terminar una tabla, muestra una transición corta hacia la siguiente.

## Entrena

- Preguntas claras, una por pantalla.
- Feedback inmediato.
- Progreso visible.
- No castigues con pérdida de lo ya ganado.
- Registra aciertos a la primera para el dominio.
- Evita revelar la respuesta en el primer error.

## Reto rápido

- Temporizador muy visible sin generar estrés exagerado.
- XP ×2 visible.
- Reacciones breves de Lumo.
- Resumen final sencillo: aciertos, mejora y recompensa.

## Empareja

- Elimina el botón `Comprobar`.
- Valida al soltar, pulsar o usar teclado.
- Correcto: encaja, queda fijado, marca ✓, pequeño pop y recompensa una sola vez.
- Incorrecto: vuelve a origen, mensaje “Ahí no… prueba otra vez”, sin revelar la respuesta.
- Registra el intento incorrecto.
- Segundo error: pista de tabla.
- Tercer error: pista de rango, sin dar directamente el resultado.
- Máximo cinco parejas por ronda.
- Final de ronda automático con resumen breve.

# 5. Sistema de cajas sorpresa

Las cajas son recompensas ocasionales añadidas al premio normal. Nunca sustituyen ni reducen la recompensa anunciada por completar la actividad.

## Cuándo puede aparecer una caja

Solo tras una actividad realmente completada:

- Entrena.
- Reto rápido.
- Empareja completo.
- Misión del día.
- Repaso de fallos.
- Primera vez que domina una tabla.

No puede aparecer por entrar y salir, repetir una pantalla sin actividad evaluable, recargar la página o completar Aprende pulsando atrás/adelante.

Probabilidad inicial configurable, no escrita dentro de componentes:

- Actividad normal completada: 20 %.
- Reto rápido completado con participación válida: 25 %.
- Misión del día: 35 %.
- Primera vez que domina una tabla: caja garantizada.

Añade protección de mala suerte: si completa cinco actividades evaluables consecutivas sin caja, la siguiente entrega una caja normal garantizada. Reinicia el contador al conseguir una.

La tirada debe realizarse una sola vez en el momento de confirmar la finalización y persistir su resultado antes de mostrar la animación. No debe poder repetirse recargando, navegando atrás o haciendo doble clic. Utiliza un identificador idempotente de finalización.

## Rarezas

Cuando cae una caja:

- Normal: 72 %.
- Especial: 23 %.
- Épica: 5 %.

No muestres estos porcentajes al niño en la interfaz normal. Déjalos configurables y documentados para adulto/desarrollo.

## Elección entre dos cajas

En el 30 % de las ocasiones en que ya haya caído una caja, muestra dos cajas cerradas boca a boca y permite elegir una. Las dos deben contener un premio válido.

- Decide y persiste ambos premios antes de mostrar la elección.
- La caja no elegida no debe decir que contenía algo mejor; simplemente se retira.
- No uses mensajes de pérdida.
- No permitas cambiar la elección tras abrirla.
- El resultado no puede modificarse recargando.

## Premios

Las cajas nunca están vacías y nunca quitan nada.

Premios iniciales orientativos:

Caja normal:

- 5, 8 o 10 monedas.
- 3–5 de energía.
- Pequeño bonus de XP.

Caja especial:

- 12, 15 o 20 monedas.
- 6–10 de energía.
- Bonus medio de XP.
- Probabilidad de fragmento cosmético si ese sistema existe más adelante.

Caja épica:

- 30, 40 o 50 monedas.
- 12–20 de energía.
- Bonus alto de XP.
- Cosmético o efecto visual especial cuando ese inventario exista.

No prometas Robux reales ni hagas una conversión automática a Robux. Si en el futuro hay recompensas gestionadas por un adulto, deben estar separadas, con límites y aprobación adulta.

Aplica topes diarios a monedas/energía si el proyecto ya los tiene. Si un premio supera el tope, no lo pierdas silenciosamente: conviértelo a una recompensa válida alternativa o explica claramente el ajuste.

# 6. Presentación y animación de las cajas

Las imágenes son estáticas con transparencia. Crea el movimiento con CSS/HTML alrededor del PNG; no intentes editar el PNG ni crear GIF.

Secuencia:

1. La caja entra con subida corta y escala `0.9 → 1`.
2. Hace dos o tres temblores pequeños, nunca un bucle infinito.
3. Al pulsar `ABRIR`, realiza una anticipación breve hacia abajo.
4. Salto corto, destello detrás de la caja y expansión de partículas CSS.
5. La caja puede desplazarse ligeramente hacia arriba y desvanecerse mientras aparece el premio.
6. El premio muestra cantidad, icono y botón `RECOGER`.

No hace falta animar físicamente una tapa porque solo hay una imagen cerrada. Simula la apertura con destello, separación visual, escala y transición al premio. Así el resultado será limpio y no parecerá que la tapa se dobla.

Duraciones orientativas:

- Entrada: 350–450 ms.
- Temblor: 450–650 ms.
- Apertura: 500–750 ms.
- Revelado del premio: 250–400 ms.

La caja normal tiene partículas cian, la especial violeta/cian y la épica dorado/violeta. El sonido, si está activado, debe ser corto y distinto por rareza. No uses animaciones continuas.

Con `prefers-reduced-motion`, elimina salto y temblor: usa aparición, cambio de halo y revelado del premio. Mantén toda la información sin depender del movimiento o del color.

# 7. UX, seguridad y tono

- No mostrar mensajes de “casi te tocó” ni premios que se escapan.
- No vender cajas ni permitir comprarlas con dinero.
- No crear rachas que castiguen por no entrar.
- No usar cuenta atrás para abrir.
- No bloquear el aprendizaje detrás de las cajas.
- No hacer que las probabilidades dependan de fallar respuestas.
- No restar monedas, XP o energía.
- Mantener el sistema como sorpresa de celebración, no como centro de la aplicación.

Textos recomendados:

- `¡Te ha caído una caja!`
- `Elige una`
- `Abrir caja`
- `¡Premio encontrado!`
- `Recoger`

# 8. Arquitectura y datos

Crea una configuración central tipada para:

- Probabilidad por actividad.
- Protección de mala suerte.
- Rarezas y pesos.
- Tablas de premios.
- Probabilidad de elección entre dos.
- Topes y conversiones.

Separa:

- Cálculo del drop.
- Persistencia/idempotencia.
- Selección del premio.
- Presentación y animaciones.
- Aplicación de la recompensa al saldo.

No concedas el premio hasta confirmar `RECOGER`, pero el premio debe estar persistido desde antes de la animación. Si se cierra la app, al volver debe recuperar la caja o premio pendiente sin volver a sortear.

# 9. Pruebas obligatorias

Comprueba:

- Cada tabla 2–9 usa su imagen correcta.
- Todos los estados se leen y no dependen solo del color.
- Aprende sigue el orden seleccionado y el rango global.
- Empareja no tiene `Comprobar` y valida inmediatamente.
- Una finalización solo puede tirar una caja una vez.
- Recargar no cambia rareza, elección ni premio.
- Nunca existe caja vacía o premio negativo.
- La caja garantizada por protección funciona.
- La primera dominación garantiza caja una sola vez.
- Los porcentajes suman correctamente.
- La elección entre dos queda persistida.
- Recoger dos veces no duplica el saldo.
- Una caja pendiente se recupera al reabrir.
- Movimiento reducido elimina temblores y saltos.
- Funciona con ratón, táctil y teclado.

# 10. Documentación y entrega

Actualiza `docs/DESIGN_SYSTEM.md` con:

- Dirección “lobby y niveles”.
- Uso de las imágenes 2–9.
- Anatomía y estados de las cartas.
- Diseño compacto de los modos.
- Rarezas y uso visual de las cajas.
- Animaciones y movimiento reducido.

Crea también documentación técnica breve del sistema de drops y su persistencia.

Antes de darlo por terminado, enséñame:

- Capturas completas de portada, selección de tablas y selección de modos en móvil, tablet y escritorio.
- Una carta por cada estado.
- Demostración de caja normal, especial, épica y elección entre dos.
- Rutas exactas de los recursos.
- Componentes y configuración creados.
- Pruebas añadidas.
- Resultado de TypeScript, lint, tests y build.

No rediseñes Lumo en esta tarea: integra la versión que ya se esté trabajando. No cambies textos o reglas educativas fuera de lo indicado. Primero integra y valida esta dirección general; no añadas tienda, inventario complejo, skins ni compra de cajas.
