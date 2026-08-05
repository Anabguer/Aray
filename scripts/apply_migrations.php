<?php
/**
 * Aplica migraciones pendientes sin pasar por bootstrap web.
 * Uso: php scripts/apply_migrations.php
 */
declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root . '/includes/database.local.php';

if (!function_exists('arayapp_table')) {
    function arayapp_table(string $name): string
    {
        $prefix = defined('DB_TABLE_PREFIX') ? DB_TABLE_PREFIX : 'arayapp_';
        return $prefix . $name;
    }
}

require_once $root . '/includes/Http.php';
require_once $root . '/includes/Database.php';
require_once $root . '/includes/MadridTime.php';
require_once $root . '/includes/SchemaInstaller.php';

$pdo = Database::pdo();
$applied = SchemaInstaller::applyMigrations($pdo);
echo $applied === []
    ? "Sin migraciones pendientes.\n"
    : ('Aplicadas: ' . implode(', ', $applied) . "\n");

$daily = arayapp_table('daily_mission');
$cols = $pdo->query("SHOW COLUMNS FROM {$daily} LIKE 'words_units'")->fetch();
echo $cols ? "words_units OK\n" : "ERROR: falta words_units\n";
