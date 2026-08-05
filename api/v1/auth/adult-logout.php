<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Session::start();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

// Olvidar dispositivo: si no, AuthGate sigue con cookie y no deja llegar a /access.
AuthService::forgetCurrentDevice();

Session::destroy();
Session::start();
Http::ok(['csrf' => Csrf::token()]);
