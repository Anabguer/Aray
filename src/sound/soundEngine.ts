type ToneKind = 'correct' | 'wrong' | 'reward' | 'tick'

/**
 * Motor de sonido ligero con Web Audio API (beeps originales).
 * Sin archivos externos ni recursos con copyright.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null
  private muted = false

  setMuted(muted: boolean) {
    this.muted = muted
  }

  isMuted() {
    return this.muted
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    if (!this.ctx) this.ctx = new AudioCtx()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  play(kind: ToneKind) {
    if (this.muted) return
    const ctx = this.ensureCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const profiles: Record<ToneKind, { freq: number; dur: number; type: OscillatorType; peak: number }> = {
      correct: { freq: 660, dur: 0.12, type: 'sine', peak: 0.045 },
      wrong: { freq: 220, dur: 0.14, type: 'triangle', peak: 0.035 },
      reward: { freq: 880, dur: 0.18, type: 'sine', peak: 0.05 },
      tick: { freq: 440, dur: 0.04, type: 'sine', peak: 0.02 },
    }

    const p = profiles[kind]
    osc.type = p.type
    osc.frequency.setValueAtTime(p.freq, now)
    if (kind === 'reward') {
      osc.frequency.linearRampToValueAtTime(1174, now + p.dur)
    }
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(p.peak, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur)
    osc.start(now)
    osc.stop(now + p.dur + 0.02)
  }
}

export const soundEngine = new SoundEngine()
