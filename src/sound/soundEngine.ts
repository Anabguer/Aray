import {
  DEFAULT_AUDIO_PREFS,
  loadAudioPrefs,
  saveAudioPrefs,
  type AudioPrefs,
} from '@/sound/audioPrefs'
import {
  LONG_SOUNDS,
  SOUND_IDS,
  type LegacyToneKind,
  type SoundId,
  resolveSoundId,
} from '@/sound/soundIds'

const MASTER_VOLUME = 0.48
const WRONG_VOLUME = 0.28

function soundUrl(id: SoundId): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return `${base}sounds/${id}.wav`
}

function musicUrl(): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return `${base}sounds/musica-fondo.mp3`
}

/**
 * Motor de audio reutilizable con archivos locales.
 * - Efectos + música de fondo (volumen independiente)
 * - Preferencias en localStorage
 * - No reproduce hasta la primera interacción (autoplay)
 */
export class SoundEngine {
  private prefs: AudioPrefs = { ...DEFAULT_AUDIO_PREFS }
  private unlocked = false
  private ready = false
  private preloadStarted = false
  private pools = new Map<SoundId, HTMLAudioElement[]>()
  private longCurrent: HTMLAudioElement | null = null
  private music: HTMLAudioElement | null = null
  private unlockBound = false
  private prefsListeners = new Set<(prefs: AudioPrefs) => void>()

  constructor() {
    this.prefs = loadAudioPrefs()
  }

  getPrefs(): AudioPrefs {
    return { ...this.prefs }
  }

  subscribePrefs(listener: (prefs: AudioPrefs) => void): () => void {
    this.prefsListeners.add(listener)
    return () => {
      this.prefsListeners.delete(listener)
    }
  }

  private emitPrefs() {
    const snapshot = this.getPrefs()
    for (const listener of this.prefsListeners) listener(snapshot)
  }

  applyPrefs(partial: Partial<AudioPrefs>) {
    this.prefs = {
      ...this.prefs,
      ...partial,
      sfxVolume:
        partial.sfxVolume != null
          ? Math.max(0, Math.min(1, partial.sfxVolume))
          : this.prefs.sfxVolume,
      musicVolume:
        partial.musicVolume != null
          ? Math.max(0, Math.min(1, partial.musicVolume))
          : this.prefs.musicVolume,
    }
    saveAudioPrefs(this.prefs)
    this.syncMusic()
    this.emitPrefs()
  }

  /** Compat: mute global de efectos (el HUD antiguo). */
  setMuted(muted: boolean) {
    this.applyPrefs({ sfxEnabled: !muted })
  }

  isMuted() {
    return !this.prefs.sfxEnabled
  }

  /** Vincula unlock a la primera interacción del usuario. */
  bindAutoUnlock() {
    if (typeof window === 'undefined' || this.unlockBound) return
    this.unlockBound = true
    const unlock = () => {
      this.unlocked = true
      void this.preload()
      this.syncMusic()
    }
    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('keydown', unlock, { once: true })
  }

  /** Marca el motor como desbloqueado (llamar desde gestos de UI). */
  unlock() {
    this.unlocked = true
    void this.preload()
    this.syncMusic()
  }

  async preload() {
    if (this.preloadStarted) return
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      this.ready = true
      return
    }
    this.preloadStarted = true
    this.bindAutoUnlock()

    await Promise.all(
      SOUND_IDS.map(async (id) => {
        const a = new Audio(soundUrl(id))
        a.preload = 'auto'
        a.setAttribute('data-sound', id)
        this.pools.set(id, [a])
        await new Promise<void>((resolve) => {
          let settled = false
          const done = () => {
            if (settled) return
            settled = true
            resolve()
          }
          a.addEventListener('canplaythrough', done, { once: true })
          a.addEventListener('error', done, { once: true })
          try {
            a.load()
          } catch {
            done()
          }
          window.setTimeout(done, 600)
        })
      }),
    )
    this.ensureMusicElement()
    this.ready = true
    this.syncMusic()
  }

  private ensureMusicElement(): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null
    if (this.music) return this.music
    const a = new Audio(musicUrl())
    a.loop = true
    a.preload = 'auto'
    a.setAttribute('data-sound', 'musica-fondo')
    this.music = a
    return a
  }

  private syncMusic() {
    const a = this.ensureMusicElement()
    if (!a) return
    a.volume = Math.max(0, Math.min(1, this.prefs.musicVolume))
    const shouldPlay = this.unlocked && this.prefs.musicEnabled && this.prefs.musicVolume > 0.001
    if (!shouldPlay) {
      try {
        a.pause()
      } catch {
        /* ignore */
      }
      return
    }
    void a.play().catch(() => {
      /* autoplay bloqueado hasta gesto */
    })
  }

  private acquire(id: SoundId): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null
    const pool = this.pools.get(id)
    if (!pool || pool.length === 0) {
      const a = new Audio(soundUrl(id))
      a.preload = 'auto'
      this.pools.set(id, [a])
      return a
    }
    const idle = pool.find((el) => el.paused || el.ended)
    if (idle) return idle
    if (pool.length < 3 && !LONG_SOUNDS.has(id)) {
      const clone = pool[0]!.cloneNode(true) as HTMLAudioElement
      pool.push(clone)
      return clone
    }
    const a = pool[0]!
    try {
      a.pause()
      a.currentTime = 0
    } catch {
      /* ignore */
    }
    return a
  }

  private stopLong() {
    if (!this.longCurrent) return
    try {
      this.longCurrent.pause()
      this.longCurrent.currentTime = 0
    } catch {
      /* ignore */
    }
    this.longCurrent = null
  }

  /**
   * Reproduce un efecto. Acepta ids nuevos o tonos legacy.
   * Si aún no hubo interacción, no suena (política autoplay).
   */
  play(kind: SoundId | LegacyToneKind, opts?: { volume?: number }) {
    if (!this.prefs.sfxEnabled || !this.unlocked) return

    const id = resolveSoundId(kind)
    if (!this.ready && !this.preloadStarted) void this.preload()

    const audio = this.acquire(id)
    if (!audio) return

    if (LONG_SOUNDS.has(id)) {
      this.stopLong()
      this.longCurrent = audio
      audio.onended = () => {
        if (this.longCurrent === audio) this.longCurrent = null
      }
    }

    const base =
      opts?.volume ??
      (id === 'answer-wrong' ? WRONG_VOLUME : id === 'ui-click' ? 0.35 : 0.55)
    audio.volume = Math.max(0, Math.min(1, base * MASTER_VOLUME * this.prefs.sfxVolume))
    try {
      audio.currentTime = 0
    } catch {
      /* ignore */
    }
    void audio.play().catch(() => {
      /* autoplay u otro bloqueo */
    })
  }
}

export const soundEngine = new SoundEngine()

if (typeof window !== 'undefined') {
  soundEngine.bindAutoUnlock()
}
