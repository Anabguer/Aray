<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$code = isset($body['code']) && is_string($body['code']) ? $body['code'] : '';
$slug = isset($body['playerSlug']) && is_string($body['playerSlug']) ? $body['playerSlug'] : 'aray';
$label = isset($body['deviceLabel']) && is_string($body['deviceLabel']) ? $body['deviceLabel'] : 'Dispositivo';

if (mb_strlen($code) > 32 || mb_strlen($slug) > 32) {
    Http::error(400, 'invalid_code', 'Código no válido.');
}

$result = AuthService::redeemTempCode($code, $slug, $label);
Http::ok($result);
