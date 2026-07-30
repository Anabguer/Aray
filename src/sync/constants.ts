/**
 * Fallback local si aún no hay snapshot del servidor.
 * La época oficial vive en MySQL (`arayapp_app_settings.sync_epoch`).
 */
export const ARAY_DATA_EPOCH_FALLBACK = 1

export const PROGRESS_CACHE_KEY = 'aray.progress.v1'
export const PENDING_SESSIONS_KEY = 'aray.pendingSessions'
export const SYNC_META_KEY = 'aray.sync.meta'

export const DEFAULT_PLAYER_SLUG = 'aray'
