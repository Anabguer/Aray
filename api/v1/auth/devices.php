<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

$accountId = AuthService::requireAdult();
$playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

$devices = AuthService::listDevices($accountId, $playerId);
Http::ok(['devices' => $devices, 'csrf' => Csrf::token()]);
