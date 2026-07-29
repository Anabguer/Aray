<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Session::start();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));
Session::destroy();
Session::start();
Http::ok(['csrf' => Csrf::token()]);
