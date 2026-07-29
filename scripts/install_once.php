<?php

declare(strict_types=1);

/**
 * Instalación idempotente: crea BD (si procede), tablas IF NOT EXISTS y semilla Neni/Aray.
 *
 * HARD-ABORT: si la instalación ya consta como completada (tablas + Neni/Aray),
 * el script finaliza inmediatamente sin validar el token, sembrar datos ni
 * ejecutar ningún paso de instalación.
 *
 * CLI:
 *   php scripts/install_once.php --token=TU_TOKEN
 *
 * Protección web: responde 403 y sale si no se ejecuta por CLI.
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Instalación solo por CLI.\n";
    exit(1);
}

function cli_fail(string $msg): void
{
    fwrite(STDERR, $msg . "\n");
    exit(1);
}

if (!defined('DB_USER') || DB_USER === 'CHANGE_ME') {
    cli_fail('Configura includes/database.local.php (DB_*).');
}

// ── HARD-ABORT: instalación ya completada ──────────────────────────────────
// Se comprueba ANTES de validar el token. No re-sembrar, no re-aplicar pasos.
try {
    if (SchemaInstaller::isInstalled()) {
        echo "Instalación ya completada. Abortando (hard-abort).\n";
        echo "No se ha validado el token ni se ha ejecutado ningún paso de instalación.\n";
        exit(0);
    }
} catch (Throwable $e) {
    // Si la BD no es accesible todavía, continuar con el flujo normal de instalación.
}

if (!defined('ARAY_INSTALL_TOKEN') || ARAY_INSTALL_TOKEN === 'CHANGE_INSTALL_TOKEN') {
    cli_fail('Define ARAY_INSTALL_TOKEN en database.local.php.');
}

$tokenArg = null;
foreach ($argv as $arg) {
    if (strpos($arg, '--token=') === 0) {
        $tokenArg = substr($arg, 8);
    }
}
if ($tokenArg === null) {
    cli_fail('Uso: php scripts/install_once.php --token=TU_TOKEN');
}
if (!hash_equals((string) ARAY_INSTALL_TOKEN, $tokenArg)) {
    cli_fail('Token de instalación no válido.');
}

try {
    $result = SchemaInstaller::ensure(true);
    $verify = SchemaInstaller::verifyStructure(Database::pdo());
} catch (Throwable $e) {
    cli_fail('Instalación fallida: ' . $e->getMessage());
}

echo "Instalación OK (idempotente).\n";
echo 'Migraciones nuevas: ' . (count($result['migrationsApplied']) ? implode(', ', $result['migrationsApplied']) : '(ninguna)') . "\n";
echo 'Semilla aplicada ahora: ' . ($result['seeded'] ? 'sí' : 'no (ya existían cuentas)') . "\n";
echo 'Cuentas: ' . $result['accounts'] . "\n";
echo 'Tablas arayapp_*: ' . count($result['tables']) . "\n";
foreach ($result['tables'] as $t) {
    echo "  - {$t}\n";
}
if (!$verify['ok']) {
    cli_fail('Verificación estructural incompleta: ' . json_encode($verify['missingTables'], JSON_UNESCAPED_UNICODE));
}
echo 'Neni id=' . $verify['neni']['id'] . ' / Aray id=' . $verify['aray']['id'] . "\n";
echo "IMPORTANTE: no subas database.local.php; rota ARAY_INSTALL_TOKEN tras instalar.\n";
