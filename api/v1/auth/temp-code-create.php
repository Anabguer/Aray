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
if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

$result = AuthService::createTempCode($accountId, $playerId);
Http::ok(array_merge($result, ['csrf' => Csrf::token()]));
