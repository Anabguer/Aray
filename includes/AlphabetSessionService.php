<?php

declare(strict_types=1);

/**
 * Partidas del ABC (lenguas): dominio por modo, letras difíciles, XP y energía.
 * Idempotente por sessionId (reutiliza arayapp_sessions).
 */
final class AlphabetSessionService
{
    public const SKILL_ID = 'alphabet-letters';
    public const XP_PER_CORRECT = 10;
    public const STREAK_BONUS_EVERY = 5;
    public const STREAK_BONUS_XP = 10;
    public const COINS_PER_ROUND = 0;
    public const ENERGY_PER_ROUND = 30; // escala ×10 (alineado con alphabetRoundConfig)
    public const PASS_SCORE = 8; // /10
    public const TARGET_SIZE = 10;

    private static $allowedModes = [
        'missing',
        'neighbor',
        'order-letters',
        'order-words',
        'random',
    ];

    /**
     * @param array{
     *   sessionId:string,
     *   mode:string,
     *   answers:list<array>,
     *   bestStreakInRound?:int,
     *   syncEpoch?:mixed
     * } $payload
     */
    public static function submit(int $playerId, array $payload): array
    {
        $sessionId = self::validateSessionId($payload['sessionId'] ?? '');
        $mode = self::validateMode($payload['mode'] ?? '');
        $answers = self::normalizeAnswers($payload['answers'] ?? []);
        $clientBest = max(0, (int) ($payload['bestStreakInRound'] ?? 0));
        SyncEpochService::assertClientEpochAcceptable($payload['syncEpoch'] ?? null);

        $pdo = Database::pdo();
        $sessTable = Database::table('sessions');
        $serverMode = self::serverMode($mode);

        $existing = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1");
        $existing->execute([':id' => $sessionId]);
        $existingRow = $existing->fetch();
        if (is_array($existingRow)) {
            if ((int) ($existingRow['player_id'] ?? 0) !== $playerId) {
                Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
            }
            return self::buildResult($existingRow, true);
        }

        $calc = self::recalculate($answers, $clientBest);

        $pdo->beginTransaction();
        try {
            $lock = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1 FOR UPDATE");
            $lock->execute([':id' => $sessionId]);
            $locked = $lock->fetch();
            if (is_array($locked)) {
                $pdo->commit();
                if ((int) ($locked['player_id'] ?? 0) !== $playerId) {
                    Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
                }
                return self::buildResult($locked, true);
            }

            self::insertSession($pdo, $sessionId, $playerId, $serverMode, $calc);
            self::updateModeMastery($pdo, $playerId, $mode, $answers, $calc);
            self::updateLetterStats($pdo, $playerId, $answers);
            self::updateAlphabetMeta($pdo, $playerId, $calc);
            self::updatePlayerProgress($pdo, $playerId, $calc);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $existing->execute([':id' => $sessionId]);
            $race = $existing->fetch();
            if (is_array($race)) {
                if ((int) ($race['player_id'] ?? 0) !== $playerId) {
                    Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
                }
                return self::buildResult($race, true);
            }
            throw $e;
        }

        $existing->execute([':id' => $sessionId]);
        $saved = $existing->fetch();

        if (is_array($saved) && (int) ($saved['energy_granted'] ?? 0) === 0) {
            $grant = RewardCycleService::grantPoints(
                $playerId,
                self::ENERGY_PER_ROUND,
                $sessionId,
                null
            );
            $granted = (int) ($grant['granted'] ?? 0);
            $pdo->prepare(
                "UPDATE {$sessTable}
                 SET energy_requested = :req, energy_granted = :gr
                 WHERE id = :id AND player_id = :p"
            )->execute([
                ':req' => self::ENERGY_PER_ROUND,
                ':gr' => $granted,
                ':id' => $sessionId,
                ':p' => $playerId,
            ]);
            $existing->execute([':id' => $sessionId]);
            $saved = $existing->fetch();
        }

        ActivityService::recordSessionEvent($playerId, [
            'sessionId' => $sessionId,
            'mode' => $serverMode,
            'correct' => $calc['correctCount'],
            'wrong' => $calc['wrongCount'],
            'xpEarned' => $calc['xpEarned'],
            'coinsEarned' => $calc['coinsEarned'],
            'rewardPoints' => is_array($saved) ? (int) ($saved['energy_granted'] ?? 0) : 0,
        ]);

        return self::buildResult(is_array($saved) ? $saved : [], false);
    }

    /** Snapshot alphabet para ProgressRepository / adulto. */
    public static function snapshotForPlayer(int $playerId): array
    {
        $pdo = Database::pdo();
        $modes = [];
        $mastery = Database::table('skill_mode_mastery');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$mastery}
             WHERE player_id = :p AND skill_id = :s"
        );
        $stmt->execute([':p' => $playerId, ':s' => self::SKILL_ID]);
        foreach ($stmt->fetchAll() as $row) {
            $key = (string) $row['mode_key'];
            $modes[$key] = [
                'practiced' => (bool) $row['practiced'],
                'attempts' => (int) $row['attempts'],
                'correct' => (int) $row['correct'],
                'masteryScore' => (int) $row['mastery_score'],
                'bestRoundScore' => (int) $row['best_round_score'],
                'lastRoundScore' => $row['last_round_score'] === null ? null : (int) $row['last_round_score'],
                'consecutiveLowRounds' => (int) $row['consecutive_low_rounds'],
                'everMastered' => (bool) $row['ever_mastered'],
                'lastPracticedAt' => $row['last_practiced_at'],
            ];
        }

        $letters = [];
        $letterTable = Database::table('letter_stats');
        $lstmt = $pdo->prepare("SELECT * FROM {$letterTable} WHERE player_id = :p");
        $lstmt->execute([':p' => $playerId]);
        foreach ($lstmt->fetchAll() as $row) {
            $letters[(string) $row['letter']] = [
                'attempts' => (int) $row['attempts'],
                'correct' => (int) $row['correct'],
                'wrong' => (int) $row['wrong'],
                'lastSeenAt' => $row['last_seen_at'],
            ];
        }

        $metaTable = Database::table('alphabet_progress');
        $mstmt = $pdo->prepare("SELECT * FROM {$metaTable} WHERE player_id = :p LIMIT 1");
        $mstmt->execute([':p' => $playerId]);
        $meta = $mstmt->fetch();

        return [
            'modes' => (object) $modes,
            'letters' => (object) $letters,
            'roundsPlayed' => is_array($meta) ? (int) $meta['rounds_played'] : 0,
            'perfectRounds' => is_array($meta) ? (int) $meta['perfect_rounds'] : 0,
            'bestStreak' => is_array($meta) ? (int) $meta['best_streak'] : 0,
        ];
    }

    private static function recalculate(array $answers, int $clientBest): array
    {
        $correctCount = 0;
        $wrongCount = 0;
        $streak = 0;
        $bestStreak = 0;
        $xp = 0;

        foreach ($answers as $ans) {
            if (!empty($ans['correct'])) {
                $correctCount++;
                $xp += self::XP_PER_CORRECT;
                if (!empty($ans['firstTry'])) {
                    $streak++;
                    $bestStreak = max($bestStreak, $streak);
                    if ($streak > 0 && $streak % self::STREAK_BONUS_EVERY === 0) {
                        $xp += self::STREAK_BONUS_XP;
                    }
                } else {
                    $streak = 0;
                }
            } else {
                $wrongCount++;
                $streak = 0;
            }
        }

        $total = count($answers);
        $roundScore = $total > 0
            ? (int) max(0, min(self::TARGET_SIZE, round(($correctCount / $total) * self::TARGET_SIZE)))
            : 0;

        return [
            'correctCount' => $correctCount,
            'wrongCount' => $wrongCount,
            'xpEarned' => $xp,
            'coinsEarned' => self::COINS_PER_ROUND,
            'bestStreak' => max($bestStreak, $clientBest),
            'score' => $roundScore * 10, // 0–100 en sessions.score
            'roundScore' => $roundScore,
            'perfect' => $total > 0 && $correctCount === $total,
        ];
    }

    private static function normalizeAnswers(array $answers): array
    {
        if (count($answers) > 80) {
            Http::error(400, 'too_many_answers', 'Demasiadas respuestas.');
        }
        $out = [];
        $kinds = ['missing', 'neighbor', 'order-letters', 'order-words'];
        foreach ($answers as $ans) {
            if (!is_array($ans)) {
                continue;
            }
            $attemptId = trim((string) ($ans['attemptId'] ?? ''));
            if ($attemptId === '' || strlen($attemptId) > 64) {
                continue;
            }
            $kind = (string) ($ans['kind'] ?? '');
            if (!in_array($kind, $kinds, true)) {
                continue;
            }
            $letter = strtoupper(trim((string) ($ans['focusLetter'] ?? '')));
            if ($letter !== '' && strlen($letter) > 8) {
                $letter = substr($letter, 0, 8);
            }
            $out[] = [
                'attemptId' => $attemptId,
                'kind' => $kind,
                'correct' => !empty($ans['correct']),
                'firstTry' => isset($ans['firstTry']) ? (bool) $ans['firstTry'] : true,
                'focusLetter' => $letter,
            ];
        }
        return $out;
    }

    private static function insertSession(
        PDO $pdo,
        string $sessionId,
        int $playerId,
        string $serverMode,
        array $calc
    ): void {
        $sessTable = Database::table('sessions');
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "INSERT INTO {$sessTable}
             (id, player_id, mode, tables_json, score, best_streak,
              xp_earned, coins_earned, energy_requested, energy_granted,
              personal_best, is_mission_of_day, client_started_at,
              processed_at, rewards_applied)
             VALUES
             (:id, :pid, :mode, :tj, :score, :bs,
              :xp, :co, 0, 0,
              0, 0, NULL, :now, 1)"
        )->execute([
            ':id' => $sessionId,
            ':pid' => $playerId,
            ':mode' => $serverMode,
            ':tj' => json_encode(['skill' => self::SKILL_ID], JSON_UNESCAPED_UNICODE),
            ':score' => $calc['score'],
            ':bs' => $calc['bestStreak'],
            ':xp' => $calc['xpEarned'],
            ':co' => $calc['coinsEarned'],
            ':now' => $now,
        ]);
    }

    private static function updateModeMastery(
        PDO $pdo,
        int $playerId,
        string $mode,
        array $answers,
        array $calc
    ): void {
        $track = [$mode];
        if ($mode === 'random') {
            foreach ($answers as $ans) {
                $k = (string) $ans['kind'];
                if (!in_array($k, $track, true)) {
                    $track[] = $k;
                }
            }
        }

        $table = Database::table('skill_mode_mastery');
        $now = MadridTime::utcNowString();

        foreach ($track as $key) {
            $subset = $key === $mode
                ? $answers
                : array_values(array_filter($answers, static function ($a) use ($key) {
                    return ($a['kind'] ?? '') === $key;
                }));
            if (count($subset) === 0) {
                continue;
            }
            $subCorrect = 0;
            foreach ($subset as $a) {
                if (!empty($a['correct'])) {
                    $subCorrect++;
                }
            }
            $roundScore = $key === $mode
                ? (int) $calc['roundScore']
                : (int) max(0, min(self::TARGET_SIZE, round(($subCorrect / count($subset)) * self::TARGET_SIZE)));

            $stmt = $pdo->prepare(
                "SELECT * FROM {$table}
                 WHERE player_id = :p AND skill_id = :s AND mode_key = :m LIMIT 1"
            );
            $stmt->execute([':p' => $playerId, ':s' => self::SKILL_ID, ':m' => $key]);
            $current = $stmt->fetch();

            $attempts = ($current ? (int) $current['attempts'] : 0) + count($subset);
            $correct = ($current ? (int) $current['correct'] : 0) + $subCorrect;
            $best = max($current ? (int) $current['best_round_score'] : 0, $roundScore);
            $was = $current ? (bool) $current['ever_mastered'] : false;
            $ever = $was || $best >= self::PASS_SCORE;
            $cons = $current ? (int) $current['consecutive_low_rounds'] : 0;
            if ($roundScore >= self::PASS_SCORE) {
                $cons = 0;
            } else {
                $cons++;
            }
            $mastery = $attempts > 0 ? (int) round(100 * $correct / $attempts) : 0;
            if ($ever) {
                $mastery = max($mastery, $best * 10, 80);
            } else {
                $mastery = max($mastery, $best * 10);
            }
            $mastery = min(100, $mastery);

            if (!is_array($current)) {
                $pdo->prepare(
                    "INSERT INTO {$table}
                     (player_id, skill_id, mode_key, practiced, attempts, correct, mastery_score,
                      best_round_score, last_round_score, consecutive_low_rounds,
                      ever_mastered, last_practiced_at, updated_at)
                     VALUES (:p, :s, :m, 1, :at, :co, :ms, :br, :lr, :cl, :em, :now, :now2)"
                )->execute([
                    ':p' => $playerId,
                    ':s' => self::SKILL_ID,
                    ':m' => $key,
                    ':at' => $attempts,
                    ':co' => $correct,
                    ':ms' => $mastery,
                    ':br' => $best,
                    ':lr' => $roundScore,
                    ':cl' => $cons,
                    ':em' => $ever ? 1 : 0,
                    ':now' => $now,
                    ':now2' => $now,
                ]);
            } else {
                $pdo->prepare(
                    "UPDATE {$table}
                     SET practiced = 1,
                         attempts = :at,
                         correct = :co,
                         mastery_score = :ms,
                         best_round_score = :br,
                         last_round_score = :lr,
                         consecutive_low_rounds = :cl,
                         ever_mastered = :em,
                         last_practiced_at = :now,
                         updated_at = :now2
                     WHERE player_id = :p AND skill_id = :s AND mode_key = :m"
                )->execute([
                    ':at' => $attempts,
                    ':co' => $correct,
                    ':ms' => $mastery,
                    ':br' => $best,
                    ':lr' => $roundScore,
                    ':cl' => $cons,
                    ':em' => $ever ? 1 : 0,
                    ':now' => $now,
                    ':now2' => $now,
                    ':p' => $playerId,
                    ':s' => self::SKILL_ID,
                    ':m' => $key,
                ]);
            }
        }
    }

    private static function updateLetterStats(PDO $pdo, int $playerId, array $answers): void
    {
        $table = Database::table('letter_stats');
        $now = MadridTime::utcNowString();
        foreach ($answers as $ans) {
            $letter = (string) ($ans['focusLetter'] ?? '');
            if ($letter === '') {
                continue;
            }
            $ok = !empty($ans['correct']);
            $pdo->prepare(
                "INSERT INTO {$table}
                 (player_id, letter, attempts, correct, wrong, last_seen_at, updated_at)
                 VALUES (:p, :l, 1, :c, :w, :now, :now2)
                 ON DUPLICATE KEY UPDATE
                   attempts = attempts + 1,
                   correct = correct + :c2,
                   wrong = wrong + :w2,
                   last_seen_at = :now3,
                   updated_at = :now4"
            )->execute([
                ':p' => $playerId,
                ':l' => $letter,
                ':c' => $ok ? 1 : 0,
                ':w' => $ok ? 0 : 1,
                ':now' => $now,
                ':now2' => $now,
                ':c2' => $ok ? 1 : 0,
                ':w2' => $ok ? 0 : 1,
                ':now3' => $now,
                ':now4' => $now,
            ]);
        }
    }

    private static function updateAlphabetMeta(PDO $pdo, int $playerId, array $calc): void
    {
        $table = Database::table('alphabet_progress');
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "INSERT INTO {$table} (player_id, rounds_played, perfect_rounds, best_streak, updated_at)
             VALUES (:p, 1, :pf, :bs, :u)
             ON DUPLICATE KEY UPDATE
               rounds_played = rounds_played + 1,
               perfect_rounds = perfect_rounds + :pf2,
               best_streak = GREATEST(best_streak, :bs2),
               updated_at = :u2"
        )->execute([
            ':p' => $playerId,
            ':pf' => !empty($calc['perfect']) ? 1 : 0,
            ':bs' => $calc['bestStreak'],
            ':u' => $now,
            ':pf2' => !empty($calc['perfect']) ? 1 : 0,
            ':bs2' => $calc['bestStreak'],
            ':u2' => $now,
        ]);
    }

    private static function updatePlayerProgress(PDO $pdo, int $playerId, array $calc): void
    {
        $progTable = Database::table('player_progress');
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "INSERT IGNORE INTO {$progTable}
             (player_id, xp, coins, best_streak, best_challenge_score,
              last_practice_at, created_at, updated_at)
             VALUES (:p, 0, 0, 0, 0, :now, :now2, :now3)"
        )->execute([':p' => $playerId, ':now' => $now, ':now2' => $now, ':now3' => $now]);

        $pdo->prepare(
            "UPDATE {$progTable}
             SET xp = xp + :xp,
                 coins = coins + :co,
                 best_streak = GREATEST(best_streak, :bs),
                 last_practice_at = :now,
                 updated_at = :now2
             WHERE player_id = :p"
        )->execute([
            ':xp' => $calc['xpEarned'],
            ':co' => $calc['coinsEarned'],
            ':bs' => $calc['bestStreak'],
            ':now' => $now,
            ':now2' => $now,
            ':p' => $playerId,
        ]);
    }

    private static function buildResult(array $sessionRow, bool $idempotent): array
    {
        return [
            'idempotent' => $idempotent,
            'sessionId' => (string) ($sessionRow['id'] ?? ''),
            'score' => (int) ($sessionRow['score'] ?? 0),
            'bestStreak' => (int) ($sessionRow['best_streak'] ?? 0),
            'xpEarned' => (int) ($sessionRow['xp_earned'] ?? 0),
            'coinsEarned' => (int) ($sessionRow['coins_earned'] ?? 0),
            'energyRequested' => (int) ($sessionRow['energy_requested'] ?? 0),
            'energyGranted' => (int) ($sessionRow['energy_granted'] ?? 0),
            'processedAt' => (string) ($sessionRow['processed_at'] ?? ''),
        ];
    }

    private static function serverMode(string $mode): string
    {
        $map = [
            'missing' => 'abc-missing',
            'neighbor' => 'abc-neighbor',
            'order-letters' => 'abc-oletters',
            'order-words' => 'abc-owords',
            'random' => 'abc-random',
        ];
        return $map[$mode] ?? 'abc-random';
    }

    private static function validateSessionId($id): string
    {
        $id = trim((string) $id);
        if ($id === '' || strlen($id) > 64 || !preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) {
            Http::error(400, 'invalid_session_id', 'sessionId inválido.');
        }
        return $id;
    }

    private static function validateMode($mode): string
    {
        $mode = strtolower(trim((string) $mode));
        if (!in_array($mode, self::$allowedModes, true)) {
            Http::error(400, 'invalid_mode', 'Modo ABC no reconocido.');
        }
        return $mode;
    }
}
