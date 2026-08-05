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

        // Día jugado = hubo partida/actividad, no solo heartbeat con la pestaña abierta.
        $cstmt = $pdo->prepare(
            "SELECT COUNT(*) FROM {$daily}
             WHERE player_id = :p AND (sessions_count > 0 OR activities_count > 0)"
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
        $level = intdiv($xp, 500) + 1;
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
                'playSecondsTotal' => self::resolvePlaySecondsTotal($playerId, (int) ($sums['play_seconds'] ?? 0)),
                'sessionsCount' => (int) ($sums['sessions_count'] ?? 0),
                'activitiesCount' => (int) ($sums['activities_count'] ?? 0),
                'correctCount' => $correct,
                'wrongCount' => $wrong,
                'accuracyPct' => self::pct($correct, $correct + $wrong),
                'rewardPointsCurrent' => (int) ($reward['pointsTotal'] ?? 0),
                'rewardTarget' => (int) ($reward['targetPoints'] ?? 5000),
                'currentCycleNumber' => (int) ($reward['currentCycleNumber'] ?? 1),
                'xp' => $xp,
                'level' => $level,
                'coins' => (int) $progress['coins'],
                'energyToday' => (int) ($reward['dailyPoints'] ?? 0),
                'energyCap' => (int) ($reward['dailyCap'] ?? 100),
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
                'alphabet' => self::alphabetEducation($playerId),
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
        $days = self::enrichPlaySecondsFromSessions($playerId, $from, $to, $days);
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

    private static function alphabetEducation(int $playerId): array
    {
        $snap = AlphabetSessionService::snapshotForPlayer($playerId);
        $modesIn = is_object($snap['modes']) ? (array) $snap['modes'] : (array) ($snap['modes'] ?? []);
        $labels = [
            'missing' => 'Letra que falta',
            'neighbor' => 'Siguiente / anterior',
            'order-letters' => 'Ordena letras',
            'order-words' => 'Ordena palabras',
            'random' => 'Random',
        ];
        $modes = [];
        $dominated = 0;
        $needsReview = 0;
        foreach ($labels as $key => $title) {
            $row = isset($modesIn[$key]) && is_array($modesIn[$key]) ? $modesIn[$key] : null;
            $ever = $row ? !empty($row['everMastered']) : false;
            $cons = $row ? (int) ($row['consecutiveLowRounds'] ?? 0) : 0;
            $last = $row && array_key_exists('lastRoundScore', $row) ? $row['lastRoundScore'] : null;
            $label = 'Sin practicar';
            if ($cons >= 2) {
                $label = 'NECESITA REFUERZO';
                $needsReview++;
            } elseif ($ever && $cons >= 1) {
                $label = 'NECESITA REFUERZO';
                $needsReview++;
            } elseif ($ever) {
                $label = 'DOMADO';
                $dominated++;
            } elseif ($row && !empty($row['practiced'])) {
                $label = 'ENTRENANDO';
            }
            $modes[] = [
                'modeKey' => $key,
                'title' => $title,
                'label' => $label,
                'practiced' => $row ? !empty($row['practiced']) : false,
                'everMastered' => $ever,
                'bestRoundScore' => $row ? (int) ($row['bestRoundScore'] ?? 0) : 0,
                'lastRoundScore' => $last === null ? null : (int) $last,
                'attempts' => $row ? (int) ($row['attempts'] ?? 0) : 0,
                'correct' => $row ? (int) ($row['correct'] ?? 0) : 0,
            ];
        }

        $lettersIn = is_object($snap['letters']) ? (array) $snap['letters'] : (array) ($snap['letters'] ?? []);
        $hard = [];
        foreach ($lettersIn as $letter => $stats) {
            if (!is_array($stats) || (int) ($stats['wrong'] ?? 0) <= 0) {
                continue;
            }
            $hard[] = [
                'letter' => (string) $letter,
                'wrong' => (int) $stats['wrong'],
                'attempts' => (int) ($stats['attempts'] ?? 0),
                'correct' => (int) ($stats['correct'] ?? 0),
            ];
        }
        usort($hard, static function ($a, $b) {
            if ($a['wrong'] === $b['wrong']) {
                return $b['attempts'] <=> $a['attempts'];
            }
            return $b['wrong'] <=> $a['wrong'];
        });
        $hard = array_slice($hard, 0, 12);

        return [
            'roundsPlayed' => (int) ($snap['roundsPlayed'] ?? 0),
            'perfectRounds' => (int) ($snap['perfectRounds'] ?? 0),
            'bestStreak' => (int) ($snap['bestStreak'] ?? 0),
            'dominatedModes' => $dominated,
            'needsReviewModes' => $needsReview,
            'modes' => $modes,
            'hardLetters' => $hard,
        ];
    }

    private static function pct(int $correct, int $total): ?int
    {
        if ($total <= 0) {
            return null;
        }
        return (int) round(100 * $correct / $total);
    }

    /**
     * Tiempo total: suma play_seconds solo en días con partida/actividad.
     * Si no hay filas con tiempo real, estima desde partidas guardadas (legacy).
     */
    private static function resolvePlaySecondsTotal(int $playerId, int $fromDaily): int
    {
        $pdo = Database::pdo();
        $daily = Database::table('daily_activity');
        $stmt = $pdo->prepare(
            "SELECT COALESCE(SUM(play_seconds), 0) FROM {$daily}
             WHERE player_id = :p AND (sessions_count > 0 OR activities_count > 0)"
        );
        $stmt->execute([':p' => $playerId]);
        $fromPlayedDays = (int) $stmt->fetchColumn();
        if ($fromPlayedDays > 0) {
            return $fromPlayedDays;
        }
        if ($fromDaily > 0) {
            return $fromDaily;
        }
        $counts = self::sessionCountsByPlayableDate($playerId, '1970-01-01', '2999-12-31');
        $n = 0;
        foreach ($counts as $c) {
            $n += $c;
        }
        return $n * 75;
    }

    /**
     * @param list<array> $days
     * @return list<array>
     */
    private static function enrichPlaySecondsFromSessions(
        int $playerId,
        string $from,
        string $to,
        array $days
    ): array {
        $counts = self::sessionCountsByPlayableDate($playerId, $from, $to);
        if ($counts === []) {
            return $days;
        }

        $byDate = [];
        foreach ($days as $day) {
            $date = (string) ($day['activityDate'] ?? '');
            $byDate[$date] = $day;
        }

        foreach ($counts as $date => $n) {
            if ($n < 1) {
                continue;
            }
            if (!isset($byDate[$date])) {
                $byDate[$date] = [
                    'activityDate' => $date,
                    'playSeconds' => $n * 75,
                    'sessionsCount' => $n,
                    'activitiesCount' => $n,
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
                continue;
            }
            $play = (int) ($byDate[$date]['playSeconds'] ?? 0);
            $sessions = (int) ($byDate[$date]['sessionsCount'] ?? 0);
            if ($play <= 0) {
                $byDate[$date]['playSeconds'] = $n * 75;
            }
            if ($sessions < $n) {
                $byDate[$date]['sessionsCount'] = $n;
            }
        }

        $out = array_values($byDate);
        usort(
            $out,
            static fn (array $a, array $b): int => strcmp(
                (string) ($b['activityDate'] ?? ''),
                (string) ($a['activityDate'] ?? '')
            )
        );
        return $out;
    }

    /** @return array<string,int> fecha jugable (Madrid) => nº partidas */
    private static function sessionCountsByPlayableDate(int $playerId, string $from, string $to): array
    {
        $pdo = Database::pdo();
        $sess = Database::table('sessions');
        $stmt = $pdo->prepare(
            "SELECT processed_at FROM {$sess}
             WHERE player_id = :p
               AND processed_at >= :f
               AND processed_at < :t"
        );
        $fromUtc = MadridTime::playableDateStartUtc($from);
        $toExclusive = self::shiftPlayableDate($to, 1);
        $toUtc = MadridTime::playableDateStartUtc($toExclusive);
        $stmt->execute([
            ':p' => $playerId,
            ':f' => $fromUtc,
            ':t' => $toUtc,
        ]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $raw = (string) ($row['processed_at'] ?? '');
            if ($raw === '') {
                continue;
            }
            $date = MadridTime::playableDate(
                DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $raw, new DateTimeZone('UTC'))
                    ?: new DateTimeImmutable($raw, new DateTimeZone('UTC'))
            );
            if ($date < $from || $date > $to) {
                continue;
            }
            $out[$date] = ($out[$date] ?? 0) + 1;
        }
        return $out;
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
