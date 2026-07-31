import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { BrandLogo } from '@/components/BrandLogo'
import './access.css'

export function AccessScreen() {
  const { loginAdult, enterAsChild } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const players = await loginAdult(login.trim().toLowerCase(), password)
      if (players.length > 1) {
        navigate('/pick-profile', { replace: true })
        return
      }
      const only = players[0]
      if (only?.slug) {
        await enterAsChild(only.slug)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.message.trim() !== ''
          ? err.message
          : 'No se pudo iniciar sesión.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="access-page">
      <div className="access-page__card">
        <BrandLogo variant="hero" className="access-page__logo" />
        <h1 className="access-page__title">AFK Academy</h1>
        <p className="access-page__lead">Entra con la cuenta familiar para jugar y guardar el progreso.</p>

        <form className="access-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="access-form__label">
            Usuario
            <input
              className="access-form__input"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={busy}
              required
              minLength={3}
              maxLength={32}
            />
          </label>
          <label className="access-form__label">
            Contraseña
            <input
              className="access-form__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
              minLength={8}
            />
          </label>
          {error ? (
            <p className="access-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="access-page__footer">
          ¿Primera vez?{' '}
          <Link to="/register" className="access-page__link">
            Crear familia
          </Link>
        </p>
      </div>
    </div>
  )
}
