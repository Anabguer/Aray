import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { setPendingAdultPanel } from '@/features/access/pendingAdultPanel'
import { useProgress } from '@/progress/ProgressContext'

type Props = {
  open: boolean
  onClose: () => void
}

const SYNC_BUDGET_MS = 6000

export function AdultPinModal({ open, onClose }: Props) {
  const { loginAdultPin, deviceAuthorized, role, tutorDisplayName } = useAuth()
  const { flushSyncQueue } = useProgress()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  onCloseRef.current = onClose

  // Se puede pedir PIN con cookie de dispositivo O con sesión (niño/adulto).
  const canUsePin = deviceAuthorized || role === 'child' || role === 'adult'

  useEffect(() => {
    if (!open) return
    if (!canUsePin) {
      onCloseRef.current()
      navigate('/access')
      return
    }
    setPin('')
    setError(null)
    setBusy(false)
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
    // Solo al abrir el modal (no en cada re-render del padre: eso borraba el PIN).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (pin.length !== 4) return
    setBusy(true)
    setError(null)
    // Marca ANTES del login: AuthGate no debe convertir a niño / pick-profile en el lobby.
    setPendingAdultPanel(true)
    try {
      try {
        await Promise.race([
          flushSyncQueue(),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, SYNC_BUDGET_MS)
          }),
        ])
      } catch {
        /* Sync falló o timeout: igual entramos al panel. */
      }
      await loginAdultPin(pin)
      onClose()
      navigate('/adult', { replace: true })
    } catch (err) {
      setPendingAdultPanel(false)
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
          disabled={busy}
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
          {busy ? (
            <p className="adult-pin-modal__hint" role="status">
              Entrando…
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
