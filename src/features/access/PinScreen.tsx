import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/auth/AuthContext'

const PIN_LEN = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const

export function PinScreen() {
  const { loginPin } = useAuth()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const titleId = useId()
  const hiddenRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(
    async (pin: string) => {
      if (submitting.current || pin.length !== PIN_LEN) return
      submitting.current = true
      setBusy(true)
      setError(null)
      try {
        await loginPin(pin)
      } catch (err) {
        setDigits('')
        setError(
          err instanceof ApiError ? err.message : 'Ese PIN no es correcto',
        )
      } finally {
        submitting.current = false
        setBusy(false)
      }
    },
    [loginPin],
  )

  const pushDigit = useCallback(
    (d: string) => {
      if (busy) return
      setError(null)
      setDigits((prev) => {
        if (prev.length >= PIN_LEN) return prev
        const next = prev + d
        if (next.length === PIN_LEN) {
          queueMicrotask(() => void submit(next))
        }
        return next
      })
    },
    [busy, submit],
  )

  const backspace = useCallback(() => {
    if (busy) return
    setError(null)
    setDigits((prev) => prev.slice(0, -1))
  }, [busy])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        pushDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pushDigit, backspace])

  useEffect(() => {
    hiddenRef.current?.focus()
  }, [])

  return (
    <div className="pin-screen">
      <div className="pin-screen__glow" aria-hidden="true" />
      <div className="pin-screen__card">
        <BrandLogo variant="hero" className="pin-screen__logo" />
        <h1 id={titleId} className="pin-screen__title">
          Introduce tu PIN
        </h1>
        <p className="pin-screen__lead">Cuatro números para entrar</p>

        <div
          className="pin-screen__boxes"
          role="group"
          aria-labelledby={titleId}
          aria-busy={busy}
        >
          {Array.from({ length: PIN_LEN }, (_, i) => (
            <span
              key={i}
              className={[
                'pin-screen__box',
                digits.length > i ? 'is-filled' : '',
                digits.length === i && !busy ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {digits.length > i ? '•' : ''}
            </span>
          ))}
        </div>

        <label className="visually-hidden" htmlFor="pin-hidden-input">
          PIN
        </label>
        <input
          ref={hiddenRef}
          id="pin-hidden-input"
          className="pin-screen__hidden"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={PIN_LEN}
          value={digits}
          disabled={busy}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LEN)
            setError(null)
            setDigits(next)
            if (next.length === PIN_LEN) void submit(next)
          }}
        />

        {error ? (
          <p className="pin-screen__error" role="alert">
            {error}
          </p>
        ) : (
          <p className="pin-screen__hint" aria-live="polite">
            {busy ? 'Comprobando…' : '\u00a0'}
          </p>
        )}

        <div className="pin-screen__pad" aria-label="Teclado numérico">
          {KEYS.map((key, idx) => {
            if (key === '') {
              return <span key={`empty-${idx}`} className="pin-screen__pad-spacer" />
            }
            if (key === '⌫') {
              return (
                <button
                  key="back"
                  type="button"
                  className="pin-screen__key pin-screen__key--action"
                  onClick={backspace}
                  disabled={busy || digits.length === 0}
                  aria-label="Borrar"
                >
                  ⌫
                </button>
              )
            }
            return (
              <button
                key={key}
                type="button"
                className="pin-screen__key"
                onClick={() => pushDigit(key)}
                disabled={busy || digits.length >= PIN_LEN}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
