<?php

declare(strict_types=1);

/**
 * Pruebas de humo Fase 1 (CLI).
 * Sin BD configurada: solo syntax + MadridTime.
 * Con BD + semilla: auth, dispositivo, progress.
 *
 * Uso: php scripts/phase1_smoke.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/bootstrap.php';

$failed = 0;
function check(string $label, bool $ok, string $detail = ''): void
{
    global $failed;
    if ($ok) {
        echo "[OK] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } else {
        echo "[FAIL] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
        $failed++;
    }
}

check('PHP >= 7.4', version_compare(PHP_VERSION, '7.4.0', '>='), PHP_VERSION);
check('ext pdo_mysql', extension_loaded('pdo_mysql'));
check('ext json', extension_loaded('json'));
check('ext session', extension_loaded('session'));
check('Europe/Madrid', in_array('Europe/Madrid', DateTimeZone::listIdentifiers(), true));

$playable = MadridTime::playableDate();
check('playableDate Y-m-d', (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $playable), $playable);

$utc = MadridTime::utcNowString();
check('utcNowString', (bool) preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $utc), $utc);

// 22:30 UTC en julio = 00:30 CEST (UTC+2) → día jugable siguiente en Madrid
$july = new DateTimeImmutable('2026-07-15 22:30:00', new DateTimeZone('UTC'));
check('DST verano fecha Madrid', MadridTime::playableDate($july) === '2026-07-16', MadridTime::playableDate($july));
// 22:30 UTC en enero = 23:30 CET (UTC+1) → misma fecha civil
$jan = new DateTimeImmutable('2026-01-15 22:30:00', new DateTimeZone('UTC'));
check('DST invierno fecha Madrid', MadridTime::playableDate($jan) === '2026-01-15', MadridTime::playableDate($jan));

$dbReady = defined('DB_USER') && DB_USER !== 'CHANGE_ME' && defined('DB_PASSWORD') && DB_PASSWORD !== 'CHANGE_ME';
if (!$dbReady) {
    echo "\nBD no configurada: se omiten pruebas de integración.\n";
    echo "Copia includes/database.example.php → includes/database.local.php y ejecuta install_once.\n";
    exit($failed > 0 ? 1 : 0);
}

try {
    $pdo = Database::pdo();
    $ver = (string) $pdo->query('SELECT VERSION()')->fetchColumn();
    check('DB connection', true, $ver);

    $mig = Database::table('schema_migrations');
    $rows = $pdo->query("SELECT version FROM {$mig}")->fetchAll(PDO::FETCH_COLUMN);
    check('migration 001 aplicada', in_array('001_initial_schema', $rows ?: [], true));

    $accounts = Database::table('accounts');
    $neni = $pdo->query("SELECT id, login FROM {$accounts} WHERE login = 'neni' LIMIT 1")->fetch();
    check('semilla Neni', is_array($neni), is_array($neni) ? 'id=' . $neni['id'] : 'falta install_once');

    $players = Database::table('player_profiles');
    $aray = $pdo->query("SELECT id, slug FROM {$players} WHERE slug = 'aray' LIMIT 1")->fetch();
    check('semilla Aray', is_array($aray));

    if (is_array($aray)) {
        $snap = ProgressRepository::getSnapshot((int) $aray['id']);
        check('progress xp int', isset($snap['xp']) && is_int($snap['xp']));
        check('progress reward meta 300', ($snap['reward']['targetPoints'] ?? 0) === 300);
        check('progress playableDate', ($snap['playableDate'] ?? '') === MadridTime::playableDate());
    }

    // Hash token device roundtrip
    $raw = bin2hex(random_bytes(32));
    $hash = hash('sha256', $raw);
    check('token hash 64 hex', strlen($hash) === 64);
} catch (Throwable $e) {
    check('DB integration', false, $e->getMessage());
}

echo $failed === 0 ? "\nFase 1 smoke: OK\n" : "\nFase 1 smoke: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
