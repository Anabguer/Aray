<?php

declare(strict_types=1);

/**
 * Auditoría funcional contra producción Hostalia (HTTP) + conteos MySQL.
 * No limpia datos. No imprime secretos.
 *
 * Uso: php scripts/prod_functional_audit.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/database.local.php';

$base = 'https://intocables13.com/aray/afkacademy/api/v1';
$cookieFile = sys_get_temp_dir() . '/aray_audit_cookies_' . getmypid() . '.txt';
@unlink($cookieFile);

function req(string $method, string $url, ?array $json, string $cookieFile): array
{
    $ch = curl_init($url);
    $headers = ['Accept: application/json'];
    $body = null;
    if ($json !== null) {
        $body = json_encode($json, JSON_UNESCAPED_UNICODE);
        $headers[] = 'Content-Type: application/json';
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    if ($raw === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['http' => 0, 'json' => null, 'error' => $err, 'raw' => ''];
    }
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    $respBody = substr($raw, $headerSize);
    $decoded = json_decode($respBody, true);
    return [
        'http' => $http,
        'json' => is_array($decoded) ? $decoded : null,
        'error' => null,
        'raw' => $respBody,
    ];
}

function line(string $k, $v): void
{
    if (is_array($v) || is_object($v)) {
        echo $k . '=' . json_encode($v, JSON_UNESCAPED_UNICODE) . "\n";
    } else {
        echo $k . '=' . $v . "\n";
    }
}

$pdo = new PDO(
    sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME),
    DB_USER,
    DB_PASSWORD,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

$playerId = (int) $pdo->query("SELECT id FROM arayapp_player_profiles WHERE slug='aray' LIMIT 1")->fetchColumn();
line('player_id', $playerId);

function counts(PDO $pdo, int $playerId): array
{
    $out = [];
    foreach ([
        'sessions' => "SELECT COUNT(*) FROM arayapp_sessions WHERE player_id=:p",
        'session_answers' => "SELECT COUNT(*) FROM arayapp_session_answers sa INNER JOIN arayapp_sessions s ON s.id=sa.session_id WHERE s.player_id=:p",
        'fact_stats' => "SELECT COUNT(*) FROM arayapp_fact_stats WHERE player_id=:p",
        'table_mastery' => "SELECT COUNT(*) FROM arayapp_table_mastery WHERE player_id=:p",
        'crates_all' => "SELECT COUNT(*) FROM arayapp_crates WHERE player_id=:p",
        'crates_pending' => "SELECT COUNT(*) FROM arayapp_crates WHERE player_id=:p AND status IN ('pending_choice','pending_open','pending_claim')",
        'crates_claimed' => "SELECT COUNT(*) FROM arayapp_crates WHERE player_id=:p AND status='claimed'",
        'mission_completions' => "SELECT COUNT(*) FROM arayapp_mission_completions WHERE player_id=:p",
        'authorized_devices' => "SELECT COUNT(*) FROM arayapp_authorized_devices WHERE player_id=:p AND revoked_at IS NULL",
    ] as $k => $sql) {
        $st = $pdo->prepare($sql);
        $st->execute([':p' => $playerId]);
        $out[$k] = (int) $st->fetchColumn();
    }
    $prog = $pdo->prepare('SELECT xp, coins, best_streak, crate_pity_without FROM arayapp_player_progress WHERE player_id=:p');
    $prog->execute([':p' => $playerId]);
    $out['progress'] = $prog->fetch() ?: null;
    $goal = $pdo->prepare("SELECT target_points, daily_cap, daily_points, daily_date, points_total, goal_status FROM arayapp_reward_goals WHERE player_id=:p AND goal_code='robux-500'");
    $goal->execute([':p' => $playerId]);
    $out['reward_goal'] = $goal->fetch() ?: null;
    $epoch = $pdo->query("SELECT setting_value FROM arayapp_app_settings WHERE setting_key='sync_epoch'")->fetchColumn();
    $out['sync_epoch'] = $epoch;
    return $out;
}

$pre = counts($pdo, $playerId);
line('PRE', $pre);

$csrf = req('GET', $base . '/csrf.php', null, $cookieFile);
line('csrf_http', $csrf['http']);
$csrfToken = is_array($csrf['json']) ? (string) ($csrf['json']['csrf'] ?? '') : '';

$login = req('POST', $base . '/auth/adult-login.php', [
    'csrf' => $csrfToken,
    'login' => ARAY_SEED_ADULT_LOGIN,
    'password' => ARAY_SEED_ADULT_PASSWORD,
], $cookieFile);
line('adult_login_http', $login['http']);
line('adult_login_ok', $login['json']['ok'] ?? false);
if (is_array($login['json']) && isset($login['json']['csrf'])) {
    $csrfToken = (string) $login['json']['csrf'];
}

$authMe = req('GET', $base . '/auth/me.php', null, $cookieFile);
line('me_after_login_http', $authMe['http']);
line('me_role', $authMe['json']['role'] ?? null);

$authorize = req('POST', $base . '/auth/device-authorize.php', [
    'csrf' => $csrfToken,
    'playerId' => $playerId,
    'deviceLabel' => 'audit-' . date('His'),
], $cookieFile);
line('device_authorize_http', $authorize['http']);
line('device_authorize_ok', $authorize['json']['ok'] ?? false);
if (is_array($authorize['json']) && isset($authorize['json']['csrf'])) {
    $csrfToken = (string) $authorize['json']['csrf'];
}

$child = req('POST', $base . '/auth/child-enter.php', [
    'csrf' => $csrfToken,
    'playerId' => $playerId,
], $cookieFile);
line('child_enter_http', $child['http']);
line('child_enter_ok', $child['json']['ok'] ?? false);
if (is_array($child['json']) && isset($child['json']['csrf'])) {
    $csrfToken = (string) $child['json']['csrf'];
}

$progress = req('GET', $base . '/players/progress.php?playerId=' . $playerId, null, $cookieFile);
line('progress_http', $progress['http']);
$snap = $progress['json']['progress'] ?? null;
line('progress_xp', is_array($snap) ? ($snap['xp'] ?? null) : null);
line('progress_syncEpoch', is_array($snap) ? ($snap['syncEpoch'] ?? null) : null);
line('progress_reward_target', is_array($snap) ? ($snap['reward']['targetPoints'] ?? null) : null);
line('progress_reward_dailyCap', is_array($snap) ? ($snap['reward']['dailyCap'] ?? null) : null);
$syncEpoch = is_array($snap) && isset($snap['syncEpoch']) ? (int) $snap['syncEpoch'] : 2;
if (is_array($progress['json']) && isset($progress['json']['csrf'])) {
    $csrfToken = (string) $progress['json']['csrf'];
}

$sessionId = 'audit' . gmdate('YmdHis') . bin2hex(random_bytes(4));
$answers = [];
// 5 hechos distintos tabla 3 (anti-repetición: hechos únicos)
foreach ([[3,1],[3,2],[3,4],[3,5],[3,6]] as $i => $pair) {
    [$a, $b] = $pair;
    $answers[] = [
        'attemptId' => $sessionId . '-a' . $i,
        'a' => $a,
        'b' => $b,
        'selected' => $a * $b,
        'firstTry' => true,
        'attemptN' => 1,
        'elapsedMs' => 800,
    ];
}

$payload = [
    'csrf' => $csrfToken,
    'sessionId' => $sessionId,
    'mode' => 'train',
    'tables' => [3],
    'answers' => $answers,
    'clientStartedAt' => gmdate('Y-m-d H:i:s'),
    'syncEpoch' => $syncEpoch,
    'isMissionOfDay' => true,
    'missionCode' => 'audit-mission-' . gmdate('His'),
];

$submit1 = req('POST', $base . '/players/session-submit.php', $payload, $cookieFile);
line('submit1_http', $submit1['http']);
line('submit1_ok', $submit1['json']['ok'] ?? false);
line('submit1_idempotent', $submit1['json']['idempotent'] ?? null);
line('submit1_xp', $submit1['json']['xpEarned'] ?? null);
line('submit1_coins', $submit1['json']['coinsEarned'] ?? null);
line('submit1_energyGranted', $submit1['json']['energyGranted'] ?? null);
$cratePending = $submit1['json']['progress']['crates']['pending'] ?? null;
line('submit1_crate_status', is_array($cratePending) ? ($cratePending['status'] ?? null) : null);
line('submit1_crate_completion', is_array($cratePending) ? ($cratePending['completionId'] ?? null) : null);
if (is_array($submit1['json']) && isset($submit1['json']['csrf'])) {
    $csrfToken = (string) $submit1['json']['csrf'];
}

$payload['csrf'] = $csrfToken;
$submit2 = req('POST', $base . '/players/session-submit.php', $payload, $cookieFile);
line('submit2_http', $submit2['http']);
line('submit2_idempotent', $submit2['json']['idempotent'] ?? null);
line('submit2_xp', $submit2['json']['xpEarned'] ?? null);
if (is_array($submit2['json']) && isset($submit2['json']['csrf'])) {
    $csrfToken = (string) $submit2['json']['csrf'];
}

// Stale epoch
$stale = $payload;
$stale['csrf'] = $csrfToken;
$stale['sessionId'] = $sessionId . 'stale';
$stale['syncEpoch'] = max(0, $syncEpoch - 1);
$staleResp = req('POST', $base . '/players/session-submit.php', $stale, $cookieFile);
line('stale_epoch_http', $staleResp['http']);
line('stale_epoch_error', $staleResp['json']['error'] ?? null);
if (is_array($staleResp['json']) && isset($staleResp['json']['csrf'])) {
    $csrfToken = (string) $staleResp['json']['csrf'];
}

// Crate flow if pending
$crateNote = null;
if (is_array($cratePending) && isset($cratePending['completionId'])) {
    $cid = (string) $cratePending['completionId'];
    $status = (string) ($cratePending['status'] ?? '');
    if ($status === 'pending_choice') {
        $ch = req('POST', $base . '/players/crate-choose.php', [
            'csrf' => $csrfToken,
            'completionId' => $cid,
            'chosenIndex' => 0,
        ], $cookieFile);
        line('crate_choose_http', $ch['http']);
        if (is_array($ch['json']) && isset($ch['json']['csrf'])) {
            $csrfToken = (string) $ch['json']['csrf'];
        }
        $status = (string) (($ch['json']['pending']['status'] ?? 'pending_open'));
    }
    $op = req('POST', $base . '/players/crate-open.php', [
        'csrf' => $csrfToken,
        'completionId' => $cid,
    ], $cookieFile);
    line('crate_open_http', $op['http']);
    if (is_array($op['json']) && isset($op['json']['csrf'])) {
        $csrfToken = (string) $op['json']['csrf'];
    }
    $cl = req('POST', $base . '/players/crate-claim.php', [
        'csrf' => $csrfToken,
        'completionId' => $cid,
    ], $cookieFile);
    line('crate_claim_http', $cl['http']);
    line('crate_claim_applied', $cl['json']['applied'] ?? null);
    $crateNote = $cl['json']['adjustmentNote'] ?? null;
}

// Anti-repetition: same 5 facts twice in one session should not double energy vs unique
$sessionIdRep = 'auditrep' . gmdate('His') . bin2hex(random_bytes(3));
$dupAnswers = [];
for ($i = 0; $i < 5; $i++) {
    $dupAnswers[] = [
        'attemptId' => $sessionIdRep . '-d' . $i,
        'a' => 2,
        'b' => 2,
        'selected' => 4,
        'firstTry' => true,
        'attemptN' => 1,
        'elapsedMs' => 500,
    ];
}
$rep = req('POST', $base . '/players/session-submit.php', [
    'csrf' => $csrfToken,
    'sessionId' => $sessionIdRep,
    'mode' => 'train',
    'tables' => [2],
    'answers' => $dupAnswers,
    'syncEpoch' => $syncEpoch,
], $cookieFile);
line('antirepeat_http', $rep['http']);
line('antirepeat_energyRequested', $rep['json']['energyRequested'] ?? null);
line('antirepeat_energyGranted', $rep['json']['energyGranted'] ?? null);
// Expected requested = 1 (unique fact 2x2) for train weight 1

$post = counts($pdo, $playerId);
line('POST', $post);
line('DELTA_sessions', $post['sessions'] - $pre['sessions']);
line('DELTA_answers', $post['session_answers'] - $pre['session_answers']);
line('DELTA_missions', $post['mission_completions'] - $pre['mission_completions']);
line('DELTA_crates', $post['crates_all'] - $pre['crates_all']);
line('sessionId_used', $sessionId);
line('mission_code_used', $payload['missionCode']);

@unlink($cookieFile);
echo "DONE\n";
