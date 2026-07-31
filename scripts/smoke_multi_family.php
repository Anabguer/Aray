<?php

declare(strict_types=1);

/**
 * Smoke multi-familia: registro, login, device por cuenta, PIN scoped, child-enter hermanos.
 * php scripts/smoke_multi_family.php
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
    $port = 8777;
    $proc = proc_open(
        sprintf('php -S %s:%d -t %s', $host, $port, escapeshellarg($root)),
        [['pipe', 'r'], ['file', $root . '/tmp-php-out.txt', 'w'], ['file', $root . '/tmp-php-err.txt', 'w']],
        $pipes,
        $root
    );
    usleep(600000);

    $cookieA = $root . '/tmp-mf-a.txt';
    $cookieB = $root . '/tmp-mf-b.txt';
    @unlink($cookieA);
    @unlink($cookieB);

    $http = static function (string $cookie, string $method, string $path, ?array $body = null) use ($host, $port): array {
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

    $suffix = substr(bin2hex(random_bytes(3)), 0, 6);
    $login = 'fam' . $suffix;

    $c = $http($cookieB, 'GET', '/api/v1/csrf.php');
    $csrf = $c['json']['csrf'] ?? '';
    check('csrf', is_string($csrf) && $csrf !== '');

    $reg = $http($cookieB, 'POST', '/api/v1/auth/register.php', [
        'csrf' => $csrf,
        'login' => $login,
        'password' => 'Secreto123!',
        'displayName' => 'Prima Demo',
        'pin' => '2468',
        'children' => [
            ['displayName' => 'Luis', 'courseId' => 'primary-3'],
            ['displayName' => 'Ana', 'courseId' => 'primary-4'],
        ],
    ]);
    check('register http', $reg['code'] === 200, 'code=' . $reg['code'] . ' ' . ($reg['json']['message'] ?? ''));
    check('register adult', ($reg['json']['role'] ?? '') === 'adult');
    check('register device', !empty($reg['json']['device']['authorized']));
    $players = $reg['json']['players'] ?? [];
    check('register 2 kids', is_array($players) && count($players) === 2, 'n=' . (is_array($players) ? count($players) : 0));

    $slugLuis = (string) ($players[0]['slug'] ?? '');
    $slugAna = (string) ($players[1]['slug'] ?? '');
    $csrf2 = $reg['json']['csrf'] ?? $csrf;

    $enterAna = $http($cookieB, 'POST', '/api/v1/auth/child-enter.php', [
        'csrf' => $csrf2,
        'playerSlug' => $slugAna,
    ]);
    check('child-enter hermano', $enterAna['code'] === 200 && ($enterAna['json']['player']['slug'] ?? '') === $slugAna);

    $csrf3 = $enterAna['json']['csrf'] ?? $csrf2;
    $pinOk = $http($cookieB, 'POST', '/api/v1/auth/pin-login.php', [
        'csrf' => $csrf3,
        'pin' => '2468',
    ]);
    check('PIN familia B', $pinOk['code'] === 200 && ($pinOk['json']['account']['displayName'] ?? '') === 'Prima Demo');

    // Neni intacta
    $verify = SchemaInstaller::verifyStructure(Database::pdo());
    check('seed Neni sigue', !empty($verify['neni']['id']));
    check('seed Aray sigue', !empty($verify['aray']['id']));

    // Cookie limpia: PIN sin device debe fallar con login_required
    $cEmpty = $http($cookieA, 'GET', '/api/v1/csrf.php');
    $csrfA = $cEmpty['json']['csrf'] ?? '';
    $pinAlone = $http($cookieA, 'POST', '/api/v1/auth/pin-login.php', [
        'csrf' => $csrfA,
        'pin' => '2468',
    ]);
    check(
        'PIN sin device → login_required',
        $pinAlone['code'] === 401 && (($pinAlone['json']['error'] ?? '') === 'login_required'),
        ($pinAlone['json']['error'] ?? '') . ' code=' . $pinAlone['code']
    );

    $loginB = $http($cookieA, 'POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $pinAlone['json']['csrf'] ?? $csrfA,
        'login' => $login,
        'password' => 'Secreto123!',
    ]);
    // need fresh csrf after failed pin
    $cA2 = $http($cookieA, 'GET', '/api/v1/csrf.php');
    $loginB = $http($cookieA, 'POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $cA2['json']['csrf'] ?? $csrfA,
        'login' => $login,
        'password' => 'Secreto123!',
    ]);
    check('adult-login auto-device', $loginB['code'] === 200 && !empty($loginB['json']['device']['authorized']));

    if (is_resource($proc)) {
        proc_terminate($proc);
        proc_close($proc);
    }
    @unlink($cookieA);
    @unlink($cookieB);
} catch (Throwable $e) {
    check('smoke', false, $e->getMessage());
}

echo $failed === 0 ? "\nSmoke multi-familia: OK\n" : "\nSmoke multi-familia: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
