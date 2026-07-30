<?php
/**
 * Ejecuta database/scripts/reset_aray_progress.sql con COMMIT.
 * Uso: php scripts/run_reset_aray_progress.php
 */
declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root . '/includes/database.local.php';

$sqlFile = $root . '/database/scripts/reset_aray_progress.sql';
$sql = file_get_contents($sqlFile);
if ($sql === false) {
    fwrite(STDERR, "No se pudo leer $sqlFile\n");
    exit(1);
}

// El script deja ROLLBACK por seguridad; aquí hacemos COMMIT tras confirmación del usuario.
$sql = preg_replace('/^\s*ROLLBACK\s*;\s*$/mi', 'COMMIT;', $sql);
if ($sql === null || !preg_match('/\bCOMMIT\s*;/i', $sql)) {
    fwrite(STDERR, "No se pudo sustituir ROLLBACK por COMMIT.\n");
    exit(1);
}

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=%s',
    DB_HOST,
    DB_NAME,
    defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
);

$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

echo "Conectado a " . DB_HOST . " / " . DB_NAME . "\n";
echo "Ejecutando reset ARAY (COMMIT)...\n\n";

// Ejecutar por sentencias (multi-query vía PDO::MYSQL_ATTR_MULTI_STATEMENTS)
$pdo->setAttribute(PDO::MYSQL_ATTR_MULTI_STATEMENTS, true);

try {
    $stmt = $pdo->query($sql);
    $setIndex = 0;
    do {
        $rows = $stmt->fetchAll();
        if ($rows !== []) {
            echo "--- result set " . (++$setIndex) . " ---\n";
            foreach ($rows as $row) {
                echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
            }
            echo "\n";
        } else {
            // statement sin filas (DELETE/UPDATE/INSERT) — OK
        }
    } while ($stmt->nextRowset());
} catch (Throwable $e) {
    fwrite(STDERR, 'ERROR: ' . $e->getMessage() . "\n");
    try {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    } catch (Throwable $ignored) {
    }
    exit(1);
}

$epoch = $pdo->query("SELECT setting_value FROM arayapp_app_settings WHERE setting_key = 'sync_epoch'")
    ->fetchColumn();
$progress = $pdo->query(
    "SELECT xp, coins, best_streak, best_challenge_score FROM arayapp_player_progress WHERE player_id = 1"
)->fetch();
$sessions = (int) $pdo->query('SELECT COUNT(*) FROM arayapp_sessions WHERE player_id = 1')->fetchColumn();

echo "=== RESUMEN FINAL ===\n";
echo 'sync_epoch=' . $epoch . "\n";
echo 'progress=' . json_encode($progress, JSON_UNESCAPED_UNICODE) . "\n";
echo "sessions=$sessions\n";
echo "OK: limpieza aplicada con COMMIT.\n";
