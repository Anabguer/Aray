# Mis fallos — Cálculo, Dinero, Horas

## Persistencia actual

Clave localStorage: `afk.maths.misses.v1.{playerId}`

Mismo patrón que Ortografía (`afk.spell.misses.v1.*`).

| Ámbito | Estado |
|--------|--------|
| Misma sesión | Sí |
| Tras recargar (mismo navegador / mismo jugador) | Sí |
| Entre dispositivos / sync servidor | **No** (todavía) |

El progreso de **Tablas** sigue en `ProgressState.facts` + `session-submit.php` y no se mezcla con este store.

## Contrato futuro (sync)

Payload por entrada:

```ts
{
  questionId: string
  skillId: 'calc' | 'money' | 'clocks'
  modeId: string
  difficulty?: string
  payload: /* snapshot de pregunta */
  misses: number
  hits: number
  streakHits: number
  updatedAt: number
}
```

Cuando exista endpoint, merge monótono por `questionId` (como daily-mission):
max(misses), max(updatedAt), y reglas de clear por `streakHits >= 3`.

## Retirada del repaso

Tras **3** aciertos seguidos sin nuevo fallo (`MATHS_MISS_CLEAR_STREAK`).
