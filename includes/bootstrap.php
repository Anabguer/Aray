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
require_once __DIR__ . '/SchemaInstaller.php';
require_once __DIR__ . '/AdultAudit.php';
require_once __DIR__ . '/Session.php';
require_once __DIR__ . '/Csrf.php';
require_once __DIR__ . '/RateLimit.php';
require_once __DIR__ . '/AuthService.php';
require_once __DIR__ . '/PinAuthService.php';
require_once __DIR__ . '/CurriculumCatalogService.php';
require_once __DIR__ . '/PlayerCourseService.php';
require_once __DIR__ . '/RewardCycleService.php';
require_once __DIR__ . '/ActivityService.php';
require_once __DIR__ . '/AdultDashboardService.php';
require_once __DIR__ . '/SessionService.php';
require_once __DIR__ . '/ProgressRepository.php';
require_once __DIR__ . '/Database.php';
if (!defined('DB_PREFIX')) {
    define('DB_PREFIX', 'arayapp_');
}

/** Compatibilidad CLI Windows sin extensión mbstring */
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $string, ?string $encoding = null): int
    {
        return strlen($string);
    }
}
if (!function_exists('mb_strtolower')) {
    function mb_strtolower(string $string, ?string $encoding = null): string
    {
        return strtolower($string);
    }
}
if (!function_exists('mb_substr')) {
    function mb_substr(string $string, int $start, ?int $length = null, ?string $encoding = null): string
    {
        return $length === null ? substr($string, $start) : substr($string, $start, $length);
    }
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
