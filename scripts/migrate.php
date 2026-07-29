<?php

declare(strict_types=1);

/**
 * Aplica migraciones SQL pendientes (CREATE IF NOT EXISTS).
 * Uso CLI: php scripts/migrate.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Solo CLI.\n");
    exit(1);
}

if (!defined('DB_USER') || DB_USER === 'CHANGE_ME') {
    fwrite(STDERR, "Configura includes/database.local.php antes de migrar.\n");
    exit(1);
}

try {
    $applied = SchemaInstaller::ensure(false);
    echo "Migraciones nuevas: " . (count($applied['migrationsApplied']) ? implode(', ', $applied['migrationsApplied']) : '(ninguna)') . "\n";
    echo 'Tablas: ' . count($applied['tables']) . "\n";
    echo "Migraciones completas.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(1);
}
