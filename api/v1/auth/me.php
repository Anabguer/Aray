<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Session::start();

$out = Session::snapshot();
$out['csrf'] = Csrf::token();

// me.php no debe colgar el arranque de la app si MySQL falla o va lento.
try {
    $out['device'] = AuthService::deviceStatus();
} catch (Throwable $e) {
    $out['device'] = ['authorized' => false, 'error' => 'db_unavailable'];
}

try {
    if (($out['role'] ?? null) === 'adult' && Session::accountId() !== null) {
        $out['players'] = AuthService::playersForAccount(Session::accountId());
    }

    // Sesión infantil: enriquecer avatar/curso desde BD (la sesión PHP no guarda avatarUrl).
    if (($out['role'] ?? null) === 'child' && Session::playerId() !== null) {
        $row = AuthService::findPlayerById(Session::playerId());
        if (is_array($row)) {
            $out['player'] = [
                'id' => (int) $row['id'],
                'slug' => (string) $row['slug'],
                'displayName' => (string) $row['display_name'],
                'avatarUrl' => AvatarService::urlFromCode(
                    isset($row['avatar_code']) ? (string) $row['avatar_code'] : null
                ),
            ];
        }
    }
} catch (Throwable $e) {
    // Mantener snapshot de sesión aunque falle el enriquecimiento.
    if (!isset($out['players'])) {
        $out['players'] = [];
    }
}

Http::ok($out);
