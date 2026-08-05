<?php
/**
 * 1) Reset progreso jugador Aray (cuenta Neni se conserva).
 * 2) Borra familia de prueba "Prima Demo" (Luis + Ana) completa.
 *
 * Uso: php scripts/wipe_test_data.php
 */
declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root . '/includes/database.local.php';

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=%s',
    DB_HOST,
    DB_NAME,
    defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4',
);
$pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

function tableExists(PDO $pdo, string $table): bool
{
    $st = $pdo->prepare(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1',
    );
    $st->execute([$table]);
    return (bool) $st->fetchColumn();
}

function wipePlayerProgress(PDO $pdo, int $playerId): void
{
    // session answers
    $pdo->prepare(
        'DELETE sa FROM arayapp_session_answers sa
         INNER JOIN arayapp_sessions s ON s.id = sa.session_id
         WHERE s.player_id = ?',
    )->execute([$playerId]);

    $tables = [
        'arayapp_sessions',
        'arayapp_fact_stats',
        'arayapp_table_mastery',
        'arayapp_crates',
        'arayapp_inventory_items',
        'arayapp_mission_completions',
        'arayapp_daily_activity',
        'arayapp_play_presence',
        'arayapp_reward_cycles',
        'arayapp_reward_goals',
        'arayapp_adult_actions',
        'arayapp_device_temp_codes',
        'arayapp_authorized_devices',
        'arayapp_daily_mission',
        'arayapp_player_achievements',
        'arayapp_alphabet_progress',
        'arayapp_letter_stats',
        'arayapp_skill_mode_mastery',
    ];
    foreach ($tables as $t) {
        if (!tableExists($pdo, $t)) {
            continue;
        }
        $pdo->prepare("DELETE FROM {$t} WHERE player_id = ?")->execute([$playerId]);
    }

    if (tableExists($pdo, 'arayapp_player_progress')) {
        // stats_json vacío: evita que el panel adulto arrastre días/sesiones de pruebas.
        $emptyStats = json_encode(
            [
                'playSeconds' => 0,
                'sessionsCompleted' => 0,
                'goodSessionStreak' => 0,
                'bestGoodSessionStreak' => 0,
                'dailyMissionsCompleted' => 0,
                'byFeature' => new stdClass(),
            ],
            JSON_UNESCAPED_UNICODE,
        );
        $pdo->prepare(
            'UPDATE arayapp_player_progress SET
              xp = 0, coins = 0, best_streak = 0, best_challenge_score = 0,
              last_practice_at = NULL, crate_pity_without = 0,
              stats_json = ?,
              local_migrated_at = NULL, local_migration_hash = NULL, local_migration_result = NULL,
              updated_at = UTC_TIMESTAMP()
             WHERE player_id = ?',
        )->execute([$emptyStats, $playerId]);
    }

    $pdo->prepare(
        'INSERT INTO arayapp_reward_goals (
          player_id, goal_code, reward_label, target_points, daily_cap,
          points_total, daily_date, daily_points, goal_status, current_cycle_number,
          created_at, updated_at
        ) VALUES (
          ?, \'robux-500\', \'500 Robux\', 500, 10,
          0, NULL, 0, \'active\', 1,
          UTC_TIMESTAMP(), UTC_TIMESTAMP()
        )',
    )->execute([$playerId]);

    $pdo->prepare(
        'INSERT INTO arayapp_reward_cycles (
          player_id, cycle_number, target_points, points_toward, status, created_at, updated_at
        ) VALUES (?, 1, 500, 0, \'active\', UTC_TIMESTAMP(), UTC_TIMESTAMP())',
    )->execute([$playerId]);
}

function bumpSyncEpoch(PDO $pdo): int
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS arayapp_app_settings (
          setting_key VARCHAR(64) NOT NULL,
          setting_value LONGTEXT NOT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    );
    $pdo->exec(
        "INSERT INTO arayapp_app_settings (setting_key, setting_value, updated_at)
         VALUES ('sync_epoch', '1', UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           setting_value = CAST(CAST(setting_value AS UNSIGNED) + 1 AS CHAR),
           updated_at = UTC_TIMESTAMP()",
    );
    return (int) $pdo->query(
        "SELECT setting_value FROM arayapp_app_settings WHERE setting_key = 'sync_epoch'",
    )->fetchColumn();
}

echo "Conectado a " . DB_HOST . " / " . DB_NAME . "\n";

$pdo->beginTransaction();
try {
    // --- 1) Aray ---
    $aray = $pdo->query(
        "SELECT id, slug, display_name FROM arayapp_player_profiles WHERE slug = 'aray' LIMIT 1",
    )->fetch();
    if (!$aray || (int) $aray['id'] !== 1 || $aray['display_name'] !== 'Aray') {
        throw new RuntimeException('Perfil Aray no verificado: ' . json_encode($aray));
    }
    echo "Reset Aray player_id={$aray['id']}...\n";
    wipePlayerProgress($pdo, (int) $aray['id']);

    // --- 2) Prima Demo ---
    $acct = $pdo->query(
        "SELECT id, display_name FROM arayapp_accounts WHERE display_name = 'Prima Demo' LIMIT 1",
    )->fetch();
    if (!$acct) {
        echo "Prima Demo no encontrada (ya borrada?).\n";
    } else {
        $accountId = (int) $acct['id'];
        if ($accountId === 1) {
            throw new RuntimeException('Abort: Prima Demo no puede ser account 1 (Neni)');
        }
        $players = $pdo->prepare(
            'SELECT p.id, p.slug, p.display_name
             FROM arayapp_account_players ap
             INNER JOIN arayapp_player_profiles p ON p.id = ap.player_id
             WHERE ap.account_id = ?',
        );
        $players->execute([$accountId]);
        $kids = $players->fetchAll();
        echo "Borrar familia Prima Demo account_id={$accountId}:\n";
        foreach ($kids as $kid) {
            echo "  - player {$kid['id']} {$kid['slug']} ({$kid['display_name']})\n";
            wipePlayerProgress($pdo, (int) $kid['id']);
        }

        // dispositivos / códigos a nivel cuenta
        foreach (['arayapp_auth_attempts'] as $t) {
            if (!tableExists($pdo, $t)) {
                continue;
            }
            // por login de la cuenta
            $login = $pdo->prepare('SELECT login FROM arayapp_accounts WHERE id = ?');
            $login->execute([$accountId]);
            $loginName = $login->fetchColumn();
            if ($loginName) {
                try {
                    $pdo->prepare("DELETE FROM {$t} WHERE login = ?")->execute([$loginName]);
                } catch (Throwable) {
                    /* columna distinta; ignorar */
                }
            }
        }

        foreach ($kids as $kid) {
            $pid = (int) $kid['id'];
            if (tableExists($pdo, 'arayapp_player_activity_assignments')) {
                $pdo->prepare('DELETE FROM arayapp_player_activity_assignments WHERE player_id = ?')->execute([$pid]);
            }
            if (tableExists($pdo, 'arayapp_player_course_history')) {
                $pdo->prepare('DELETE FROM arayapp_player_course_history WHERE player_id = ?')->execute([$pid]);
            }
        }

        $pdo->prepare('DELETE FROM arayapp_account_players WHERE account_id = ?')->execute([$accountId]);
        foreach ($kids as $kid) {
            $pdo->prepare('DELETE FROM arayapp_player_progress WHERE player_id = ?')->execute([(int) $kid['id']]);
            $pdo->prepare('DELETE FROM arayapp_player_profiles WHERE id = ?')->execute([(int) $kid['id']]);
        }
        $pdo->prepare('DELETE FROM arayapp_accounts WHERE id = ?')->execute([$accountId]);
        echo "Familia Prima Demo eliminada.\n";
    }

    $epoch = bumpSyncEpoch($pdo);
    $pdo->commit();

    $progress = $pdo->query(
        'SELECT xp, coins, best_streak FROM arayapp_player_progress WHERE player_id = 1',
    )->fetch();
    $sessions = (int) $pdo->query('SELECT COUNT(*) FROM arayapp_sessions WHERE player_id = 1')->fetchColumn();
    $prima = $pdo->query(
        "SELECT COUNT(*) FROM arayapp_accounts WHERE display_name = 'Prima Demo'",
    )->fetchColumn();

    echo "=== OK ===\n";
    echo "sync_epoch={$epoch}\n";
    echo 'aray_progress=' . json_encode($progress, JSON_UNESCAPED_UNICODE) . "\n";
    echo "aray_sessions={$sessions}\n";
    echo "prima_demo_remaining={$prima}\n";
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, 'ERROR: ' . $e->getMessage() . "\n");
    exit(1);
}
