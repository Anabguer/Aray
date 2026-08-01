/** Feedback aleatorio al acertar/fallar — mismo espíritu que Learn de tablas. */

export type FxKind = 'bubble' | 'stamp' | 'near' | 'band'
export type StampSlot = 'a' | 'b' | 'c' | 'd'

export type RunFx = {
  kind: FxKind
  tone: 'hit' | 'miss'
  message: string
  stamp?: string
  slot?: StampSlot
  optionIndex?: number
  xp?: number
  combo?: number
  key: number
}

export const HIT_MESSAGES = [
  '¡Esa estaba regalada!',
  'Lumo.exe impresionado.',
  '¡PUM! Directo.',
  'Modo bestia activado.',
  'Ni has despeinado el avatar.',
  '¡Combo limpio!',
  'Demasiado fácil para ti.',
  'Crack total.',
] as const

export const HIT_MESSAGES_MOBILE = [
  '¡Regalada!',
  'Lumo impresionado.',
  '¡PUM! Directo.',
  'Modo bestia.',
  '¡Combo limpio!',
  'Demasiado fácil.',
] as const

export const MISS_MESSAGES = [
  'Buen intento, pequeño troll.',
  'Uy… esa hizo parkour.',
  'La respuesta se ha escondido.',
  'Casi. Lumo no ha visto nada.',
  'Glitch. Otra vez.',
  'Te quiso trolear.',
  'Plot twist: esa no era.',
  'Casi, casi…',
] as const

export const MISS_MESSAGES_MOBILE = [
  'Buen intento, troll.',
  'Esa hizo parkour.',
  'Se ha escondido.',
  'Casi. Nada visto.',
  'Glitch. Otra vez.',
  'Te quiso trolear.',
  'Plot twist.',
  'Casi, casi…',
] as const

export const STAMP_HITS = ['¡CRACK!', 'EZ', '¡PUM!', 'NICE'] as const
export const STAMP_MISS = ['CASI, TROL', 'NOPE', 'GLITCH', '¿EH?'] as const
export const STAMP_SLOTS: StampSlot[] = ['a', 'b', 'c', 'd']
export const FX_DESKTOP: FxKind[] = ['bubble', 'stamp', 'near', 'band']
export const FX_MOBILE: FxKind[] = ['bubble', 'near', 'band']
export const COMBO_MIN = 2

export function pickFromPool<T>(pool: readonly T[], avoid?: T | null): T {
  if (pool.length === 1) return pool[0]!
  const filtered = avoid == null ? [...pool] : pool.filter((x) => x !== avoid)
  const list = filtered.length > 0 ? filtered : [...pool]
  return list[Math.floor(Math.random() * list.length)]!
}

export function isMobileFx(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 900px)').matches
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function buildRunFx(input: {
  tone: 'hit' | 'miss'
  optionIndex?: number
  nextStreak: number
  xpGranted?: number
  lastKind?: FxKind | null
  lastHitMsg?: string | null
  lastMissMsg?: string | null
}): RunFx {
  const reduced = prefersReducedMotion()
  const mobile = isMobileFx()
  const pool = mobile ? FX_MOBILE : FX_DESKTOP
  const kind = pickFromPool(pool, input.lastKind)
  const hitPool = mobile ? HIT_MESSAGES_MOBILE : HIT_MESSAGES
  const missPool = mobile ? MISS_MESSAGES_MOBILE : MISS_MESSAGES
  const message =
    input.tone === 'hit'
      ? pickFromPool(hitPool, input.lastHitMsg)
      : pickFromPool(missPool, input.lastMissMsg)

  const hasCombo = input.tone === 'hit' && input.nextStreak >= COMBO_MIN
  const stamp =
    kind === 'stamp'
      ? hasCombo
        ? `¡Combo ×${input.nextStreak}!`
        : pickFromPool(input.tone === 'hit' ? STAMP_HITS : STAMP_MISS)
      : hasCombo && kind === 'band'
        ? `¡Combo ×${input.nextStreak}!`
        : undefined

  const xp =
    input.tone === 'hit' && input.xpGranted != null && input.xpGranted > 0
      ? input.xpGranted
      : undefined

  return {
    kind: reduced && kind === 'stamp' ? 'band' : kind,
    tone: input.tone,
    message,
    stamp,
    slot: pickFromPool(STAMP_SLOTS),
    optionIndex: input.optionIndex,
    xp,
    combo: hasCombo ? input.nextStreak : undefined,
    key: Date.now(),
  }
}
