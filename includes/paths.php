<?php
/**
 * Detección de rutas — local vs producción (intocables13.com/aray/afkacademy/).
 * Preparado para el futuro backend PHP. No contiene secretos.
 */

$isLocalhost = (
    ($_SERVER['HTTP_HOST'] ?? '') === 'localhost'
    || strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false
    || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false
);

if ($isLocalhost) {
    define('BASE_URL', '/aray/afkacademy/');
    define('SITE_URL', 'http://localhost/aray/afkacademy');
} else {
    define('BASE_URL', '/aray/afkacademy/');
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443)
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
    $protocol = $https ? 'https' : 'http';
    define('SITE_URL', $protocol . '://' . ($_SERVER['HTTP_HOST'] ?? 'intocables13.com') . rtrim(BASE_URL, '/'));
}

define('API_URL', BASE_URL . 'api/');

function aray_url(string $path = ''): string
{
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}
