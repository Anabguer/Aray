import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import './access.css'

export function ProfilePickerScreen() {
  const { loading, deviceAuthorized, familyPlayers, enterAsChild, tutorDisplayName } = useAuth()
  const navigate = useNavigate()
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Cargando…</p>
      </div>
    )
  }

  if (!deviceAuthorized) {
    return <Navigate to="/access" replace />
  }

  if (familyPlayers.length === 0) {
    return <Navigate to="/access" replace />
  }

  if (familyPlayers.length === 1 && familyPlayers[0]?.slug) {
    return <Navigate to="/" replace />
  }

  async function pick(slug: string | null) {
    if (!slug || busySlug) return
    setBusySlug(slug)
    setError(null)
    try {
      await enterAsChild(slug)
      // authKey en ProgressProvider disparará refresh; navegamos al lobby
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.message.trim() !== ''
          ? err.message
          : 'No se pudo entrar con ese perfil.',
      )
      setBusySlug(null)
    }
  }

  return (
    <div className="access-page">
      <div className="access-page__card">
        <h1 className="access-page__title">¿Quién juega?</h1>
        <p className="access-page__lead">
          {tutorDisplayName
            ? `Familia de ${tutorDisplayName}`
            : 'Elige el perfil para cargar su progreso.'}
        </p>
        <ul className="profile-picker">
          {familyPlayers.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="profile-picker__btn"
                disabled={busySlug !== null}
                onClick={() => void pick(p.slug)}
              >
                <PlayerAvatar
                  url={p.avatarUrl}
                  name={p.displayName ?? 'Jugador'}
                  size="lg"
                />
                <span className="profile-picker__name">{p.displayName ?? 'Jugador'}</span>
              </button>
            </li>
          ))}
        </ul>
        {error ? (
          <p className="access-form__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
