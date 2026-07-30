<?php

declare(strict_types=1);

/**
 * Probe CLI: intenta recuperar un sessionId con un playerId distinto.
 * Esperado: Http::error 403 session_forbidden (y NO "LEAK_OK").
 *
 * Uso: php scripts/phase2_ownership_probe.php <sessionId> <otherPlayerId>
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

$sessionId = $argv[1] ?? '';
$otherId = isset($argv[2]) ? (int) $argv[2] : 0;
if ($sessionId === '' || $otherId < 1) {
    fwrite(STDERR, "Uso: php scripts/phase2_ownership_probe.php <sessionId> <otherPlayerId>\n");
    exit(1);
}

// Si ownership falla correctamente, Http::error hace exit y no llegamos a LEAK_OK.
SessionService::submit($otherId, [
    'sessionId' => $sessionId,
    'mode' => 'train',
    'tables' => [2],
    'answers' => [],
]);

echo "LEAK_OK\n";
exit(0);
