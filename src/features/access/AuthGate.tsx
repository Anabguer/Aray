import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { usePlayHeartbeat } from '@/auth/usePlayHeartbeat'
import { DeviceSetupScreen } from '@/features/access/DeviceSetupScreen'
import { PinScreen } from '@/features/access/PinScreen'

export function AuthGate() {
  const { loading, role, deviceAuthorized } = useAuth()
  const location = useLocation()
  usePlayHeartbeat()

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Cargando…</p>
      </div>
    )
  }

  if (!deviceAuthorized) {
    return <DeviceSetupScreen />
  }

  if (!role) {
    return <PinScreen />
  }

  const isAdultPath = location.pathname === '/adult' || location.pathname.startsWith('/adult/')

  if (role === 'adult' && !isAdultPath) {
    return <Navigate to="/adult" replace />
  }

  if (role === 'child' && isAdultPath) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
