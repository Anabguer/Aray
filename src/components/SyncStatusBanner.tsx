import { Link } from 'react-router-dom'
import { useProgress } from '@/progress/ProgressContext'

/** Aviso breve si falta familia en este dispositivo o hay cola offline. */
export function SyncStatusBanner() {
  const { syncStatus, syncError, pendingSyncCount, hydrated } = useProgress()

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

  if (syncStatus === 'offline' || pendingSyncCount > 0) {
    return (
      <p className="sync-banner sync-banner--info" role="status">
        {pendingSyncCount > 0
          ? syncError
            ? `No se pudo guardar una partida (${syncError}). Reintentando…`
            : `Guardando ${pendingSyncCount} partida(s) en la nube…`
          : 'Sin conexión: se usará la caché y se reintentará al volver.'}
      </p>
    )
  }

  if (syncStatus === 'error' && syncError) {
    return (
      <p className="sync-banner sync-banner--warn" role="alert">
        {syncError}
      </p>
    )
  }

  return null
}
