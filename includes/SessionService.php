<?php

declare(strict_types=1);

/**
 * Fase 2: recálculo y persistencia de partidas.
 *
 * El servidor recalcula siempre factKey, correct, XP, monedas, dominio y fact_stats.
 * No se confía en `correct` ni `factKey` enviados por React: solo en a, b y selected.
 * Idempotencia por sessionId + ownership del playerId autenticado.
 *
 * Catálogo de operaciones: a,b ∈ [1,10] (como factsForTables del frontend).
 * 0×n / n×0 / 0×0 no estánidos.
 *
 * factKey canónico: min(a,b)×max(a,b)  (p.ej. 3×7 ≡ 7×3 → "3x7").
 * correct: selected === a * b.
 *
 * Dominio por tabla (no score global):
 *   - Se atribuye la respuesta a la tabla `a` (igual que el frontend).
 *   - last/best_round_score, ever_mastered y consecutive_low_rounds usan el score de esa tabla.
 */
final class SessionService
{
    public const XP_PER_CORRECT = 10;
    public const STREAK_BONUS_EVERY = 5;
    public const STREAK_BONUS_XP = 5;
    public const MASTERY_THRESHOLD = 80;
    public const CONSECUTIVE_LOW_THRESHOLD = 50;
    public const MIN_OPERAND = 1;
    public const MAX_OPERAND = 10;
    public const MAX_TABLES = 10;

    /**
     * Procesa y persiste una partida.
     * Si el sessionId ya existe y pertenece al playerId, devuelve el resultado (idempotente).
     * Si pertenece a otro jugador → 403.
     *
     * @param array{
     *   sessionId: string,
     *   mode: string,
     *   tables: list<int>,
     *   answers: list<array{
     *     attemptId: string,
     *     factKey?: string,
     *     a: int,
     *     b: int,
     *     selected: int,
     *     correct?: bool,
     *     firstTry?: bool,
     *     attemptN?: int,
     *     elapsedMs?: int
     *   }>,
     *   clientStartedAt?: string
     * } $payload
     */
    public static function submit(int $playerId, array $payload): array
    {
        $sessionId = self::validateSessionId($payload['sessionId'] ?? '');
        $mode      = self::validateMode($payload['mode'] ?? 'train');
        $tables    = self::validateTables($payload['tables'] ?? []);
        $answers   = self::normalizeAnswers($payload['answers'] ?? []);
        $clientStartedAt = self::parseClientStartedAt($payload['clientStartedAt'] ?? null);
        $isMissionOfDay = !empty($payload['isMissionOfDay']);
        $missionCode = self::validateMissionCode($payload['missionCode'] ?? null);
        // Corte de datos: rechaza colas offline de PWA/dispositivos anteriores a la limpieza.
        SyncEpochService::assertClientEpochAcceptable($payload['syncEpoch'] ?? null);

        $pdo = Database::pdo();
        $sessTable = Database::table('sessions');

        // Idempotencia: si ya existe, comprobar ownership
        $existing = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1");
        $existing->execute([':id' => $sessionId]);
        $existingRow = $existing->fetch();
        if (is_array($existingRow)) {
            self::assertSessionOwnedBy($existingRow, $playerId);
            return self::buildResult($existingRow, true);
        }

        $calc = self::recalculate($answers);

        $pdo->beginTransaction();
        try {
            // Re-check dentro de la transacción (carrera concurrente)
            $lock = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1 FOR UPDATE");
            $lock->execute([':id' => $sessionId]);
            $locked = $lock->fetch();
            if (is_array($locked)) {
                $pdo->commit();
                self::assertSessionOwnedBy($locked, $playerId);
                return self::buildResult($locked, true);
            }

            self::insertSession(
                $pdo,
                $sessionId,
                $playerId,
                $mode,
                $tables,
                $calc,
                $clientStartedAt,
                $isMissionOfDay
            );
            self::insertAnswers($pdo, $sessionId, $answers);
            self::updateFactStats($pdo, $playerId, $answers);
            $newlyMastered = self::updateTableMastery($pdo, $playerId, $tables, $answers);
            self::updatePlayerProgress($pdo, $playerId, $calc);
            if ($isMissionOfDay && $missionCode !== null) {
                self::upsertMissionCompletion($pdo, $playerId, $missionCode, $sessionId);
            }
            CrateService::rollAfterSession(
                $pdo,
                $playerId,
                $sessionId,
                $mode,
                $isMissionOfDay,
                $newlyMastered
            );

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Carrera: otra petición insertó la misma sesión
            $existing->execute([':id' => $sessionId]);
            $raceRow = $existing->fetch();
            if (is_array($raceRow)) {
                self::assertSessionOwnedBy($raceRow, $playerId);
                return self::buildResult($raceRow, true);
            }
            throw $e;
        }

        $existing->execute([':id' => $sessionId]);
        $savedRow = $existing->fetch();

        // Energía/premio: fuera de la transacción de partida (grantPoints abre la suya).
        if (is_array($savedRow) && (int) ($savedRow['energy_granted'] ?? 0) === 0) {
            self::applyEnergyGrant($sessionId, $playerId, $mode, $answers);
            $existing->execute([':id' => $sessionId]);
            $savedRow = $existing->fetch();
        }

        return self::buildResult(is_array($savedRow) ? $savedRow : [], false);
    }

    /** factKey canónico: menor×mayor (3×7 ≡ 7×3). */
    public static function canonicalFactKey(int $a, int $b): string
    {
        $lo = min($a, $b);
        $hi = max($a, $b);
        return $lo . 'x' . $hi;
    }

    public static function isAllowedOperand(int $n): bool
    {
        return $n >= self::MIN_OPERAND && $n <= self::MAX_OPERAND;
    }

    // ─────────────────────────── Ownership ─────────────────────────────────

    private static function assertSessionOwnedBy(array $sessionRow, int $playerId): void
    {
        if ((int) ($sessionRow['player_id'] ?? 0) !== $playerId) {
            Http::error(403, 'session_forbidden', 'Esta sesión no pertenece a este perfil.');
        }
    }

    // ─────────────────────────── Normalización ─────────────────────────────

    /**
     * Normaliza respuestas: factKey y correct solo desde a, b, selected.
     * Ignora factKey/correct del cliente. Descarta operandos fuera de catálogo.
     *
     * @return list<array{
     *   attemptId:string, factKey:string, a:int, b:int, selected:int,
     *   correct:bool, firstTry:bool, attemptN:int, elapsedMs:?int
     * }>
     */
    private static function normalizeAnswers(array $answers): array
    {
        if (count($answers) > 200) {
            Http::error(400, 'too_many_answers', 'Demasiadas respuestas (máx 200).');
        }
        $out = [];
        foreach ($answers as $ans) {
            if (!is_array($ans)) {
                continue;
            }
            $attemptId = trim((string) ($ans['attemptId'] ?? ''));
            if ($attemptId === '' || strlen($attemptId) > 64) {
                continue;
            }
            $a = (int) ($ans['a'] ?? 0);
            $b = (int) ($ans['b'] ?? 0);
            if (!self::isAllowedOperand($a) || !self::isAllowedOperand($b)) {
                // 0×0, 0×n, fuera de 1..10: rechazadas (catálogo no las permite)
                continue;
            }
            $selected = (int) ($ans['selected'] ?? -1);
            $out[] = [
                'attemptId' => $attemptId,
                'factKey'   => self::canonicalFactKey($a, $b),
                'a'         => $a,
                'b'         => $b,
                'selected'  => $selected,
                'correct'   => $selected === ($a * $b),
                'firstTry'  => isset($ans['firstTry']) ? (bool) $ans['firstTry'] : true,
                'attemptN'  => max(1, (int) ($ans['attemptN'] ?? 1)),
                'elapsedMs' => isset($ans['elapsedMs']) && is_numeric($ans['elapsedMs'])
                    ? (int) $ans['elapsedMs']
                    : null,
            ];
        }
        return $out;
    }

    // ─────────────────────────── Recálculo ─────────────────────────────────

    private static function recalculate(array $answers): array
    {
        $correctCount = 0;
        $wrongCount = 0;
        $streak = 0;
        $bestStreak = 0;
        $xp = 0;

        foreach ($answers as $ans) {
            // Solo el correct recalculado en servidor
            if (!empty($ans['correct'])) {
                $correctCount++;
                $streak++;
                $xp += self::XP_PER_CORRECT;
                if ($streak % self::STREAK_BONUS_EVERY === 0) {
                    $xp += self::STREAK_BONUS_XP;
                }
                if ($streak > $bestStreak) {
                    $bestStreak = $streak;
                }
            } else {
                $wrongCount++;
                $streak = 0;
            }
        }

        $total = $correctCount + $wrongCount;
        $score = $total > 0 ? (int) round(100 * $correctCount / $total) : 0;
        $coins = 0;

        return [
            'correctCount' => $correctCount,
            'wrongCount'   => $wrongCount,
            'total'        => $total,
            'score'        => $score,
            'bestStreak'   => $bestStreak,
            'xpEarned'     => $xp,
            'coinsEarned'  => $coins,
        ];
    }

    /**
     * Score 0–100 de una tabla concreta (respuestas con a === tableN).
     *
     * @return array{attempts:int, correct:int, score:int}
     */
    private static function scoreForTable(array $answers, int $tableN): array
    {
        $attempts = 0;
        $correct = 0;
        foreach ($answers as $ans) {
            if ((int) $ans['a'] !== $tableN) {
                continue;
            }
            $attempts++;
            if (!empty($ans['correct'])) {
                $correct++;
            }
        }
        $score = $attempts > 0 ? (int) round(100 * $correct / $attempts) : 0;
        return ['attempts' => $attempts, 'correct' => $correct, 'score' => $score];
    }

    // ─────────────────────────── Persistencia ──────────────────────────────

    private static function insertSession(
        PDO $pdo,
        string $sessionId,
        int $playerId,
        string $mode,
        array $tables,
        array $calc,
        ?string $clientStartedAt,
        bool $isMissionOfDay = false
    ): void {
        $sessTable = Database::table('sessions');
        $now = MadridTime::utcNowString();
        $tablesJson = json_encode(array_values($tables), JSON_UNESCAPED_UNICODE);

        $pdo->prepare(
            "INSERT INTO {$sessTable}
             (id, player_id, mode, tables_json, score, best_streak,
              xp_earned, coins_earned, energy_requested, energy_granted,
              personal_best, is_mission_of_day, client_started_at,
              processed_at, rewards_applied)
             VALUES
             (:id, :pid, :mode, :tj, :score, :bs,
              :xp, :co, 0, 0,
              0, :mod, :csa, :now, 1)"
        )->execute([
            ':id'   => $sessionId,
            ':pid'  => $playerId,
            ':mode' => $mode,
            ':tj'   => $tablesJson,
            ':score' => $calc['score'],
            ':bs'   => $calc['bestStreak'],
            ':xp'   => $calc['xpEarned'],
            ':co'   => $calc['coinsEarned'],
            ':mod'  => $isMissionOfDay ? 1 : 0,
            ':csa'  => $clientStartedAt,
            ':now'  => $now,
        ]);
    }

    private static function insertAnswers(PDO $pdo, string $sessionId, array $answers): void
    {
        if (empty($answers)) {
            return;
        }
        $ansTable = Database::table('session_answers');
        $stmt = $pdo->prepare(
            "INSERT IGNORE INTO {$ansTable}
             (session_id, attempt_id, fact_key, a, b, selected, correct,
              first_try, attempt_n, elapsed_ms, created_at)
             VALUES
             (:sid, :aid, :fk, :a, :b, :sel, :cor, :ft, :an, :ms, :now)"
        );
        $now = MadridTime::utcNowString();
        foreach ($answers as $ans) {
            $stmt->execute([
                ':sid' => $sessionId,
                ':aid' => $ans['attemptId'],
                ':fk'  => $ans['factKey'],
                ':a'   => $ans['a'],
                ':b'   => $ans['b'],
                ':sel' => $ans['selected'],
                ':cor' => !empty($ans['correct']) ? 1 : 0,
                ':ft'  => !empty($ans['firstTry']) ? 1 : 0,
                ':an'  => $ans['attemptN'],
                ':ms'  => $ans['elapsedMs'],
                ':now' => $now,
            ]);
        }
    }

    private static function updateFactStats(PDO $pdo, int $playerId, array $answers): void
    {
        if (empty($answers)) {
            return;
        }
        $factTable = Database::table('fact_stats');
        $now = MadridTime::utcNowString();

        $byKey = [];
        foreach ($answers as $ans) {
            $key = $ans['factKey'];
            if (!isset($byKey[$key])) {
                $byKey[$key] = ['attempts' => 0, 'correct' => 0, 'wrong' => 0];
            }
            $byKey[$key]['attempts']++;
            if (!empty($ans['correct'])) {
                $byKey[$key]['correct']++;
            } else {
                $byKey[$key]['wrong']++;
            }
        }

        foreach ($byKey as $factKey => $counts) {
            $stmt = $pdo->prepare(
                "SELECT attempts, correct, wrong, weight
                 FROM {$factTable}
                 WHERE player_id = :p AND fact_key = :fk LIMIT 1"
            );
            $stmt->execute([':p' => $playerId, ':fk' => $factKey]);
            $current = $stmt->fetch();

            $newAttempts = ($current ? (int) $current['attempts'] : 0) + $counts['attempts'];
            $newCorrect  = ($current ? (int) $current['correct']  : 0) + $counts['correct'];
            $newWrong    = ($current ? (int) $current['wrong']    : 0) + $counts['wrong'];
            $weight      = $current ? (float) $current['weight'] : 1.0;

            if ($newAttempts > 0) {
                $errorRate   = $newWrong / $newAttempts;
                $correctRate = $newCorrect / $newAttempts;
                if ($errorRate > 0.4) {
                    $weight = min(3.0, $weight * 1.2);
                } elseif ($correctRate > 0.8) {
                    $weight = max(0.3, $weight * 0.9);
                }
            }

            $pdo->prepare(
                "INSERT INTO {$factTable}
                 (player_id, fact_key, attempts, correct, wrong, weight, last_seen_at, updated_at)
                 VALUES (:p, :fk, :at, :co, :wr, :wt, :now, :now2)
                 ON DUPLICATE KEY UPDATE
                   attempts     = attempts + :at2,
                   correct      = correct  + :co2,
                   wrong        = wrong    + :wr2,
                   weight       = :wt2,
                   last_seen_at = :now3,
                   updated_at   = :now4"
            )->execute([
                ':p'    => $playerId,
                ':fk'   => $factKey,
                ':at'   => $counts['attempts'],
                ':co'   => $counts['correct'],
                ':wr'   => $counts['wrong'],
                ':wt'   => round($weight, 3),
                ':now'  => $now,
                ':now2' => $now,
                ':at2'  => $counts['attempts'],
                ':co2'  => $counts['correct'],
                ':wr2'  => $counts['wrong'],
                ':wt2'  => round($weight, 3),
                ':now3' => $now,
                ':now4' => $now,
            ]);
        }
    }

    /**
     * @return list<int> tablas que pasan a ever_mastered en esta partida
     */
    private static function updateTableMastery(
        PDO $pdo,
        int $playerId,
        array $tables,
        array $answers
    ): array {
        if (empty($tables)) {
            return [];
        }

        $masteryTable = Database::table('table_mastery');
        $now = MadridTime::utcNowString();
        $newlyMastered = [];

        foreach ($tables as $tableN) {
            $tableN = (int) $tableN;
            if ($tableN < 1 || $tableN > self::MAX_TABLES) {
                continue;
            }

            // Score específico de esta tabla (no el global de la sesión)
            $tableCalc = self::scoreForTable($answers, $tableN);
            $tableScore = $tableCalc['score'];
            $counts = [
                'attempts' => $tableCalc['attempts'],
                'correct'  => $tableCalc['correct'],
            ];

            $stmt = $pdo->prepare(
                "SELECT * FROM {$masteryTable}
                 WHERE player_id = :p AND table_n = :t LIMIT 1"
            );
            $stmt->execute([':p' => $playerId, ':t' => $tableN]);
            $current = $stmt->fetch();

            $newAttempts = ($current ? (int) $current['attempts'] : 0) + $counts['attempts'];
            $newCorrect  = ($current ? (int) $current['correct']  : 0) + $counts['correct'];
            $bestRound   = $current ? (int) $current['best_round_score'] : 0;
            $newBestRound = max($bestRound, $tableScore);
            $wasMastered = $current ? (bool) $current['ever_mastered'] : false;
            $everMastered = $wasMastered;
            if ($tableScore >= self::MASTERY_THRESHOLD) {
                $everMastered = true;
            }
            if ($everMastered && !$wasMastered) {
                $newlyMastered[] = $tableN;
            }

            $masteryScore = $newAttempts > 0
                ? (int) round(100 * $newCorrect / $newAttempts)
                : 0;

            $consLow = $current ? (int) $current['consecutive_low_rounds'] : 0;
            if ($counts['attempts'] > 0) {
                if ($tableScore < self::CONSECUTIVE_LOW_THRESHOLD) {
                    $consLow++;
                } else {
                    $consLow = 0;
                }
            }

            if (!is_array($current)) {
                $pdo->prepare(
                    "INSERT INTO {$masteryTable}
                     (player_id, table_n, practiced, attempts, correct, mastery_score,
                      best_round_score, last_round_score, consecutive_low_rounds,
                      ever_mastered, last_practiced_at, updated_at)
                     VALUES (:p, :t, 1, :at, :co, :ms, :br, :lr, :cl, :em, :now, :now2)"
                )->execute([
                    ':p'    => $playerId,
                    ':t'    => $tableN,
                    ':at'   => $newAttempts,
                    ':co'   => $newCorrect,
                    ':ms'   => $masteryScore,
                    ':br'   => $newBestRound,
                    ':lr'   => $counts['attempts'] > 0 ? $tableScore : null,
                    ':cl'   => $consLow,
                    ':em'   => $everMastered ? 1 : 0,
                    ':now'  => $now,
                    ':now2' => $now,
                ]);
            } else {
                $pdo->prepare(
                    "UPDATE {$masteryTable}
                     SET practiced                = 1,
                         attempts                 = :at,
                         correct                  = :co,
                         mastery_score            = :ms,
                         best_round_score         = :br,
                         last_round_score         = COALESCE(:lr, last_round_score),
                         consecutive_low_rounds   = :cl,
                         ever_mastered            = :em,
                         last_practiced_at        = :now,
                         updated_at               = :now2
                     WHERE player_id = :p AND table_n = :t"
                )->execute([
                    ':at'   => $newAttempts,
                    ':co'   => $newCorrect,
                    ':ms'   => $masteryScore,
                    ':br'   => $newBestRound,
                    ':lr'   => $counts['attempts'] > 0 ? $tableScore : null,
                    ':cl'   => $consLow,
                    ':em'   => $everMastered ? 1 : 0,
                    ':now'  => $now,
                    ':now2' => $now,
                    ':p'    => $playerId,
                    ':t'    => $tableN,
                ]);
            }
        }

        return $newlyMastered;
    }

    private static function upsertMissionCompletion(
        PDO $pdo,
        int $playerId,
        string $missionCode,
        string $sessionId
    ): void {
        $table = Database::table('mission_completions');
        $now = MadridTime::utcNowString();
        $date = MadridTime::playableDate();
        $pdo->prepare(
            "INSERT INTO {$table}
             (player_id, mission_date, mission_code, session_id, completed_at)
             VALUES (:p, :d, :c, :s, :now)
             ON DUPLICATE KEY UPDATE
               session_id = COALESCE(session_id, VALUES(session_id))"
        )->execute([
            ':p' => $playerId,
            ':d' => $date,
            ':c' => $missionCode,
            ':s' => $sessionId,
            ':now' => $now,
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
             SET xp               = xp + :xp,
                 coins            = coins + :co,
                 best_streak      = GREATEST(best_streak, :bs),
                 last_practice_at = :now,
                 updated_at       = :now2
             WHERE player_id = :p"
        )->execute([
            ':xp'   => $calc['xpEarned'],
            ':co'   => $calc['coinsEarned'],
            ':bs'   => $calc['bestStreak'],
            ':now'  => $now,
            ':now2' => $now,
            ':p'    => $playerId,
        ]);
    }

    /**
     * Energía del premio: recalculada en servidor a partir de aciertos únicos.
     * No confía en puntos enviados por React. Idempotente vía energy_granted en sessions.
     */
    private static function computeEnergyRequested(string $mode, array $answers): int
    {
        if ($mode === 'learn') {
            return 0;
        }
        if ($mode === 'match') {
            // matchSessionMeta.rewardWeight = medium = 30 (escala ×10)
            return 30;
        }

        $weight = 10;
        $mult = $mode === 'challenge' ? 2 : 1;
        $seen = [];
        $points = 0;
        foreach ($answers as $ans) {
            if (empty($ans['correct'])) {
                continue;
            }
            $fk = (string) ($ans['factKey'] ?? '');
            if ($fk === '' || isset($seen[$fk])) {
                continue;
            }
            $seen[$fk] = true;
            $points += $weight;
        }

        return (int) round($points * $mult);
    }

    private static function applyEnergyGrant(
        string $sessionId,
        int $playerId,
        string $mode,
        array $answers
    ): void {
        $requested = self::computeEnergyRequested($mode, $answers);
        $pdo = Database::pdo();
        $sessTable = Database::table('sessions');

        if ($requested <= 0) {
            $pdo->prepare(
                "UPDATE {$sessTable}
                 SET energy_requested = 0, energy_granted = 0
                 WHERE id = :id AND player_id = :p"
            )->execute([':id' => $sessionId, ':p' => $playerId]);
            return;
        }

        $grant = RewardCycleService::grantPoints($playerId, $requested, $sessionId, null);
        $granted = (int) ($grant['granted'] ?? 0);

        $pdo->prepare(
            "UPDATE {$sessTable}
             SET energy_requested = :req, energy_granted = :gr
             WHERE id = :id AND player_id = :p"
        )->execute([
            ':req' => $requested,
            ':gr' => $granted,
            ':id' => $sessionId,
            ':p' => $playerId,
        ]);
    }

    // ─────────────────────────── Respuesta ─────────────────────────────────

    private static function buildResult(array $sessionRow, bool $idempotent): array
    {
        return [
            'idempotent'  => $idempotent,
            'sessionId'   => (string) ($sessionRow['id'] ?? ''),
            'score'       => (int) ($sessionRow['score'] ?? 0),
            'bestStreak'  => (int) ($sessionRow['best_streak'] ?? 0),
            'xpEarned'    => (int) ($sessionRow['xp_earned'] ?? 0),
            'coinsEarned' => (int) ($sessionRow['coins_earned'] ?? 0),
            'energyRequested' => (int) ($sessionRow['energy_requested'] ?? 0),
            'energyGranted' => (int) ($sessionRow['energy_granted'] ?? 0),
            'processedAt' => (string) ($sessionRow['processed_at'] ?? ''),
        ];
    }

    // ─────────────────────────── Validación ────────────────────────────────

    private static function validateSessionId(string $id): string
    {
        $id = trim($id);
        if ($id === '' || strlen($id) > 64 || !preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) {
            Http::error(400, 'invalid_session_id', 'sessionId inválido (máx 64 chars alfanumérico/-/_).');
        }
        return $id;
    }

    private static function validateMode(string $mode): string
    {
        $allowed = ['learn', 'train', 'challenge', 'match', 'misses', 'random'];
        $mode = strtolower(trim($mode));
        if (!in_array($mode, $allowed, true)) {
            Http::error(400, 'invalid_mode', 'Modo de juego no reconocido.');
        }
        return $mode;
    }

    private static function validateTables(array $tables): array
    {
        $out = [];
        foreach ($tables as $t) {
            $n = (int) $t;
            if ($n >= 1 && $n <= self::MAX_TABLES && !in_array($n, $out, true)) {
                $out[] = $n;
            }
        }
        return $out;
    }

    /** @param mixed $code */
    private static function validateMissionCode($code): ?string
    {
        if ($code === null || $code === '') {
            return null;
        }
        if (!is_string($code)) {
            return null;
        }
        $code = trim($code);
        if ($code === '' || strlen($code) > 64 || !preg_match('/^[a-zA-Z0-9_\-]+$/', $code)) {
            Http::error(400, 'invalid_mission_code', 'missionCode inválido.');
        }
        return $code;
    }

    private static function parseClientStartedAt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value, new DateTimeZone('UTC'));
        if ($dt === false) {
            $dt = DateTimeImmutable::createFromFormat(
                DateTimeInterface::ATOM,
                $value,
                new DateTimeZone('UTC')
            );
        }
        if ($dt === false) {
            return null;
        }
        return $dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }
}
