import { useProgress } from '@/progress/ProgressContext'

/** Aviso breve si falta autorizar dispositivo o hay cola offline. */
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
        Para guardar el progreso en la nube, Neni debe abrir el panel familiar y pulsar «Autorizar
        este dispositivo».
      </p>
    )
  }

  if (syncStatus === 'offline' || pendingSyncCount > 0) {
    return (
      <p className="sync-banner sync-banner--info" role="status">
        {pendingSyncCount > 0
          ? `Hay ${pendingSyncCount} partida(s) pendientes de sincronizar.`
          : 'Sin conexión: se usará la caché y se reintentará al volver.'}
        {syncError ? ` (${syncError})` : ''}
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
