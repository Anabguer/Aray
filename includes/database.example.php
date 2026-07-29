<?php
/**
 * EJEMPLO de conexión MySQL para ARAY.
 * Copia este archivo a database.local.php o database.php y rellena valores reales
 * fuera del control de versiones. NO pegues credenciales de producción aquí.
 *
 * Prefijo de tablas reservado: arayapp_
 * No uses el prefijo aray_ (ya existe en Intocables).
 */

declare(strict_types=1);

// define('DB_HOST', 'localhost');
// define('DB_USER', 'CHANGE_ME');
// define('DB_PASSWORD', 'CHANGE_ME');
// define('DB_NAME', 'aray_db');
// define('DB_CHARSET', 'utf8mb4');
define('DB_PREFIX', 'arayapp_');

function arayapp_table(string $name): string
{
    return DB_PREFIX . $name;
}

/*
function getArayDbConnection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}
*/
