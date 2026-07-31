<?php

declare(strict_types=1);

/**
 * Smoke: login familiar + PIN scoped (dispositivo de la cuenta).
 * php scripts/smoke_adult_pin.php
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

require_once $root . '/includes/bootstrap.php';

try {
    SchemaInstaller::ensure(true);
    PinAuthService::ensurePinHashes(Database::pdo());

    $host = '127.0.0.1';
    $port = 8773;
    $proc = proc_open(
        sprintf('php -S %s:%d -t %s', $host, $port, escapeshellarg($root)),
        [['pipe', 'r'], ['file', $root . '/tmp-php-out.txt', 'w'], ['file', $root . '/tmp-php-err.txt', 'w']],
        $pipes,
        $root
    );
    usleep(500000);

    $cookie = $root . '/tmp-adult-pin-cookies.txt';
    @unlink($cookie);

    $http = static function (string $method, string $path, ?array $body = null) use ($host, $port, $cookie): array {
        $ch = curl_init("http://{$host}:{$port}{$path}");
        $headers = ['Accept: application/json'];
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_COOKIEJAR => $cookie,
            CURLOPT_COOKIEFILE => $cookie,
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

    $c = $http('GET', '/api/v1/csrf.php');
    $csrf = $c['json']['csrf'] ?? '';
    check('csrf', is_string($csrf) && $csrf !== '');

    $blocked = $http('GET', '/api/v1/adult/overview.php');
    check('panel protegido sin sesión', $blocked['code'] === 401 || $blocked['code'] === 403, 'code=' . $blocked['code']);

    $adultPin = defined('ARAY_SEED_ADULT_PIN') ? (string) ARAY_SEED_ADULT_PIN : '';
    $seedLogin = defined('ARAY_SEED_ADULT_LOGIN') ? (string) ARAY_SEED_ADULT_LOGIN : 'neni';
    $seedPassword = defined('ARAY_SEED_ADULT_PASSWORD') ? (string) ARAY_SEED_ADULT_PASSWORD : '';
    check('PIN adulto configurado en local', preg_match('/^\d{4}$/', $adultPin) === 1);
    check('password seed configurada', $seedPassword !== '');

    $pinAlone = $http('POST', '/api/v1/auth/pin-login.php', ['csrf' => $csrf, 'pin' => $adultPin]);
    check(
        'PIN sin device → login_required',
        $pinAlone['code'] === 401 && (($pinAlone['json']['error'] ?? '') === 'login_required'),
        ($pinAlone['json']['error'] ?? '') . ' code=' . $pinAlone['code']
    );

    $cLogin = $http('GET', '/api/v1/csrf.php');
    $login = $http('POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $cLogin['json']['csrf'] ?? $csrf,
        'login' => $seedLogin,
        'password' => $seedPassword,
    ]);
    check('adult-login → adult', $login['code'] === 200 && ($login['json']['role'] ?? '') === 'adult');
    check('adult-login auto-device', !empty($login['json']['device']['authorized']));

    $http('POST', '/api/v1/auth/adult-logout.php', ['csrf' => $login['json']['csrf'] ?? '']);

    // Tras logout sigue la cookie de dispositivo → PIN scoped a Neni
    $c2 = $http('GET', '/api/v1/csrf.php');
    $csrf2 = $c2['json']['csrf'] ?? $csrf;
    $bad = $http('POST', '/api/v1/auth/pin-login.php', ['csrf' => $csrf2, 'pin' => '0000']);
    check(
        'PIN incorrecto',
        $bad['code'] === 401 && (($bad['json']['message'] ?? '') === 'PIN incorrecto'),
        ($bad['json']['message'] ?? '') . ' code=' . $bad['code']
    );
    check('respuesta no revela PIN', strpos($bad['raw'], $adultPin) === false);

    $c3 = $http('GET', '/api/v1/csrf.php');
    $ok = $http('POST', '/api/v1/auth/pin-login.php', [
        'csrf' => $c3['json']['csrf'] ?? $csrf2,
        'pin' => $adultPin,
    ]);
    check('PIN correcto → adult', $ok['code'] === 200 && ($ok['json']['role'] ?? '') === 'adult');
    check('respuesta login sin PIN en claro', strpos($ok['raw'], $adultPin) === false);

    $verify = SchemaInstaller::verifyStructure(Database::pdo());
    $playerId = (int) ($verify['aray']['id'] ?? 0);
    $ov = $http('GET', '/api/v1/adult/overview.php?playerId=' . $playerId);
    check('overview con sesión adulta', $ov['code'] === 200 && isset($ov['json']['summary']));

    $logout = $http('POST', '/api/v1/auth/adult-logout.php', ['csrf' => $ok['json']['csrf'] ?? $csrf2]);
    check('logout', $logout['code'] === 200);

    $blocked2 = $http('GET', '/api/v1/adult/overview.php?playerId=' . $playerId);
    check('panel bloqueado tras logout', $blocked2['code'] === 401 || $blocked2['code'] === 403);

    if (is_resource($proc)) {
        proc_terminate($proc);
        proc_close($proc);
    }
    @unlink($cookie);
} catch (Throwable $e) {
    check('smoke', false, $e->getMessage());
}

echo $failed === 0 ? "\nSmoke PIN adulto: OK\n" : "\nSmoke PIN adulto: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
