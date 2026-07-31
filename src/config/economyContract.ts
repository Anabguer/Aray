/**
 * Contrato de economía ARAY (sin monedas de tienda).
 *
 * - XP → Nivel: solo al jugar (aciertos / sesión). Umbral: XP_PER_LEVEL.
 * - Energía → Drop Robux: jugar + subir de nivel + cajas + reclamar logros.
 * - Monedas (HUD/tienda): eliminadas. Las “monedas” del ejercicio Dinero son gameplay (€).
 *
 * Tope diario energía: rewardGoalConfig.dailyCap (100).
 * Meta ciclo: rewardGoalConfig.targetPoints (5000).
 */
export const economyContract = {
  xpPerLevel: 500,
  levelUpEnergyBonus: 20,
  xpOnlyFromPlay: true,
  energySources: ['play', 'levelUp', 'crate', 'achievement'] as const,
  coinsEconomyEnabled: false,
} as const
