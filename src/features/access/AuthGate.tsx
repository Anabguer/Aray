import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

/** El Lobby y el juego son libres. Solo /adult exige sesión adulta. */
export function AuthGate() {
  const { loading, role } = useAuth()
  const location = useLocation()
  const isAdultPath = location.pathname === '/adult' || location.pathname.startsWith('/adult/')

  if (!isAdultPath) {
    return <Outlet />
  }

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Cargando…</p>
      </div>
    )
  }

  if (role !== 'adult') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
