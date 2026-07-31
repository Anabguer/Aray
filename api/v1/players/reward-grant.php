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

// Tope = dailyCap escala ×10 (100). El motor recorta por capacidad diaria real.
if ($sessionId === '' || strlen($sessionId) > 64 || $requested < 0 || $requested > 100) {
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

$pdo = Database::pdo();
$sessTable = Database::table('sessions');
$now = MadridTime::utcNowString();

// Stub de sesión para idempotencia (energy_granted) — mismo patrón que tablas/ABC.
$existing = $pdo->prepare("SELECT id, player_id, energy_granted FROM {$sessTable} WHERE id = :id LIMIT 1");
$existing->execute([':id' => $sessionId]);
$row = $existing->fetch();
if (is_array($row)) {
    if ((int) ($row['player_id'] ?? 0) !== $playerId) {
        Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
    }
    if ((int) ($row['energy_granted'] ?? 0) > 0) {
        Http::ok([
            'granted' => 0,
            'reward' => RewardCycleService::publicRewardState($playerId),
            'cyclesCompleted' => [],
            'skippedDuplicate' => true,
        ]);
    }
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

$grant = RewardCycleService::grantPoints($playerId, $requested, $sessionId, $applied);
$granted = (int) ($grant['granted'] ?? 0);

$pdo->prepare(
    "UPDATE {$sessTable}
     SET energy_requested = :req, energy_granted = :gr, mode = :mode
     WHERE id = :id AND player_id = :p"
)->execute([
    ':req' => $requested,
    ':gr' => max($granted, 1), // marca idempotencia aunque el tope diario conceda 0
    ':mode' => $mode,
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

Http::ok($grant);
