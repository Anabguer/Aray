<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET', 'POST']);
Http::requireDbConfigured();
Session::start();

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
    if ($playerId < 1) {
        Http::error(400, 'invalid_player', 'Perfil no válido.');
    }
    $accountId = AuthService::requireAdultLinkedToPlayer($playerId);
    Http::ok([
        'playerId' => $playerId,
        'activityAssignments' => PlayerCourseService::listAssignments($playerId),
        'csrf' => Csrf::token(),
        'accountId' => $accountId,
    ]);
}

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$accountId = AuthService::requireAdult();
$playerId = isset($body['playerId']) ? (int) $body['playerId'] : 0;
$assignments = isset($body['assignments']) && is_array($body['assignments']) ? $body['assignments'] : null;

if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}
if ($assignments === null) {
    Http::error(400, 'invalid_assignments', 'Falta el mapa de asignaciones.');
}

$result = PlayerCourseService::setAssignments($accountId, $playerId, $assignments);
Http::ok(array_merge($result, ['csrf' => Csrf::token()]));
