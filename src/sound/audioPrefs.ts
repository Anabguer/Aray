export interface AudioPrefs {
  sfxEnabled: boolean
  musicEnabled: boolean
  /** 0–1 */
  sfxVolume: number
  /** 0–1 — por defecto flojito */
  musicVolume: number
}

export const AUDIO_PREFS_KEY = 'aray.audioPrefs'

export const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  sfxEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.7,
  musicVolume: 0.18,
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export function normalizeAudioPrefs(raw: unknown): AudioPrefs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AUDIO_PREFS }
  const o = raw as Record<string, unknown>
  return {
    sfxEnabled: o.sfxEnabled !== false,
    musicEnabled: o.musicEnabled !== false,
    sfxVolume: clamp01(typeof o.sfxVolume === 'number' ? o.sfxVolume : DEFAULT_AUDIO_PREFS.sfxVolume),
    musicVolume: clamp01(
      typeof o.musicVolume === 'number' ? o.musicVolume : DEFAULT_AUDIO_PREFS.musicVolume,
    ),
  }
}

export function loadAudioPrefs(): AudioPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_AUDIO_PREFS }
  try {
    const raw = window.localStorage.getItem(AUDIO_PREFS_KEY)
    if (!raw) return { ...DEFAULT_AUDIO_PREFS }
    return normalizeAudioPrefs(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_AUDIO_PREFS }
  }
}

export function saveAudioPrefs(prefs: AudioPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(normalizeAudioPrefs(prefs)))
  } catch {
    /* quota / private mode */
  }
}
