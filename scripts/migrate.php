<?php

declare(strict_types=1);

/**
 * Aplica migraciones SQL pendientes en database/migrations/.
 * Uso CLI: php scripts/migrate.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Solo CLI.\n");
    exit(1);
}

if (!defined('DB_USER') || DB_USER === 'CHANGE_ME' || !defined('DB_PASSWORD') || DB_PASSWORD === 'CHANGE_ME') {
    fwrite(STDERR, "Configura includes/database.local.php antes de migrar.\n");
    exit(1);
}

$pdo = Database::pdo();
$migrationsDir = $root . '/database/migrations';

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS ' . Database::table('schema_migrations') . ' (
        version VARCHAR(64) NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (version)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$applied = $pdo->query('SELECT version FROM ' . Database::table('schema_migrations'))->fetchAll(PDO::FETCH_COLUMN);
$appliedMap = array_fill_keys($applied ?: [], true);

$files = glob($migrationsDir . '/*.sql');
sort($files);

foreach ($files as $file) {
    $version = basename($file, '.sql');
    if (isset($appliedMap[$version])) {
        echo "OK (ya aplicada): {$version}\n";
        continue;
    }

    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "No se pudo leer {$file}\n");
        exit(1);
    }

    echo "Aplicando {$version}...\n";
    $pdo->beginTransaction();
    try {
        // Ejecutar statements separados por ; al final de línea (simple)
        $statements = preg_split('/;\s*\n/', $sql) ?: [];
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if ($statement === '' || strpos($statement, '--') === 0 && substr_count($statement, "\n") === 0) {
                continue;
            }
            // Quitar comentarios de línea sueltos al inicio
            $clean = preg_replace('/^--.*$/m', '', $statement);
            $clean = trim((string) $clean);
            if ($clean === '') {
                continue;
            }
            $pdo->exec($clean);
        }
        $ins = $pdo->prepare(
            'INSERT IGNORE INTO ' . Database::table('schema_migrations') . ' (version, applied_at) VALUES (:v, :at)'
        );
        $ins->execute([':v' => $version, ':at' => MadridTime::utcNowString()]);
        $pdo->commit();
        echo "Aplicada: {$version}\n";
    } catch (Throwable $e) {
        $pdo->rollBack();
        fwrite(STDERR, 'Error en ' . $version . ': ' . $e->getMessage() . "\n");
        exit(1);
    }
}

echo "Migraciones completas.\n";
