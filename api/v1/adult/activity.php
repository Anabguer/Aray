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

$range = isset($_GET['range']) && is_string($_GET['range']) ? $_GET['range'] : '7d';
$from = isset($_GET['from']) && is_string($_GET['from']) ? $_GET['from'] : null;
$to = isset($_GET['to']) && is_string($_GET['to']) ? $_GET['to'] : null;
$mode = isset($_GET['mode']) && is_string($_GET['mode']) ? $_GET['mode'] : null;
$table = isset($_GET['table']) ? (int) $_GET['table'] : null;

Http::ok(AdultDashboardService::activity($accountId, $playerId, $range, $from, $to, $mode, $table));
