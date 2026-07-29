<?php

declare(strict_types=1);

final class Database
{
    /** @var PDO|null */
    private static $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        Http::requireDbConfigured();

        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_NAME,
            defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
        );

        self::$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        self::$pdo->exec("SET time_zone = '+00:00'");

        return self::$pdo;
    }

    public static function table(string $name): string
    {
        return arayapp_table($name);
    }
}
