<?php

declare(strict_types=1);

final class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $name = defined('ARAY_SESSION_NAME') ? ARAY_SESSION_NAME : 'ARAYSESSID';
        $secure = defined('ARAY_COOKIE_SECURE') ? (bool) ARAY_COOKIE_SECURE : aray_is_production();
        $sameSite = defined('ARAY_COOKIE_SAMESITE') ? ARAY_COOKIE_SAMESITE : 'Lax';
        $path = defined('ARAY_COOKIE_PATH') ? ARAY_COOKIE_PATH : '/aray';

        session_name($name);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => $path,
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);
        session_start();
    }

    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }

    public static function destroy(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'secure' => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
    }

    public static function setAdult(int $accountId, string $displayName, string $login): void
    {
        self::start();
        $_SESSION['role'] = 'adult';
        $_SESSION['account_id'] = $accountId;
        $_SESSION['display_name'] = $displayName;
        $_SESSION['login'] = $login;
        unset($_SESSION['player_id'], $_SESSION['player_slug'], $_SESSION['device_id']);
    }

    public static function setChild(int $playerId, string $playerSlug, string $displayName, ?int $deviceId = null): void
    {
        self::start();
        $_SESSION['role'] = 'child';
        $_SESSION['player_id'] = $playerId;
        $_SESSION['player_slug'] = $playerSlug;
        $_SESSION['display_name'] = $displayName;
        if ($deviceId !== null) {
            $_SESSION['device_id'] = $deviceId;
        }
        unset($_SESSION['account_id'], $_SESSION['login']);
    }

    public static function role(): ?string
    {
        self::start();
        $role = $_SESSION['role'] ?? null;
        return is_string($role) ? $role : null;
    }

    public static function accountId(): ?int
    {
        self::start();
        return isset($_SESSION['account_id']) ? (int) $_SESSION['account_id'] : null;
    }

    public static function playerId(): ?int
    {
        self::start();
        return isset($_SESSION['player_id']) ? (int) $_SESSION['player_id'] : null;
    }

    public static function snapshot(): array
    {
        self::start();
        $role = self::role();
        if ($role === null) {
            return ['authenticated' => false, 'role' => null];
        }
        if ($role === 'adult') {
            return [
                'authenticated' => true,
                'role' => 'adult',
                'account' => [
                    'id' => self::accountId(),
                    'login' => $_SESSION['login'] ?? null,
                    'displayName' => $_SESSION['display_name'] ?? null,
                ],
            ];
        }
        return [
            'authenticated' => true,
            'role' => 'child',
            'player' => [
                'id' => self::playerId(),
                'slug' => $_SESSION['player_slug'] ?? null,
                'displayName' => $_SESSION['display_name'] ?? null,
            ],
            'deviceId' => isset($_SESSION['device_id']) ? (int) $_SESSION['device_id'] : null,
        ];
    }
}
