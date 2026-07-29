<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$accountId = AuthService::requireAdult();
$playerId = isset($body['playerId']) ? (int) $body['playerId'] : 0;
$label = isset($body['deviceLabel']) && is_string($body['deviceLabel']) ? $body['deviceLabel'] : 'Dispositivo';

if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

$result = AuthService::authorizeDevice($accountId, $playerId, $label);
Http::ok($result);
