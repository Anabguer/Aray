<?php

declare(strict_types=1);

/**
 * Pruebas de integración PIN + panel adulto + ciclos de premio.
 * Uso: php scripts/phase_pin_adult_integration.php
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
    echo "Falta database.local.php\n";
    exit(1);
}

require_once $root . '/includes/bootstrap.php';

try {
    SchemaInstaller::ensure(true);
    $verify = SchemaInstaller::verifyStructure(Database::pdo());
    check('estructura tras 002', $verify['ok'], 'tables=' . $verify['tableCount']);
    check('tablas ciclo/actividad', in_array(Database::table('reward_cycles'), $verify['tables'], true)
        && in_array(Database::table('daily_activity'), $verify['tables'], true));

    $pdo = Database::pdo();
    $playerId = (int) $verify['aray']['id'];
    $accountId = (int) $verify['neni']['id'];

    $acc = $pdo->query('SELECT adult_pin_hash FROM ' . Database::table('accounts') . ' WHERE id=' . $accountId)->fetch();
    $pl = $pdo->query('SELECT child_pin_hash FROM ' . Database::table('player_profiles') . ' WHERE id=' . $playerId)->fetch();
    check('PIN adulto hasheado', is_array($acc) && !empty($acc['adult_pin_hash']));
    check('PIN infantil hasheado', is_array($pl) && !empty($pl['child_pin_hash']));
    check('PIN no en texto plano BD', is_array($acc) && strpos((string) $acc['adult_pin_hash'], '0322') === false
        && is_array($pl) && strpos((string) $pl['child_pin_hash'], '1322') === false);

    // Ciclos: grant con sobrante
    RewardCycleService::ensureGoalAndCycle($playerId);
    $pdo->prepare('DELETE FROM ' . Database::table('reward_cycles') . ' WHERE player_id = ?')->execute([$playerId]);
    $pdo->prepare(
        'UPDATE ' . Database::table('reward_goals') . '
         SET points_total=0, daily_points=0, daily_date=NULL, goal_status="active", current_cycle_number=1
         WHERE player_id=?'
    )->execute([$playerId]);
    RewardCycleService::ensureGoalAndCycle($playerId);

    // Simular cerca del objetivo
    $cycles = Database::table('reward_cycles');
    $pdo->prepare("UPDATE {$cycles} SET points_toward = 495 WHERE player_id = ? AND cycle_number = 1")
        ->execute([$playerId]);
    $pdo->prepare(
        'UPDATE ' . Database::table('reward_goals') . ' SET daily_date = ?, daily_points = 0 WHERE player_id = ?'
    )->execute([MadridTime::playableDate(), $playerId]);

    $grant = RewardCycleService::grantPoints($playerId, 10, 'test-session-surplus', []);
    check('grant concede 10', $grant['granted'] === 10, 'granted=' . $grant['granted']);
    $state = RewardCycleService::publicRewardState($playerId);
    check('premio 1 pendiente', ($state['pendingPrize']['cycleNumber'] ?? null) === 1);
    check('sobrante en ciclo 2', (int) $state['pointsTotal'] === 5 && (int) $state['currentCycleNumber'] === 2, json_encode([
        'points' => $state['pointsTotal'],
        'cycle' => $state['currentCycleNumber'],
    ]));

    $pendingId = (int) $state['pendingPrize']['id'];
    $delivered = RewardCycleService::markDelivered(
        $accountId,
        $playerId,
        $pendingId,
        500,
        MadridTime::playableDate(),
        'Prueba integración'
    );
    check('entrega OK', ($delivered['pendingPrize'] ?? null) === null);
    check('historial entregado', count($delivered['deliveredPrizes'] ?? []) >= 1);

    $row = $pdo->query("SELECT status FROM {$cycles} WHERE id = {$pendingId}")->fetch();
    check('no re-entregar', is_array($row) && $row['status'] === 'delivered');

    $voided = RewardCycleService::voidDelivery($accountId, $playerId, $pendingId, 'Entrega de prueba anulada');
    check('anulación vuelve a pendiente', ($voided['pendingPrize']['id'] ?? null) === $pendingId);

    if (!function_exists('curl_init')) {
        check('ext curl', false);
        echo "\nPIN/adulto integración: {$failed} fallos\n";
        exit($failed > 0 ? 1 : 0);
    }

    $host = '127.0.0.1';
    $port = 8772;
    $proc = proc_open(
        sprintf('php -S %s:%d -t %s', $host, $port, escapeshellarg($root)),
        [['pipe', 'r'], ['file', $root . '/tmp-php-out.txt', 'w'], ['file', $root . '/tmp-php-err.txt', 'w']],
        $pipes,
        $root
    );
    usleep(600000);

    $cookieClean = $root . '/tmp-pin-cookies-clean.txt';
    $cookieAuth = $root . '/tmp-pin-cookies-auth.txt';
    @unlink($cookieClean);
    @unlink($cookieAuth);

    $http = static function (string $method, string $path, ?array $body, string $cookieFile) use ($host, $port): array {
        $ch = curl_init("http://{$host}:{$port}{$path}");
        $headers = ['Accept: application/json'];
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_COOKIEJAR => $cookieFile,
            CURLOPT_COOKIEFILE => $cookieFile,
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
        return ['code' => $code, 'json' => is_array($json) ? $json : null];
    };

    $c = $http('GET', '/api/v1/csrf.php', null, $cookieClean);
    $csrf = $c['json']['csrf'] ?? '';

    // PIN sin dispositivo autorizado
    $pinFail = $http('POST', '/api/v1/auth/pin-login.php', [
        'csrf' => $csrf,
        'pin' => defined('ARAY_SEED_CHILD_PIN') ? ARAY_SEED_CHILD_PIN : '0000',
    ], $cookieClean);
    check(
        'PIN rechazado sin dispositivo',
        $pinFail['code'] === 401 && ($pinFail['json']['error'] ?? '') === 'device_required',
        'code=' . $pinFail['code']
    );

    // Login adulto + autorizar
    $c2 = $http('GET', '/api/v1/csrf.php', null, $cookieAuth);
    $csrf2 = $c2['json']['csrf'] ?? '';
    $login = $http('POST', '/api/v1/auth/adult-login.php', [
        'csrf' => $csrf2,
        'login' => 'neni',
        'password' => (string) ARAY_SEED_ADULT_PASSWORD,
    ], $cookieAuth);
    check('adult-login', $login['code'] === 200 && ($login['json']['role'] ?? '') === 'adult');

    $csrf3 = $login['json']['csrf'] ?? $csrf2;
    $dev = $http('POST', '/api/v1/auth/device-authorize.php', [
        'csrf' => $csrf3,
        'playerId' => $playerId,
        'deviceLabel' => 'Test PIN',
    ], $cookieAuth);
    check('device-authorize', $dev['code'] === 200);

    // Logout sesión (dispositivo permanece)
    $csrf4 = $dev['json']['csrf'] ?? $csrf3;
    $http('POST', '/api/v1/auth/adult-logout.php', ['csrf' => $csrf4], $cookieAuth);

    $c3 = $http('GET', '/api/v1/csrf.php', null, $cookieAuth);
    $csrf5 = $c3['json']['csrf'] ?? '';

    $childPin = defined('ARAY_SEED_CHILD_PIN') && preg_match('/^\d{4}$/', (string) ARAY_SEED_CHILD_PIN)
        ? (string) ARAY_SEED_CHILD_PIN
        : '';
    $adultPin = defined('ARAY_SEED_ADULT_PIN') && preg_match('/^\d{4}$/', (string) ARAY_SEED_ADULT_PIN)
        ? (string) ARAY_SEED_ADULT_PIN
        : '';

    if ($childPin !== '') {
        $pinChild = $http('POST', '/api/v1/auth/pin-login.php', [
            'csrf' => $csrf5,
            'pin' => $childPin,
        ], $cookieAuth);
        check('PIN infantil → child', $pinChild['code'] === 200 && ($pinChild['json']['role'] ?? '') === 'child');

        // Niño no puede overview adulto
        $blocked = $http('GET', '/api/v1/adult/overview.php?playerId=' . $playerId, null, $cookieAuth);
        check('niño bloqueado en /adult', $blocked['code'] === 401 || $blocked['code'] === 403, 'code=' . $blocked['code']);

        $csrf6 = $pinChild['json']['csrf'] ?? $csrf5;
        $http('POST', '/api/v1/auth/adult-logout.php', ['csrf' => $csrf6], $cookieAuth);
    } else {
        check('PIN infantil configurado', false, 'falta ARAY_SEED_CHILD_PIN');
    }

    $c4 = $http('GET', '/api/v1/csrf.php', null, $cookieAuth);
    $csrf7 = $c4['json']['csrf'] ?? '';
    if ($adultPin !== '') {
        $pinAdult = $http('POST', '/api/v1/auth/pin-login.php', [
            'csrf' => $csrf7,
            'pin' => $adultPin,
        ], $cookieAuth);
        check('PIN adulto → adult', $pinAdult['code'] === 200 && ($pinAdult['json']['role'] ?? '') === 'adult');

        $ov = $http('GET', '/api/v1/adult/overview.php?playerId=' . $playerId, null, $cookieAuth);
        check('overview adulto', $ov['code'] === 200 && isset($ov['json']['summary']));
    } else {
        check('PIN adulto configurado', false, 'falta ARAY_SEED_ADULT_PIN');
    }

    // PIN incorrecto genérico
    $c5 = $http('GET', '/api/v1/csrf.php', null, $cookieAuth);
    $http('POST', '/api/v1/auth/adult-logout.php', ['csrf' => $c5['json']['csrf'] ?? ''], $cookieAuth);
    $c6 = $http('GET', '/api/v1/csrf.php', null, $cookieAuth);
    $bad = $http('POST', '/api/v1/auth/pin-login.php', [
        'csrf' => $c6['json']['csrf'] ?? '',
        'pin' => '9999',
    ], $cookieAuth);
    check(
        'PIN incorrecto genérico',
        $bad['code'] === 401 && (($bad['json']['message'] ?? '') === 'Ese PIN no es correcto.'),
        ($bad['json']['message'] ?? '')
    );

    if (is_resource($proc)) {
        proc_terminate($proc);
        proc_close($proc);
    }
    @unlink($cookieClean);
    @unlink($cookieAuth);
} catch (Throwable $e) {
    check('integración', false, $e->getMessage());
}

echo $failed === 0 ? "\nPIN/adulto integración: OK\n" : "\nPIN/adulto integración: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
