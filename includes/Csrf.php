<?php

declare(strict_types=1);

final class Csrf
{
    private const SESSION_KEY = 'csrf_token';

    public static function token(): string
    {
        Session::start();
        if (empty($_SESSION[self::SESSION_KEY]) || !is_string($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }
        return $_SESSION[self::SESSION_KEY];
    }

    public static function requireValid(?string $provided): void
    {
        Session::start();
        $expected = self::token();
        if (!is_string($provided) || $provided === '' || !hash_equals($expected, $provided)) {
            Http::error(403, 'csrf_invalid', 'Sesión no válida. Recarga e inténtalo de nuevo.', [
                'csrf' => $expected,
            ]);
        }
    }

    public static function fromRequest(array $body): ?string
    {
        if (isset($body['csrf']) && is_string($body['csrf'])) {
            return $body['csrf'];
        }
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        return is_string($header) ? $header : null;
    }
}
