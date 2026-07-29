<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Session::start();

$out = Session::snapshot();
$out['device'] = AuthService::deviceStatus();
$out['csrf'] = Csrf::token();

if (($out['role'] ?? null) === 'adult' && Session::accountId() !== null) {
    $out['players'] = AuthService::playersForAccount(Session::accountId());
}

Http::ok($out);
