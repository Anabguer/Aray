<?php

declare(strict_types=1);

/**
 * PIN adulto (4 dígitos) de la familia recordada en este dispositivo
 * (sesión adulta o cookie ARAYDEVICE). Autoriza el dispositivo si falta.
 */
final class PinAuthService
{
    public static function loginWithAdultPin(string $pin): array
    {
        $pinNorm = preg_replace('/\D+/', '', $pin) ?? '';
        if (strlen($pinNorm) !== 4) {
            Http::error(401, 'invalid_pin', 'PIN incorrecto');
        }

        $account = self::resolveTargetAccount();
        if ($account === null) {
            Http::error(401, 'login_required', 'Entra primero con usuario y contraseña en este dispositivo.');
        }

        $accountId = (int) $account['id'];
        $identity = 'adult_pin:' . $accountId;
        RateLimit::assertAllowed('pin_login', $identity);

        $hash = (string) ($account['adult_pin_hash'] ?? '');
        $ok = $hash !== '' && password_verify($pinNorm, $hash);
        RateLimit::record('pin_login', $identity, $ok);

        if (!$ok) {
            Http::error(401, 'invalid_pin', 'PIN incorrecto');
        }

        $displayName = (string) $account['display_name'];
        $login = (string) $account['login'];

        Session::regenerate();
        Session::setAdult($accountId, $displayName, $login);

        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $pdo->prepare(
            "UPDATE {$accounts} SET last_login_at = :at WHERE id = :id"
        )->execute([':at' => MadridTime::utcNowString(), ':id' => $accountId]);

        $players = AuthService::playersForAccount($accountId);
        $device = AuthService::deviceStatus();
        if (!AuthService::deviceBelongsToAccount($device, $accountId) && $players !== []) {
            AuthService::authorizeDevice($accountId, (int) $players[0]['id'], 'PC de ' . $displayName);
            $device = AuthService::deviceStatus();
        }

        return [
            'role' => 'adult',
            'account' => [
                'id' => $accountId,
                'login' => $login,
                'displayName' => $displayName,
            ],
            'players' => $players,
            'device' => $device,
            'csrf' => Csrf::token(),
        ];
    }

    /** Cuenta cuyo PIN se puede comprobar: sesión adulta o cookie de dispositivo. */
    private static function resolveTargetAccount(): ?array
    {
        Session::start();
        if (Session::role() === 'adult' && Session::accountId() !== null) {
            $acc = AuthService::findAccountById(Session::accountId());
            if (is_array($acc) && (int) $acc['is_active'] === 1) {
                return $acc;
            }
        }

        $fromDevice = AuthService::accountIdFromDeviceCookie();
        if ($fromDevice !== null) {
            $acc = AuthService::findAccountById($fromDevice);
            if (is_array($acc) && (int) $acc['is_active'] === 1) {
                return $acc;
            }
        }

        return null;
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
