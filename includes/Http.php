<?php

declare(strict_types=1);

final class Http
{
    public static function jsonRequest(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            self::error(400, 'invalid_json', 'Petición no válida.');
        }
        return $data;
    }

    public static function allowMethods(array $methods): void
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'OPTIONS') {
            self::corsHeaders();
            http_response_code(204);
            exit;
        }
        if (!in_array($method, $methods, true)) {
            self::error(405, 'method_not_allowed', 'Método no permitido.');
        }
        self::corsHeaders();
    }

    public static function corsHeaders(): void
    {
        // Misma origen bajo /aray/; no abrir CORS amplio.
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
    }

    public static function ok(array $payload, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode(array_merge(['ok' => true], $payload), JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(int $status, string $code, string $message, array $extra = []): void
    {
        http_response_code($status);
        echo json_encode(array_merge([
            'ok' => false,
            'error' => $code,
            'message' => $message,
        ], $extra), JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function clientIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return is_string($ip) ? $ip : '0.0.0.0';
    }

    public static function userAgent(): string
    {
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        return mb_substr(is_string($ua) ? $ua : '', 0, 255);
    }

    public static function requireDbConfigured(): void
    {
        if (!defined('DB_USER') || DB_USER === 'CHANGE_ME' || !defined('DB_PASSWORD') || DB_PASSWORD === 'CHANGE_ME') {
            self::error(503, 'db_not_configured', 'Base de datos no configurada.');
        }
    }
}
