/**
 * Contrato de economía ARAY (sin monedas de tienda).
 *
 * - XP → Nivel: solo al jugar (aciertos / sesión). Umbral: XP_PER_LEVEL.
 * - Energía → Drop Robux: misión del día + reto (+ cajas / logros / level-up esporádicos).
 * - Monedas (HUD/tienda): eliminadas. Las “monedas” del ejercicio Dinero son gameplay (€).
 *
 * Tope diario energía (misión+reto): rewardGoalConfig.dailyCap (100).
 * Meta ciclo (~60 días): rewardGoalConfig.targetPoints (6000).
 */
export const economyContract = {
  xpPerLevel: 500,
  levelUpEnergyBonus: 20,
  xpOnlyFromPlay: true,
  energySources: ['play', 'levelUp', 'crate', 'achievement'] as const,
  coinsEconomyEnabled: false,
} as const
