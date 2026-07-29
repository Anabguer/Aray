<?php

declare(strict_types=1);

/**
 * Bootstrap común del API ARAY.
 */

$arayRoot = dirname(__DIR__);

require_once __DIR__ . '/paths.php';

$localConfig = __DIR__ . '/database.local.php';
$exampleConfig = __DIR__ . '/database.example.php';

if (is_file($localConfig)) {
    require_once $localConfig;
} else {
    // Permite health sin BD; endpoints que necesiten PDO fallarán con 503.
    require_once $exampleConfig;
}

require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/MadridTime.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Session.php';
require_once __DIR__ . '/Csrf.php';
require_once __DIR__ . '/RateLimit.php';
require_once __DIR__ . '/AuthService.php';
require_once __DIR__ . '/ProgressRepository.php';
require_once __DIR__ . '/AdultAudit.php';

if (!defined('DB_PREFIX')) {
    define('DB_PREFIX', 'arayapp_');
}

function arayapp_table(string $name): string
{
    return DB_PREFIX . $name;
}

function aray_env(): string
{
    return defined('ARAY_ENV') ? (string) ARAY_ENV : 'local';
}

function aray_is_production(): bool
{
    return aray_env() === 'production';
}
