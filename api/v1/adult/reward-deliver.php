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
$robux = isset($body['robuxAmount']) ? (int) $body['robuxAmount'] : 500;
$note = isset($body['note']) && is_string($body['note']) ? $body['note'] : '';
$date = isset($body['deliveryDate']) && is_string($body['deliveryDate'])
    ? $body['deliveryDate']
    : MadridTime::playableDate();

if ($playerId < 1 || $cycleId < 1) {
    Http::error(400, 'invalid_request', 'Datos de entrega no válidos.');
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    Http::error(400, 'invalid_date', 'Fecha de entrega no válida.');
}

$reward = RewardCycleService::markDelivered($accountId, $playerId, $cycleId, $robux, $date, $note);
Http::ok(['reward' => $reward]);
