<?php

declare(strict_types=1);

final class RateLimit
{
    public static function assertAllowed(string $attemptType, string $identityKey): void
    {
        $pdo = Database::pdo();
        $table = Database::table('auth_attempts');
        $window = defined('ARAY_AUTH_WINDOW_SECONDS') ? (int) ARAY_AUTH_WINDOW_SECONDS : 900;
        $max = defined('ARAY_AUTH_MAX_FAILURES') ? (int) ARAY_AUTH_MAX_FAILURES : 8;
        $lockout = defined('ARAY_AUTH_LOCKOUT_SECONDS') ? (int) ARAY_AUTH_LOCKOUT_SECONDS : 900;

        $since = MadridTime::utcNow()->modify('-' . $lockout . ' seconds')->format('Y-m-d H:i:s');
        $ipHash = hash('sha256', Http::clientIp());

        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS c FROM {$table}
             WHERE attempt_type = :t
               AND succeeded = 0
               AND created_at >= :since
               AND (identity_key = :id OR ip_hash = :ip)"
        );
        $stmt->execute([
            ':t' => $attemptType,
            ':since' => $since,
            ':id' => self::normalizeIdentity($identityKey),
            ':ip' => $ipHash,
        ]);
        $count = (int) $stmt->fetchColumn();

        if ($count >= $max) {
            Http::error(429, 'too_many_attempts', 'Demasiados intentos. Espera un rato e inténtalo de nuevo.');
        }

        // Ventana corta también por identity (mismo mensaje genérico)
        $windowSince = MadridTime::utcNow()->modify('-' . $window . ' seconds')->format('Y-m-d H:i:s');
        $stmt2 = $pdo->prepare(
            "SELECT COUNT(*) AS c FROM {$table}
             WHERE attempt_type = :t AND identity_key = :id AND succeeded = 0 AND created_at >= :since"
        );
        $stmt2->execute([
            ':t' => $attemptType,
            ':id' => self::normalizeIdentity($identityKey),
            ':since' => $windowSince,
        ]);
        if ((int) $stmt2->fetchColumn() >= $max) {
            Http::error(429, 'too_many_attempts', 'Demasiados intentos. Espera un rato e inténtalo de nuevo.');
        }
    }

    public static function record(string $attemptType, string $identityKey, bool $succeeded): void
    {
        $pdo = Database::pdo();
        $table = Database::table('auth_attempts');
        $stmt = $pdo->prepare(
            "INSERT INTO {$table} (attempt_type, identity_key, ip_hash, succeeded, created_at)
             VALUES (:t, :id, :ip, :ok, :at)"
        );
        $stmt->execute([
            ':t' => $attemptType,
            ':id' => self::normalizeIdentity($identityKey),
            ':ip' => hash('sha256', Http::clientIp()),
            ':ok' => $succeeded ? 1 : 0,
            ':at' => MadridTime::utcNowString(),
        ]);
    }

    private static function normalizeIdentity(string $key): string
    {
        return mb_substr(mb_strtolower(trim($key)), 0, 128);
    }
}
