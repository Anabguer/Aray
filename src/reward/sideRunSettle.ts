/** Energía proporcional si se abandona una run a medias (mín. 1 si hubo aciertos). */
export function sideRunEnergyForProgress(
  fullReward: number,
  correct: number,
  total: number,
): number {
  const cap = Math.max(0, Math.floor(fullReward))
  const hits = Math.max(0, Math.floor(correct))
  const n = Math.max(1, Math.floor(total))
  if (hits <= 0 || cap <= 0) return 0
  if (hits >= n) return cap
  return Math.min(cap, Math.max(1, Math.round((cap * hits) / n)))
}
