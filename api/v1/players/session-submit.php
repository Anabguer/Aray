<?php

declare(strict_types=1);

/**
 * POST /api/v1/players/session-submit.php
 *
 * Envía el resumen de una partida para que el servidor recalcule y persista.
 * Requiere sesión infantil activa (cookie ARAYSESSID + rol child).
 * Idempotente: reenviar el mismo sessionId devuelve el resultado original.
 *
 * Request JSON:
 * {
 *   "csrf": "...",
 *   "sessionId": "uuid-o-similar",   // máx 64 chars, alfanumérico/-/_
 *   "mode": "train",                 // learn|train|challenge|match|misses|random
 *   "tables": [3, 7],                // tablas practicadas (1-10)
 *   "answers": [                     // lista de respuestas individuales
 *     {
 *       "attemptId": "unique-id",
 *       "factKey": "3x7",
 *       "a": 3, "b": 7,
 *       "selected": 21,
 *       "correct": true,
 *       "firstTry": true,
 *       "attemptN": 1,
 *       "elapsedMs": 1234
 *     }
 *   ],
 *   "clientStartedAt": "2026-07-29 18:00:00"  // UTC, opcional
 * }
 *
 * Response 200:
 * {
 *   "idempotent": false,
 *   "sessionId": "...",
 *   "score": 85,
 *   "bestStreak": 7,
 *   "xpEarned": 110,
 *   "coinsEarned": 11,
 *   "processedAt": "2026-07-29 18:01:05",
 *   "progress": { ... snapshot completo ... },
 *   "csrf": "..."
 * }
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

$result = SessionService::submit($playerId, $body);

// Incluir snapshot actualizado y nuevo CSRF en la respuesta
$result['progress'] = ProgressRepository::getSnapshot($playerId);
$result['csrf']     = Csrf::token();

Http::ok($result);
