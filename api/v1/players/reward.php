<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

if (Session::role() !== 'child' || Session::playerId() === null) {
    // Adulto también puede leer el estado de premio del perfil vinculado
    if (Session::role() === 'adult' && Session::accountId() !== null) {
        $playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
        if ($playerId < 1) {
            Http::error(400, 'invalid_player', 'Perfil no válido.');
        }
        AuthService::requireAdultLinkedToPlayer($playerId);
        Http::ok(['reward' => RewardCycleService::publicRewardState($playerId)]);
    }
    Http::error(401, 'unauthorized', 'Se requiere autorización.');
}

Http::ok(['reward' => RewardCycleService::publicRewardState(Session::playerId())]);
