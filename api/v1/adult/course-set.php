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
$courseId = isset($body['courseId']) && is_string($body['courseId']) ? $body['courseId'] : '';
$mode = isset($body['courseMode']) && is_string($body['courseMode']) ? $body['courseMode'] : 'standard';

if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

$result = PlayerCourseService::setCourse($accountId, $playerId, $courseId, $mode);
Http::ok(array_merge($result, ['csrf' => Csrf::token()]));
