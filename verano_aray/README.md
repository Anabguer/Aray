# Cuaderno de verano de Aray

**Reglas del temario (obligatorias para cualquier ejercicio nuevo):** [`regles_temari.md`](regles_temari.md)

Este paquete genera un cuaderno completo de verano para Aray con:

- `salida/cuaderno_verano_aray.html`: cuaderno completo con portada, planificación, panel de recompensas y 8 semanas de fichas.
- `salida/solucionario_verano_aray.html`: solucionario orientativo.
- `salida/buscador_correcciones.html`: buscador para localizar fichas, ejercicios y correcciones.
- `salida/portada_cuaderno.html`: portada independiente.
- `salida/extras_imprimibles.html`: planificación y panel de recompensas por separado.
- `salida/semana_01.html` a `salida/semana_08.html`: una semana por archivo, por si prefieres imprimir poco a poco.
- `generate_workbook.py`: fuente editable para cambiar nombres, temas, dificultad o textos.

## Cómo usarlo

1. Abre cualquiera de los `.html` en el navegador.
2. Imprime directamente en A4.
3. Si quieres PDF, usa `Imprimir > Guardar como PDF`.

Si quieres corregir rápido sin recorrer todo el solucionario, abre `salida/buscador_correcciones.html`.

## Ritmo recomendado

- 2 fichas al día.
- 5 días por semana.
- Una ficha de matemáticas cada día.
- La segunda ficha rota entre lengua castellana, català, medi, inglés y repaso creativo.

## Qué repasa

- Matemáticas: numeración, cálculo, sumas, restas, multiplicación, división, dinero, tiempo, medidas, geometría y problemas.
- Lengua castellana: comprensión lectora, vocabulario, gramática y escritura breve.
- Català: comprensió, vocabulari, ortografia i expressió escrita.
- Medi: hábitos, entorno, animales, materiales, agua, observación y ciencia cotidiana.
- English: vocabulario básico, lectura corta y estructuras sencillas.

## Si quieres editarlo

Puedes abrir `generate_workbook.py` y cambiar:

- `PROFILE` para nombres, gustos o datos personales.
- `WEEKS` para cambiar temática, vocabulario o retos.
- Los constructores de fichas si quieres más dificultad o menos texto.

Después regenera los archivos con:

```bash
python generate_workbook.py
```
