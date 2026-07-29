<?php

declare(strict_types=1);

/**
 * Instalación de un solo uso: migraciones + semilla Neni + perfil Aray.
 *
 * CLI:
 *   php scripts/install_once.php
 *
 * Requiere includes/database.local.php con ARAY_INSTALL_TOKEN y ARAY_SEED_* .
 * Si ya existen cuentas, aborta (no reinstala).
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Instalación solo por CLI.\n";
    exit(1);
}

function cli_fail(string $msg): void
{
    fwrite(STDERR, $msg . "\n");
    exit(1);
}

if (!defined('DB_USER') || DB_USER === 'CHANGE_ME' || !defined('DB_PASSWORD') || DB_PASSWORD === 'CHANGE_ME') {
    cli_fail('Configura includes/database.local.php (DB_*).');
}

if (!defined('ARAY_INSTALL_TOKEN') || ARAY_INSTALL_TOKEN === 'CHANGE_INSTALL_TOKEN') {
    cli_fail('Define ARAY_INSTALL_TOKEN en database.local.php.');
}

$tokenArg = null;
foreach ($argv as $arg) {
    if (strpos($arg, '--token=') === 0) {
        $tokenArg = substr($arg, 8);
    }
}
if ($tokenArg === null) {
    cli_fail('Uso: php scripts/install_once.php --token=TU_TOKEN');
}
if (!hash_equals((string) ARAY_INSTALL_TOKEN, $tokenArg)) {
    cli_fail('Token de instalación no válido.');
}

$seedLogin = defined('ARAY_SEED_ADULT_LOGIN') ? (string) ARAY_SEED_ADULT_LOGIN : 'neni';
$seedPassword = defined('ARAY_SEED_ADULT_PASSWORD') ? (string) ARAY_SEED_ADULT_PASSWORD : '';
$seedDisplay = defined('ARAY_SEED_ADULT_DISPLAY') ? (string) ARAY_SEED_ADULT_DISPLAY : 'Neni';
$playerSlug = defined('ARAY_SEED_PLAYER_SLUG') ? (string) ARAY_SEED_PLAYER_SLUG : 'aray';
$playerDisplay = defined('ARAY_SEED_PLAYER_DISPLAY') ? (string) ARAY_SEED_PLAYER_DISPLAY : 'Aray';

if ($seedPassword === '' || $seedPassword === 'CHANGE_SEED_PASSWORD') {
    cli_fail('Define ARAY_SEED_ADULT_PASSWORD (contraseña real de Neni) en database.local.php.');
}
if (mb_strlen($seedPassword) < 10) {
    cli_fail('ARAY_SEED_ADULT_PASSWORD debe tener al menos 10 caracteres.');
}

echo "Ejecutando migraciones...\n";
passthru('php ' . escapeshellarg($root . '/scripts/migrate.php'), $migrateCode);
if ($migrateCode !== 0) {
    cli_fail('Migraciones fallaron.');
}

$pdo = Database::pdo();
$accounts = Database::table('accounts');
$count = (int) $pdo->query("SELECT COUNT(*) FROM {$accounts}")->fetchColumn();
if ($count > 0) {
    cli_fail('Ya hay cuentas. Instalación abortada (un solo uso).');
}

$loginNorm = mb_strtolower(trim($seedLogin));
$hash = password_hash($seedPassword, PASSWORD_DEFAULT);
$now = MadridTime::utcNowString();

$pdo->beginTransaction();
try {
    $pdo->prepare(
        "INSERT INTO {$accounts} (login, password_hash, display_name, is_active, created_at, updated_at)
         VALUES (:l, :h, :d, 1, :c, :u)"
    )->execute([
        ':l' => $loginNorm,
        ':h' => $hash,
        ':d' => $seedDisplay,
        ':c' => $now,
        ':u' => $now,
    ]);
    $accountId = (int) $pdo->lastInsertId();

    $players = Database::table('player_profiles');
    $pdo->prepare(
        "INSERT INTO {$players} (slug, display_name, is_active, created_at, updated_at)
         VALUES (:s, :d, 1, :c, :u)"
    )->execute([
        ':s' => mb_strtolower($playerSlug),
        ':d' => $playerDisplay,
        ':c' => $now,
        ':u' => $now,
    ]);
    $playerId = (int) $pdo->lastInsertId();

    $ap = Database::table('account_players');
    $pdo->prepare(
        "INSERT INTO {$ap} (account_id, player_id, relation_role, created_at)
         VALUES (:a, :p, 'owner', :c)"
    )->execute([':a' => $accountId, ':p' => $playerId, ':c' => $now]);

    $prog = Database::table('player_progress');
    $pdo->prepare(
        "INSERT INTO {$prog} (player_id, xp, coins, created_at, updated_at)
         VALUES (:p, 0, 0, :c, :u)"
    )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

    $goals = Database::table('reward_goals');
    $pdo->prepare(
        "INSERT INTO {$goals}
         (player_id, goal_code, reward_label, target_points, daily_cap, points_total, goal_status, created_at, updated_at)
         VALUES (:p, 'robux-500', '500 Robux', 300, 10, 0, 'active', :c, :u)"
    )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

    $audit = Database::table('adult_actions');
    $pdo->prepare(
        "INSERT INTO {$audit} (account_id, player_id, action, meta_json, created_at)
         VALUES (:a, :p, 'install_seed', :m, :c)"
    )->execute([
        ':a' => $accountId,
        ':p' => $playerId,
        ':m' => json_encode(['adult' => $loginNorm, 'player' => $playerSlug], JSON_UNESCAPED_UNICODE),
        ':c' => $now,
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    cli_fail('Error semilla: ' . $e->getMessage());
}

echo "Instalación OK.\n";
echo "Cuenta adulta: {$loginNorm} (Neni)\n";
echo "Perfil: {$playerSlug} (id={$playerId})\n";
echo "IMPORTANTE: elimina o cambia ARAY_INSTALL_TOKEN y no dejes ARAY_SEED_ADULT_PASSWORD en claro más tiempo del necesario.\n";
