import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { AccessScreen } from '@/features/access/AccessScreen'

const PUBLIC_PATHS = new Set(['/access', '/register'])

/** Acceso libre a /access y /register. Juego requiere dispositivo o sesión. /adult exige adulto. */
export function AuthGate() {
  const { loading, role, deviceAuthorized, familyPlayers } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const isAdultPath = path === '/adult' || path.startsWith('/adult/')
  const isPublic = PUBLIC_PATHS.has(path)
  const isPicker = path === '/pick-profile'
  const canPlay = deviceAuthorized || role === 'adult' || role === 'child'

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Cargando…</p>
      </div>
    )
  }

  if (isPublic) {
    if (deviceAuthorized && path === '/access') {
      if (familyPlayers.length > 1 && role !== 'child') {
        return <Navigate to="/pick-profile" replace />
      }
      if (role === 'child' || familyPlayers.length === 1) {
        return <Navigate to="/" replace />
      }
    }
    return <Outlet />
  }

  if (isAdultPath) {
    if (role !== 'adult') {
      return canPlay ? <Navigate to="/" replace /> : <AccessScreen />
    }
    return <Outlet />
  }

  if (isPicker) {
    if (!deviceAuthorized) {
      return <AccessScreen />
    }
    return <Outlet />
  }

  if (!canPlay) {
    // Pantalla de acceso in-place (sin depender de Navigate) para no dejar el root vacío.
    return <AccessScreen />
  }

  // Adulto con varios niños: debe elegir perfil antes de jugar.
  if (role === 'adult' && familyPlayers.length > 1) {
    return <Navigate to="/pick-profile" replace />
  }

  return <Outlet />
}
