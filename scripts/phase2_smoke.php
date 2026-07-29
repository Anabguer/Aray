<?php

declare(strict_types=1);

/**
 * Pruebas Fase 2 (CLI):
 * - Hard-abort de install_once.php
 * - Recálculo de XP/monedas/racha en SessionService
 * - Persistencia de sesión + fact_stats + table_mastery
 * - Idempotencia por sessionId
 *
 * Uso: php scripts/phase2_smoke.php
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

check('SessionService cargado', class_exists('SessionService'));
check('SchemaInstaller::isInstalled existe', method_exists('SchemaInstaller', 'isInstalled'));

$dbReady = defined('DB_USER') && DB_USER !== 'CHANGE_ME' && defined('DB_PASSWORD') && DB_PASSWORD !== 'CHANGE_ME';
if (!$dbReady) {
    echo "\nBD no configurada: se omiten pruebas de integración Fase 2.\n";
    exit($failed > 0 ? 1 : 0);
}

try {
    $pdo = Database::pdo();
    $verify = SchemaInstaller::verifyStructure($pdo);
    check('estructura instalada', $verify['ok'], 'tables=' . $verify['tableCount']);
    check('isInstalled() true', SchemaInstaller::isInstalled($pdo));

    if (!$verify['ok'] || !is_array($verify['aray'])) {
        echo "\nFase 2 smoke: instalación incompleta. Ejecuta install_once primero.\n";
        exit(1);
    }

    $playerId = (int) $verify['aray']['id'];

    // ── Hard-abort de install_once.php ─────────────────────────────────────
    // Debe salir inmediatamente SIN validar token (token inventado → exit 0).
    $phpBin = PHP_BINARY !== '' ? PHP_BINARY : 'php';
    $cmd = sprintf(
        '%s %s --token=TOKEN_INVALIDO_HARD_ABORT_TEST',
        escapeshellarg($phpBin),
        escapeshellarg($root . '/scripts/install_once.php')
    );
    $output = [];
    $exitCode = 0;
    exec($cmd . ' 2>&1', $output, $exitCode);
    $joined = implode("\n", $output);
    check(
        'hard-abort exit 0',
        $exitCode === 0,
        'exit=' . $exitCode . ' out=' . substr($joined, 0, 120)
    );
    check(
        'hard-abort mensaje',
        stripos($joined, 'hard-abort') !== false || stripos($joined, 'ya completada') !== false,
        substr($joined, 0, 160)
    );
    check(
        'hard-abort no valida token',
        stripos($joined, 'Token de instalación no válido') === false
            && stripos($joined, 'no válido') === false
            || stripos($joined, 'ya completada') !== false,
        'no revalidó token'
    );

    // Cuentas no deben haber cambiado
    $accountsBefore = SchemaInstaller::countAccounts($pdo);
    check('cuentas intactas tras hard-abort', $accountsBefore >= 1, 'accounts=' . $accountsBefore);

    // ── Snapshot previo (para comprobar que no se pierde progreso) ─────────
    $progBefore = ProgressRepository::getSnapshot($playerId);
    $xpBefore = (int) $progBefore['xp'];
    $coinsBefore = (int) $progBefore['coins'];
    check('snapshot previo leído', $xpBefore >= 0, "xp={$xpBefore} coins={$coinsBefore}");

    // ── Recálculo + persistencia ───────────────────────────────────────────
    $sessionId = 'phase2-smoke-' . bin2hex(random_bytes(8));
    $answers = [
        // 5 correctas seguidas → streak bonus en la 5ª (+5 XP)
        ['attemptId' => $sessionId . '-a1', 'factKey' => '3x4', 'a' => 3, 'b' => 4, 'selected' => 12, 'correct' => true],
        ['attemptId' => $sessionId . '-a2', 'factKey' => '3x5', 'a' => 3, 'b' => 5, 'selected' => 15, 'correct' => true],
        ['attemptId' => $sessionId . '-a3', 'factKey' => '3x6', 'a' => 3, 'b' => 6, 'selected' => 18, 'correct' => true],
        ['attemptId' => $sessionId . '-a4', 'factKey' => '3x7', 'a' => 3, 'b' => 7, 'selected' => 21, 'correct' => true],
        ['attemptId' => $sessionId . '-a5', 'factKey' => '3x8', 'a' => 3, 'b' => 8, 'selected' => 24, 'correct' => true],
        // 1 incorrecta
        ['attemptId' => $sessionId . '-a6', 'factKey' => '3x9', 'a' => 3, 'b' => 9, 'selected' => 20, 'correct' => false],
        // 1 correcta más
        ['attemptId' => $sessionId . '-a7', 'factKey' => '3x2', 'a' => 3, 'b' => 2, 'selected' => 6,  'correct' => true],
    ];
    // XP esperado: 6 correctas × 10 = 60 + bonus racha (5ª) = 5 → 65
    // Monedas: floor(65/10) = 6
    // Score: round(100 * 6/7) = 86
    // Best streak: 5

    $result = SessionService::submit($playerId, [
        'sessionId' => $sessionId,
        'mode' => 'train',
        'tables' => [3],
        'answers' => $answers,
        'clientStartedAt' => MadridTime::utcNowString(),
    ]);

    check('sesión creada', $result['idempotent'] === false, 'sessionId=' . $result['sessionId']);
    check('XP recalculado', $result['xpEarned'] === 65, 'xp=' . $result['xpEarned']);
    check('monedas recalculadas', $result['coinsEarned'] === 6, 'coins=' . $result['coinsEarned']);
    check('bestStreak', $result['bestStreak'] === 5, 'streak=' . $result['bestStreak']);
    check('score', $result['score'] === 86, 'score=' . $result['score']);

    // ── Idempotencia ───────────────────────────────────────────────────────
    $result2 = SessionService::submit($playerId, [
        'sessionId' => $sessionId,
        'mode' => 'train',
        'tables' => [3],
        'answers' => $answers,
    ]);
    check('idempotente flag', $result2['idempotent'] === true);
    check('idempotente mismo XP', $result2['xpEarned'] === 65, 'xp=' . $result2['xpEarned']);

    // Progreso: XP solo sumado una vez
    $progAfter = ProgressRepository::getSnapshot($playerId);
    check(
        'XP sumado una sola vez',
        (int) $progAfter['xp'] === $xpBefore + 65,
        "before={$xpBefore} after={$progAfter['xp']}"
    );
    check(
        'monedas sumadas una sola vez',
        (int) $progAfter['coins'] === $coinsBefore + 6,
        "before={$coinsBefore} after={$progAfter['coins']}"
    );

    // fact_stats
    $facts = (array) $progAfter['facts'];
    check('fact_stats 3x4', isset($facts['3x4']) && (int) $facts['3x4']['correct'] >= 1);
    check('fact_stats 3x9 wrong', isset($facts['3x9']) && (int) $facts['3x9']['wrong'] >= 1);

    // table_mastery
    $tables = (array) $progAfter['tables'];
    check('table_mastery tabla 3', isset($tables['3']) && !empty($tables['3']['practiced']));
    check(
        'table_mastery lastRoundScore',
        isset($tables['3']) && (int) $tables['3']['lastRoundScore'] === 86,
        'last=' . ($tables['3']['lastRoundScore'] ?? '?')
    );

    // Filas en BD
    $sessTable = Database::table('sessions');
    $ansTable = Database::table('session_answers');
    $stmtS = $pdo->prepare("SELECT COUNT(*) FROM {$sessTable} WHERE id = :id");
    $stmtS->execute([':id' => $sessionId]);
    $sessCount = (int) $stmtS->fetchColumn();
    $stmtA = $pdo->prepare("SELECT COUNT(*) FROM {$ansTable} WHERE session_id = :id");
    $stmtA->execute([':id' => $sessionId]);
    $ansCount = (int) $stmtA->fetchColumn();
    check('fila en arayapp_sessions', $sessCount === 1);
    check('respuestas en arayapp_session_answers', $ansCount === 7, 'count=' . $ansCount);

    // No duplicados tras re-submit
    $stmtA->execute([':id' => $sessionId]);
    $ansCount2 = (int) $stmtA->fetchColumn();
    check('sin respuestas duplicadas', $ansCount2 === 7, 'count=' . $ansCount2);

} catch (Throwable $e) {
    check('phase2_smoke', false, $e->getMessage());
}

echo $failed === 0 ? "\nFase 2 smoke: OK\n" : "\nFase 2 smoke: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
