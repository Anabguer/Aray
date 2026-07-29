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
$deviceId = isset($body['deviceId']) ? (int) $body['deviceId'] : 0;

if ($playerId < 1 || $deviceId < 1) {
    Http::error(400, 'invalid_request', 'Datos no válidos.');
}

AuthService::revokeDevice($accountId, $playerId, $deviceId);
Http::ok([
    'revoked' => true,
    'deviceId' => $deviceId,
    'devices' => AuthService::listDevices($accountId, $playerId),
    'csrf' => Csrf::token(),
]);
