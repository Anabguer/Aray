<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

$playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
$slug = isset($_GET['playerSlug']) && is_string($_GET['playerSlug']) ? $_GET['playerSlug'] : '';

if ($playerId < 1 && $slug !== '') {
    $player = AuthService::findPlayerBySlug($slug);
    if ($player === null) {
        Http::error(404, 'not_found', 'Perfil no encontrado.');
    }
    $playerId = (int) $player['id'];
}

if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

AuthService::assertCanReadProgress($playerId);
$progress = ProgressRepository::getSnapshot($playerId);

Http::ok([
    'progress' => $progress,
    'csrf' => Csrf::token(),
]);
