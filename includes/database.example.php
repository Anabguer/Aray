<?php
/**
 * Plantilla de configuración ARAY.
 * Copia a database.local.php (ignorado por Git) y rellena valores reales.
 * Nunca subas contraseñas ni este archivo con secretos al repositorio.
 *
 * Prefijo de tablas: arayapp_ (no usar aray_)
 *
 * Local (patrón Anabel, adaptado): BD propia aray_db, prefijo arayapp_.
 * Hostalia: BD compartida del hosting + mismo prefijo arayapp_ (sin crear BD en panel).
 */

declare(strict_types=1);

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', ''); // local: rellena si MySQL exige contraseña
define('DB_NAME', 'aray_db');
define('DB_CHARSET', 'utf8mb4');
define('DB_PREFIX', 'arayapp_');

/** local | production */
define('ARAY_ENV', 'local');

/** Crear BD automáticamente (solo local / usuario con privilegio CREATE) */
define('ARAY_CREATE_DATABASE', true);
/** Aplicar CREATE TABLE IF NOT EXISTS al conectar (idempotente, estilo Anabel) */
define('ARAY_AUTO_ENSURE_SCHEMA', true);

define('ARAY_SESSION_NAME', 'ARAYSESSID');
define('ARAY_DEVICE_COOKIE', 'ARAYDEVICE');
define('ARAY_COOKIE_SECURE', false); // true en Hostalia (HTTPS)
define('ARAY_COOKIE_SAMESITE', 'Lax');
define('ARAY_COOKIE_PATH', '/'); // en Hostalia bajo /aray/ usar '/aray'

define('ARAY_TIMEZONE_PLAYABLE', 'Europe/Madrid');
define('ARAY_DEVICE_TOKEN_BYTES', 32);
define('ARAY_DEVICE_TTL_DAYS', 365);
define('ARAY_TEMP_CODE_TTL_MINUTES', 10);
define('ARAY_TEMP_CODE_LENGTH', 8);

/** Rate limit: intentos fallidos en ventana → bloqueo */
define('ARAY_AUTH_WINDOW_SECONDS', 900);
define('ARAY_AUTH_MAX_FAILURES', 8);
define('ARAY_AUTH_LOCKOUT_SECONDS', 900);

/**
 * Token de instalación de un solo uso (solo para scripts/install_once.php).
 * Genera uno largo y bórralo o desactívalo tras instalar.
 */
define('ARAY_INSTALL_TOKEN', 'CHANGE_INSTALL_TOKEN');

/** Semilla (solo script install; no usar en frontend) */
define('ARAY_SEED_ADULT_LOGIN', 'neni');
define('ARAY_SEED_ADULT_PASSWORD', 'CHANGE_SEED_PASSWORD');
define('ARAY_SEED_ADULT_DISPLAY', 'Neni');
define('ARAY_SEED_PLAYER_SLUG', 'aray');
define('ARAY_SEED_PLAYER_DISPLAY', 'Aray');
