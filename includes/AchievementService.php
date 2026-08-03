<?php

declare(strict_types=1);

/**
 * Logros reclamados + stats de juego (tiempo, sesiones por feature, rachas).
 * Persistidos en MySQL para que no dependan solo de localStorage / energy_granted.
 */
final class AchievementService
{
    private const FEATURES = ['tables', 'calc', 'clocks', 'money', 'spelling', 'alphabet'];

    /** @return list<string> */
    public static function claimedIds(int $playerId): array
    {
        self::ensureSchema();
        self::backfillFromSessions($playerId);

        $pdo = Database::pdo();
        $table = Database::table('player_achievements');
        $stmt = $pdo->prepare(
            "SELECT achievement_id FROM {$table} WHERE player_id = :p ORDER BY claimed_at ASC"
        );
        $stmt->execute([':p' => $playerId]);
        $ids = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $aid = (string) $id;
            if (preg_match('/^[a-z0-9\-]+$/', $aid) === 1) {
                $ids[] = $aid;
            }
        }
        return $ids;
    }

    public static function claim(int $playerId, string $achievementId, int $energyGranted): void
    {
        self::ensureSchema();
        $aid = self::normalizeAchievementId($achievementId);
        if ($aid === null) {
            return;
        }
        $pdo = Database::pdo();
        $table = Database::table('player_achievements');
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "INSERT INTO {$table} (player_id, achievement_id, energy_granted, claimed_at)
             VALUES (:p, :a, :e, :c)
             ON DUPLICATE KEY UPDATE
               energy_granted = GREATEST(energy_granted, VALUES(energy_granted))"
        )->execute([
            ':p' => $playerId,
            ':a' => $aid,
            ':e' => max(0, $energyGranted),
            ':c' => $now,
        ]);
    }

    /** @return array<string, mixed> */
    public static function statsForPlayer(int $playerId): array
    {
        self::ensureSchema();
        $pdo = Database::pdo();
        $prog = Database::table('player_progress');
        $stmt = $pdo->prepare("SELECT stats_json FROM {$prog} WHERE player_id = :p LIMIT 1");
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        $raw = is_array($row) ? ($row['stats_json'] ?? null) : null;
        return self::normalizeStats(is_string($raw) ? self::decodeJson($raw) : null);
    }

    /**
     * Fusiona un delta de stats (desde el cliente) y lo guarda.
     *
     * @param array<string, mixed> $delta
     * @return array<string, mixed>
     */
    public static function mergeStatsDelta(int $playerId, array $delta): array
    {
        self::ensureSchema();
        $pdo = Database::pdo();
        $prog = Database::table('player_progress');
        $current = self::statsForPlayer($playerId);
        $next = self::applyDelta($current, $delta);
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "UPDATE {$prog}
             SET stats_json = :s, updated_at = :u
             WHERE player_id = :p"
        )->execute([
            ':s' => json_encode($next, JSON_UNESCAPED_UNICODE),
            ':u' => $now,
            ':p' => $playerId,
        ]);
        return $next;
    }

    /**
     * Extrae achievementId de sessionId achievement-{id}-{playerKey}.
     */
    public static function achievementIdFromSession(string $sessionId, int $playerId): ?string
    {
        if (strpos($sessionId, 'achievement-') !== 0) {
            return null;
        }
        $rest = substr($sessionId, strlen('achievement-'));
        if ($rest === false || $rest === '') {
            return null;
        }
        $suffix = '-' . $playerId;
        $suffixLen = strlen($suffix);
        if ($suffixLen > 0 && substr($rest, -$suffixLen) === $suffix) {
            $aid = substr($rest, 0, -$suffixLen);
        } else {
            $aid = preg_replace('/-\d+$/', '', $rest);
        }
        return self::normalizeAchievementId(is_string($aid) ? $aid : '');
    }

    private static function ensureSchema(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $pdo = Database::pdo();
        $ach = Database::table('player_achievements');
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS {$ach} (
              player_id        BIGINT UNSIGNED NOT NULL,
              achievement_id   VARCHAR(64) NOT NULL,
              energy_granted   INT UNSIGNED NOT NULL DEFAULT 0,
              claimed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (player_id, achievement_id),
              KEY idx_achievements_player_claimed (player_id, claimed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $prog = Database::table('player_progress');
        try {
            $cols = $pdo->query("SHOW COLUMNS FROM {$prog} LIKE 'stats_json'")->fetch();
            if (!is_array($cols)) {
                $pdo->exec("ALTER TABLE {$prog} ADD COLUMN stats_json LONGTEXT NULL");
            }
        } catch (Throwable $e) {
            // ignore race
        }
        $done = true;
    }

    private static function backfillFromSessions(int $playerId): void
    {
        $pdo = Database::pdo();
        $sess = Database::table('sessions');
        $ach = Database::table('player_achievements');
        $stmt = $pdo->prepare(
            "SELECT id, energy_granted FROM {$sess}
             WHERE player_id = :p AND mode = 'achievement'"
        );
        $stmt->execute([':p' => $playerId]);
        $ins = $pdo->prepare(
            "INSERT IGNORE INTO {$ach} (player_id, achievement_id, energy_granted, claimed_at)
             VALUES (:p, :a, :e, :c)"
        );
        $now = MadridTime::utcNowString();
        foreach ($stmt->fetchAll() as $row) {
            $aid = self::achievementIdFromSession((string) $row['id'], $playerId);
            if ($aid === null) {
                continue;
            }
            $ins->execute([
                ':p' => $playerId,
                ':a' => $aid,
                ':e' => max(0, (int) ($row['energy_granted'] ?? 0)),
                ':c' => $now,
            ]);
        }
    }

    private static function normalizeAchievementId(string $id): ?string
    {
        $id = strtolower(trim($id));
        if ($id === '' || strlen($id) > 64) {
            return null;
        }
        if (preg_match('/^[a-z0-9\-]+$/', $id) !== 1) {
            return null;
        }
        return $id;
    }

    /** @return array<string, mixed>|null */
    private static function decodeJson(string $raw): ?array
    {
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    /** @param array<string, mixed>|null $raw @return array<string, mixed> */
    public static function normalizeStats(?array $raw): array
    {
        $raw = is_array($raw) ? $raw : [];
        $byRaw = is_array($raw['byFeature'] ?? null) ? $raw['byFeature'] : [];
        $byFeature = [];
        foreach (self::FEATURES as $f) {
            $src = is_array($byRaw[$f] ?? null) ? $byRaw[$f] : [];
            $modes = [];
            if (is_array($src['modes'] ?? null)) {
                foreach ($src['modes'] as $m) {
                    if (is_string($m) && $m !== '') {
                        $modes[$m] = true;
                    }
                }
            }
            $byFeature[$f] = [
                'sessions' => max(0, (int) ($src['sessions'] ?? 0)),
                'perfect' => max(0, (int) ($src['perfect'] ?? 0)),
                'modes' => array_keys($modes),
            ];
        }
        return [
            'playSeconds' => max(0, (int) ($raw['playSeconds'] ?? 0)),
            'sessionsCompleted' => max(0, (int) ($raw['sessionsCompleted'] ?? 0)),
            'goodSessionStreak' => max(0, (int) ($raw['goodSessionStreak'] ?? 0)),
            'bestGoodSessionStreak' => max(0, (int) ($raw['bestGoodSessionStreak'] ?? 0)),
            'dailyMissionsCompleted' => max(0, (int) ($raw['dailyMissionsCompleted'] ?? 0)),
            'byFeature' => $byFeature,
        ];
    }

    /**
     * @param array<string, mixed> $current
     * @param array<string, mixed> $delta
     * @return array<string, mixed>
     */
    private static function applyDelta(array $current, array $delta): array
    {
        $next = self::normalizeStats($current);
        $next['playSeconds'] += max(0, (int) ($delta['playSeconds'] ?? 0));
        $next['sessionsCompleted'] += max(0, (int) ($delta['sessionsCompleted'] ?? 0));
        $next['dailyMissionsCompleted'] += max(0, (int) ($delta['dailyMissionsCompleted'] ?? 0));

        if (array_key_exists('goodSession', $delta)) {
            if (!empty($delta['goodSession'])) {
                $next['goodSessionStreak'] += 1;
                $next['bestGoodSessionStreak'] = max(
                    $next['bestGoodSessionStreak'],
                    $next['goodSessionStreak']
                );
            } else {
                $next['goodSessionStreak'] = 0;
            }
        }

        $feature = isset($delta['feature']) && is_string($delta['feature']) ? $delta['feature'] : '';
        if (in_array($feature, self::FEATURES, true)) {
            $next['byFeature'][$feature]['sessions'] += max(0, (int) ($delta['featureSessions'] ?? 1));
            $next['byFeature'][$feature]['perfect'] += max(0, (int) ($delta['featurePerfect'] ?? 0));
            $mode = isset($delta['mode']) && is_string($delta['mode']) ? trim($delta['mode']) : '';
            if ($mode !== '') {
                $modes = $next['byFeature'][$feature]['modes'];
                if (!in_array($mode, $modes, true)) {
                    $modes[] = substr(preg_replace('/[^a-z0-9_\-]/i', '', $mode) ?? $mode, 0, 24);
                    $next['byFeature'][$feature]['modes'] = array_values(array_filter($modes));
                }
            }
        }

        return self::normalizeStats($next);
    }
}
