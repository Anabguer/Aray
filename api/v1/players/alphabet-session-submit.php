<?php

declare(strict_types=1);

/**
 * POST /api/v1/players/alphabet-session-submit.php
 *
 * Partida ABC → dominio por modo, letras, XP, monedas, energía.
 */

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

if (Session::role() !== 'child' || Session::playerId() === null) {
    Http::error(401, 'unauthorized', 'Se requiere sesión infantil.');
}

$playerId = (int) Session::playerId();

$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$result = AlphabetSessionService::submit($playerId, $body);
$result['progress'] = ProgressRepository::getSnapshot($playerId);
$result['csrf'] = Csrf::token();

Http::ok($result);
