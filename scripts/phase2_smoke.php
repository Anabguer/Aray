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
    $installScript = realpath($root . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'install_once.php');
    check('install_once.php localizado', is_string($installScript) && is_file($installScript), (string) $installScript);
    $cmd = sprintf(
        '%s %s --token=TOKEN_INVALIDO_HARD_ABORT_TEST',
        escapeshellarg($phpBin),
        escapeshellarg($installScript !== false ? $installScript : $root . '/scripts/install_once.php')
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
        'syncEpoch' => SyncEpochService::current(),
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
        'syncEpoch' => SyncEpochService::current(),
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

    // ── Correctivo: no confiar en correct/factKey del cliente ───────────────
    $xpMid = (int) ProgressRepository::getSnapshot($playerId)['xp'];

    // correct=true pero selected incorrecto → 0 XP
    $sidFakeTrue = 'phase2-fake-true-' . bin2hex(random_bytes(6));
    $rFakeTrue = SessionService::submit($playerId, [
        'sessionId' => $sidFakeTrue,
        'mode' => 'train',
        'tables' => [5],
        'answers' => [[
            'attemptId' => $sidFakeTrue . '-1',
            'factKey' => '5x5',
            'a' => 5,
            'b' => 5,
            'selected' => 99,       // 5×5=25, no 99
            'correct' => true,      // cliente miente
        ]],
    ]);
    check('fake correct=true → 0 XP', $rFakeTrue['xpEarned'] === 0, 'xp=' . $rFakeTrue['xpEarned']);
    check('fake correct=true → score 0', $rFakeTrue['score'] === 0, 'score=' . $rFakeTrue['score']);

    // correct=false pero selected correcto → se recalcula como correcto (+10 XP)
    $sidFakeFalse = 'phase2-fake-false-' . bin2hex(random_bytes(6));
    $rFakeFalse = SessionService::submit($playerId, [
        'sessionId' => $sidFakeFalse,
        'mode' => 'train',
        'tables' => [6],
        'answers' => [[
            'attemptId' => $sidFakeFalse . '-1',
            'factKey' => '6x7',
            'a' => 6,
            'b' => 7,
            'selected' => 42,       // 6×7=42 correcto
            'correct' => false,     // cliente miente
        ]],
    ]);
    check('fake correct=false → 10 XP', $rFakeFalse['xpEarned'] === 10, 'xp=' . $rFakeFalse['xpEarned']);
    check('fake correct=false → score 100', $rFakeFalse['score'] === 100);

    // factKey manipulado se sustituye por canónico (7x3 → 3x7)
    $sidFactKey = 'phase2-factkey-' . bin2hex(random_bytes(6));
    SessionService::submit($playerId, [
        'sessionId' => $sidFactKey,
        'mode' => 'train',
        'tables' => [3],
        'answers' => [[
            'attemptId' => $sidFactKey . '-1',
            'factKey' => 'HACKED',  // manipulado
            'a' => 7,
            'b' => 3,
            'selected' => 21,
            'correct' => false,
        ]],
    ]);
    $stmtFk = $pdo->prepare(
        'SELECT fact_key, correct FROM ' . Database::table('session_answers') . ' WHERE session_id = :id LIMIT 1'
    );
    $stmtFk->execute([':id' => $sidFactKey]);
    $fkRow = $stmtFk->fetch();
    check(
        'factKey canónico 3x7',
        is_array($fkRow) && (string) $fkRow['fact_key'] === '3x7',
        'fk=' . (is_array($fkRow) ? $fkRow['fact_key'] : '?')
    );
    check('factKey manipulado → correct servidor', is_array($fkRow) && (int) $fkRow['correct'] === 1);
    $factsAfter = (array) ProgressRepository::getSnapshot($playerId)['facts'];
    check('fact_stats usa canónico 3x7', isset($factsAfter['3x7']));
    check('fact_stats ignora HACKED', !isset($factsAfter['HACKED']));

    // 0×0 / fuera de catálogo → descartado, 0 XP
    $sidZero = 'phase2-zero-' . bin2hex(random_bytes(6));
    $rZero = SessionService::submit($playerId, [
        'sessionId' => $sidZero,
        'mode' => 'train',
        'tables' => [2],
        'answers' => [[
            'attemptId' => $sidZero . '-1',
            'factKey' => '0x0',
            'a' => 0,
            'b' => 0,
            'selected' => 0,
            'correct' => true,
        ]],
    ]);
    check('0×0 descartado → 0 XP', $rZero['xpEarned'] === 0);

    // Dos tablas con scores distintos → mastery por tabla
    $sidMulti = 'phase2-multi-' . bin2hex(random_bytes(6));
    SessionService::submit($playerId, [
        'sessionId' => $sidMulti,
        'mode' => 'train',
        'tables' => [2, 8],
        'answers' => [
            // Tabla 2: 2/2 correctas → score 100
            ['attemptId' => $sidMulti . '-t2a', 'a' => 2, 'b' => 3, 'selected' => 6,  'correct' => true,  'factKey' => 'x'],
            ['attemptId' => $sidMulti . '-t2b', 'a' => 2, 'b' => 4, 'selected' => 8,  'correct' => true,  'factKey' => 'x'],
            // Tabla 8: 0/2 correctas → score 0
            ['attemptId' => $sidMulti . '-t8a', 'a' => 8, 'b' => 3, 'selected' => 1,  'correct' => true,  'factKey' => 'x'],
            ['attemptId' => $sidMulti . '-t8b', 'a' => 8, 'b' => 4, 'selected' => 2,  'correct' => true,  'factKey' => 'x'],
        ],
    ]);
    $tablesMulti = (array) ProgressRepository::getSnapshot($playerId)['tables'];
    check(
        'mastery tabla 2 score 100',
        isset($tablesMulti['2']) && (int) $tablesMulti['2']['lastRoundScore'] === 100,
        'last=' . ($tablesMulti['2']['lastRoundScore'] ?? '?')
    );
    check(
        'mastery tabla 8 score 0',
        isset($tablesMulti['8']) && (int) $tablesMulti['8']['lastRoundScore'] === 0,
        'last=' . ($tablesMulti['8']['lastRoundScore'] ?? '?')
    );
    check(
        'mastery tabla 2 everMastered',
        !empty($tablesMulti['2']['everMastered'])
    );
    check(
        'mastery tabla 8 NOT everMastered por score global',
        empty($tablesMulti['8']['everMastered']) || (int) $tablesMulti['8']['bestRoundScore'] === 0
    );

    // Ownership: sessionId de Aray no se devuelve a otro playerId
    $otherId = $playerId + 900000; // id inexistente / distinto
    $probeScript = realpath($root . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'phase2_ownership_probe.php');
    $probeCmd = sprintf(
        '%s %s %s %d',
        escapeshellarg($phpBin),
        escapeshellarg($probeScript !== false ? $probeScript : $root . '/scripts/phase2_ownership_probe.php'),
        escapeshellarg($sessionId),
        $otherId
    );
    $probeOut = [];
    $probeCode = 0;
    exec($probeCmd . ' 2>&1', $probeOut, $probeCode);
    $probeJoined = implode("\n", $probeOut);
    check(
        'ownership: session de otro jugador → forbidden',
        stripos($probeJoined, 'session_forbidden') !== false && stripos($probeJoined, 'LEAK_OK') === false,
        substr($probeJoined, 0, 160)
    );

    // Idempotencia del mismo jugador sigue OK tras los correctivos
    $rIdemAgain = SessionService::submit($playerId, [
        'sessionId' => $sessionId,
        'mode' => 'train',
        'tables' => [3],
        'answers' => $answers,
    ]);
    check('idempotencia mismo jugador tras correctivo', $rIdemAgain['idempotent'] === true);
    check('idempotencia mismo XP tras correctivo', $rIdemAgain['xpEarned'] === 65);

    $xpFinal = (int) ProgressRepository::getSnapshot($playerId)['xp'];
    // Mid + 0 (fake true) + 10 (fake false) + 10 (factKey 7×3) + 0 (zero) + 20 (multi: 2 correctas ×10)
    // Global multi score: 2 correct / 4 = 50%, XP = 20
    $expectedDelta = 0 + 10 + 10 + 0 + 20;
    check(
        'XP acumulado coherente tras correctivos',
        $xpFinal === $xpMid + $expectedDelta,
        "mid={$xpMid} final={$xpFinal} expected=" . ($xpMid + $expectedDelta)
    );

} catch (Throwable $e) {
    check('phase2_smoke', false, $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine());
}

echo $failed === 0 ? "\nFase 2 smoke: OK\n" : "\nFase 2 smoke: {$failed} fallos\n";
exit($failed > 0 ? 1 : 0);
