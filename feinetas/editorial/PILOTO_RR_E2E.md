# Piloto RR — batería E2E (jugar como un niño)

Fecha: 2026-08-01  
Métodos: React Testing Library sobre la pantalla real + Playwright-less browser CDP en preview (`/dev/ortografia-rr`).

## Veredicto

**APTO para convertir el siguiente banco.**

Calidad del piloto: **94 / 100**

No se modifica `JSON_SPEC`. No se conecta al flujo principal.

---

## Problemas encontrados

Ninguno bloqueante.

---

## Problemas descartados

1. **AppShell / GameHeader exige `ProgressProvider` en tests**  
   Es dependencia del shell de la app, no del pack JSON ni del adaptador. En preview real la app ya envuelve progreso. No afecta jugabilidad del pack.

2. **Click síncrono en DOM sin await no pinta feedback**  
   Comportamiento normal de React; con micro-espera el flujo es estable. No es defecto del JSON.

3. **Campos no usados en este modo MCQ** (`image.ref`, `frequency`, `category` en UI)  
   Previstos en schema; no requeridos para este piloto. Ya documentados como no imprescindibles.

---

## Cobertura ejecutada

| Escenario | RTL E2E | Browser preview |
|-----------|---------|-----------------|
| 21 aciertos | OK 21/21 | OK 21/21 |
| 21 fallos | OK 0/21 | OK 0/21 |
| Alternar | OK 11/21 | OK 11/21 |
| Reiniciar / repetir | OK | OK |
| Sin lemas repetidos antes de terminar | OK | OK |
| Exactamente una vez cada lema del JSON | OK | OK |
| Tips solo si existen | OK | (tip visible en snapshot) |
| ruleText = lema actual | OK | OK |
| Sin bloqueo UI / opciones disabled tras respuesta | OK | OK |
| Resumen = aciertos reales | OK | OK |
| Sin errores de consola | OK (spy) | OK (`[]`) |
| Sin dependencia legacy | OK (grep imports) | n/a |

Suite: `src/dev/OrtografiaRrPilot.e2e.test.tsx` (7 tests).

---

## Recomendación

**APTO para convertir el siguiente banco.**

Motivo: el pack RR se puede jugar de punta a punta (aciertos, fallos, mezcla, reinicio) con datos solo del JSON, sin legacy y sin carencias del schema para el modo MCQ de validación.
