import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useProgress } from '@/progress/ProgressContext'

function isAuthNoise(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    m.includes('sesión adulta') ||
    m.includes('sesión infantil') ||
    m.includes('unauthorized') ||
    m.includes('device_required') ||
    m.includes('autoriza') ||
    m.includes('csrf')
  )
}

/** Aviso breve si falta familia en este dispositivo o hay cola offline. */
export function SyncStatusBanner() {
  const { role } = useAuth()
  const { syncStatus, syncError, pendingSyncCount, hydrated } = useProgress()

  // En panel adulto no tiene sentido avisar del sync de partidas.
  if (role === 'adult') return null

  if (!hydrated) {
    return (
      <p className="sync-banner sync-banner--info" role="status">
        Cargando progreso…
      </p>
    )
  }

  if (syncStatus === 'needs_device') {
    return (
      <p className="sync-banner sync-banner--warn" role="status">
        Para guardar el progreso en la nube,{' '}
        <Link to="/access">entra con la cuenta familiar</Link> (una vez en este dispositivo).
      </p>
    )
  }

  if (pendingSyncCount > 0) {
    // No mostrar el texto crudo de la API («Se requiere sesión…»): reintenta en silencio.
    if (isAuthNoise(syncError)) {
      return null
    }
    return (
      <p className="sync-banner sync-banner--info" role="status">
        {syncError
          ? 'Guardando partida… si falla, se reintenta solo.'
          : `Guardando ${pendingSyncCount} partida(s)…`}
      </p>
    )
  }

  if (syncStatus === 'offline') {
    return (
      <p className="sync-banner sync-banner--info" role="status">
        Sin conexión: se usará la caché y se reintentará al volver.
      </p>
    )
  }

  if (syncStatus === 'error' && syncError && !isAuthNoise(syncError)) {
    return (
      <p className="sync-banner sync-banner--warn" role="status">
        No se pudo sincronizar ahora. Se reintentará solo.
      </p>
    )
  }

  return null
}
