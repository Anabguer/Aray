<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$login = isset($body['login']) && is_string($body['login']) ? $body['login'] : '';
$password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

if (mb_strlen($login) > 64 || mb_strlen($password) > 200) {
    Http::error(400, 'invalid_credentials', 'No se pudo iniciar sesión.');
}

$result = AuthService::adultLogin($login, $password);
Http::ok($result);
