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
$index = isset($body['chosenIndex']) ? (int) $body['chosenIndex'] : -1;
if ($completionId === '' || $index < 0 || $index > 1) {
    Http::error(400, 'invalid_choice', 'Elección de caja no válida.');
}

$pending = CrateService::choose($playerId, $completionId, $index);

Http::ok([
    'pending' => $pending,
    'progress' => ProgressRepository::getSnapshot($playerId),
    'csrf' => Csrf::token(),
]);
