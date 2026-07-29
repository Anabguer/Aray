<?php

declare(strict_types=1);

/**
 * Genera includes/database.local.php (nunca se versiona).
 *
 * Uso:
 *   php scripts/setup_local_config.php --db-password=TU_MYSQL --seed-password=Min10Chars!
 *
 * Opcional: --db-user=root --db-name=aray_db --db-host=127.0.0.1
 */

$root = dirname(__DIR__);
$target = $root . '/includes/database.local.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Solo CLI.\n");
    exit(1);
}

function arg_value(array $argv, string $name, ?string $default = null): ?string
{
    foreach ($argv as $arg) {
        if (strpos($arg, $name . '=') === 0) {
            return substr($arg, strlen($name) + 1);
        }
    }
    return $default;
}

$dbHost = arg_value($argv, '--db-host', '127.0.0.1');
$dbUser = arg_value($argv, '--db-user', 'root');
$dbPassword = arg_value($argv, '--db-password', null);
$dbName = arg_value($argv, '--db-name', 'aray_db');
$seedPassword = arg_value($argv, '--seed-password', null);
$childPin = arg_value($argv, '--child-pin', null);
$adultPin = arg_value($argv, '--adult-pin', null);

if ($dbPassword === null) {
    fwrite(STDERR, "Falta --db-password= (contraseña MySQL local). Usa \"\" vacío si aplica: --db-password=\n");
    exit(1);
}
if ($seedPassword === null || strlen($seedPassword) < 10) {
    fwrite(STDERR, "Falta --seed-password= con al menos 10 caracteres (contraseña de Neni en local).\n");
    exit(1);
}
if ($childPin === null || preg_match('/^\d{4}$/', $childPin) !== 1) {
    fwrite(STDERR, "Falta --child-pin= con exactamente 4 dígitos (solo local; se guarda hasheado).\n");
    exit(1);
}
if ($adultPin === null || preg_match('/^\d{4}$/', $adultPin) !== 1) {
    fwrite(STDERR, "Falta --adult-pin= con exactamente 4 dígitos (solo local; se guarda hasheado).\n");
    exit(1);
}

$installToken = bin2hex(random_bytes(24));

$export = static function (string $value): string {
    return var_export($value, true);
};

$contents = <<<PHP
<?php
/**
 * Configuración LOCAL de ARAY — NO SUBIR A GIT.
 * Generado por scripts/setup_local_config.php
 */
declare(strict_types=1);

define('DB_HOST', {$export($dbHost)});
define('DB_USER', {$export($dbUser)});
define('DB_PASSWORD', {$export($dbPassword)});
define('DB_NAME', {$export($dbName)});
define('DB_CHARSET', 'utf8mb4');
define('DB_PREFIX', 'arayapp_');

define('ARAY_ENV', 'local');
define('ARAY_CREATE_DATABASE', true);
define('ARAY_AUTO_ENSURE_SCHEMA', true);

define('ARAY_SESSION_NAME', 'ARAYSESSID');
define('ARAY_DEVICE_COOKIE', 'ARAYDEVICE');
define('ARAY_COOKIE_SECURE', false);
define('ARAY_COOKIE_SAMESITE', 'Lax');
define('ARAY_COOKIE_PATH', '/'); // Hostalia con URL /aray/ → '/aray'

define('ARAY_TIMEZONE_PLAYABLE', 'Europe/Madrid');
define('ARAY_DEVICE_TOKEN_BYTES', 32);
define('ARAY_DEVICE_TTL_DAYS', 365);
define('ARAY_TEMP_CODE_TTL_MINUTES', 10);
define('ARAY_TEMP_CODE_LENGTH', 8);

define('ARAY_AUTH_WINDOW_SECONDS', 900);
define('ARAY_AUTH_MAX_FAILURES', 8);
define('ARAY_AUTH_LOCKOUT_SECONDS', 900);

define('ARAY_INSTALL_TOKEN', {$export($installToken)});

define('ARAY_SEED_ADULT_LOGIN', 'neni');
define('ARAY_SEED_ADULT_PASSWORD', {$export($seedPassword)});
define('ARAY_SEED_ADULT_DISPLAY', 'Neni');
define('ARAY_SEED_PLAYER_SLUG', 'aray');
define('ARAY_SEED_PLAYER_DISPLAY', 'Aray');
define('ARAY_SEED_CHILD_PIN', {$export($childPin)});
define('ARAY_SEED_ADULT_PIN', {$export($adultPin)});
define('ARAY_REWARD_TARGET_POINTS', 500);

PHP;

if (file_put_contents($target, $contents) === false) {
    fwrite(STDERR, "No se pudo escribir {$target}\n");
    exit(1);
}

echo "Escrito: {$target}\n";
echo "ARAY_INSTALL_TOKEN={$installToken}\n";
echo "Siguiente: php scripts/install_once.php --token={$installToken}\n";
