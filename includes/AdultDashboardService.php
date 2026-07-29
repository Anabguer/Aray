<?php

declare(strict_types=1);

/** Panel adulto: resumen, actividad, progreso educativo y premios. */
final class AdultDashboardService
{
    public static function overview(int $accountId, int $playerId): array
    {
        AuthService::requireAdultLinkedToPlayer($playerId);
        RewardCycleService::ensureGoalAndCycle($playerId);

        $pdo = Database::pdo();
        $progressTable = Database::table('player_progress');
        $daily = Database::table('daily_activity');
        $mastery = Database::table('table_mastery');
        $facts = Database::table('fact_stats');

        $pstmt = $pdo->prepare("SELECT * FROM {$progressTable} WHERE player_id = :p LIMIT 1");
        $pstmt->execute([':p' => $playerId]);
        $progress = $pstmt->fetch();
        if (!is_array($progress)) {
            Http::error(404, 'progress_missing', 'Progreso no encontrado.');
        }

        $cstmt = $pdo->prepare(
            "SELECT COUNT(*) FROM {$daily} WHERE player_id = :p AND (sessions_count > 0 OR play_seconds > 0)"
        );
        $cstmt->execute([':p' => $playerId]);
        $daysPlayed = (int) $cstmt->fetchColumn();

        $lastStmt = $pdo->prepare(
            "SELECT last_seen_at, activity_date, play_seconds FROM {$daily}
             WHERE player_id = :p AND last_seen_at IS NOT NULL
             ORDER BY last_seen_at DESC LIMIT 1"
        );
        $lastStmt->execute([':p' => $playerId]);
        $lastDay = $lastStmt->fetch();

        $sumStmt = $pdo->prepare(
            "SELECT
                COALESCE(SUM(play_seconds),0) AS play_seconds,
                COALESCE(SUM(sessions_count),0) AS sessions_count,
                COALESCE(SUM(activities_count),0) AS activities_count,
                COALESCE(SUM(correct_count),0) AS correct_count,
                COALESCE(SUM(wrong_count),0) AS wrong_count,
                COALESCE(SUM(reward_points_earned),0) AS reward_points
             FROM {$daily} WHERE player_id = :p"
        );
        $sumStmt->execute([':p' => $playerId]);
        $sums = $sumStmt->fetch() ?: [];

        $mstmt = $pdo->prepare("SELECT * FROM {$mastery} WHERE player_id = :p ORDER BY table_n ASC");
        $mstmt->execute([':p' => $playerId]);
        $tables = [];
        $dominated = [];
        $learning = [];
        $needsReview = [];
        foreach ($mstmt->fetchAll() as $row) {
            $label = self::masteryLabel($row);
            $item = [
                'tableN' => (int) $row['table_n'],
                'label' => $label,
                'practiced' => (bool) $row['practiced'],
                'attempts' => (int) $row['attempts'],
                'correct' => (int) $row['correct'],
                'masteryScore' => (int) $row['mastery_score'],
                'bestRoundScore' => (int) $row['best_round_score'],
                'lastRoundScore' => $row['last_round_score'] === null ? null : (int) $row['last_round_score'],
                'everMastered' => (bool) $row['ever_mastered'],
                'lastPracticedAt' => $row['last_practiced_at'],
                'accuracyPct' => self::pct((int) $row['correct'], (int) $row['attempts']),
            ];
            $tables[] = $item;
            if ($label === 'DOMADA') {
                $dominated[] = $item;
            } elseif ($label === 'CASI DOMADA' || $label === 'ENTRENANDO') {
                $learning[] = $item;
            } elseif ($label === 'NECESITA REFUERZO') {
                $needsReview[] = $item;
            }
        }

        $fstmt = $pdo->prepare(
            "SELECT fact_key, attempts, correct, wrong FROM {$facts}
             WHERE player_id = :p AND wrong > 0
             ORDER BY wrong DESC, attempts DESC
             LIMIT 12"
        );
        $fstmt->execute([':p' => $playerId]);
        $hardFacts = [];
        foreach ($fstmt->fetchAll() as $row) {
            $hardFacts[] = [
                'factKey' => (string) $row['fact_key'],
                'attempts' => (int) $row['attempts'],
                'correct' => (int) $row['correct'],
                'wrong' => (int) $row['wrong'],
                'accuracyPct' => self::pct((int) $row['correct'], (int) $row['attempts']),
            ];
        }

        $xp = (int) $progress['xp'];
        $level = intdiv($xp, 100) + 1;
        $reward = RewardCycleService::publicRewardState($playerId);
        $cycles = RewardCycleService::listCycles($playerId);
        $pending = array_values(array_filter(
            $cycles,
            static fn (array $c): bool => $c['status'] === 'pending_delivery'
        ));
        $delivered = array_values(array_filter(
            $cycles,
            static fn (array $c): bool => $c['status'] === 'delivered'
        ));

        $devices = AuthService::listDevices($accountId, $playerId);
        $player = AuthService::findPlayerById($playerId);
        $school = PlayerCourseService::getSchoolProfile($playerId);

        $correct = (int) ($sums['correct_count'] ?? 0);
        $wrong = (int) ($sums['wrong_count'] ?? 0);

        return [
            'player' => [
                'id' => $playerId,
                'slug' => is_array($player) ? (string) $player['slug'] : 'aray',
                'displayName' => is_array($player) ? (string) $player['display_name'] : 'Aray',
            ],
            'school' => $school,
            'summary' => [
                'daysPlayed' => $daysPlayed,
                'lastActivityAt' => is_array($lastDay) ? $lastDay['last_seen_at'] : $progress['last_practice_at'],
                'lastActivityDate' => is_array($lastDay) ? $lastDay['activity_date'] : null,
                'playSecondsTotal' => (int) ($sums['play_seconds'] ?? 0),
                'sessionsCount' => (int) ($sums['sessions_count'] ?? 0),
                'activitiesCount' => (int) ($sums['activities_count'] ?? 0),
                'correctCount' => $correct,
                'wrongCount' => $wrong,
                'accuracyPct' => self::pct($correct, $correct + $wrong),
                'rewardPointsCurrent' => (int) ($reward['pointsTotal'] ?? 0),
                'rewardTarget' => (int) ($reward['targetPoints'] ?? 500),
                'currentCycleNumber' => (int) ($reward['currentCycleNumber'] ?? 1),
                'xp' => $xp,
                'level' => $level,
                'coins' => (int) $progress['coins'],
                'energyToday' => (int) ($reward['dailyPoints'] ?? 0),
                'energyCap' => (int) ($reward['dailyCap'] ?? 10),
                'currentStreak' => 0, // racha diaria se calcula en cliente; best en progress
                'bestStreak' => (int) $progress['best_streak'],
                'dominatedTables' => array_map(static fn ($t) => $t['tableN'], $dominated),
                'pendingPrizesCount' => count($pending),
                'deliveredPrizesCount' => count($delivered),
            ],
            'education' => [
                'dominated' => $dominated,
                'learning' => $learning,
                'needsReview' => $needsReview,
                'tables' => $tables,
                'hardFacts' => $hardFacts,
            ],
            'reward' => $reward,
            'cycles' => $cycles,
            'pendingPrizes' => $pending,
            'deliveredPrizes' => $delivered,
            'devices' => $devices,
            'playableDate' => MadridTime::playableDate(),
            'serverTimeUtc' => MadridTime::utcNowString(),
        ];
    }

    public static function activity(
        int $accountId,
        int $playerId,
        string $range,
        ?string $from,
        ?string $to,
        ?string $modeFilter,
        ?int $tableFilter
    ): array {
        AuthService::requireAdultLinkedToPlayer($playerId);
        $today = MadridTime::playableDate();
        if ($range === '7d') {
            $from = self::shiftPlayableDate($today, -6);
            $to = $today;
        } elseif ($range === '30d') {
            $from = self::shiftPlayableDate($today, -29);
            $to = $today;
        } else {
            $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ? $from : self::shiftPlayableDate($today, -6);
            $to = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ? $to : $today;
        }
        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        $days = ActivityService::listDays($playerId, $from, $to);
        if ($modeFilter !== null && $modeFilter !== '') {
            $days = array_values(array_filter($days, static function (array $d) use ($modeFilter): bool {
                $modes = (array) $d['modes'];
                return isset($modes[$modeFilter]) && (int) $modes[$modeFilter] > 0;
            }));
        }
        if ($tableFilter !== null && $tableFilter >= 1 && $tableFilter <= 10) {
            $key = (string) $tableFilter;
            $days = array_values(array_filter($days, static function (array $d) use ($key): bool {
                $tables = (array) $d['tables'];
                return isset($tables[$key]) && (int) $tables[$key] > 0;
            }));
        }

        return [
            'from' => $from,
            'to' => $to,
            'range' => $range,
            'days' => $days,
        ];
    }

    /**
     * Informe filtrable por curso / asignatura / bloque / habilidad.
     * El progreso de habilidad (p. ej. tabla del 2) es global: no se duplica por curso.
     */
    public static function educationReport(
        int $playerId,
        ?string $courseId,
        ?string $subjectId,
        ?string $blockId,
        ?string $skillId
    ): array {
        $pdo = Database::pdo();
        $skillsT = Database::table('skills');
        $blocksT = Database::table('edu_blocks');
        $subjectsT = Database::table('subjects');
        $masteryT = Database::table('table_mastery');
        $mapT = Database::table('course_activity_map');
        $actT = Database::table('activities');

        $sql = "SELECT s.id AS skill_id, s.title AS skill_title, s.progress_key, s.progress_kind,
                       s.block_id, b.title AS block_title, b.subject_id, sub.title AS subject_title
                FROM {$skillsT} s
                INNER JOIN {$blocksT} b ON b.id = s.block_id
                INNER JOIN {$subjectsT} sub ON sub.id = b.subject_id
                WHERE s.status = 'active'";
        $params = [];
        if ($subjectId) {
            $sql .= ' AND b.subject_id = :sub';
            $params[':sub'] = $subjectId;
        }
        if ($blockId) {
            $sql .= ' AND s.block_id = :blk';
            $params[':blk'] = $blockId;
        }
        if ($skillId) {
            $sql .= ' AND s.id = :sk';
            $params[':sk'] = $skillId;
        }
        $sql .= ' ORDER BY sub.sort_order, b.sort_order, s.sort_order';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $skills = $stmt->fetchAll() ?: [];

        if ($courseId) {
            $linked = $pdo->prepare(
                "SELECT DISTINCT a.skill_id
                 FROM {$mapT} m
                 INNER JOIN {$actT} a ON a.id = m.activity_id
                 WHERE m.course_id = :c"
            );
            $linked->execute([':c' => $courseId]);
            $allowed = [];
            foreach ($linked->fetchAll() ?: [] as $row) {
                $allowed[(string) $row['skill_id']] = true;
            }
            $skills = array_values(array_filter(
                $skills,
                static fn (array $s): bool => isset($allowed[(string) $s['skill_id']])
            ));
        }

        $mstmt = $pdo->prepare("SELECT * FROM {$masteryT} WHERE player_id = :p");
        $mstmt->execute([':p' => $playerId]);
        $masteryByTable = [];
        foreach ($mstmt->fetchAll() ?: [] as $row) {
            $masteryByTable[(string) (int) $row['table_n']] = $row;
        }

        $rows = [];
        foreach ($skills as $skill) {
            $progressKey = (string) $skill['progress_key'];
            $mastery = null;
            if ((string) $skill['progress_kind'] === 'multiplication-table' && isset($masteryByTable[$progressKey])) {
                $m = $masteryByTable[$progressKey];
                $mastery = [
                    'attempts' => (int) $m['attempts'],
                    'correct' => (int) $m['correct'],
                    'masteryScore' => (int) $m['mastery_score'],
                    'everMastered' => (bool) $m['ever_mastered'],
                    'label' => self::masteryLabel($m),
                    'lastPracticedAt' => $m['last_practiced_at'],
                ];
            }
            $rows[] = [
                'skillId' => (string) $skill['skill_id'],
                'skillTitle' => (string) $skill['skill_title'],
                'blockId' => (string) $skill['block_id'],
                'blockTitle' => (string) $skill['block_title'],
                'subjectId' => (string) $skill['subject_id'],
                'subjectTitle' => (string) $skill['subject_title'],
                'progressKey' => $progressKey,
                'progressKind' => (string) $skill['progress_kind'],
                'mastery' => $mastery,
            ];
        }

        return [
            'filters' => [
                'courseId' => $courseId,
                'subjectId' => $subjectId,
                'blockId' => $blockId,
                'skillId' => $skillId,
            ],
            'scope' => $courseId ? 'course' : 'global',
            'skills' => $rows,
        ];
    }

    private static function masteryLabel(array $row): string
    {
        $ever = (bool) $row['ever_mastered'];
        $best = (int) $row['best_round_score'];
        $last = $row['last_round_score'] === null ? null : (int) $row['last_round_score'];
        $low = (int) $row['consecutive_low_rounds'];
        $practiced = (bool) $row['practiced'];

        if ($ever && ($last === null || $last >= 8)) {
            return 'DOMADA';
        }
        if ($ever && $last !== null && $last < 8) {
            return 'NECESITA REFUERZO';
        }
        if ($best >= 8) {
            return 'DOMADA';
        }
        if ($best >= 6) {
            return 'CASI DOMADA';
        }
        if ($practiced || (int) $row['attempts'] > 0) {
            if ($low >= 2 || ($last !== null && $last < 5)) {
                return 'NECESITA REFUERZO';
            }
            return 'ENTRENANDO';
        }
        return 'ENTRENANDO';
    }

    private static function pct(int $correct, int $total): ?int
    {
        if ($total <= 0) {
            return null;
        }
        return (int) round(100 * $correct / $total);
    }

    private static function shiftPlayableDate(string $ymd, int $days): string
    {
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $ymd, MadridTime::playableTz());
        if (!$dt instanceof DateTimeImmutable) {
            return $ymd;
        }
        return $dt->modify(($days >= 0 ? '+' : '') . $days . ' days')->format('Y-m-d');
    }
}
