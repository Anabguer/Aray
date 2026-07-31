<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$accountId = AuthService::requireAdult();

$csrf = $_POST['csrf'] ?? null;
if (!is_string($csrf)) {
    $body = Http::jsonRequest();
    $csrf = Csrf::fromRequest($body);
}
Csrf::requireValid(is_string($csrf) ? $csrf : null);

$playerId = isset($_POST['playerId']) ? (int) $_POST['playerId'] : 0;
if ($playerId < 1 && isset($_GET['playerId'])) {
    $playerId = (int) $_GET['playerId'];
}
if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Falta el perfil del niño.');
}

if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
    Http::error(400, 'upload_missing', 'Adjunta una imagen.');
}

$result = AvatarService::uploadForPlayer($accountId, $playerId, $_FILES['avatar']);
Http::ok([
    'avatarCode' => $result['avatarCode'],
    'avatarUrl' => $result['avatarUrl'],
    'playerId' => $playerId,
    'csrf' => Csrf::token(),
]);
