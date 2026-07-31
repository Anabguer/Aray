import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { useProgress } from '@/progress/ProgressContext'

type Props = {
  open: boolean
  onClose: () => void
}

export function AdultPinModal({ open, onClose }: Props) {
  const { loginAdultPin, deviceAuthorized, tutorDisplayName } = useAuth()
  const { flushSyncQueue } = useProgress()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!deviceAuthorized) {
      onClose()
      navigate('/access')
      return
    }
    setPin('')
    setError(null)
    setBusy(false)
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, deviceAuthorized, navigate, onClose])

  if (!open) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      // Vaciar cola de partidas ANTES de pasar a adulto (si no, MySQL se queda sin el XP).
      await flushSyncQueue()
      await loginAdultPin(pin)
      onClose()
      navigate('/adult')
    } catch (err) {
      const message =
        err instanceof ApiError && err.message.trim() !== ''
          ? err.message
          : 'PIN incorrecto'
      if (err instanceof ApiError && err.code === 'login_required') {
        onClose()
        navigate('/access')
        return
      }
      setError(message)
      setPin('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  // Portal a body: evita que backdrop-filter del header recorte position:fixed.
  return createPortal(
    <div className="adult-pin-modal" role="presentation" onClick={onClose}>
      <div
        className="adult-pin-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="adult-pin-modal__close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id={titleId} className="adult-pin-modal__title">
          {tutorDisplayName ? `PIN de ${tutorDisplayName}` : 'PIN familiar'}
        </h2>
        <form className="adult-pin-modal__form" onSubmit={(e) => void onSubmit(e)}>
          <input
            ref={inputRef}
            className="adult-pin-modal__input"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D+/g, '').slice(0, 4))}
            aria-label="PIN familiar"
            disabled={busy}
          />
          {error ? (
            <p className="adult-pin-modal__error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary adult-pin-modal__submit"
            disabled={busy || pin.length !== 4}
          >
            ENTRAR
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
