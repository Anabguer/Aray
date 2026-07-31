<?php

declare(strict_types=1);

/**
 * Lectura: progreso y partidas por niño (Hostalia).
 * No imprime secretos. Uso: php scripts/audit_players_progress.php
 */

$root = dirname(__DIR__);
require_once $root . '/includes/database.local.php';

$pdo = new PDO(
    sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME),
    DB_USER,
    DB_PASSWORD,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
$pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

function out(string $label, $data): void
{
    echo "=== {$label} ===\n";
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n\n";
}

$players = $pdo->query(
    "SELECT p.id, p.slug, p.display_name, p.avatar_code, p.current_course_id,
            ap.account_id, a.login AS adult_login, a.display_name AS adult_name,
            p.created_at
     FROM arayapp_player_profiles p
     LEFT JOIN arayapp_account_players ap ON ap.player_id = p.id
     LEFT JOIN arayapp_accounts a ON a.id = ap.account_id
     ORDER BY p.id"
)->fetchAll();
out('PLAYERS', $players);

$progress = $pdo->query(
    "SELECT pp.player_id, p.slug, p.display_name, pp.xp, pp.coins, pp.best_streak,
            pp.best_challenge_score, pp.crate_pity_without, pp.last_practice_at, pp.updated_at
     FROM arayapp_player_progress pp
     JOIN arayapp_player_profiles p ON p.id = pp.player_id
     ORDER BY pp.player_id"
)->fetchAll();
out('PROGRESS', $progress);

$sessionAgg = $pdo->query(
    "SELECT s.player_id, p.slug, p.display_name,
            COUNT(*) AS sessions_all,
            SUM(CASE WHEN s.processed_at >= (UTC_TIMESTAMP() - INTERVAL 48 HOUR) THEN 1 ELSE 0 END) AS sessions_48h,
            COALESCE(SUM(s.xp_earned), 0) AS xp_sum,
            COALESCE(SUM(s.coins_earned), 0) AS coins_sum,
            COALESCE(SUM(s.score), 0) AS score_sum,
            MAX(s.processed_at) AS last_session
     FROM arayapp_sessions s
     JOIN arayapp_player_profiles p ON p.id = s.player_id
     GROUP BY s.player_id, p.slug, p.display_name
     ORDER BY last_session DESC"
)->fetchAll();
out('SESSION_AGG', $sessionAgg);

$recent = $pdo->query(
    "SELECT s.id, s.player_id, p.slug, p.display_name, s.mode, s.tables_json,
            s.score, s.best_streak, s.xp_earned, s.coins_earned,
            s.energy_requested, s.energy_granted, s.is_mission_of_day,
            s.client_started_at, s.processed_at
     FROM arayapp_sessions s
     JOIN arayapp_player_profiles p ON p.id = s.player_id
     ORDER BY s.processed_at DESC
     LIMIT 25"
)->fetchAll();
out('RECENT_SESSIONS', $recent);

$answers = $pdo->query(
    "SELECT s.player_id, p.slug, p.display_name, COUNT(sa.id) AS answers
     FROM arayapp_session_answers sa
     JOIN arayapp_sessions s ON s.id = sa.session_id
     JOIN arayapp_player_profiles p ON p.id = s.player_id
     GROUP BY s.player_id, p.slug, p.display_name
     ORDER BY s.player_id"
)->fetchAll();
out('ANSWERS_BY_PLAYER', $answers);

$tables = $pdo->query("SHOW TABLES LIKE 'arayapp_%'")->fetchAll(PDO::FETCH_COLUMN);
$tableCounts = [];
foreach ($tables as $t) {
    $tableCounts[$t] = (int) $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
}
out('TABLE_COUNTS', $tableCounts);

$factCols = $pdo->query('SHOW COLUMNS FROM arayapp_fact_stats')->fetchAll();
out('FACT_STATS_COLUMNS', array_column($factCols, 'Field'));

$facts = $pdo->query(
    "SELECT fs.player_id, p.slug, p.display_name, COUNT(*) AS fact_rows
     FROM arayapp_fact_stats fs
     JOIN arayapp_player_profiles p ON p.id = fs.player_id
     GROUP BY fs.player_id, p.slug, p.display_name
     ORDER BY fs.player_id"
)->fetchAll();
out('FACT_STATS', $facts);

$mastery = $pdo->query(
    "SELECT tm.player_id, p.slug, p.display_name, COUNT(*) AS mastery_rows
     FROM arayapp_table_mastery tm
     JOIN arayapp_player_profiles p ON p.id = tm.player_id
     GROUP BY tm.player_id, p.slug, p.display_name
     ORDER BY tm.player_id"
)->fetchAll();
out('TABLE_MASTERY', $mastery);

$sessionCols = $pdo->query('SHOW COLUMNS FROM arayapp_sessions')->fetchAll();
out('SESSIONS_COLUMNS', array_column($sessionCols, 'Field'));
$rawSessionCount = (int) $pdo->query('SELECT COUNT(*) FROM arayapp_sessions')->fetchColumn();
out('SESSIONS_TOTAL', $rawSessionCount);

$crates = $pdo->query(
    "SELECT c.player_id, p.slug, p.display_name, c.status, COUNT(*) AS n
     FROM arayapp_crates c
     JOIN arayapp_player_profiles p ON p.id = c.player_id
     GROUP BY c.player_id, p.slug, p.display_name, c.status
     ORDER BY c.player_id, c.status"
)->fetchAll();
out('CRATES', $crates);

$missions = $pdo->query(
    "SELECT mc.player_id, p.slug, p.display_name, COUNT(*) AS completions, MAX(mc.completed_at) AS last_at
     FROM arayapp_mission_completions mc
     JOIN arayapp_player_profiles p ON p.id = mc.player_id
     GROUP BY mc.player_id, p.slug, p.display_name
     ORDER BY mc.player_id"
)->fetchAll();
out('MISSIONS', $missions);

$rewards = $pdo->query(
    "SELECT rg.player_id, p.slug, p.display_name, rg.goal_code, rg.points_total,
            rg.daily_points, rg.daily_date, rg.goal_status, rg.target_points, rg.daily_cap
     FROM arayapp_reward_goals rg
     JOIN arayapp_player_profiles p ON p.id = rg.player_id
     ORDER BY rg.player_id"
)->fetchAll();
out('REWARD_GOALS', $rewards);

$devices = $pdo->query(
    "SELECT d.id, d.player_id, p.slug, p.display_name, d.device_label,
            d.last_used_at, d.revoked_at, d.created_at
     FROM arayapp_authorized_devices d
     JOIN arayapp_player_profiles p ON p.id = d.player_id
     WHERE d.revoked_at IS NULL
     ORDER BY d.last_used_at DESC"
)->fetchAll();
out('ACTIVE_DEVICES', $devices);

// Orphan checks: progress without player, sessions without progress, cross-account oddities
$orphans = [
    'progress_without_profile' => (int) $pdo->query(
        'SELECT COUNT(*) FROM arayapp_player_progress pp
         LEFT JOIN arayapp_player_profiles p ON p.id = pp.player_id
         WHERE p.id IS NULL'
    )->fetchColumn(),
    'sessions_without_profile' => (int) $pdo->query(
        'SELECT COUNT(*) FROM arayapp_sessions s
         LEFT JOIN arayapp_player_profiles p ON p.id = s.player_id
         WHERE p.id IS NULL'
    )->fetchColumn(),
    'players_without_progress' => (int) $pdo->query(
        'SELECT COUNT(*) FROM arayapp_player_profiles p
         LEFT JOIN arayapp_player_progress pp ON pp.player_id = p.id
         WHERE pp.player_id IS NULL'
    )->fetchColumn(),
];
out('INTEGRITY', $orphans);

// Compare siblings in same account: XP should be independent
$siblingDiff = $pdo->query(
    "SELECT a.login AS adult_login,
            GROUP_CONCAT(CONCAT(p.display_name, ' xp=', COALESCE(pp.xp,0), ' sess=',
              (SELECT COUNT(*) FROM arayapp_sessions s WHERE s.player_id = p.id))
              ORDER BY p.id SEPARATOR ' | ') AS kids
     FROM arayapp_accounts a
     JOIN arayapp_account_players ap ON ap.account_id = a.id
     JOIN arayapp_player_profiles p ON p.id = ap.player_id
     LEFT JOIN arayapp_player_progress pp ON pp.player_id = p.id
     GROUP BY a.id, a.login
     HAVING COUNT(p.id) > 1
     ORDER BY a.id"
)->fetchAll();
out('SIBLING_COMPARE', $siblingDiff);

$settings = $pdo->query('SELECT setting_key, setting_value FROM arayapp_app_settings')->fetchAll();
out('APP_SETTINGS', $settings);

$actionCols = array_column($pdo->query('SHOW COLUMNS FROM arayapp_adult_actions')->fetchAll(), 'Field');
out('ADULT_ACTIONS_COLUMNS', $actionCols);
$actions = $pdo->query('SELECT * FROM arayapp_adult_actions ORDER BY id DESC LIMIT 20')->fetchAll();
out('ADULT_ACTIONS', $actions);

$assign = $pdo->query(
    'SELECT paa.*, p.slug, p.display_name
     FROM arayapp_player_activity_assignments paa
     JOIN arayapp_player_profiles p ON p.id = paa.player_id'
)->fetchAll();
out('ACTIVITY_ASSIGNMENTS', $assign);

$authCols = array_column($pdo->query('SHOW COLUMNS FROM arayapp_auth_attempts')->fetchAll(), 'Field');
out('AUTH_ATTEMPTS_COLUMNS', $authCols);
$authRecent = $pdo->query('SELECT * FROM arayapp_auth_attempts ORDER BY id DESC LIMIT 10')->fetchAll();
out('AUTH_ATTEMPTS_RECENT', $authRecent);
