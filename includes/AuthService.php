<?php

declare(strict_types=1);

final class AuthService
{
    public static function adultLogin(string $login, string $password): array
    {
        $loginNorm = mb_strtolower(trim($login));
        if ($loginNorm === '' || $password === '') {
            Http::error(400, 'invalid_credentials', 'No se pudo iniciar sesión.');
        }

        RateLimit::assertAllowed('adult_login', $loginNorm);

        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $stmt = $pdo->prepare(
            "SELECT id, login, password_hash, display_name, is_active
             FROM {$accounts} WHERE login = :login LIMIT 1"
        );
        $stmt->execute([':login' => $loginNorm]);
        $row = $stmt->fetch();

        $ok = is_array($row)
            && (int) $row['is_active'] === 1
            && password_verify($password, (string) $row['password_hash']);

        RateLimit::record('adult_login', $loginNorm, $ok);

        if (!$ok) {
            Http::error(401, 'invalid_credentials', 'No se pudo iniciar sesión.');
        }

        $accountId = (int) $row['id'];
        $displayName = (string) $row['display_name'];
        $loginNorm = (string) $row['login'];

        Session::regenerate();
        Session::setAdult($accountId, $displayName, $loginNorm);
        Csrf::token();

        $pdo->prepare(
            "UPDATE {$accounts} SET last_login_at = :at WHERE id = :id"
        )->execute([':at' => MadridTime::utcNowString(), ':id' => $accountId]);

        $players = self::playersForAccount($accountId);
        $device = self::deviceStatus();
        if (!self::deviceBelongsToAccount($device, $accountId) && $players !== []) {
            self::authorizeDevice($accountId, (int) $players[0]['id'], 'PC de ' . $displayName);
            $device = self::deviceStatus();
        }

        return [
            'role' => 'adult',
            'account' => [
                'id' => $accountId,
                'login' => $loginNorm,
                'displayName' => $displayName,
            ],
            'players' => $players,
            'device' => $device,
            'csrf' => Csrf::token(),
        ];
    }

    public static function requireAdult(): int
    {
        Session::start();
        if (Session::role() !== 'adult' || Session::accountId() === null) {
            Http::error(401, 'unauthorized', 'Se requiere sesión adulta.');
        }
        return Session::accountId();
    }

    public static function requireAdultLinkedToPlayer(int $playerId): int
    {
        $accountId = self::requireAdult();
        if (!self::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        return $accountId;
    }

    public static function accountOwnsPlayer(int $accountId, int $playerId): bool
    {
        $pdo = Database::pdo();
        $table = Database::table('account_players');
        $stmt = $pdo->prepare(
            "SELECT 1 FROM {$table} WHERE account_id = :a AND player_id = :p LIMIT 1"
        );
        $stmt->execute([':a' => $accountId, ':p' => $playerId]);
        return (bool) $stmt->fetchColumn();
    }

    /** Cuenta familiar dueña de un perfil niño (si hay). */
    public static function accountIdForPlayer(int $playerId): ?int
    {
        if ($playerId < 1) {
            return null;
        }
        $pdo = Database::pdo();
        $table = Database::table('account_players');
        $stmt = $pdo->prepare(
            "SELECT account_id FROM {$table} WHERE player_id = :p ORDER BY account_id ASC LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    public static function playersForAccount(int $accountId): array
    {
        $pdo = Database::pdo();
        $ap = Database::table('account_players');
        $pp = Database::table('player_profiles');
        $stmt = $pdo->prepare(
            "SELECT p.id, p.slug, p.display_name, p.avatar_code, p.current_course_id
             FROM {$ap} ap
             INNER JOIN {$pp} p ON p.id = ap.player_id
             WHERE ap.account_id = :a AND p.is_active = 1
             ORDER BY p.id ASC"
        );
        $stmt->execute([':a' => $accountId]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = [
                'id' => (int) $row['id'],
                'slug' => (string) $row['slug'],
                'displayName' => (string) $row['display_name'],
                'avatarUrl' => AvatarService::urlFromCode(
                    isset($row['avatar_code']) ? (string) $row['avatar_code'] : null
                ),
                'courseId' => isset($row['current_course_id']) ? (string) $row['current_course_id'] : null,
            ];
        }
        return $out;
    }

    public static function findPlayerBySlug(string $slug): ?array
    {
        $pdo = Database::pdo();
        $pp = Database::table('player_profiles');
        $stmt = $pdo->prepare(
            "SELECT id, slug, display_name, child_pin_hash, avatar_code, is_active
             FROM {$pp} WHERE slug = :s LIMIT 1"
        );
        $stmt->execute([':s' => mb_strtolower(trim($slug))]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    public static function findPlayerById(int $id): ?array
    {
        $pdo = Database::pdo();
        $pp = Database::table('player_profiles');
        $stmt = $pdo->prepare(
            "SELECT id, slug, display_name, child_pin_hash, avatar_code, is_active
             FROM {$pp} WHERE id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    /** Cuenta dueña del dispositivo activo (cookie), si hay. */
    public static function accountIdFromDeviceCookie(): ?int
    {
        $raw = self::readDeviceCookie();
        if ($raw === null || $raw === '') {
            return null;
        }
        $device = self::findActiveDeviceByToken($raw);
        if ($device === null) {
            return null;
        }
        $aid = (int) ($device['authorized_by_account_id'] ?? 0);
        return $aid > 0 ? $aid : null;
    }

    /** @param array<string,mixed> $deviceStatus */
    public static function deviceBelongsToAccount(array $deviceStatus, int $accountId): bool
    {
        if (!($deviceStatus['authorized'] ?? false)) {
            return false;
        }
        return (int) ($deviceStatus['accountId'] ?? 0) === $accountId;
    }

    /** Autoriza el dispositivo actual: genera token raw (solo se devuelve una vez). */
    public static function authorizeDevice(int $accountId, int $playerId, string $deviceLabel): array
    {
        if (!self::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }

        $bytes = defined('ARAY_DEVICE_TOKEN_BYTES') ? (int) ARAY_DEVICE_TOKEN_BYTES : 32;
        $raw = bin2hex(random_bytes($bytes));
        $hash = hash('sha256', $raw);
        $prefix = substr($raw, 0, 8);
        $ttlDays = defined('ARAY_DEVICE_TTL_DAYS') ? (int) ARAY_DEVICE_TTL_DAYS : 365;
        $expiresAt = MadridTime::addDaysUtc($ttlDays);
        $label = mb_substr(trim($deviceLabel) !== '' ? trim($deviceLabel) : 'Dispositivo', 0, 120);

        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $stmt = $pdo->prepare(
            "INSERT INTO {$table}
             (player_id, authorized_by_account_id, device_label, token_hash, token_prefix, user_agent, created_at, last_used_at, expires_at)
             VALUES (:p, :a, :l, :h, :pref, :ua, :c, :lu, :e)"
        );
        $now = MadridTime::utcNowString();
        $stmt->execute([
            ':p' => $playerId,
            ':a' => $accountId,
            ':l' => $label,
            ':h' => $hash,
            ':pref' => $prefix,
            ':ua' => Http::userAgent(),
            ':c' => $now,
            ':lu' => $now,
            ':e' => $expiresAt,
        ]);
        $deviceId = (int) $pdo->lastInsertId();

        self::setDeviceCookie($raw);

        AdultAudit::log($accountId, $playerId, 'device_authorize', null, [
            'deviceId' => $deviceId,
            'tokenPrefix' => $prefix,
            'deviceLabel' => $label,
        ]);

        // No convertir la sesión adulta en infantil: el panel familiar debe seguir.
        // El juego entra después con child-enter + cookie ARAYDEVICE.
        $player = self::findPlayerById($playerId);

        return [
            'deviceId' => $deviceId,
            'tokenPrefix' => $prefix,
            'deviceLabel' => $label,
            'expiresAt' => $expiresAt,
            'player' => [
                'id' => $playerId,
                'slug' => is_array($player) ? (string) $player['slug'] : '',
                'displayName' => is_array($player) ? (string) $player['display_name'] : '',
            ],
            'csrf' => Csrf::token(),
            'role' => 'adult',
        ];
    }

    public static function listDevices(int $accountId, int $playerId): array
    {
        if (!self::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $stmt = $pdo->prepare(
            "SELECT id, device_label, token_prefix, user_agent, created_at, last_used_at, expires_at, revoked_at
             FROM {$table}
             WHERE player_id = :p
             ORDER BY created_at DESC"
        );
        $stmt->execute([':p' => $playerId]);
        $devices = [];
        foreach ($stmt->fetchAll() as $row) {
            $revoked = $row['revoked_at'] !== null;
            $expired = $row['expires_at'] !== null && $row['expires_at'] < MadridTime::utcNowString();
            $devices[] = [
                'id' => (int) $row['id'],
                'deviceLabel' => (string) $row['device_label'],
                'tokenPrefix' => (string) $row['token_prefix'],
                'userAgent' => $row['user_agent'],
                'createdAt' => $row['created_at'],
                'lastUsedAt' => $row['last_used_at'],
                'expiresAt' => $row['expires_at'],
                'revokedAt' => $row['revoked_at'],
                'active' => !$revoked && !$expired,
            ];
        }
        return $devices;
    }

    /**
     * Cierra vínculo de este navegador: revoca la cookie ARAYDEVICE y la borra.
     * Usado en «Cerrar sesión» para poder entrar con otra familia en el mismo PC.
     */
    public static function forgetCurrentDevice(): void
    {
        $raw = self::readDeviceCookie();
        self::clearDeviceCookie();
        if ($raw === null || $raw === '') {
            return;
        }
        try {
            $pdo = Database::pdo();
            $table = Database::table('authorized_devices');
            $hash = hash('sha256', $raw);
            $pdo->prepare(
                "UPDATE {$table}
                 SET revoked_at = COALESCE(revoked_at, :at)
                 WHERE token_hash = :h AND revoked_at IS NULL"
            )->execute([
                ':at' => MadridTime::utcNowString(),
                ':h' => $hash,
            ]);
        } catch (Throwable $e) {
            // Cookie ya borrada; fallar BD no debe impedir el logout.
        }
    }

    public static function revokeDevice(int $accountId, int $playerId, int $deviceId): void
    {
        if (!self::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $stmt = $pdo->prepare(
            "SELECT id, token_prefix, revoked_at FROM {$table}
             WHERE id = :id AND player_id = :p LIMIT 1"
        );
        $stmt->execute([':id' => $deviceId, ':p' => $playerId]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            Http::error(404, 'not_found', 'Dispositivo no encontrado.');
        }
        if ($row['revoked_at'] !== null) {
            return;
        }
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "UPDATE {$table} SET revoked_at = :at WHERE id = :id"
        )->execute([':at' => $now, ':id' => $deviceId]);

        AdultAudit::log($accountId, $playerId, 'device_revoke', [
            'deviceId' => $deviceId,
            'tokenPrefix' => $row['token_prefix'],
        ], [
            'revokedAt' => $now,
        ]);
    }

    public static function createTempCode(int $accountId, int $playerId): array
    {
        if (!self::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }

        $len = defined('ARAY_TEMP_CODE_LENGTH') ? (int) ARAY_TEMP_CODE_LENGTH : 8;
        // Código legible sin caracteres ambiguos
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($i = 0; $i < $len; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $hash = hash('sha256', strtoupper($code));
        $prefix = substr($code, 0, 4);
        $ttl = defined('ARAY_TEMP_CODE_TTL_MINUTES') ? (int) ARAY_TEMP_CODE_TTL_MINUTES : 10;
        $expiresAt = MadridTime::addMinutesUtc($ttl);

        $pdo = Database::pdo();
        $table = Database::table('device_temp_codes');
        $stmt = $pdo->prepare(
            "INSERT INTO {$table}
             (player_id, created_by_account_id, code_hash, code_prefix, expires_at, created_at)
             VALUES (:p, :a, :h, :pref, :e, :c)"
        );
        $stmt->execute([
            ':p' => $playerId,
            ':a' => $accountId,
            ':h' => $hash,
            ':pref' => $prefix,
            ':e' => $expiresAt,
            ':c' => MadridTime::utcNowString(),
        ]);

        AdultAudit::log($accountId, $playerId, 'temp_code_create', null, [
            'codePrefix' => $prefix,
            'expiresAt' => $expiresAt,
        ]);

        return [
            'code' => $code,
            'codePrefix' => $prefix,
            'expiresAt' => $expiresAt,
            'ttlMinutes' => $ttl,
        ];
    }

    public static function redeemTempCode(string $code, string $playerSlug, string $deviceLabel): array
    {
        $codeNorm = strtoupper(preg_replace('/\s+/', '', trim($code)) ?? '');
        $slug = mb_strtolower(trim($playerSlug));
        if ($codeNorm === '' || $slug === '') {
            Http::error(400, 'invalid_code', 'Código no válido.');
        }

        RateLimit::assertAllowed('temp_code', $slug);

        $player = self::findPlayerBySlug($slug);
        if ($player === null || (int) $player['is_active'] !== 1) {
            RateLimit::record('temp_code', $slug, false);
            Http::error(400, 'invalid_code', 'Código no válido.');
        }

        $pdo = Database::pdo();
        $table = Database::table('device_temp_codes');
        $hash = hash('sha256', $codeNorm);
        $stmt = $pdo->prepare(
            "SELECT * FROM {$table}
             WHERE player_id = :p AND code_hash = :h
             ORDER BY id DESC LIMIT 1 FOR UPDATE"
        );

        $pdo->beginTransaction();
        try {
            $stmt->execute([':p' => (int) $player['id'], ':h' => $hash]);
            $row = $stmt->fetch();
            $now = MadridTime::utcNowString();

            $valid = is_array($row)
                && $row['used_at'] === null
                && $row['expires_at'] >= $now;

            if (!$valid) {
                $pdo->rollBack();
                RateLimit::record('temp_code', $slug, false);
                Http::error(400, 'invalid_code', 'Código no válido.');
            }

            // Crear dispositivo con el account que creó el código
            $bytes = defined('ARAY_DEVICE_TOKEN_BYTES') ? (int) ARAY_DEVICE_TOKEN_BYTES : 32;
            $raw = bin2hex(random_bytes($bytes));
            $tokenHash = hash('sha256', $raw);
            $tokenPrefix = substr($raw, 0, 8);
            $ttlDays = defined('ARAY_DEVICE_TTL_DAYS') ? (int) ARAY_DEVICE_TTL_DAYS : 365;
            $expiresAt = MadridTime::addDaysUtc($ttlDays);
            $label = mb_substr(trim($deviceLabel) !== '' ? trim($deviceLabel) : 'Dispositivo', 0, 120);

            $devices = Database::table('authorized_devices');
            $ins = $pdo->prepare(
                "INSERT INTO {$devices}
                 (player_id, authorized_by_account_id, device_label, token_hash, token_prefix, user_agent, created_at, last_used_at, expires_at)
                 VALUES (:p, :a, :l, :h, :pref, :ua, :c, :lu, :e)"
            );
            $ins->execute([
                ':p' => (int) $player['id'],
                ':a' => (int) $row['created_by_account_id'],
                ':l' => $label,
                ':h' => $tokenHash,
                ':pref' => $tokenPrefix,
                ':ua' => Http::userAgent(),
                ':c' => $now,
                ':lu' => $now,
                ':e' => $expiresAt,
            ]);
            $deviceId = (int) $pdo->lastInsertId();

            $pdo->prepare(
                "UPDATE {$table} SET used_at = :u, used_device_id = :d WHERE id = :id"
            )->execute([':u' => $now, ':d' => $deviceId, ':id' => (int) $row['id']]);

            AdultAudit::log((int) $row['created_by_account_id'], (int) $player['id'], 'temp_code_redeem', [
                'tempCodeId' => (int) $row['id'],
                'codePrefix' => $row['code_prefix'],
            ], [
                'deviceId' => $deviceId,
                'tokenPrefix' => $tokenPrefix,
            ]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        RateLimit::record('temp_code', $slug, true);
        self::setDeviceCookie($raw);

        Session::regenerate();
        Session::setChild(
            (int) $player['id'],
            (string) $player['slug'],
            (string) $player['display_name'],
            $deviceId
        );

        return [
            'deviceId' => $deviceId,
            'tokenPrefix' => $tokenPrefix,
            'player' => [
                'id' => (int) $player['id'],
                'slug' => (string) $player['slug'],
                'displayName' => (string) $player['display_name'],
            ],
            'csrf' => Csrf::token(),
        ];
    }

    /** Entra como niño usando cookie de dispositivo (cualquier niño de la misma cuenta). */
    public static function childEnterWithDeviceCookie(?string $playerSlug = null): array
    {
        $raw = self::readDeviceCookie();
        if ($raw === null || $raw === '') {
            Http::error(401, 'device_required', 'Este dispositivo no está autorizado. Entra con la cuenta familiar.');
        }

        $device = self::findActiveDeviceByToken($raw);
        if ($device === null) {
            self::clearDeviceCookie();
            Http::error(401, 'device_required', 'Este dispositivo no está autorizado. Entra con la cuenta familiar.');
        }

        $accountId = (int) ($device['authorized_by_account_id'] ?? 0);
        if ($accountId < 1) {
            Http::error(401, 'device_required', 'Este dispositivo no está autorizado. Entra con la cuenta familiar.');
        }

        $player = null;
        if ($playerSlug !== null && $playerSlug !== '') {
            $candidate = self::findPlayerBySlug($playerSlug);
            if (
                $candidate !== null
                && (int) $candidate['is_active'] === 1
                && self::accountOwnsPlayer($accountId, (int) $candidate['id'])
            ) {
                $player = $candidate;
            } else {
                Http::error(403, 'forbidden', 'Este dispositivo no corresponde a ese perfil.');
            }
        } else {
            $player = self::findPlayerById((int) $device['player_id']);
            if ($player === null || (int) $player['is_active'] !== 1) {
                $siblings = self::playersForAccount($accountId);
                if ($siblings === []) {
                    Http::error(401, 'device_required', 'Este dispositivo no está autorizado. Entra con la cuenta familiar.');
                }
                $player = self::findPlayerById((int) $siblings[0]['id']);
            }
        }

        if ($player === null || (int) $player['is_active'] !== 1) {
            Http::error(401, 'device_required', 'Este dispositivo no está autorizado. Entra con la cuenta familiar.');
        }

        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $pdo->prepare(
            "UPDATE {$table} SET last_used_at = :at, player_id = :p WHERE id = :id"
        )->execute([
            ':at' => MadridTime::utcNowString(),
            ':p' => (int) $player['id'],
            ':id' => (int) $device['id'],
        ]);

        Session::regenerate();
        Session::setChild(
            (int) $player['id'],
            (string) $player['slug'],
            (string) $player['display_name'],
            (int) $device['id']
        );

        return [
            'role' => 'child',
            'player' => [
                'id' => (int) $player['id'],
                'slug' => (string) $player['slug'],
                'displayName' => (string) $player['display_name'],
                'avatarUrl' => AvatarService::urlFromCode(
                    isset($player['avatar_code']) ? (string) $player['avatar_code'] : null
                ),
            ],
            'deviceId' => (int) $device['id'],
            'csrf' => Csrf::token(),
            'canPlayAsAray' => true,
        ];
    }

    public static function deviceStatus(): array
    {
        $raw = self::readDeviceCookie();
        if ($raw === null || $raw === '') {
            return ['authorized' => false];
        }
        $device = self::findActiveDeviceByToken($raw);
        if ($device === null) {
            return ['authorized' => false];
        }
        $accountId = (int) ($device['authorized_by_account_id'] ?? 0);
        if ($accountId < 1) {
            return ['authorized' => false];
        }
        $player = self::findPlayerById((int) $device['player_id']);
        $account = self::findAccountById($accountId);
        $players = self::playersForAccount($accountId);
        return [
            'authorized' => true,
            'deviceId' => (int) $device['id'],
            'deviceLabel' => (string) $device['device_label'],
            'accountId' => $accountId,
            'accountDisplayName' => is_array($account) ? (string) $account['display_name'] : null,
            'player' => $player === null ? null : [
                'id' => (int) $player['id'],
                'slug' => (string) $player['slug'],
                'displayName' => (string) $player['display_name'],
                'avatarUrl' => AvatarService::urlFromCode(
                    isset($player['avatar_code']) ? (string) $player['avatar_code'] : null
                ),
            ],
            'players' => $players,
        ];
    }

    public static function findAccountById(int $id): ?array
    {
        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $stmt = $pdo->prepare(
            "SELECT id, login, display_name, adult_pin_hash, is_active
             FROM {$accounts} WHERE id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    /**
     * Autorización para leer progreso: adulto vinculado o niño del mismo player
     * (sesión child o cookie de dispositivo válida).
     */
    public static function assertCanReadProgress(int $playerId): void
    {
        Session::start();
        if (Session::role() === 'adult' && Session::accountId() !== null) {
            if (self::accountOwnsPlayer(Session::accountId(), $playerId)) {
                return;
            }
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        if (Session::role() === 'child' && Session::playerId() === $playerId) {
            return;
        }
        // Cookie de dispositivo: cualquier niño de la misma cuenta familiar
        $raw = self::readDeviceCookie();
        if ($raw !== null) {
            $device = self::findActiveDeviceByToken($raw);
            if ($device !== null) {
                $accountId = (int) ($device['authorized_by_account_id'] ?? 0);
                if ($accountId > 0 && self::accountOwnsPlayer($accountId, $playerId)) {
                    return;
                }
                if ((int) $device['player_id'] === $playerId) {
                    return;
                }
            }
        }
        Http::error(401, 'unauthorized', 'Se requiere autorización.');
    }

    private static function findActiveDeviceByToken(string $raw): ?array
    {
        $pdo = Database::pdo();
        $table = Database::table('authorized_devices');
        $hash = hash('sha256', $raw);
        $stmt = $pdo->prepare(
            "SELECT * FROM {$table} WHERE token_hash = :h LIMIT 1"
        );
        $stmt->execute([':h' => $hash]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            return null;
        }
        if ($row['revoked_at'] !== null) {
            return null;
        }
        if ($row['expires_at'] !== null && $row['expires_at'] < MadridTime::utcNowString()) {
            return null;
        }
        return $row;
    }

    private static function setDeviceCookie(string $rawToken): void
    {
        $name = defined('ARAY_DEVICE_COOKIE') ? ARAY_DEVICE_COOKIE : 'ARAYDEVICE';
        $secure = defined('ARAY_COOKIE_SECURE') ? (bool) ARAY_COOKIE_SECURE : aray_is_production();
        $sameSite = defined('ARAY_COOKIE_SAMESITE') ? ARAY_COOKIE_SAMESITE : 'Lax';
        $path = defined('ARAY_COOKIE_PATH') ? ARAY_COOKIE_PATH : '/aray/afkacademy';
        $ttlDays = defined('ARAY_DEVICE_TTL_DAYS') ? (int) ARAY_DEVICE_TTL_DAYS : 365;

        setcookie($name, $rawToken, [
            'expires' => time() + ($ttlDays * 86400),
            'path' => $path,
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);
        $_COOKIE[$name] = $rawToken;
    }

    private static function clearDeviceCookie(): void
    {
        $name = defined('ARAY_DEVICE_COOKIE') ? ARAY_DEVICE_COOKIE : 'ARAYDEVICE';
        $secure = defined('ARAY_COOKIE_SECURE') ? (bool) ARAY_COOKIE_SECURE : aray_is_production();
        $sameSite = defined('ARAY_COOKIE_SAMESITE') ? ARAY_COOKIE_SAMESITE : 'Lax';
        $path = defined('ARAY_COOKIE_PATH') ? ARAY_COOKIE_PATH : '/aray/afkacademy';
        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => $path,
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);
        unset($_COOKIE[$name]);
    }

    private static function readDeviceCookie(): ?string
    {
        $name = defined('ARAY_DEVICE_COOKIE') ? ARAY_DEVICE_COOKIE : 'ARAYDEVICE';
        $val = $_COOKIE[$name] ?? null;
        return is_string($val) && $val !== '' ? $val : null;
    }
}
