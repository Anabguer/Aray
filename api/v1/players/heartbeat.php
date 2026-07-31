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
$active = !isset($body['active']) || (bool) $body['active'];

try {
    $result = ActivityService::heartbeat($playerId, [
        'active' => $active,
        'mode' => isset($body['mode']) && is_string($body['mode']) ? $body['mode'] : null,
    ]);
    Http::ok(['day' => $result]);
} catch (Throwable $e) {
    Http::error(500, 'heartbeat_failed', 'No se pudo registrar la presencia.', [
        'where' => basename($e->getFile()) . ':' . $e->getLine(),
    ]);
}
