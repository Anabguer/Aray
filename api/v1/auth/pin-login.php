<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$pin = isset($body['pin']) && is_string($body['pin']) ? $body['pin'] : '';
if (strlen($pin) > 16) {
    Http::error(401, 'invalid_pin', 'PIN incorrecto');
}

$result = PinAuthService::loginWithAdultPin($pin);
Http::ok($result);
