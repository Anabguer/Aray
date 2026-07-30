<?php

declare(strict_types=1);

/**
 * Época de sincronización controlada por el servidor.
 * Al limpiar datos de prueba se incrementa: las colas offline antiguas
 * (PWA / segundo dispositivo) son rechazadas y no pueden reintroducir progreso.
 */
final class SyncEpochService
{
    public const SETTING_KEY = 'sync_epoch';
    public const DEFAULT_EPOCH = 1;

    public static function ensureTable(PDO $pdo): void
    {
        $table = Database::table('app_settings');
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS {$table} (
                setting_key   VARCHAR(64) NOT NULL,
                setting_value LONGTEXT NOT NULL,
                updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (setting_key)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $pdo->prepare(
            "INSERT IGNORE INTO {$table} (setting_key, setting_value, updated_at)
             VALUES (:k, :v, :t)"
        )->execute([
            ':k' => self::SETTING_KEY,
            ':v' => (string) self::DEFAULT_EPOCH,
            ':t' => MadridTime::utcNowString(),
        ]);
    }

    public static function current(): int
    {
        $pdo = Database::pdo();
        self::ensureTable($pdo);
        $table = Database::table('app_settings');
        $stmt = $pdo->prepare(
            "SELECT setting_value FROM {$table} WHERE setting_key = :k LIMIT 1"
        );
        $stmt->execute([':k' => self::SETTING_KEY]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            return self::DEFAULT_EPOCH;
        }
        $n = (int) $row['setting_value'];
        return $n >= 1 ? $n : self::DEFAULT_EPOCH;
    }

    /** Incrementa la época (p. ej. tras limpieza de progreso de prueba). */
    public static function bump(int $by = 1): int
    {
        $by = max(1, $by);
        $pdo = Database::pdo();
        self::ensureTable($pdo);
        $table = Database::table('app_settings');
        $now = MadridTime::utcNowString();
        $current = self::current();
        $next = $current + $by;
        $pdo->prepare(
            "INSERT INTO {$table} (setting_key, setting_value, updated_at)
             VALUES (:k, :v, :t)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)"
        )->execute([
            ':k' => self::SETTING_KEY,
            ':v' => (string) $next,
            ':t' => $now,
        ]);
        return $next;
    }

    /**
     * Rechaza partidas creadas antes del corte de datos.
     * @param mixed $clientEpoch
     * @throws void via Http::error
     */
    public static function assertClientEpochAcceptable($clientEpoch): int
    {
        $server = self::current();
        // Sin syncEpoch → se asume la época actual (cliente online reciente / scripts).
        // Con syncEpoch antiguo (< servidor) → rechazo (cola offline previa al corte).
        $client = is_numeric($clientEpoch) ? (int) $clientEpoch : $server;
        if ($client < $server) {
            Http::error(
                409,
                'sync_epoch_stale',
                'Esta partida es anterior al corte de datos. Descarta la cola local y vuelve a jugar.'
            );
        }
        return $server;
    }
}
