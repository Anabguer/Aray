<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

Session::start();
if (Session::role() !== 'child' || Session::playerId() === null) {
    Http::error(401, 'unauthorized', 'Se requiere sesión infantil.');
}

$playerId = Session::playerId();
$requested = isset($body['requestedPoints']) ? (int) $body['requestedPoints'] : 0;
$sessionId = isset($body['sessionId']) && is_string($body['sessionId']) ? trim($body['sessionId']) : '';
$applied = isset($body['appliedSessionIds']) && is_array($body['appliedSessionIds'])
    ? array_values(array_filter($body['appliedSessionIds'], 'is_string'))
    : [];

// Tope misión = dailyCap (100). Extras (caja/logro/levelup) pueden bypass.
if ($sessionId === '' || strlen($sessionId) > 64 || $requested < 0 || $requested > 200) {
    Http::error(400, 'invalid_grant', 'Petición de puntos no válida.');
}

$mode = 'play';
if (!empty($body['activity']) && is_array($body['activity'])) {
    $rawMode = $body['activity']['mode'] ?? null;
    if (is_string($rawMode) && $rawMode !== '') {
        $mode = substr(preg_replace('/[^a-z0-9_\-]/i', '', $rawMode) ?? 'play', 0, 16);
    }
}
if ($mode === '') {
    $mode = 'play';
}

$ignoreDailyCap = !empty($body['ignoreDailyCap'])
    || in_array($mode, ['achievement', 'levelup', 'crate'], true)
    || strpos($sessionId, 'crate-energy-') === 0
    || strpos($sessionId, 'achievement-') === 0
    || strpos($sessionId, 'levelup-') === 0;

$xpEarned = isset($body['xpEarned']) ? (int) $body['xpEarned'] : 0;
if ($xpEarned < 0) {
    $xpEarned = 0;
}
if ($xpEarned > 500) {
    $xpEarned = 500;
}

$pdo = Database::pdo();
$sessTable = Database::table('sessions');
$now = MadridTime::utcNowString();

// Stub de sesión para idempotencia (energy_granted) — mismo patrón que tablas/ABC.
$existing = $pdo->prepare(
    "SELECT id, player_id, energy_granted, xp_earned FROM {$sessTable} WHERE id = :id LIMIT 1"
);
$existing->execute([':id' => $sessionId]);
$row = $existing->fetch();
$prevXp = 0;
if (is_array($row)) {
    if ((int) ($row['player_id'] ?? 0) !== $playerId) {
        Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
    }
    if ((int) ($row['energy_granted'] ?? 0) > 0) {
        Http::ok([
            'granted' => 0,
            'xpEarned' => 0,
            'reward' => RewardCycleService::publicRewardState($playerId),
            'cyclesCompleted' => [],
            'skippedDuplicate' => true,
            'achievements' => [
                'claimedIds' => AchievementService::claimedIds($playerId),
            ],
            'stats' => AchievementService::statsForPlayer($playerId),
        ]);
    }
    $prevXp = (int) ($row['xp_earned'] ?? 0);
} else {
    $pdo->prepare(
        "INSERT INTO {$sessTable}
         (id, player_id, mode, tables_json, score, best_streak,
          xp_earned, coins_earned, energy_requested, energy_granted,
          personal_best, is_mission_of_day, client_started_at,
          processed_at, rewards_applied)
         VALUES
         (:id, :pid, :mode, '[]', 0, 0,
          0, 0, 0, 0,
          0, 0, NULL, :now, 1)"
    )->execute([
        ':id' => $sessionId,
        ':pid' => $playerId,
        ':mode' => $mode,
        ':now' => $now,
    ]);
}

$grant = RewardCycleService::grantPoints($playerId, $requested, $sessionId, $applied, $ignoreDailyCap);
$granted = (int) ($grant['granted'] ?? 0);

// XP de actividades laterales (calc/spell/clocks/money): una sola vez por sessionId.
$applyXp = ($prevXp === 0 && $xpEarned > 0) ? $xpEarned : 0;
if ($applyXp > 0) {
    $progTable = Database::table('player_progress');
    $pdo->prepare(
        "INSERT IGNORE INTO {$progTable}
         (player_id, xp, coins, best_streak, best_challenge_score,
          last_practice_at, created_at, updated_at)
         VALUES (:p, 0, 0, 0, 0, :now, :now2, :now3)"
    )->execute([':p' => $playerId, ':now' => $now, ':now2' => $now, ':now3' => $now]);
    $pdo->prepare(
        "UPDATE {$progTable}
         SET xp = xp + :xp,
             last_practice_at = :now,
             updated_at = :now2
         WHERE player_id = :p"
    )->execute([
        ':xp' => $applyXp,
        ':now' => $now,
        ':now2' => $now,
        ':p' => $playerId,
    ]);
}

$pdo->prepare(
    "UPDATE {$sessTable}
     SET energy_requested = :req, energy_granted = :gr, mode = :mode,
         xp_earned = GREATEST(xp_earned, :xp)
     WHERE id = :id AND player_id = :p"
)->execute([
    ':req' => $requested,
    ':gr' => max($granted, 1), // marca idempotencia aunque el tope diario conceda 0
    ':mode' => $mode,
    ':xp' => $applyXp,
    ':id' => $sessionId,
    ':p' => $playerId,
]);

if (!empty($body['activity']) && is_array($body['activity'])) {
    $activity = $body['activity'];
    $activity['sessionId'] = $sessionId;
    $activity['rewardPoints'] = $granted;
    $activity['mode'] = $mode;
    ActivityService::recordSessionEvent($playerId, $activity);
}

// Logros: persistir claim aunque el tope diario dé 0 energía.
if ($mode === 'achievement') {
    $aid = AchievementService::achievementIdFromSession($sessionId, $playerId);
    if ($aid !== null) {
        AchievementService::claim($playerId, $aid, $granted);
    }
}

$statsOut = null;
if (!empty($body['statsDelta']) && is_array($body['statsDelta'])) {
    $statsOut = AchievementService::mergeStatsDelta($playerId, $body['statsDelta']);
}

$payload = $grant;
$payload['xpEarned'] = $applyXp;
$payload['achievements'] = [
    'claimedIds' => AchievementService::claimedIds($playerId),
];
if ($statsOut !== null) {
    $payload['stats'] = $statsOut;
}

Http::ok($payload);
