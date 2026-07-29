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
$sessionId = isset($body['sessionId']) && is_string($body['sessionId']) ? $body['sessionId'] : '';
$applied = isset($body['appliedSessionIds']) && is_array($body['appliedSessionIds'])
    ? array_values(array_filter($body['appliedSessionIds'], 'is_string'))
    : [];

if ($sessionId === '' || $requested < 0 || $requested > 50) {
    Http::error(400, 'invalid_grant', 'Petición de puntos no válida.');
}

$grant = RewardCycleService::grantPoints($playerId, $requested, $sessionId, $applied);

// Registrar actividad asociada si viene el resumen
if (!empty($body['activity']) && is_array($body['activity'])) {
    $activity = $body['activity'];
    $activity['sessionId'] = $sessionId;
    $activity['rewardPoints'] = $grant['granted'];
    ActivityService::recordSessionEvent($playerId, $activity);
}

Http::ok($grant);
