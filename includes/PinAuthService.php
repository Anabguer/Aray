<?php

declare(strict_types=1);

/**
 * Acceso por PIN (4 dígitos) solo en dispositivos ya autorizados.
 * Los PIN nunca viajan hasheados desde el cliente: el servidor verifica con password_verify.
 */
final class PinAuthService
{
    public static function loginWithPin(string $pin): array
    {
        $pinNorm = preg_replace('/\D+/', '', $pin) ?? '';
        if (strlen($pinNorm) !== 4) {
            Http::error(400, 'invalid_pin', 'Ese PIN no es correcto.');
        }

        $device = self::requireAuthorizedDevice();
        $playerId = (int) $device['player_id'];
        $identity = 'device:' . (int) $device['id'];

        RateLimit::assertAllowed('pin_login', $identity);

        $player = AuthService::findPlayerById($playerId);
        if ($player === null || (int) $player['is_active'] !== 1) {
            RateLimit::record('pin_login', $identity, false);
            Http::error(401, 'invalid_pin', 'Ese PIN no es correcto.');
        }

        $childHash = isset($player['child_pin_hash']) ? (string) $player['child_pin_hash'] : '';
        if ($childHash !== '' && password_verify($pinNorm, $childHash)) {
            RateLimit::record('pin_login', $identity, true);
            self::touchDevice((int) $device['id']);
            Session::regenerate();
            Session::setChild(
                $playerId,
                (string) $player['slug'],
                (string) $player['display_name'],
                (int) $device['id']
            );
            return [
                'role' => 'child',
                'player' => [
                    'id' => $playerId,
                    'slug' => (string) $player['slug'],
                    'displayName' => (string) $player['display_name'],
                ],
                'deviceId' => (int) $device['id'],
                'csrf' => Csrf::token(),
            ];
        }

        $account = self::findAdultOwnerWithPin($playerId);
        if ($account !== null) {
            $adultHash = (string) ($account['adult_pin_hash'] ?? '');
            if ($adultHash !== '' && password_verify($pinNorm, $adultHash)) {
                RateLimit::record('pin_login', $identity, true);
                self::touchDevice((int) $device['id']);
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
        }

        RateLimit::record('pin_login', $identity, false);
        Http::error(401, 'invalid_pin', 'Ese PIN no es correcto.');
    }

    /** @return array{id:int,player_id:int,device_label:string} */
    private static function requireAuthorizedDevice(): array
    {
        $status = AuthService::deviceStatus();
        if (empty($status['authorized'])) {
            Http::error(
                401,
                'device_required',
                'Este dispositivo aún no está autorizado. Un adulto debe autorizarlo primero.'
            );
        }
        return [
            'id' => (int) $status['deviceId'],
            'player_id' => (int) $status['player']['id'],
            'device_label' => (string) ($status['deviceLabel'] ?? 'Dispositivo'),
        ];
    }

    private static function findAdultOwnerWithPin(int $playerId): ?array
    {
        $pdo = Database::pdo();
        $ap = Database::table('account_players');
        $acc = Database::table('accounts');
        $stmt = $pdo->prepare(
            "SELECT a.id, a.login, a.display_name, a.adult_pin_hash, a.is_active
             FROM {$ap} ap
             INNER JOIN {$acc} a ON a.id = ap.account_id
             WHERE ap.player_id = :p AND a.is_active = 1
             ORDER BY ap.created_at ASC
             LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    private static function touchDevice(int $deviceId): void
    {
        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $pdo->prepare(
            "UPDATE {$table} SET last_used_at = :at WHERE id = :id"
        )->execute([':at' => MadridTime::utcNowString(), ':id' => $deviceId]);
    }

    /**
     * Establece hashes de PIN si faltan (solo desde seed/scripts locales).
     * No acepta PIN vacíos ni los deja en texto plano.
     */
    public static function ensurePinHashes(PDO $pdo): void
    {
        $childPin = defined('ARAY_SEED_CHILD_PIN') ? (string) ARAY_SEED_CHILD_PIN : '';
        $adultPin = defined('ARAY_SEED_ADULT_PIN') ? (string) ARAY_SEED_ADULT_PIN : '';

        $players = Database::table('player_profiles');
        $accounts = Database::table('accounts');

        if (preg_match('/^\d{4}$/', $childPin) === 1) {
            $stmt = $pdo->query(
                "SELECT id, child_pin_hash FROM {$players} WHERE slug = 'aray' LIMIT 1"
            );
            $row = $stmt ? $stmt->fetch() : false;
            if (is_array($row) && ($row['child_pin_hash'] === null || $row['child_pin_hash'] === '')) {
                $hash = password_hash($childPin, PASSWORD_DEFAULT);
                $pdo->prepare(
                    "UPDATE {$players} SET child_pin_hash = :h WHERE id = :id"
                )->execute([':h' => $hash, ':id' => (int) $row['id']]);
            }
        }

        if (preg_match('/^\d{4}$/', $adultPin) === 1) {
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
}
