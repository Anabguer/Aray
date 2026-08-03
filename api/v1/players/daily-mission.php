<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

if (Session::role() !== 'child' || Session::playerId() === null) {
    Http::error(401, 'unauthorized', 'Se requiere sesión infantil.');
}

$playerId = Session::playerId();

$incoming = [
    'date' => isset($body['date']) && is_string($body['date']) ? $body['date'] : null,
    'progress' => isset($body['progress']) && is_array($body['progress']) ? $body['progress'] : [],
    'challengeDone' => !empty($body['challengeDone']),
];

$merged = DailyMissionService::mergeFromClient($playerId, $incoming);

Http::ok([
    'dailyMission' => $merged,
    'csrf' => Csrf::token(),
]);
