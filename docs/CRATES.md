# Sistema de cajas ARAY

Las cajas son recompensas **extra** al completar una actividad evaluable. No sustituyen XP, monedas ni energía de la sesión.

## Configuración

Centralizada en [`src/config/crateConfig.ts`](../src/config/crateConfig.ts):

- Probabilidad por actividad (`train` 20 %, `challenge` 25 %, `missionOfDay` 35 %, `firstMastery` 100 %).
- Pity: tras 5 actividades sin caja → caja normal garantizada.
- Rarezas: normal 72 / especial 23 / épica 5.
- Elección entre dos: 30 % cuando ya cae caja.
- En la elección: **siempre** una caja normal (“buena”) y otra especial/épica (“legendaria”), barajadas; la mejor da **más energía**. En la UI las dos se ven iguales (misterio) hasta elegir.
- Tablas de premios (energía por rareza).

## Flujo

1. `applySession` concede recompensas de sesión (idempotente por `sessionId`).
2. `rollCrateForCompletion(completionId)` sortea **una sola vez** y persiste `pending` en `progress.crates`.
3. UI (`CrateReveal`): elegir (si aplica) → Abrir → Recoger.
4. `collectPendingCrate` + `applyCrateRewardToProgress`: aplica saldo una vez; overflow de energía → monedas.

## Persistencia (`progress.crates`)

- `rolledCompletionIds` — ya sorteados (recargar no vuelve a tirar).
- `claimedCompletionIds` — ya recogidos (no duplica saldo).
- `pending` — caja/premio decididos antes de la animación.
- `pityWithoutCrate`, `firstMasteryGrantedTables`.

## Imágenes

- `src/assets/rewards/caja-normal.png|especial|epica.png` — `object-fit: contain`.
- Animación solo CSS; `prefers-reduced-motion` elimina temblor/salto.
