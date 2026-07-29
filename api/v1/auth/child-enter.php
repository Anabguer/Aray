<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$slug = isset($body['playerSlug']) && is_string($body['playerSlug']) ? $body['playerSlug'] : null;
$result = AuthService::childEnterWithDeviceCookie($slug);
Http::ok($result);
