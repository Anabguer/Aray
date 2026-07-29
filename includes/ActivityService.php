<?php

declare(strict_types=1);

/**
 * Actividad diaria y tiempo de juego con pausas por inactividad.
 * Heartbeat máximo acreditable: intervalo entre pulsos (cap 45s).
 * Si pasan > 120s sin pulso, se considera pausa (no se suma el hueco).
 */
final class ActivityService
{
    public const HEARTBEAT_MAX_SECONDS = 45;
    public const INACTIVITY_GAP_SECONDS = 120;
    public const DAILY_PLAY_CAP_SECONDS = 10800; // 3 h

    /**
     * @param array{
     *   active?:bool,
     *   mode?:string,
     *   tableNs?:list<int>
     * } $payload
     */
    public static function heartbeat(int $playerId, array $payload = []): array
    {
        $pdo = Database::pdo();
        $presence = Database::table('play_presence');
        $daily = Database::table('daily_activity');
        $now = MadridTime::utcNow();
        $nowStr = $now->format('Y-m-d H:i:s');
        $today = MadridTime::playableDate($now);
        $active = !empty($payload['active']);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$presence} WHERE player_id = :p LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([':p' => $playerId]);
            $row = $stmt->fetch();

            $added = 0;
            if (!is_array($row)) {
                $pdo->prepare(
                    "INSERT INTO {$presence}
                     (player_id, last_heartbeat_at, last_active_at, session_started_at, updated_at)
                     VALUES (:p, :hb, :la, :ss, :u)"
                )->execute([
                    ':p' => $playerId,
                    ':hb' => $nowStr,
                    ':la' => $active ? $nowStr : $nowStr,
                    ':ss' => $active ? $nowStr : null,
                    ':u' => $nowStr,
                ]);
            } else {
                $lastHb = DateTimeImmutable::createFromFormat(
                    'Y-m-d H:i:s',
                    (string) $row['last_heartbeat_at'],
                    new DateTimeZone('UTC')
                );
                if ($lastHb instanceof DateTimeImmutable && $active) {
                    $delta = $now->getTimestamp() - $lastHb->getTimestamp();
                    if ($delta > 0 && $delta <= self::INACTIVITY_GAP_SECONDS) {
                        $added = min(self::HEARTBEAT_MAX_SECONDS, $delta);
                    }
                }
                $pdo->prepare(
                    "UPDATE {$presence}
                     SET last_heartbeat_at = :hb,
                         last_active_at = IF(:act = 1, :la, last_active_at),
                         session_started_at = IF(:act2 = 1 AND session_started_at IS NULL, :ss, session_started_at),
                         updated_at = :u
                     WHERE player_id = :p"
                )->execute([
                    ':hb' => $nowStr,
                    ':act' => $active ? 1 : 0,
                    ':la' => $nowStr,
                    ':act2' => $active ? 1 : 0,
                    ':ss' => $nowStr,
                    ':u' => $nowStr,
                    ':p' => $playerId,
                ]);
            }

            self::upsertDailyRow($pdo, $playerId, $today, $nowStr, $added, null);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::daySnapshot($playerId, $today);
    }

    /**
     * Registra el resumen de una partida/actividad (desde el cliente autenticado).
     * @param array{
     *   sessionId:string,
     *   mode?:string,
     *   tables?:list<int>,
     *   correct?:int,
     *   wrong?:int,
     *   xpEarned?:int,
     *   coinsEarned?:int,
     *   rewardPoints?:int,
     *   achievements?:list<string>
     * } $event
     */
    public static function recordSessionEvent(int $playerId, array $event): array
    {
        $sessionId = isset($event['sessionId']) && is_string($event['sessionId'])
            ? trim($event['sessionId'])
            : '';
        if ($sessionId === '' || strlen($sessionId) > 64) {
            Http::error(400, 'invalid_session', 'Sesión no válida.');
        }

        $pdo = Database::pdo();
        $daily = Database::table('daily_activity');
        $today = MadridTime::playableDate();
        $now = MadridTime::utcNowString();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$daily} WHERE player_id = :p AND activity_date = :d LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([':p' => $playerId, ':d' => $today]);
            $row = $stmt->fetch();

            $modes = [];
            $tables = [];
            $achievements = [];
            $applied = [];
            if (is_array($row)) {
                $modes = self::decodeList($row['modes_json']);
                $tables = self::decodeList($row['tables_json']);
                $achievements = self::decodeList($row['achievements_json']);
                // Reutilizamos modes_json para guardar sessionIds aplicados bajo clave __sessions
            }

            $metaSessions = [];
            if (isset($modes['__sessions']) && is_array($modes['__sessions'])) {
                $metaSessions = $modes['__sessions'];
            }
            if (in_array($sessionId, $metaSessions, true)) {
                $pdo->commit();
                return self::daySnapshot($playerId, $today);
            }
            $metaSessions[] = $sessionId;
            if (count($metaSessions) > 80) {
                $metaSessions = array_slice($metaSessions, -80);
            }
            $modes['__sessions'] = $metaSessions;

            $mode = isset($event['mode']) && is_string($event['mode']) ? $event['mode'] : 'play';
            if (!isset($modes[$mode])) {
                $modes[$mode] = 0;
            }
            $modes[$mode] = (int) $modes[$mode] + 1;

            if (isset($event['tables']) && is_array($event['tables'])) {
                foreach ($event['tables'] as $t) {
                    $n = (int) $t;
                    if ($n >= 1 && $n <= 10) {
                        $key = (string) $n;
                        $tables[$key] = (int) ($tables[$key] ?? 0) + 1;
                    }
                }
            }
            if (isset($event['achievements']) && is_array($event['achievements'])) {
                foreach ($event['achievements'] as $a) {
                    if (is_string($a) && $a !== '') {
                        $achievements[$a] = true;
                    }
                }
            }

            $patch = [
                'sessions_count' => 1,
                'activities_count' => 1,
                'correct_count' => max(0, (int) ($event['correct'] ?? 0)),
                'wrong_count' => max(0, (int) ($event['wrong'] ?? 0)),
                'xp_earned' => max(0, (int) ($event['xpEarned'] ?? 0)),
                'coins_earned' => max(0, (int) ($event['coinsEarned'] ?? 0)),
                'reward_points_earned' => max(0, (int) ($event['rewardPoints'] ?? 0)),
                'tables_json' => json_encode($tables, JSON_UNESCAPED_UNICODE),
                'modes_json' => json_encode($modes, JSON_UNESCAPED_UNICODE),
                'achievements_json' => json_encode(array_keys($achievements), JSON_UNESCAPED_UNICODE),
            ];

            self::upsertDailyRow($pdo, $playerId, $today, $now, 0, $patch);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::daySnapshot($playerId, $today);
    }

    /** @return list<array> */
    public static function listDays(int $playerId, string $fromDate, string $toDate): array
    {
        $pdo = Database::pdo();
        $daily = Database::table('daily_activity');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$daily}
             WHERE player_id = :p AND activity_date >= :f AND activity_date <= :t
             ORDER BY activity_date DESC"
        );
        $stmt->execute([':p' => $playerId, ':f' => $fromDate, ':t' => $toDate]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = self::mapDay($row);
        }
        return $out;
    }

    public static function daySnapshot(int $playerId, ?string $date = null): array
    {
        $date = $date ?? MadridTime::playableDate();
        $pdo = Database::pdo();
        $daily = Database::table('daily_activity');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$daily} WHERE player_id = :p AND activity_date = :d LIMIT 1"
        );
        $stmt->execute([':p' => $playerId, ':d' => $date]);
        $row = $stmt->fetch();
        return is_array($row) ? self::mapDay($row) : [
            'activityDate' => $date,
            'playSeconds' => 0,
            'sessionsCount' => 0,
            'activitiesCount' => 0,
            'correctCount' => 0,
            'wrongCount' => 0,
            'accuracyPct' => null,
            'xpEarned' => 0,
            'coinsEarned' => 0,
            'rewardPointsEarned' => 0,
            'tables' => (object) [],
            'modes' => (object) [],
            'achievements' => [],
            'firstSeenAt' => null,
            'lastSeenAt' => null,
        ];
    }

    private static function upsertDailyRow(
        PDO $pdo,
        int $playerId,
        string $today,
        string $nowStr,
        int $addSeconds,
        ?array $patch
    ): void {
        $daily = Database::table('daily_activity');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$daily} WHERE player_id = :p AND activity_date = :d LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([':p' => $playerId, ':d' => $today]);
        $row = $stmt->fetch();

        if (!is_array($row)) {
            $play = min(self::DAILY_PLAY_CAP_SECONDS, max(0, $addSeconds));
            $pdo->prepare(
                "INSERT INTO {$daily}
                 (player_id, activity_date, play_seconds, sessions_count, activities_count,
                  correct_count, wrong_count, xp_earned, coins_earned, reward_points_earned,
                  tables_json, modes_json, achievements_json, first_seen_at, last_seen_at, created_at, updated_at)
                 VALUES
                 (:p, :d, :ps, :sc, :ac, :cc, :wc, :xp, :co, :rp, :tj, :mj, :aj, :fs, :ls, :c, :u)"
            )->execute([
                ':p' => $playerId,
                ':d' => $today,
                ':ps' => $play,
                ':sc' => (int) ($patch['sessions_count'] ?? 0),
                ':ac' => (int) ($patch['activities_count'] ?? 0),
                ':cc' => (int) ($patch['correct_count'] ?? 0),
                ':wc' => (int) ($patch['wrong_count'] ?? 0),
                ':xp' => (int) ($patch['xp_earned'] ?? 0),
                ':co' => (int) ($patch['coins_earned'] ?? 0),
                ':rp' => (int) ($patch['reward_points_earned'] ?? 0),
                ':tj' => $patch['tables_json'] ?? '{}',
                ':mj' => $patch['modes_json'] ?? '{}',
                ':aj' => $patch['achievements_json'] ?? '[]',
                ':fs' => $nowStr,
                ':ls' => $nowStr,
                ':c' => $nowStr,
                ':u' => $nowStr,
            ]);
            return;
        }

        $play = min(
            self::DAILY_PLAY_CAP_SECONDS,
            (int) $row['play_seconds'] + max(0, $addSeconds)
        );
        $pdo->prepare(
            "UPDATE {$daily} SET
                play_seconds = :ps,
                sessions_count = sessions_count + :sc,
                activities_count = activities_count + :ac,
                correct_count = correct_count + :cc,
                wrong_count = wrong_count + :wc,
                xp_earned = xp_earned + :xp,
                coins_earned = coins_earned + :co,
                reward_points_earned = reward_points_earned + :rp,
                tables_json = COALESCE(:tj, tables_json),
                modes_json = COALESCE(:mj, modes_json),
                achievements_json = COALESCE(:aj, achievements_json),
                last_seen_at = :ls,
                updated_at = :u
             WHERE id = :id"
        )->execute([
            ':ps' => $play,
            ':sc' => (int) ($patch['sessions_count'] ?? 0),
            ':ac' => (int) ($patch['activities_count'] ?? 0),
            ':cc' => (int) ($patch['correct_count'] ?? 0),
            ':wc' => (int) ($patch['wrong_count'] ?? 0),
            ':xp' => (int) ($patch['xp_earned'] ?? 0),
            ':co' => (int) ($patch['coins_earned'] ?? 0),
            ':rp' => (int) ($patch['reward_points_earned'] ?? 0),
            ':tj' => $patch['tables_json'] ?? null,
            ':mj' => $patch['modes_json'] ?? null,
            ':aj' => $patch['achievements_json'] ?? null,
            ':ls' => $nowStr,
            ':u' => $nowStr,
            ':id' => (int) $row['id'],
        ]);
    }

    private static function mapDay(array $row): array
    {
        $correct = (int) $row['correct_count'];
        $wrong = (int) $row['wrong_count'];
        $total = $correct + $wrong;
        $modes = self::decodeList($row['modes_json']);
        unset($modes['__sessions']);
        $ach = json_decode((string) ($row['achievements_json'] ?? '[]'), true);
        return [
            'activityDate' => (string) $row['activity_date'],
            'playSeconds' => (int) $row['play_seconds'],
            'sessionsCount' => (int) $row['sessions_count'],
            'activitiesCount' => (int) $row['activities_count'],
            'correctCount' => $correct,
            'wrongCount' => $wrong,
            'accuracyPct' => $total > 0 ? (int) round(100 * $correct / $total) : null,
            'xpEarned' => (int) $row['xp_earned'],
            'coinsEarned' => (int) $row['coins_earned'],
            'rewardPointsEarned' => (int) $row['reward_points_earned'],
            'tables' => (object) self::decodeList($row['tables_json']),
            'modes' => (object) $modes,
            'achievements' => is_array($ach) ? array_values($ach) : [],
            'firstSeenAt' => $row['first_seen_at'],
            'lastSeenAt' => $row['last_seen_at'],
        ];
    }

    private static function decodeList(?string $json): array
    {
        if ($json === null || $json === '') {
            return [];
        }
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }
}
