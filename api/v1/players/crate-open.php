<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

if (Session::role() !== 'child' || Session::playerId() === null) {
    Http::error(401, 'unauthorized', 'Se requiere sesión infantil.');
}

$playerId = (int) Session::playerId();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$completionId = isset($body['completionId']) && is_string($body['completionId'])
    ? trim($body['completionId'])
    : '';
if ($completionId === '') {
    Http::error(400, 'invalid_completion_id', 'completionId requerido.');
}

$pending = CrateService::open($playerId, $completionId);

Http::ok([
    'pending' => $pending,
    'progress' => ProgressRepository::getSnapshot($playerId),
    'csrf' => Csrf::token(),
]);
