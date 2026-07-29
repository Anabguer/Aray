<?php

declare(strict_types=1);

/**
 * PIN adulto (4 dígitos). Sin dispositivos ni PIN infantil.
 * El valor en claro solo existe en config local al sembrar; en BD solo hash.
 */
final class PinAuthService
{
    public static function loginWithAdultPin(string $pin): array
    {
        $pinNorm = preg_replace('/\D+/', '', $pin) ?? '';
        if (strlen($pinNorm) !== 4) {
            Http::error(401, 'invalid_pin', 'PIN incorrecto');
        }

        $identity = 'adult_pin';
        RateLimit::assertAllowed('pin_login', $identity);

        $account = self::findActiveAdultWithPin();
        $hash = is_array($account) ? (string) ($account['adult_pin_hash'] ?? '') : '';
        $ok = $hash !== '' && password_verify($pinNorm, $hash);

        RateLimit::record('pin_login', $identity, $ok);

        if (!$ok || !is_array($account)) {
            Http::error(401, 'invalid_pin', 'PIN incorrecto');
        }

        Session::regenerate();
        Session::setAdult(
            (int) $account['id'],
            (string) $account['display_name'],
            (string) $account['login']
        );

        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $pdo->prepare(
            "UPDATE {$accounts} SET last_login_at = :at WHERE id = :id"
        )->execute([':at' => MadridTime::utcNowString(), ':id' => (int) $account['id']]);

        return [
            'role' => 'adult',
            'account' => [
                'id' => (int) $account['id'],
                'login' => (string) $account['login'],
                'displayName' => (string) $account['display_name'],
            ],
            'players' => AuthService::playersForAccount((int) $account['id']),
            'csrf' => Csrf::token(),
        ];
    }

    private static function findActiveAdultWithPin(): ?array
    {
        $pdo = Database::pdo();
        $acc = Database::table('accounts');
        $stmt = $pdo->query(
            "SELECT id, login, display_name, adult_pin_hash, is_active
             FROM {$acc}
             WHERE is_active = 1 AND adult_pin_hash IS NOT NULL AND adult_pin_hash <> ''
             ORDER BY id ASC
             LIMIT 1"
        );
        $row = $stmt ? $stmt->fetch() : false;
        return is_array($row) ? $row : null;
    }

    /**
     * Establece hash del PIN adulto si falta (solo seed/scripts locales).
     */
    public static function ensurePinHashes(PDO $pdo): void
    {
        $adultPin = defined('ARAY_SEED_ADULT_PIN') ? (string) ARAY_SEED_ADULT_PIN : '';
        if (preg_match('/^\d{4}$/', $adultPin) !== 1) {
            return;
        }

        $accounts = Database::table('accounts');
        $stmt = $pdo->query(
            "SELECT id, adult_pin_hash FROM {$accounts} WHERE login = 'neni' LIMIT 1"
        );
        $row = $stmt ? $stmt->fetch() : false;
        if (is_array($row) && ($row['adult_pin_hash'] === null || $row['adult_pin_hash'] === '')) {
            $hash = password_hash($adultPin, PASSWORD_DEFAULT);
            $pdo->prepare(
                "UPDATE {$accounts} SET adult_pin_hash = :h WHERE id = :id"
            )->execute([':h' => $hash, ':id' => (int) $row['id']]);
        }
    }
}
