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
$cycleId = isset($body['cycleId']) ? (int) $body['cycleId'] : 0;
$reason = isset($body['reason']) && is_string($body['reason']) ? $body['reason'] : '';

if ($playerId < 1 || $cycleId < 1) {
    Http::error(400, 'invalid_request', 'Datos no válidos.');
}

$reward = RewardCycleService::voidDelivery($accountId, $playerId, $cycleId, $reason);
Http::ok(['reward' => $reward]);
