# ARAY — niveles y cajas

## Imágenes

- `numeros/tabla-2.png` a `numeros/tabla-9.png`: arte cuadrado para las cartas de tablas.
- `cajas/caja-normal.png`: caja normal con transparencia.
- `cajas/caja-especial.png`: caja especial con transparencia.
- `cajas/caja-epica.png`: caja épica con transparencia.

Las imágenes de las cajas ya tienen canal alfa. No hay que retirarles ningún fondo.

## Uso recomendado

- Los números son portadas de nivel, no fondos a pantalla completa.
- Mantener `object-fit: cover` y una posición centrada.
- No escribir el estado dentro de la imagen: superponerlo con HTML para que sea accesible y dinámico.
- Las cajas deben permanecer como PNG; sus movimientos y efectos se crean con CSS alrededor de la imagen.
- No deformar las proporciones de ningún archivo.

El texto completo de implementación está en `MENSAJE_PARA_CURSOR.md`.
