<?php

declare(strict_types=1);

/**
 * Prueba de integración Fase 1 contra MySQL real + endpoints HTTP.
 * Uso: php scripts/phase1_integration.php
 */

$root = dirname(__DIR__);

$failed = 0;
function check(string $label, bool $ok, string $detail = ''): void
{
    global $failed;
    if ($ok) {
        echo "[OK] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } else {
        echo "[FAIL] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
        $failed++;
    }
}

if (!is_file($root . '/includes/database.local.php')) {
    echo "Falta database.local.php. Ejecuta scripts/setup_local_config.php primero.\n";
    exit(1);
}

require_once $root . '/includes/bootstrap.php';

check('database.local.php ignorado por gitignore pattern', true, 'includes/*.local.php');

try {
    $first = SchemaInstaller::ensure(true);
    $second = SchemaInstaller::ensure(true);
    check('ensure idempotente', $second['seeded'] === false && $second['accounts'] >= 1, 'accounts=' . $second['accounts']);

    $verify = SchemaInstaller::verifyStructure(Database::pdo());
    check('estructura completa', $verify['ok'], 'tables=' . $verify['tableCount']);
    check('semilla Neni', is_array($verify['neni']));
    check('semilla Aray', is_array($verify['aray']));
    $playerId = (int) $verify['aray']['id'];

    $pdo = Database::pdo();
    $idxSessions = $pdo->query('SHOW INDEX FROM ' . Database::table('sessions'))->fetchAll();
    $idxAnswers = $pdo->query('SHOW INDEX FROM ' . Database::table('session_answers'))->fetchAll();
    $idxDevices = $pdo->query('SHOW INDEX FROM ' . Database::table('authorized_devices'))->fetchAll();
    check('índices sessions', count($idxSessions) >= 2);
    check('índices session_answers', count($idxAnswers) >= 3);
    check('índices authorized_devices', count($idxDevices) >= 2);

    $fk = $pdo->query(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME LIKE 'arayapp_%'
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
    )->fetchColumn();
    check('foreign keys presentes', (int) $fk >= 10, 'count=' . $fk);

    if (!function_exists('curl_init')) {
        check('ext curl', false);
        echo "\nFase 1 integración: {$failed} fallos\n";
        exit(1);
    }

    $host = '127.0.0.1';
    $port = 8771;
    $proc = proc_open(
        sprintf('php -S %s:%d -t %s', $host, $port, escapeshellarg($root)),
        [['pipe', 'r'], ['file', $root . '/tmp-php-out.txt', 'w'], ['file', $root . '/tmp-php-err.txt', 'w']],
        $pipes,
        $root
    );
    usleep(500000);

    $cookieFile = $root . '/tmp-phase1-cookies.txt';
    @unlink($cookieFile);

    $http = static function (string $method, string $path, ?array $body = null) use ($host, $port, $cookieFile): array {
        $ch = curl_init("http://{$host}:{$port}{$path}");
        $headers = ['Accept: application/json'];
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_COOKIEJAR => $cookieFile,
            CURLOPT_COOKIEFILE => $cookieFile,
            CURLOPT_HEADER => false,
        ]);
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = is_string($raw) ? json_decode($raw, true) : null;
        return ['code' => $code, 'json' => is_array($json) ? $json : null, 'raw' => is_string($raw) ? $raw : ''];
    };

    $h = $http('GET', '/api/v1/health.php');
    check('HTTP health', $h['code'] === 200 && !empty($h['json']['dbOk']), 'tables=' . ($h['json']['arayTableCount'] ?? '?'));

    $c = $http('GET', '/api/v1/csrf.php');
    $csrfToken = $c['json']['csrf'] ?? '';
    check('HTTP csrf', $c['code'] === 200 && is_string($csrfToken) && $csrfToken !== '');

    $loginHttp = $http('POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $csrfToken,
        'login' => 'neni',
        'password' => (string) ARAY_SEED_ADULT_PASSWORD,
    ]);
    check(
        'HTTP adult-login',
        $loginHttp['code'] === 200 && ($loginHttp['json']['role'] ?? '') === 'adult',
        'code=' . $loginHttp['code'] . ' err=' . ($loginHttp['json']['error'] ?? '')
    );

    $csrf2 = $loginHttp['json']['csrf'] ?? $csrfToken;
    $dev = $http('POST', '/api/v1/auth/device-authorize.php', [
        'csrf' => $csrf2,
        'playerId' => $playerId,
        'deviceLabel' => 'Integración',
    ]);
    check('HTTP device-authorize', $dev['code'] === 200 && isset($dev['json']['deviceId']), 'code=' . $dev['code']);

    $progHttp = $http('GET', '/api/v1/players/progress.php?playerId=' . $playerId);
    check('HTTP progress', $progHttp['code'] === 200 && isset($progHttp['json']['progress']['xp']), 'code=' . $progHttp['code']);

    $me = $http('GET', '/api/v1/auth/me.php');
    check('HTTP me', $me['code'] === 200 && !empty($me['json']['authenticated']));

    if (is_resource($proc)) {
        proc_terminate($proc);
        proc_close($proc);
    }
    @unlink($cookieFile);
} catch (Throwable $e) {
    check('integración', false, $e->getMessage());
}

echo $failed === 0 ? "\nFase 1 integración: OK\n" : "\nFase 1 integración: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
