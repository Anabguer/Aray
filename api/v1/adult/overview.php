<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

$accountId = AuthService::requireAdult();
$playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
if ($playerId < 1) {
    $players = AuthService::playersForAccount($accountId);
    if ($players === []) {
        Http::error(404, 'player_missing', 'No hay perfil vinculado.');
    }
    $playerId = (int) $players[0]['id'];
}

Http::ok(AdultDashboardService::overview($accountId, $playerId));
