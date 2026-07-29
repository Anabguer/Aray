<?php

declare(strict_types=1);

/**
 * Fase 2: recálculo y persistencia de partidas.
 *
 * El servidor recalcula siempre XP, monedas, dominio y fact_stats.
 * No se confía en los campos de recompensa enviados por React.
 * Idempotencia garantizada por sessionId (PRIMARY KEY en arayapp_sessions).
 *
 * Reglas de XP/monedas (mismas que en el frontend, validadas aquí):
 *   - Base XP por pregunta correcta: 10
 *   - Bonus racha × factor: cada 5 respuestas correctas seguidas +5 XP extra
 *   - Monedas = floor(xpEarned / 10)   (1 moneda por cada 10 XP)
 *   - Modo "learn": sin energía (energyWeight=0)
 *   - best_streak: máximo de cualquier racha en la sesión
 *
 * Dominio (table_mastery):
 *   - mastery_score  = clamp(0-100): corrects_in_session / total_in_session × 100
 *   - ever_mastered  = true si mastery_score ≥ 80 alguna vez
 *   - best_round_score actualizado si la sesión supera el anterior
 *   - consecutive_low_rounds: +1 si score <50, reset a 0 si score ≥50
 *
 * fact_stats: attempts/correct/wrong y peso adaptativo por fact_key (a×b).
 *   - weight sube si wrong/attempts > 0.4; baja si correct/attempts > 0.8
 */
final class SessionService
{
    public const XP_PER_CORRECT = 10;
    public const STREAK_BONUS_EVERY = 5;
    public const STREAK_BONUS_XP = 5;
    public const MASTERY_THRESHOLD = 80;
    public const CONSECUTIVE_LOW_THRESHOLD = 50;
    public const MAX_TABLES = 10;

    /**
     * Procesa y persiste una partida.
     * Si el sessionId ya existe devuelve el resultado anterior (idempotente).
     *
     * @param array{
     *   sessionId: string,
     *   mode: string,
     *   tables: list<int>,
     *   answers: list<array{
     *     attemptId: string,
     *     factKey: string,
     *     a: int,
     *     b: int,
     *     selected: int,
     *     correct: bool,
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
        $answers   = self::validateAnswers($payload['answers'] ?? []);
        $clientStartedAt = self::parseClientStartedAt($payload['clientStartedAt'] ?? null);

        $pdo = Database::pdo();

        // Idempotencia: si ya existe, devolver el resultado guardado
        $sessTable = Database::table('sessions');
        $existing = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1");
        $existing->execute([':id' => $sessionId]);
        $existingRow = $existing->fetch();
        if (is_array($existingRow)) {
            return self::buildResult($existingRow, $playerId, true);
        }

        // Recálculo en servidor
        $calc = self::recalculate($answers, $mode);

        $pdo->beginTransaction();
        try {
            // Re-check dentro de la transacción (evita carrera concurrente)
            $lock = $pdo->prepare("SELECT * FROM {$sessTable} WHERE id = :id LIMIT 1 FOR UPDATE");
            $lock->execute([':id' => $sessionId]);
            $locked = $lock->fetch();
            if (is_array($locked)) {
                $pdo->commit();
                return self::buildResult($locked, $playerId, true);
            }

            // 1. Guardar sesión
            self::insertSession($pdo, $sessionId, $playerId, $mode, $tables, $calc, $clientStartedAt);

            // 2. Guardar respuestas individuales
            self::insertAnswers($pdo, $sessionId, $answers);

            // 3. Actualizar fact_stats
            self::updateFactStats($pdo, $playerId, $answers);

            // 4. Actualizar table_mastery para cada tabla involucrada
            self::updateTableMastery($pdo, $playerId, $tables, $answers, $calc);

            // 5. Actualizar player_progress (XP, monedas, best_streak, last_practice_at)
            self::updatePlayerProgress($pdo, $playerId, $calc);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Si otra petición insertó la misma sesión en paralelo, devolver la existente
            $existing->execute([':id' => $sessionId]);
            $raceRow = $existing->fetch();
            if (is_array($raceRow)) {
                return self::buildResult($raceRow, $playerId, true);
            }
            throw $e;
        }

        // Recargar la fila insertada para construir la respuesta canónica
        $existing->execute([':id' => $sessionId]);
        $savedRow = $existing->fetch();

        return self::buildResult(is_array($savedRow) ? $savedRow : [], $playerId, false);
    }

    // ─────────────────────────── Recálculo ─────────────────────────────────

    private static function recalculate(array $answers, string $mode): array
    {
        $correctCount = 0;
        $wrongCount = 0;
        $streak = 0;
        $bestStreak = 0;
        $xp = 0;

        foreach ($answers as $a) {
            if ((bool) ($a['correct'] ?? false)) {
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
        $coins = (int) floor($xp / 10);

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

    // ─────────────────────────── Persistencia ──────────────────────────────

    private static function insertSession(
        PDO $pdo,
        string $sessionId,
        int $playerId,
        string $mode,
        array $tables,
        array $calc,
        ?string $clientStartedAt
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
              0, 0, :csa, :now, 1)"
        )->execute([
            ':id'   => $sessionId,
            ':pid'  => $playerId,
            ':mode' => $mode,
            ':tj'   => $tablesJson,
            ':score' => $calc['score'],
            ':bs'   => $calc['bestStreak'],
            ':xp'   => $calc['xpEarned'],
            ':co'   => $calc['coinsEarned'],
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
                ':aid' => (string) ($ans['attemptId'] ?? ''),
                ':fk'  => (string) ($ans['factKey'] ?? ''),
                ':a'   => (int) ($ans['a'] ?? 0),
                ':b'   => (int) ($ans['b'] ?? 0),
                ':sel' => (int) ($ans['selected'] ?? 0),
                ':cor' => (bool) ($ans['correct'] ?? false) ? 1 : 0,
                ':ft'  => isset($ans['firstTry']) ? ((bool) $ans['firstTry'] ? 1 : 0) : 1,
                ':an'  => max(1, (int) ($ans['attemptN'] ?? 1)),
                ':ms'  => isset($ans['elapsedMs']) ? (int) $ans['elapsedMs'] : null,
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

        // Agrupar por factKey para hacer un upsert por key
        $byKey = [];
        foreach ($answers as $ans) {
            $key = (string) ($ans['factKey'] ?? '');
            if ($key === '') {
                continue;
            }
            if (!isset($byKey[$key])) {
                $byKey[$key] = ['attempts' => 0, 'correct' => 0, 'wrong' => 0];
            }
            $byKey[$key]['attempts']++;
            if ((bool) ($ans['correct'] ?? false)) {
                $byKey[$key]['correct']++;
            } else {
                $byKey[$key]['wrong']++;
            }
        }

        foreach ($byKey as $factKey => $counts) {
            // Leer estado actual para recalcular weight
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

    private static function updateTableMastery(
        PDO $pdo,
        int $playerId,
        array $tables,
        array $answers,
        array $calc
    ): void {
        if (empty($tables)) {
            return;
        }

        $masteryTable = Database::table('table_mastery');
        $now = MadridTime::utcNowString();
        $score = $calc['score'];

        // Contar correctas/incorrectas por tabla a partir de factKey (ej: "3x7")
        $byTable = [];
        foreach ($answers as $ans) {
            $a = (int) ($ans['a'] ?? 0);
            $b = (int) ($ans['b'] ?? 0);
            $tableN = $a >= 1 && $a <= self::MAX_TABLES ? $a
                    : ($b >= 1 && $b <= self::MAX_TABLES ? $b : 0);
            if ($tableN === 0) {
                continue;
            }
            if (!isset($byTable[$tableN])) {
                $byTable[$tableN] = ['attempts' => 0, 'correct' => 0];
            }
            $byTable[$tableN]['attempts']++;
            if ((bool) ($ans['correct'] ?? false)) {
                $byTable[$tableN]['correct']++;
            }
        }

        foreach ($tables as $tableN) {
            $tableN = (int) $tableN;
            if ($tableN < 1 || $tableN > self::MAX_TABLES) {
                continue;
            }

            $counts = $byTable[$tableN] ?? ['attempts' => 0, 'correct' => 0];

            // Leer estado actual
            $stmt = $pdo->prepare(
                "SELECT * FROM {$masteryTable}
                 WHERE player_id = :p AND table_n = :t LIMIT 1"
            );
            $stmt->execute([':p' => $playerId, ':t' => $tableN]);
            $current = $stmt->fetch();

            $newAttempts = ($current ? (int) $current['attempts'] : 0) + $counts['attempts'];
            $newCorrect  = ($current ? (int) $current['correct']  : 0) + $counts['correct'];
            $bestRound   = $current ? (int) $current['best_round_score'] : 0;
            $newBestRound = max($bestRound, $score);
            $everMastered = $current ? (bool) $current['ever_mastered'] : false;
            if ($score >= self::MASTERY_THRESHOLD) {
                $everMastered = true;
            }

            $masteryScore = $newAttempts > 0
                ? (int) round(100 * $newCorrect / $newAttempts)
                : 0;

            $consLow = $current ? (int) $current['consecutive_low_rounds'] : 0;
            if ($score < self::CONSECUTIVE_LOW_THRESHOLD) {
                $consLow++;
            } else {
                $consLow = 0;
            }

            if (!is_array($current)) {
                $pdo->prepare(
                    "INSERT INTO {$masteryTable}
                     (player_id, table_n, practiced, attempts, correct, mastery_score,
                      best_round_score, last_round_score, consecutive_low_rounds,
                      ever_mastered, last_practiced_at, updated_at)
                     VALUES (:p, :t, 1, :at, :co, :ms, :br, :lr, :cl, :em, :now, :now2)"
                )->execute([
                    ':p'   => $playerId,
                    ':t'   => $tableN,
                    ':at'  => $newAttempts,
                    ':co'  => $newCorrect,
                    ':ms'  => $masteryScore,
                    ':br'  => $newBestRound,
                    ':lr'  => $score,
                    ':cl'  => $consLow,
                    ':em'  => $everMastered ? 1 : 0,
                    ':now' => $now,
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
                         last_round_score         = :lr,
                         consecutive_low_rounds   = :cl,
                         ever_mastered            = :em,
                         last_practiced_at        = :now,
                         updated_at               = :now2
                     WHERE player_id = :p AND table_n = :t"
                )->execute([
                    ':at'  => $newAttempts,
                    ':co'  => $newCorrect,
                    ':ms'  => $masteryScore,
                    ':br'  => $newBestRound,
                    ':lr'  => $score,
                    ':cl'  => $consLow,
                    ':em'  => $everMastered ? 1 : 0,
                    ':now' => $now,
                    ':now2' => $now,
                    ':p'   => $playerId,
                    ':t'   => $tableN,
                ]);
            }
        }
    }

    private static function updatePlayerProgress(PDO $pdo, int $playerId, array $calc): void
    {
        $progTable = Database::table('player_progress');
        $now = MadridTime::utcNowString();

        // Crear fila de progreso si no existe (primer juego sin login previo)
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
            ':xp'  => $calc['xpEarned'],
            ':co'  => $calc['coinsEarned'],
            ':bs'  => $calc['bestStreak'],
            ':now' => $now,
            ':now2' => $now,
            ':p'   => $playerId,
        ]);
    }

    // ─────────────────────────── Respuesta ─────────────────────────────────

    private static function buildResult(array $sessionRow, int $playerId, bool $idempotent): array
    {
        return [
            'idempotent'   => $idempotent,
            'sessionId'    => (string) ($sessionRow['id'] ?? ''),
            'score'        => (int) ($sessionRow['score'] ?? 0),
            'bestStreak'   => (int) ($sessionRow['best_streak'] ?? 0),
            'xpEarned'     => (int) ($sessionRow['xp_earned'] ?? 0),
            'coinsEarned'  => (int) ($sessionRow['coins_earned'] ?? 0),
            'processedAt'  => (string) ($sessionRow['processed_at'] ?? ''),
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

    private static function validateAnswers(array $answers): array
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
            $factKey   = trim((string) ($ans['factKey'] ?? ''));
            $a = (int) ($ans['a'] ?? 0);
            $b = (int) ($ans['b'] ?? 0);
            if ($attemptId === '' || strlen($attemptId) > 64) {
                continue;
            }
            if ($factKey === '' || strlen($factKey) > 16) {
                continue;
            }
            if ($a < 0 || $a > 10 || $b < 0 || $b > 10) {
                continue;
            }
            $out[] = [
                'attemptId' => $attemptId,
                'factKey'   => $factKey,
                'a'         => $a,
                'b'         => $b,
                'selected'  => (int) ($ans['selected'] ?? -1),
                'correct'   => (bool) ($ans['correct'] ?? false),
                'firstTry'  => isset($ans['firstTry']) ? (bool) $ans['firstTry'] : true,
                'attemptN'  => max(1, (int) ($ans['attemptN'] ?? 1)),
                'elapsedMs' => isset($ans['elapsedMs']) && is_int($ans['elapsedMs'])
                    ? $ans['elapsedMs']
                    : null,
            ];
        }
        return $out;
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
