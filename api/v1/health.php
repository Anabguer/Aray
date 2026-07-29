<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);

$payload = [
    'app' => 'ARAY',
    'phase' => 1,
    'message' => 'API ARAY fase 1 (auth + progress).',
    'tablePrefix' => defined('DB_PREFIX') ? DB_PREFIX : 'arayapp_',
    'phpVersion' => PHP_VERSION,
    'playableTimezone' => defined('ARAY_TIMEZONE_PLAYABLE') ? ARAY_TIMEZONE_PLAYABLE : 'Europe/Madrid',
    'playableDate' => MadridTime::playableDate(),
    'serverTimeUtc' => MadridTime::utcNowString(),
    'dbConfigured' => defined('DB_USER') && DB_USER !== 'CHANGE_ME',
];

if ($payload['dbConfigured']) {
    try {
        $pdo = Database::pdo();
        $payload['dbOk'] = true;
        $payload['dbVersion'] = (string) $pdo->query('SELECT VERSION()')->fetchColumn();
        $mig = Database::table('schema_migrations');
        $stmt = $pdo->query("SELECT version FROM {$mig} ORDER BY version");
        $payload['migrations'] = $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
        $payload['arayTableCount'] = count(SchemaInstaller::listArayTables($pdo));
        $payload['accounts'] = SchemaInstaller::countAccounts($pdo);
    } catch (Throwable $e) {
        $payload['dbOk'] = false;
        $payload['dbError'] = 'connection_failed';
    }
}

Http::ok($payload);
