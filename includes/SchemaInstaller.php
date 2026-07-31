<?php

declare(strict_types=1);

/**
 * Instalación / ensure de esquema al estilo Anabel:
 * - CREATE TABLE IF NOT EXISTS (idempotente)
 * - Semilla solo si no hay cuentas
 * - No destruye ni duplica datos en reejecución
 */
final class SchemaInstaller
{
    public static function ensureDatabaseExists(): void
    {
        if (!defined('ARAY_CREATE_DATABASE') || !ARAY_CREATE_DATABASE) {
            return;
        }
        if (!defined('DB_NAME') || DB_NAME === '') {
            return;
        }

        $dsn = sprintf(
            'mysql:host=%s;charset=%s',
            DB_HOST,
            defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $db = str_replace('`', '``', DB_NAME);
        $pdo->exec(
            "CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
    }

    /** Aplica migraciones pendientes y semilla si hace falta. Idempotente. */
    public static function ensure(bool $allowSeed = true): array
    {
        self::ensureDatabaseExists();
        $pdo = Database::pdo();
        $applied = self::applyMigrations($pdo);
        $seeded = false;
        if ($allowSeed) {
            $seeded = self::seedIfEmpty($pdo);
        }
        if (class_exists('PinAuthService')) {
            PinAuthService::ensurePinHashes($pdo);
        }
        if (class_exists('RewardCycleService') && self::countAccounts($pdo) > 0) {
            $players = Database::table('player_profiles');
            $row = $pdo->query("SELECT id FROM {$players} WHERE slug = 'aray' LIMIT 1")->fetch();
            if (is_array($row)) {
                RewardCycleService::ensureGoalAndCycle((int) $row['id']);
            }
        }

        return [
            'migrationsApplied' => $applied,
            'seeded' => $seeded,
            'accounts' => self::countAccounts($pdo),
            'tables' => self::listArayTables($pdo),
        ];
    }

    /** @return list<string> versiones aplicadas en esta ejecución */
    public static function applyMigrations(PDO $pdo): array
    {
        $migTable = Database::table('schema_migrations');
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS {$migTable} (
                version VARCHAR(64) NOT NULL,
                applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (version)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        $appliedRows = $pdo->query("SELECT version FROM {$migTable}")->fetchAll(PDO::FETCH_COLUMN);
        $appliedMap = array_fill_keys($appliedRows ?: [], true);

        $dir = dirname(__DIR__) . '/database/migrations';
        $files = glob($dir . '/*.sql') ?: [];
        sort($files);

        $newly = [];
        foreach ($files as $file) {
            $version = basename($file, '.sql');
            if (isset($appliedMap[$version])) {
                continue;
            }
            $sql = file_get_contents($file);
            if ($sql === false) {
                throw new RuntimeException('No se pudo leer ' . $file);
            }
            self::execSqlScript($pdo, $sql);
            $ins = $pdo->prepare(
                "INSERT IGNORE INTO {$migTable} (version, applied_at) VALUES (:v, :at)"
            );
            $ins->execute([':v' => $version, ':at' => MadridTime::utcNowString()]);
            $newly[] = $version;
        }

        return $newly;
    }

    public static function seedIfEmpty(PDO $pdo): bool
    {
        if (self::countAccounts($pdo) > 0) {
            return false;
        }

        $seedLogin = defined('ARAY_SEED_ADULT_LOGIN') ? (string) ARAY_SEED_ADULT_LOGIN : 'neni';
        $seedPassword = defined('ARAY_SEED_ADULT_PASSWORD') ? (string) ARAY_SEED_ADULT_PASSWORD : '';
        $seedDisplay = defined('ARAY_SEED_ADULT_DISPLAY') ? (string) ARAY_SEED_ADULT_DISPLAY : 'Neni';
        $playerSlug = defined('ARAY_SEED_PLAYER_SLUG') ? (string) ARAY_SEED_PLAYER_SLUG : 'aray';
        $playerDisplay = defined('ARAY_SEED_PLAYER_DISPLAY') ? (string) ARAY_SEED_PLAYER_DISPLAY : 'Aray';

        if ($seedPassword === '' || $seedPassword === 'CHANGE_SEED_PASSWORD') {
            throw new RuntimeException(
                'No hay cuentas y falta ARAY_SEED_ADULT_PASSWORD en database.local.php para sembrar Neni.'
            );
        }
        if (mb_strlen($seedPassword) < 10) {
            throw new RuntimeException('ARAY_SEED_ADULT_PASSWORD debe tener al menos 10 caracteres.');
        }

        $loginNorm = mb_strtolower(trim($seedLogin));
        $hash = password_hash($seedPassword, PASSWORD_DEFAULT);
        $now = MadridTime::utcNowString();

        $accounts = Database::table('accounts');
        $players = Database::table('player_profiles');
        $ap = Database::table('account_players');
        $prog = Database::table('player_progress');
        $goals = Database::table('reward_goals');
        $audit = Database::table('adult_actions');

        $childPin = defined('ARAY_SEED_CHILD_PIN') ? (string) ARAY_SEED_CHILD_PIN : '';
        $adultPin = defined('ARAY_SEED_ADULT_PIN') ? (string) ARAY_SEED_ADULT_PIN : '';
        $childPinHash = preg_match('/^\d{4}$/', $childPin) === 1
            ? password_hash($childPin, PASSWORD_DEFAULT)
            : null;
        $adultPinHash = preg_match('/^\d{4}$/', $adultPin) === 1
            ? password_hash($adultPin, PASSWORD_DEFAULT)
            : null;

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                "INSERT INTO {$accounts} (login, password_hash, adult_pin_hash, display_name, is_active, created_at, updated_at)
                 VALUES (:l, :h, :pin, :d, 1, :c, :u)"
            )->execute([
                ':l' => $loginNorm,
                ':h' => $hash,
                ':pin' => $adultPinHash,
                ':d' => $seedDisplay,
                ':c' => $now,
                ':u' => $now,
            ]);
            $accountId = (int) $pdo->lastInsertId();

            $pdo->prepare(
                "INSERT INTO {$players} (slug, display_name, child_pin_hash, current_course_id, course_mode, course_started_at, is_active, created_at, updated_at)
                 VALUES (:s, :d, :pin, 'primary-3', 'review', :cs, 1, :c, :u)"
            )->execute([
                ':s' => mb_strtolower($playerSlug),
                ':d' => $playerDisplay,
                ':pin' => $childPinHash,
                ':cs' => $now,
                ':c' => $now,
                ':u' => $now,
            ]);
            $playerId = (int) $pdo->lastInsertId();

            $pdo->prepare(
                "INSERT INTO {$ap} (account_id, player_id, relation_role, created_at)
                 VALUES (:a, :p, 'owner', :c)"
            )->execute([':a' => $accountId, ':p' => $playerId, ':c' => $now]);

            $pdo->prepare(
                "INSERT INTO {$prog} (player_id, xp, coins, created_at, updated_at)
                 VALUES (:p, 0, 0, :c, :u)"
            )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

            $pdo->prepare(
                "INSERT INTO {$goals}
                 (player_id, goal_code, reward_label, target_points, daily_cap, points_total,
                  goal_status, current_cycle_number, created_at, updated_at)
                 VALUES (:p, 'robux-500', '500 Robux', 5000, 100, 0, 'active', 1, :c, :u)"
            )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

            $cycles = Database::table('reward_cycles');
            $pdo->prepare(
                "INSERT INTO {$cycles}
                 (player_id, cycle_number, target_points, points_toward, status, created_at, updated_at)
                 VALUES (:p, 1, 5000, 0, 'active', :c, :u)"
            )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

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
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return true;
    }

    public static function countAccounts(PDO $pdo): int
    {
        $accounts = Database::table('accounts');
        try {
            return (int) $pdo->query("SELECT COUNT(*) FROM {$accounts}")->fetchColumn();
        } catch (Throwable $e) {
            return 0;
        }
    }

    /**
     * True si la instalación ya está completa (tablas + Neni/Aray).
     * Usado por install_once.php para hard-abort sin revalidar token ni reseeding.
     */
    public static function isInstalled(?PDO $pdo = null): bool
    {
        try {
            $pdo = $pdo ?? Database::pdo();
            $verify = self::verifyStructure($pdo);
            return !empty($verify['ok']);
        } catch (Throwable $e) {
            return false;
        }
    }

    /** @return list<string> */
    public static function listArayTables(PDO $pdo): array
    {
        $prefix = DB_PREFIX;
        $stmt = $pdo->query('SHOW TABLES');
        $all = $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
        $out = [];
        foreach ($all as $name) {
            if (strpos((string) $name, $prefix) === 0) {
                $out[] = (string) $name;
            }
        }
        sort($out);
        return $out;
    }

    public static function verifyStructure(PDO $pdo): array
    {
        $required = [
            'schema_migrations',
            'accounts',
            'player_profiles',
            'account_players',
            'player_progress',
            'fact_stats',
            'table_mastery',
            'reward_goals',
            'sessions',
            'session_answers',
            'crates',
            'mission_completions',
            'adult_actions',
            'inventory_items',
            'authorized_devices',
            'device_temp_codes',
            'auth_attempts',
            'reward_cycles',
            'daily_activity',
            'play_presence',
            'courses',
            'subjects',
            'edu_blocks',
            'skills',
            'activities',
            'course_activity_map',
            'player_course_history',
            'player_activity_assignments',
            'skill_mode_mastery',
            'letter_stats',
            'alphabet_progress',
        ];
        $tables = self::listArayTables($pdo);
        $missing = [];
        foreach ($required as $name) {
            $full = Database::table($name);
            if (!in_array($full, $tables, true)) {
                $missing[] = $full;
            }
        }

        $neni = null;
        $aray = null;
        if ($missing === []) {
            $accounts = Database::table('accounts');
            $players = Database::table('player_profiles');
            $neni = $pdo->query("SELECT id, login, display_name FROM {$accounts} WHERE login = 'neni' LIMIT 1")->fetch();
            $aray = $pdo->query("SELECT id, slug, display_name FROM {$players} WHERE slug = 'aray' LIMIT 1")->fetch();
        }

        return [
            'ok' => $missing === [] && is_array($neni) && is_array($aray),
            'missingTables' => $missing,
            'tableCount' => count($tables),
            'tables' => $tables,
            'neni' => is_array($neni) ? $neni : null,
            'aray' => is_array($aray) ? $aray : null,
        ];
    }

    private static function execSqlScript(PDO $pdo, string $sql): void
    {
        $statements = preg_split('/;\s*\n/', $sql) ?: [];
        foreach ($statements as $statement) {
            $clean = preg_replace('/^--.*$/m', '', $statement);
            $clean = trim((string) $clean);
            if ($clean === '') {
                continue;
            }
            if (stripos($clean, 'USE ') === 0) {
                continue;
            }
            $pdo->exec($clean);
        }
    }
}
