<?php

declare(strict_types=1);

/**
 * Integración HTTP Fase 2: session-submit + hard-abort + idempotencia.
 * Uso: php scripts/phase2_integration.php
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

$proc = null;
$cookieFile = $root . '/tmp-phase2-cookies.txt';

try {
    $verify = SchemaInstaller::verifyStructure(Database::pdo());
    check('estructura', $verify['ok'], 'tables=' . $verify['tableCount']);
    if (!$verify['ok'] || !is_array($verify['aray'])) {
        throw new RuntimeException('Instalación incompleta');
    }
    $playerId = (int) $verify['aray']['id'];

    // Hard-abort (sin servidor HTTP)
    $phpBin = PHP_BINARY !== '' ? PHP_BINARY : 'php';
    $installScript = realpath($root . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'install_once.php');
    $out = [];
    $code = 0;
    exec(
        sprintf(
            '%s %s --token=WRONG',
            escapeshellarg($phpBin),
            escapeshellarg($installScript !== false ? $installScript : $root . '/scripts/install_once.php')
        ) . ' 2>&1',
        $out,
        $code
    );
    $joined = implode("\n", $out);
    check('hard-abort install_once', $code === 0 && stripos($joined, 'completada') !== false, substr($joined, 0, 120));

    if (!function_exists('curl_init')) {
        check('ext curl', false);
        echo "\nFase 2 integración: {$failed} fallos\n";
        exit(1);
    }

    $host = '127.0.0.1';
    $port = 8772;
    $proc = proc_open(
        sprintf('php -d output_buffering=0 -S %s:%d -t %s', $host, $port, escapeshellarg($root)),
        [['pipe', 'r'], ['file', $root . '/tmp-php-out.txt', 'w'], ['file', $root . '/tmp-php-err.txt', 'w']],
        $pipes,
        $root
    );
    usleep(600000);

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
            CURLOPT_TIMEOUT => 15,
        ]);
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $raw = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = is_string($raw) ? json_decode($raw, true) : null;
        return ['code' => $httpCode, 'json' => is_array($json) ? $json : null, 'raw' => is_string($raw) ? $raw : ''];
    };

    $c = $http('GET', '/api/v1/csrf.php');
    $csrf = $c['json']['csrf'] ?? '';
    check('csrf', $c['code'] === 200 && $csrf !== '');

    $login = $http('POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $csrf,
        'login' => 'neni',
        'password' => (string) ARAY_SEED_ADULT_PASSWORD,
    ]);
    check('adult-login', $login['code'] === 200, 'code=' . $login['code']);
    $csrf = $login['json']['csrf'] ?? $csrf;

    $dev = $http('POST', '/api/v1/auth/device-authorize.php', [
        'csrf' => $csrf,
        'playerId' => $playerId,
        'deviceLabel' => 'Phase2-Integration',
    ]);
    check('device-authorize', $dev['code'] === 200, 'code=' . $dev['code']);
    $csrf = $dev['json']['csrf'] ?? $csrf;

    // Entrar como niño con cookie de dispositivo
    $enter = $http('POST', '/api/v1/auth/child-enter.php', [
        'csrf' => $csrf,
        'playerSlug' => 'aray',
    ]);
    check('child-enter', $enter['code'] === 200 && ($enter['json']['role'] ?? '') === 'child', 'code=' . $enter['code']);
    $csrf = $enter['json']['csrf'] ?? $csrf;

    $progBefore = $http('GET', '/api/v1/players/progress.php?playerId=' . $playerId);
    $xpBefore = (int) ($progBefore['json']['progress']['xp'] ?? -1);
    check('progress previo', $progBefore['code'] === 200 && $xpBefore >= 0, 'xp=' . $xpBefore);

    $sessionId = 'phase2-http-' . bin2hex(random_bytes(8));
    $payload = [
        'csrf' => $csrf,
        'sessionId' => $sessionId,
        'mode' => 'train',
        'tables' => [4],
        'answers' => [
            ['attemptId' => $sessionId . '-1', 'factKey' => '4x2', 'a' => 4, 'b' => 2, 'selected' => 8,  'correct' => true],
            ['attemptId' => $sessionId . '-2', 'factKey' => '4x3', 'a' => 4, 'b' => 3, 'selected' => 12, 'correct' => true],
            ['attemptId' => $sessionId . '-3', 'factKey' => '4x4', 'a' => 4, 'b' => 4, 'selected' => 16, 'correct' => true],
            ['attemptId' => $sessionId . '-4', 'factKey' => '4x5', 'a' => 4, 'b' => 5, 'selected' => 99, 'correct' => false],
        ],
    ];
    // XP: 3×10 = 30; monedas 3; score 75; streak 3

    $submit = $http('POST', '/api/v1/players/session-submit.php', $payload);
    check(
        'session-submit',
        $submit['code'] === 200 && ($submit['json']['idempotent'] ?? true) === false,
        'code=' . $submit['code'] . ' err=' . ($submit['json']['error'] ?? '') . ' xp=' . ($submit['json']['xpEarned'] ?? '?')
    );
    check('session-submit XP', ($submit['json']['xpEarned'] ?? 0) === 30, 'xp=' . ($submit['json']['xpEarned'] ?? '?'));
    check('session-submit coins', ($submit['json']['coinsEarned'] ?? 0) === 3);
    check('session-submit progress incluido', isset($submit['json']['progress']['xp']));

    $csrf = $submit['json']['csrf'] ?? $csrf;
    $payload['csrf'] = $csrf;
    $resubmit = $http('POST', '/api/v1/players/session-submit.php', $payload);
    check('session-submit idempotente', $resubmit['code'] === 200 && ($resubmit['json']['idempotent'] ?? false) === true);
    check('session-submit idempotente mismo XP', ($resubmit['json']['xpEarned'] ?? 0) === 30);

    $progAfter = $http('GET', '/api/v1/players/progress.php?playerId=' . $playerId);
    $xpAfter = (int) ($progAfter['json']['progress']['xp'] ?? -1);
    check(
        'progreso no duplicado',
        $xpAfter === $xpBefore + 30,
        "before={$xpBefore} after={$xpAfter}"
    );

    // Sin sesión infantil → 401
    @unlink($cookieFile);
    $c2 = $http('GET', '/api/v1/csrf.php');
    $csrf2 = $c2['json']['csrf'] ?? '';
    $noAuth = $http('POST', '/api/v1/players/session-submit.php', [
        'csrf' => $csrf2,
        'sessionId' => 'no-auth-' . bin2hex(random_bytes(4)),
        'mode' => 'train',
        'tables' => [2],
        'answers' => [],
    ]);
    check('session-submit sin auth → 401', $noAuth['code'] === 401, 'code=' . $noAuth['code']);

} catch (Throwable $e) {
    check('integración', false, $e->getMessage());
} finally {
    if (is_resource($proc)) {
        proc_terminate($proc);
        proc_close($proc);
    }
    @unlink($cookieFile);
    // Limpieza extra por si el proceso hijo queda colgado en Windows
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        @exec('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8772 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"');
    }
}

echo $failed === 0 ? "\nFase 2 integración: OK\n" : "\nFase 2 integración: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
