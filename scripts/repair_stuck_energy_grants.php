<?php

declare(strict_types=1);

/**
 * Repara grants de energía marcados energy_granted=1 con requested>1
 * (bug: cliente enviaba sessionId en appliedSessionIds → granted 0 + marca falsa).
 *
 * Uso: php scripts/repair_stuck_energy_grants.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

$pdo = Database::pdo();
$sessTable = Database::table('sessions');

$rows = $pdo->query(
    "SELECT id, player_id, mode, energy_requested, energy_granted
     FROM {$sessTable}
     WHERE energy_requested > 1 AND energy_granted = 1
     ORDER BY processed_at ASC"
)->fetchAll();

echo 'stuck=' . count($rows) . PHP_EOL;

foreach ($rows as $row) {
    $sessionId = (string) $row['id'];
    $playerId = (int) $row['player_id'];
    $requested = (int) $row['energy_requested'];

    $pdo->prepare(
        "UPDATE {$sessTable} SET energy_granted = 0 WHERE id = :id AND player_id = :p"
    )->execute([':id' => $sessionId, ':p' => $playerId]);

    $grant = RewardCycleService::grantPoints($playerId, $requested, $sessionId, null);
    $granted = (int) ($grant['granted'] ?? 0);

    $pdo->prepare(
        "UPDATE {$sessTable}
         SET energy_requested = :req, energy_granted = :gr
         WHERE id = :id AND player_id = :p"
    )->execute([
        ':req' => $requested,
        ':gr' => max($granted, 1),
        ':id' => $sessionId,
        ':p' => $playerId,
    ]);

    echo json_encode([
        'sessionId' => $sessionId,
        'playerId' => $playerId,
        'mode' => $row['mode'],
        'requested' => $requested,
        'granted' => $granted,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}

echo "DONE\n";
