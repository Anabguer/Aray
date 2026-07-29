<?php

declare(strict_types=1);

final class Database
{
    /** @var PDO|null */
    private static $pdo = null;

    /** @var bool */
    private static $schemaEnsured = false;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        Http::requireDbConfigured();

        if (defined('ARAY_CREATE_DATABASE') && ARAY_CREATE_DATABASE) {
            SchemaInstaller::ensureDatabaseExists();
        }

        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_NAME,
            defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
        );

        try {
            self::$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // Si la BD aún no existe y está permitido crearla, reintentar una vez
            if (
                defined('ARAY_CREATE_DATABASE')
                && ARAY_CREATE_DATABASE
                && strpos($e->getMessage(), 'Unknown database') !== false
            ) {
                SchemaInstaller::ensureDatabaseExists();
                self::$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } else {
                throw $e;
            }
        }

        self::$pdo->exec("SET time_zone = '+00:00'");

        if (
            !self::$schemaEnsured
            && defined('ARAY_AUTO_ENSURE_SCHEMA')
            && ARAY_AUTO_ENSURE_SCHEMA
        ) {
            self::$schemaEnsured = true;
            SchemaInstaller::applyMigrations(self::$pdo);
            if (class_exists('PinAuthService')) {
                PinAuthService::ensurePinHashes(self::$pdo);
            }
        }

        return self::$pdo;
    }

    public static function table(string $name): string
    {
        return arayapp_table($name);
    }

    public static function resetForTests(): void
    {
        self::$pdo = null;
        self::$schemaEnsured = false;
    }
}
