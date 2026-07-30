<?php

declare(strict_types=1);

/**
 * Ciclos consecutivos de premio Robux.
 * Los puntos de recompensa son independientes de XP/monedas.
 * Al alcanzar el objetivo → pending_delivery; el sobrante pasa al ciclo siguiente.
 */
final class RewardCycleService
{
    public const DEFAULT_TARGET = 500;
    public const DEFAULT_DAILY_CAP = 10;
    public const GOAL_CODE = 'robux-500';

    public static function ensureGoalAndCycle(int $playerId): void
    {
        $pdo = Database::pdo();
        $goals = Database::table('reward_goals');
        $cycles = Database::table('reward_cycles');
        $now = MadridTime::utcNowString();

        $stmt = $pdo->prepare(
            "SELECT id, target_points, current_cycle_number FROM {$goals}
             WHERE player_id = :p AND goal_code = :c LIMIT 1"
        );
        $stmt->execute([':p' => $playerId, ':c' => self::GOAL_CODE]);
        $goal = $stmt->fetch();

        if (!is_array($goal)) {
            $pdo->prepare(
                "INSERT INTO {$goals}
                 (player_id, goal_code, reward_label, target_points, daily_cap, points_total,
                  goal_status, current_cycle_number, created_at, updated_at)
                 VALUES (:p, :c, '500 Robux', :t, :d, 0, 'active', 1, :now, :now2)"
            )->execute([
                ':p' => $playerId,
                ':c' => self::GOAL_CODE,
                ':t' => self::DEFAULT_TARGET,
                ':d' => self::DEFAULT_DAILY_CAP,
                ':now' => $now,
                ':now2' => $now,
            ]);
            $cycleNumber = 1;
            $target = self::DEFAULT_TARGET;
        } else {
            $cycleNumber = max(1, (int) ($goal['current_cycle_number'] ?? 1));
            $target = max(1, (int) $goal['target_points']);
            if ($target < self::DEFAULT_TARGET) {
                $pdo->prepare(
                    "UPDATE {$goals} SET target_points = :t WHERE id = :id"
                )->execute([':t' => self::DEFAULT_TARGET, ':id' => (int) $goal['id']]);
                $target = self::DEFAULT_TARGET;
            }
        }

        $cstmt = $pdo->prepare(
            "SELECT id FROM {$cycles} WHERE player_id = :p AND cycle_number = :n LIMIT 1"
        );
        $cstmt->execute([':p' => $playerId, ':n' => $cycleNumber]);
        if (!$cstmt->fetch()) {
            $pdo->prepare(
                "INSERT INTO {$cycles}
                 (player_id, cycle_number, target_points, points_toward, status, created_at, updated_at)
                 VALUES (:p, :n, :t, 0, 'active', :c, :u)"
            )->execute([
                ':p' => $playerId,
                ':n' => $cycleNumber,
                ':t' => $target,
                ':c' => $now,
                ':u' => $now,
            ]);
        }
    }

    /**
     * Concede puntos de recompensa con tope diario y vuelco a ciclos.
     * @return array{granted:int,reward:array,cyclesCompleted:list<array>,skippedDuplicate:bool}
     */
    public static function grantPoints(
        int $playerId,
        int $requested,
        string $sessionId,
        ?array $alreadyAppliedSessionIds = null
    ): array {
        self::ensureGoalAndCycle($playerId);
        $pdo = Database::pdo();
        $goals = Database::table('reward_goals');
        $cycles = Database::table('reward_cycles');
        $today = MadridTime::playableDate();
        $now = MadridTime::utcNowString();

        $pdo->beginTransaction();
        try {
            $gstmt = $pdo->prepare(
                "SELECT * FROM {$goals} WHERE player_id = :p AND goal_code = :c LIMIT 1 FOR UPDATE"
            );
            $gstmt->execute([':p' => $playerId, ':c' => self::GOAL_CODE]);
            $goal = $gstmt->fetch();
            if (!is_array($goal)) {
                throw new RuntimeException('reward goal missing');
            }

            // Anti-duplicado: si la sesión ya tiene energía concedida, no repetir.
            $sessTable = Database::table('sessions');
            $sstmt = $pdo->prepare(
                "SELECT energy_granted FROM {$sessTable} WHERE id = :id AND player_id = :p LIMIT 1"
            );
            $sstmt->execute([':id' => $sessionId, ':p' => $playerId]);
            $sessRow = $sstmt->fetch();
            if (is_array($sessRow) && (int) ($sessRow['energy_granted'] ?? 0) > 0) {
                $pdo->commit();
                return [
                    'granted' => 0,
                    'reward' => self::publicRewardState($playerId),
                    'cyclesCompleted' => [],
                    'skippedDuplicate' => true,
                ];
            }

            if (is_array($alreadyAppliedSessionIds) && in_array($sessionId, $alreadyAppliedSessionIds, true)) {
                $pdo->commit();
                return [
                    'granted' => 0,
                    'reward' => self::publicRewardState($playerId),
                    'cyclesCompleted' => [],
                    'skippedDuplicate' => true,
                ];
            }

            $dailyDate = $goal['daily_date'];
            $dailyPoints = (int) $goal['daily_points'];
            if ($dailyDate !== $today) {
                $dailyDate = $today;
                $dailyPoints = 0;
            }

            $dailyCap = max(0, (int) $goal['daily_cap']);
            $dailyLeft = max(0, $dailyCap - $dailyPoints);
            $granted = max(0, min($requested, $dailyLeft));
            $remaining = $granted;
            $cyclesCompleted = [];

            $cycleNumber = max(1, (int) $goal['current_cycle_number']);
            $target = max(1, (int) $goal['target_points']);

            while ($remaining > 0) {
                $cstmt = $pdo->prepare(
                    "SELECT * FROM {$cycles}
                     WHERE player_id = :p AND cycle_number = :n LIMIT 1 FOR UPDATE"
                );
                $cstmt->execute([':p' => $playerId, ':n' => $cycleNumber]);
                $cycle = $cstmt->fetch();
                if (!is_array($cycle)) {
                    $pdo->prepare(
                        "INSERT INTO {$cycles}
                         (player_id, cycle_number, target_points, points_toward, status, created_at, updated_at)
                         VALUES (:p, :n, :t, 0, 'active', :c, :u)"
                    )->execute([
                        ':p' => $playerId,
                        ':n' => $cycleNumber,
                        ':t' => $target,
                        ':c' => $now,
                        ':u' => $now,
                    ]);
                    $cstmt->execute([':p' => $playerId, ':n' => $cycleNumber]);
                    $cycle = $cstmt->fetch();
                }

                if (!is_array($cycle)) {
                    break;
                }

                // Si el ciclo activo ya está pendiente/entregado, abrir el siguiente.
                if (($cycle['status'] ?? '') !== 'active') {
                    $cycleNumber++;
                    continue;
                }

                $toward = (int) $cycle['points_toward'];
                $cycleTarget = max(1, (int) $cycle['target_points']);
                $need = max(0, $cycleTarget - $toward);
                $add = min($remaining, $need);
                $toward += $add;
                $remaining -= $add;

                if ($toward >= $cycleTarget) {
                    $pdo->prepare(
                        "UPDATE {$cycles}
                         SET points_toward = :pt, status = 'pending_delivery', earned_at = :e, updated_at = :u
                         WHERE id = :id"
                    )->execute([
                        ':pt' => $cycleTarget,
                        ':e' => $now,
                        ':u' => $now,
                        ':id' => (int) $cycle['id'],
                    ]);
                    $cyclesCompleted[] = [
                        'cycleNumber' => $cycleNumber,
                        'status' => 'pending_delivery',
                        'earnedAt' => $now,
                    ];
                    $cycleNumber++;
                    // Crear siguiente ciclo vacío (puede recibir sobrante en la misma pasada)
                    $pdo->prepare(
                        "INSERT IGNORE INTO {$cycles}
                         (player_id, cycle_number, target_points, points_toward, status, created_at, updated_at)
                         VALUES (:p, :n, :t, 0, 'active', :c, :u)"
                    )->execute([
                        ':p' => $playerId,
                        ':n' => $cycleNumber,
                        ':t' => $target,
                        ':c' => $now,
                        ':u' => $now,
                    ]);
                } else {
                    $pdo->prepare(
                        "UPDATE {$cycles} SET points_toward = :pt, updated_at = :u WHERE id = :id"
                    )->execute([
                        ':pt' => $toward,
                        ':u' => $now,
                        ':id' => (int) $cycle['id'],
                    ]);
                }
            }

            $active = self::loadActiveCycleRow($pdo, $playerId, $cycleNumber);
            $pointsTotal = is_array($active) ? (int) $active['points_toward'] : 0;
            $status = 'active';
            // Vista infantil: si hay algún pending sin entregar, goalStatus = completed para el más reciente pendiente
            $pending = self::latestPendingCycle($pdo, $playerId);
            if (is_array($pending)) {
                $status = 'completed';
            }

            $pdo->prepare(
                "UPDATE {$goals}
                 SET points_total = :pt, daily_date = :dd, daily_points = :dp,
                     goal_status = :gs, current_cycle_number = :cn, updated_at = :u
                 WHERE id = :id"
            )->execute([
                ':pt' => $pointsTotal,
                ':dd' => $dailyDate,
                ':dp' => $dailyPoints + $granted,
                ':gs' => $status,
                ':cn' => $cycleNumber,
                ':u' => $now,
                ':id' => (int) $goal['id'],
            ]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return [
            'granted' => $granted,
            'reward' => self::publicRewardState($playerId),
            'cyclesCompleted' => $cyclesCompleted,
            'skippedDuplicate' => false,
        ];
    }

    public static function publicRewardState(int $playerId): array
    {
        self::ensureGoalAndCycle($playerId);
        $pdo = Database::pdo();
        $goals = Database::table('reward_goals');
        $gstmt = $pdo->prepare(
            "SELECT * FROM {$goals} WHERE player_id = :p AND goal_code = :c LIMIT 1"
        );
        $gstmt->execute([':p' => $playerId, ':c' => self::GOAL_CODE]);
        $goal = $gstmt->fetch();
        $today = MadridTime::playableDate();
        $dailyPoints = 0;
        $dailyDate = $today;
        if (is_array($goal)) {
            if ($goal['daily_date'] === $today) {
                $dailyPoints = (int) $goal['daily_points'];
                $dailyDate = $today;
            }
        }

        $active = self::getActiveCycle($playerId);
        $pending = self::listCycles($playerId, 'pending_delivery');
        $delivered = self::listCycles($playerId, 'delivered');
        $latestPending = $pending[0] ?? null;

        $childStatus = 'active';
        if ($latestPending !== null) {
            $childStatus = 'completed';
        }

        return [
            'goalCode' => self::GOAL_CODE,
            'rewardLabel' => '500 Robux',
            'targetPoints' => is_array($active) ? (int) $active['targetPoints'] : self::DEFAULT_TARGET,
            'dailyCap' => is_array($goal) ? (int) $goal['daily_cap'] : self::DEFAULT_DAILY_CAP,
            'pointsTotal' => is_array($active) ? (int) $active['pointsToward'] : 0,
            'dailyDate' => $dailyDate,
            'dailyPoints' => $dailyPoints,
            'goalStatus' => $childStatus,
            'currentCycleNumber' => is_array($active) ? (int) $active['cycleNumber'] : 1,
            'pendingPrize' => $latestPending,
            'deliveredPrizes' => $delivered,
            'activeCycle' => $active,
        ];
    }

    public static function getActiveCycle(int $playerId): ?array
    {
        $pdo = Database::pdo();
        $cycles = Database::table('reward_cycles');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$cycles}
             WHERE player_id = :p AND status = 'active'
             ORDER BY cycle_number ASC LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        return is_array($row) ? self::mapCycle($row) : null;
    }

    /** @return list<array> */
    public static function listCycles(int $playerId, ?string $status = null): array
    {
        $pdo = Database::pdo();
        $cycles = Database::table('reward_cycles');
        if ($status !== null) {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$cycles} WHERE player_id = :p AND status = :s
                 ORDER BY cycle_number DESC"
            );
            $stmt->execute([':p' => $playerId, ':s' => $status]);
        } else {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$cycles} WHERE player_id = :p ORDER BY cycle_number ASC"
            );
            $stmt->execute([':p' => $playerId]);
        }
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = self::mapCycle($row);
        }
        return $out;
    }

    public static function markDelivered(
        int $accountId,
        int $playerId,
        int $cycleId,
        int $robuxAmount,
        string $deliveryDateLocal,
        string $note = ''
    ): array {
        if (!AuthService::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        $pdo = Database::pdo();
        $cycles = Database::table('reward_cycles');
        $now = MadridTime::utcNowString();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$cycles} WHERE id = :id AND player_id = :p LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([':id' => $cycleId, ':p' => $playerId]);
            $row = $stmt->fetch();
            if (!is_array($row)) {
                Http::error(404, 'not_found', 'Premio no encontrado.');
            }
            if (($row['status'] ?? '') !== 'pending_delivery') {
                Http::error(409, 'already_handled', 'Este premio ya no está pendiente de entrega.');
            }

            $before = self::mapCycle($row);
            $pdo->prepare(
                "UPDATE {$cycles}
                 SET status = 'delivered',
                     delivered_at = :da,
                     delivered_by_account_id = :acc,
                     robux_amount = :r,
                     delivery_note = :n,
                     delivery_date_local = :dd,
                     updated_at = :u
                 WHERE id = :id"
            )->execute([
                ':da' => $now,
                ':acc' => $accountId,
                ':r' => max(0, $robuxAmount),
                ':n' => mb_substr(trim($note), 0, 255),
                ':dd' => $deliveryDateLocal,
                ':u' => $now,
                ':id' => $cycleId,
            ]);

            $stmt->execute([':id' => $cycleId, ':p' => $playerId]);
            $afterRow = $stmt->fetch();
            $after = is_array($afterRow) ? self::mapCycle($afterRow) : $before;

            AdultAudit::log($accountId, $playerId, 'reward_deliver', $before, $after, [
                'cycleId' => $cycleId,
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::publicRewardState($playerId);
    }

    /**
     * Anula una entrega errónea: el ciclo vuelve a pending_delivery.
     * No borra el historial: queda registro en adult_actions.
     */
    public static function voidDelivery(
        int $accountId,
        int $playerId,
        int $cycleId,
        string $reason
    ): array {
        if (!AuthService::accountOwnsPlayer($accountId, $playerId)) {
            Http::error(403, 'forbidden', 'No tienes permiso sobre este perfil.');
        }
        $reason = trim($reason);
        if ($reason === '' || mb_strlen($reason) < 3) {
            Http::error(400, 'reason_required', 'Indica un motivo para anular la entrega.');
        }

        $pdo = Database::pdo();
        $cycles = Database::table('reward_cycles');
        $now = MadridTime::utcNowString();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT * FROM {$cycles} WHERE id = :id AND player_id = :p LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([':id' => $cycleId, ':p' => $playerId]);
            $row = $stmt->fetch();
            if (!is_array($row)) {
                Http::error(404, 'not_found', 'Premio no encontrado.');
            }
            if (($row['status'] ?? '') !== 'delivered') {
                Http::error(409, 'not_delivered', 'Solo se pueden anular premios ya entregados.');
            }

            $before = self::mapCycle($row);
            $pdo->prepare(
                "UPDATE {$cycles}
                 SET status = 'pending_delivery',
                     voided_at = :va,
                     voided_by_account_id = :acc,
                     void_reason = :vr,
                     delivered_at = NULL,
                     delivered_by_account_id = NULL,
                     robux_amount = NULL,
                     delivery_note = NULL,
                     delivery_date_local = NULL,
                     updated_at = :u
                 WHERE id = :id"
            )->execute([
                ':va' => $now,
                ':acc' => $accountId,
                ':vr' => mb_substr($reason, 0, 255),
                ':u' => $now,
                ':id' => $cycleId,
            ]);

            $stmt->execute([':id' => $cycleId, ':p' => $playerId]);
            $afterRow = $stmt->fetch();
            $after = is_array($afterRow) ? self::mapCycle($afterRow) : $before;

            AdultAudit::log($accountId, $playerId, 'reward_void_delivery', $before, $after, [
                'reason' => $reason,
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::publicRewardState($playerId);
    }

    private static function mapCycle(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'cycleNumber' => (int) $row['cycle_number'],
            'targetPoints' => (int) $row['target_points'],
            'pointsToward' => (int) $row['points_toward'],
            'status' => (string) $row['status'],
            'earnedAt' => $row['earned_at'],
            'deliveredAt' => $row['delivered_at'],
            'deliveredByAccountId' => $row['delivered_by_account_id'] === null
                ? null
                : (int) $row['delivered_by_account_id'],
            'robuxAmount' => $row['robux_amount'] === null ? null : (int) $row['robux_amount'],
            'deliveryNote' => $row['delivery_note'],
            'deliveryDateLocal' => $row['delivery_date_local'],
            'voidedAt' => $row['voided_at'] ?? null,
            'voidReason' => $row['void_reason'] ?? null,
        ];
    }

    private static function loadActiveCycleRow(PDO $pdo, int $playerId, int $cycleNumber): ?array
    {
        $cycles = Database::table('reward_cycles');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$cycles} WHERE player_id = :p AND cycle_number = :n LIMIT 1"
        );
        $stmt->execute([':p' => $playerId, ':n' => $cycleNumber]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    private static function latestPendingCycle(PDO $pdo, int $playerId): ?array
    {
        $cycles = Database::table('reward_cycles');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$cycles}
             WHERE player_id = :p AND status = 'pending_delivery'
             ORDER BY cycle_number ASC LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }
}
