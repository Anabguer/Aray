import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { AccessScreen } from '@/features/access/AccessScreen'

const PUBLIC_PATHS = new Set(['/access', '/register'])

/**
 * Si el adulto llega al juego (p. ej. un solo niño) sin child-enter,
 * entra automáticamente para poder guardar partidas sin pisar el panel familiar.
 */
function EnsureChildForPlay() {
  const { role, familyPlayers, enterAsChild } = useAuth()
  const location = useLocation()
  const enteringRef = useRef(false)

  useEffect(() => {
    if (role !== 'adult') return
    const path = location.pathname
    if (path === '/adult' || path.startsWith('/adult/')) return
    if (path === '/pick-profile') return
    if (PUBLIC_PATHS.has(path)) return
    const slug = familyPlayers.length === 1 ? familyPlayers[0]?.slug : null
    if (!slug) return
    if (enteringRef.current) return
    enteringRef.current = true
    void enterAsChild(slug).finally(() => {
      enteringRef.current = false
    })
    // Usar length + slug (no el array) para no reintentar en cada render por referencia nueva.
  }, [role, familyPlayers.length, familyPlayers[0]?.slug, location.pathname, enterAsChild])

  return null
}

/** Acceso libre a /access y /register. Juego requiere dispositivo o sesión. /adult exige adulto. */
export function AuthGate() {
  const { loading, role, deviceAuthorized, familyPlayers } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const isAdultPath = path === '/adult' || path.startsWith('/adult/')
  const isPublic = PUBLIC_PATHS.has(path)
  const isPicker = path === '/pick-profile'
  const canPlay = deviceAuthorized || role === 'adult' || role === 'child'

  // RR7: sin key el Outlet a veces no remonta al cambiar de ruta (URL sí, pantalla no).
  const outlet = <Outlet key={location.key || path} />

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
    return outlet
  }

  if (isAdultPath) {
    if (role !== 'adult') {
      return canPlay ? <Navigate to="/" replace /> : <AccessScreen />
    }
    return outlet
  }

  if (isPicker) {
    if (!deviceAuthorized) {
      return <AccessScreen />
    }
    return outlet
  }

  if (!canPlay) {
    // Pantalla de acceso in-place (sin depender de Navigate) para no dejar el root vacío.
    return <AccessScreen />
  }

  // Adulto con varios niños: debe elegir perfil antes de jugar.
  if (role === 'adult' && familyPlayers.length > 1) {
    return <Navigate to="/pick-profile" replace />
  }

  return (
    <>
      <EnsureChildForPlay />
      {outlet}
    </>
  )
}
