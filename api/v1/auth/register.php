<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$children = $body['children'] ?? [];
if (!is_array($children)) {
    $children = [];
}

$result = FamilyRegisterService::register([
    'login' => isset($body['login']) && is_string($body['login']) ? $body['login'] : '',
    'password' => isset($body['password']) && is_string($body['password']) ? $body['password'] : '',
    'displayName' => isset($body['displayName']) && is_string($body['displayName']) ? $body['displayName'] : '',
    'pin' => isset($body['pin']) && is_string($body['pin']) ? $body['pin'] : '',
    'children' => $children,
]);

Http::ok($result);
