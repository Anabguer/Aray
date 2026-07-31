import { useEffect, useId, useState } from 'react'
import { soundEngine } from '@/sound/soundEngine'
import type { AudioPrefs } from '@/sound/audioPrefs'
import { useProgress } from '@/progress/ProgressContext'

type Props = {
  open: boolean
  onClose: () => void
}

function VolumeRow({
  id,
  label,
  enabled,
  volume,
  onToggle,
  onVolume,
}: {
  id: string
  label: string
  enabled: boolean
  volume: number
  onToggle: (enabled: boolean) => void
  onVolume: (volume: number) => void
}) {
  return (
    <div className="sound-settings__row">
      <div className="sound-settings__row-head">
        <label className="sound-settings__label" htmlFor={`${id}-toggle`}>
          {label}
        </label>
        <button
          type="button"
          id={`${id}-toggle`}
          className={`sound-settings__switch${enabled ? ' is-on' : ''}`}
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
        >
          <span className="sound-settings__switch-knob" aria-hidden="true" />
          <span className="sound-settings__switch-text">{enabled ? 'On' : 'Off'}</span>
        </button>
      </div>
      <label className="sound-settings__vol-label" htmlFor={`${id}-vol`}>
        Volumen
      </label>
      <input
        id={`${id}-vol`}
        className="sound-settings__slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        disabled={!enabled}
        onChange={(e) => onVolume(Number(e.target.value) / 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
      />
    </div>
  )
}

export function SoundSettingsModal({ open, onClose }: Props) {
  const titleId = useId()
  const { setSoundMuted } = useProgress()
  const [prefs, setPrefs] = useState<AudioPrefs>(() => soundEngine.getPrefs())

  useEffect(() => {
    if (!open) return
    setPrefs(soundEngine.getPrefs())
    return soundEngine.subscribePrefs(setPrefs)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function patch(partial: Partial<AudioPrefs>) {
    soundEngine.unlock()
    soundEngine.applyPrefs(partial)
    const next = soundEngine.getPrefs()
    setPrefs(next)
    // Mantener sync con progress.soundMuted (efectos)
    if (partial.sfxEnabled != null) {
      setSoundMuted(!partial.sfxEnabled)
    }
  }

  return (
    <div className="sound-settings" role="presentation" onClick={onClose}>
      <div
        className="sound-settings__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="sound-settings__close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id={titleId} className="sound-settings__title">
          Sonido
        </h2>
        <p className="sound-settings__lead">
          Puedes dejar una cosa y quitar la otra. Se guarda en este dispositivo.
        </p>

        <VolumeRow
          id="sfx"
          label="Efectos"
          enabled={prefs.sfxEnabled}
          volume={prefs.sfxVolume}
          onToggle={(sfxEnabled) => patch({ sfxEnabled })}
          onVolume={(sfxVolume) => patch({ sfxVolume })}
        />

        <VolumeRow
          id="music"
          label="Música de fondo"
          enabled={prefs.musicEnabled}
          volume={prefs.musicVolume}
          onToggle={(musicEnabled) => patch({ musicEnabled })}
          onVolume={(musicVolume) => patch({ musicVolume })}
        />

        <button type="button" className="btn btn-primary sound-settings__done" onClick={onClose}>
          Listo
        </button>
      </div>
    </div>
  )
}
