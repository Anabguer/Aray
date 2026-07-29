<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Session::start();
Http::ok([
    'csrf' => Csrf::token(),
    'session' => Session::snapshot(),
    'device' => AuthService::deviceStatus(),
]);
