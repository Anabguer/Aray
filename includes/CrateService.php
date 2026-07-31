<?php

declare(strict_types=1);

/**
 * Cajas: tirada en servidor (fuente oficial), choose / open / claim.
 * RNG determinista por playerId+sessionId para alinear UX optimista del cliente.
 */
final class CrateService
{
    public const PITY_AFTER = 5;
    public const CHOICE_CHANCE = 0.3;
    public const ENERGY_OVERFLOW_TO_COINS = 0;

    /** @var array<string, float> */
    private const DROP_CHANCE = [
        'train' => 0.2,
        'challenge' => 0.25,
        'match' => 0.2,
        'misses' => 0.2,
        'missionOfDay' => 0.35,
        'firstMastery' => 1.0,
        'learn' => 0.0,
        'random' => 0.2,
    ];

    /** @var array<string, int> */
    private const RARITY_WEIGHTS = [
        'normal' => 72,
        'especial' => 23,
        'epica' => 5,
    ];

    /** @var array<string, list<array{kind:string,amount:int}>> */
    private const REWARDS = [
        'normal' => [
            ['kind' => 'energy', 'amount' => 20],
            ['kind' => 'energy', 'amount' => 30],
            ['kind' => 'energy', 'amount' => 40],
            ['kind' => 'energy', 'amount' => 50],
        ],
        'especial' => [
            ['kind' => 'energy', 'amount' => 50],
            ['kind' => 'energy', 'amount' => 60],
            ['kind' => 'energy', 'amount' => 80],
            ['kind' => 'energy', 'amount' => 100],
        ],
        'epica' => [
            ['kind' => 'energy', 'amount' => 100],
            ['kind' => 'energy', 'amount' => 120],
            ['kind' => 'energy', 'amount' => 160],
            ['kind' => 'energy', 'amount' => 200],
        ],
    ];

    /**
     * Tirada idempotente tras insertar la sesión (dentro o fuera de la misma TX).
     *
     * @param list<int> $newlyMasteredTables
     */
    public static function rollAfterSession(
        PDO $pdo,
        int $playerId,
        string $sessionId,
        string $mode,
        bool $isMissionOfDay,
        array $newlyMasteredTables
    ): void {
        if ($mode === 'learn') {
            return;
        }

        $crateTable = Database::table('crates');
        $exists = $pdo->prepare(
            "SELECT id FROM {$crateTable} WHERE player_id = :p AND completion_id = :c LIMIT 1"
        );
        $exists->execute([':p' => $playerId, ':c' => $sessionId]);
        if ($exists->fetch()) {
            return;
        }

        $progTable = Database::table('player_progress');
        $pstmt = $pdo->prepare(
            "SELECT crate_pity_without FROM {$progTable} WHERE player_id = :p LIMIT 1 FOR UPDATE"
        );
        $pstmt->execute([':p' => $playerId]);
        $prog = $pstmt->fetch();
        $pity = is_array($prog) ? (int) $prog['crate_pity_without'] : 0;

        $activity = self::resolveActivity($mode, $isMissionOfDay, $newlyMasteredTables);
        $chance = self::DROP_CHANCE[$activity] ?? 0.2;
        $rng = self::rng("crate-roll:{$playerId}:{$sessionId}");
        $pityHit = ($pity + 1) >= self::PITY_AFTER;
        $drops = $activity === 'firstMastery' || $pityHit || $rng() < $chance;
        $now = MadridTime::utcNowString();

        if (!$drops) {
            $pdo->prepare(
                "UPDATE {$progTable}
                 SET crate_pity_without = crate_pity_without + 1, updated_at = :now
                 WHERE player_id = :p"
            )->execute([':now' => $now, ':p' => $playerId]);

            // Marca de tirada sin premio (idempotencia)
            $pdo->prepare(
                "INSERT INTO {$crateTable}
                 (player_id, completion_id, rarity, is_choice, options_json,
                  chosen_index, reward_kind, reward_amount, status, rolled_at)
                 VALUES
                 (:p, :c, 'none', 0, '[]', NULL, NULL, NULL, 'no_drop', :now)"
            )->execute([':p' => $playerId, ':c' => $sessionId, ':now' => $now]);
            return;
        }

        $isChoice = $rng() < self::CHOICE_CHANCE;
        $options = $isChoice ? self::makeChoicePair($rng) : [self::makeOption($rng)];
        $primary = $options[0];
        $status = $isChoice ? 'pending_choice' : 'pending_open';
        $chosen = $isChoice ? null : 0;
        $optionsJson = json_encode($options, JSON_UNESCAPED_UNICODE);

        $pdo->prepare(
            "UPDATE {$progTable}
             SET crate_pity_without = 0, updated_at = :now
             WHERE player_id = :p"
        )->execute([':now' => $now, ':p' => $playerId]);

        $pdo->prepare(
            "INSERT INTO {$crateTable}
             (player_id, completion_id, rarity, is_choice, options_json,
              chosen_index, reward_kind, reward_amount, status, rolled_at)
             VALUES
             (:p, :c, :r, :ic, :oj, :ci, :rk, :ra, :st, :now)"
        )->execute([
            ':p' => $playerId,
            ':c' => $sessionId,
            ':r' => $primary['rarity'],
            ':ic' => $isChoice ? 1 : 0,
            ':oj' => $optionsJson,
            ':ci' => $chosen,
            ':rk' => $primary['reward']['kind'],
            ':ra' => $primary['reward']['amount'],
            ':st' => $status,
            ':now' => $now,
        ]);
    }

    public static function choose(int $playerId, string $completionId, int $index): array
    {
        $pdo = Database::pdo();
        $crateTable = Database::table('crates');
        $pdo->beginTransaction();
        try {
            $row = self::lockCrate($pdo, $playerId, $completionId);
            if ((string) $row['status'] !== 'pending_choice') {
                $pdo->commit();
                return self::publicPending($row);
            }
            $options = json_decode((string) $row['options_json'], true);
            if (!is_array($options) || !isset($options[$index]) || !is_array($options[$index])) {
                Http::error(400, 'invalid_choice', 'Opción de caja no válida.');
            }
            $opt = $options[$index];
            $rarity = (string) ($opt['rarity'] ?? 'normal');
            $kind = (string) ($opt['reward']['kind'] ?? '');
            $amount = (int) ($opt['reward']['amount'] ?? 0);
            $pdo->prepare(
                "UPDATE {$crateTable}
                 SET chosen_index = :i, rarity = :r, reward_kind = :k, reward_amount = :a,
                     status = 'pending_open'
                 WHERE id = :id"
            )->execute([
                ':i' => $index,
                ':r' => $rarity,
                ':k' => $kind,
                ':a' => $amount,
                ':id' => (int) $row['id'],
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::getPendingForPlayer($playerId) ?? [];
    }

    public static function open(int $playerId, string $completionId): array
    {
        $pdo = Database::pdo();
        $crateTable = Database::table('crates');
        $pdo->beginTransaction();
        try {
            $row = self::lockCrate($pdo, $playerId, $completionId);
            $status = (string) $row['status'];
            if ($status === 'pending_claim' || $status === 'claimed') {
                $pdo->commit();
                return self::publicPending($row);
            }
            if ($status !== 'pending_open' && $status !== 'pending_choice') {
                Http::error(409, 'crate_not_openable', 'Esta caja no se puede abrir.');
            }
            if ($row['chosen_index'] === null) {
                Http::error(409, 'crate_needs_choice', 'Elige una opción antes de abrir.');
            }
            $now = MadridTime::utcNowString();
            $pdo->prepare(
                "UPDATE {$crateTable}
                 SET status = 'pending_claim', opened_at = :now
                 WHERE id = :id"
            )->execute([':now' => $now, ':id' => (int) $row['id']]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return self::getPendingForPlayer($playerId) ?? [];
    }

    /**
     * Aplica premio una vez (idempotente). Devuelve snapshot-friendly info.
     *
     * @return array{applied:bool,adjustmentNote:?string,pending:?array}
     */
    public static function claim(int $playerId, string $completionId): array
    {
        $pdo = Database::pdo();
        $crateTable = Database::table('crates');
        $progTable = Database::table('player_progress');
        $applied = false;
        $note = null;
        $rewardKind = null;
        $rewardAmount = 0;
        $energyToGrant = 0;

        $pdo->beginTransaction();
        try {
            $row = self::lockCrate($pdo, $playerId, $completionId);
            $status = (string) $row['status'];
            if ($status === 'claimed') {
                $pdo->commit();
                return ['applied' => false, 'adjustmentNote' => null, 'pending' => null];
            }
            if ($status !== 'pending_claim') {
                // Autocompletar open si ya eligió
                if ($status === 'pending_open' && $row['chosen_index'] !== null) {
                    $nowOpen = MadridTime::utcNowString();
                    $pdo->prepare(
                        "UPDATE {$crateTable}
                         SET status = 'pending_claim', opened_at = COALESCE(opened_at, :now)
                         WHERE id = :id"
                    )->execute([':now' => $nowOpen, ':id' => (int) $row['id']]);
                    $row['status'] = 'pending_claim';
                } else {
                    Http::error(409, 'crate_not_claimable', 'Abre la caja antes de recoger el premio.');
                }
            }

            $rewardKind = (string) ($row['reward_kind'] ?? '');
            $rewardAmount = (int) ($row['reward_amount'] ?? 0);
            if ($rewardKind !== 'energy' || $rewardAmount <= 0) {
                Http::error(500, 'crate_reward_invalid', 'Premio de caja inválido (solo energía).');
            }

            $now = MadridTime::utcNowString();

            // Marcar claimed antes de energía (dedupe vía app_settings).
            $pdo->prepare(
                "UPDATE {$crateTable}
                 SET status = 'claimed', claimed_at = :now
                 WHERE id = :id"
            )->execute([':now' => $now, ':id' => (int) $row['id']]);

            $energyToGrant = $rewardAmount;

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        if ($energyToGrant > 0) {
            $settings = Database::table('app_settings');
            $dedupeKey = 'ceg:' . substr(hash('sha256', $completionId), 0, 40);
            $ins = Database::pdo()->prepare(
                "INSERT IGNORE INTO {$settings} (setting_key, setting_value, updated_at)
                 VALUES (:k, '1', :now)"
            );
            $ins->execute([':k' => $dedupeKey, ':now' => MadridTime::utcNowString()]);
            if ($ins->rowCount() > 0) {
                $grantId = 'crate-energy-' . $completionId;
                $grant = RewardCycleService::grantPoints($playerId, $energyToGrant, $grantId, null, true);
                $granted = (int) ($grant['granted'] ?? 0);
                $applied = true;
            } else {
                $applied = false;
            }
        }

        return [
            'applied' => $applied,
            'adjustmentNote' => $note,
            'pending' => self::getPendingForPlayer($playerId),
        ];
    }

    public static function getPendingForPlayer(int $playerId): ?array
    {
        $pdo = Database::pdo();
        $crateTable = Database::table('crates');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$crateTable}
             WHERE player_id = :p
               AND status IN ('pending_choice','pending_open','pending_claim')
             ORDER BY id DESC LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        return is_array($row) ? self::publicPending($row) : null;
    }

    /** Forma compatible con PendingCrate del cliente. */
    public static function publicPending(array $row): array
    {
        $options = json_decode((string) ($row['options_json'] ?? '[]'), true);
        if (!is_array($options)) {
            $options = [];
        }
        $status = (string) ($row['status'] ?? '');
        $chosen = $row['chosen_index'] === null ? null : (int) $row['chosen_index'];
        $kind = $row['reward_kind'] !== null ? (string) $row['reward_kind'] : null;
        $amount = $row['reward_amount'] === null ? null : (int) $row['reward_amount'];
        $reward = ($kind !== null && $amount !== null)
            ? ['kind' => $kind, 'amount' => $amount]
            : (isset($options[0]['reward']) ? $options[0]['reward'] : ['kind' => 'energy', 'amount' => 0]);

        return [
            'completionId' => (string) $row['completion_id'],
            'rarity' => (string) ($row['rarity'] ?? 'normal'),
            'isChoice' => (bool) $row['is_choice'],
            'options' => $options,
            'chosenIndex' => $chosen,
            'rewardKind' => $kind,
            'rewardAmount' => $amount,
            'reward' => $reward,
            'opened' => $status === 'pending_claim' || $status === 'claimed',
            'status' => $status,
        ];
    }

    // ─────────────────────────── helpers ───────────────────────────────────

    /** @param list<int> $newlyMastered */
    private static function resolveActivity(string $mode, bool $isMissionOfDay, array $newlyMastered): string
    {
        if ($newlyMastered !== []) {
            return 'firstMastery';
        }
        if ($isMissionOfDay) {
            return 'missionOfDay';
        }
        if (isset(self::DROP_CHANCE[$mode])) {
            return $mode;
        }
        return 'train';
    }

    /** @return callable(): float */
    public static function rng(string $seed): callable
    {
        $bin = hash('sha256', $seed, true);
        $state = unpack('N', substr($bin, 0, 4))[1];
        return static function () use (&$state): float {
            $state = (int) ((1103515245 * $state + 12345) & 0x7fffffff);
            return $state / 0x7fffffff;
        };
    }

    /** @param callable(): float $rng */
    private static function makeOption(callable $rng): array
    {
        $rarity = self::pickRarity($rng);
        return self::makeOptionOfRarity($rarity, $rng);
    }

    /**
     * Pareja del modal: una normal (“buena”) y otra especial/épica con más energía.
     *
     * @param callable(): float $rng
     * @return list<array{rarity:string,reward:array{kind:string,amount:int}}>
     */
    private static function makeChoicePair(callable $rng): array
    {
        $safe = self::makeOptionOfRarity('normal', $rng);
        $jackpotRarity = $rng() < 0.65 ? 'especial' : 'epica';
        $jackpot = self::makeOptionOfRarity($jackpotRarity, $rng);

        $safeAmount = (int) $safe['reward']['amount'];
        if ((int) $jackpot['reward']['amount'] <= $safeAmount) {
            $better = [];
            foreach (self::REWARDS[$jackpotRarity] as $reward) {
                if ((int) $reward['amount'] > $safeAmount) {
                    $better[] = $reward;
                }
            }
            if ($better !== []) {
                $jackpot = [
                    'rarity' => $jackpotRarity,
                    'reward' => $better[(int) floor($rng() * count($better))],
                ];
            } else {
                $epicBetter = [];
                foreach (self::REWARDS['epica'] as $reward) {
                    if ((int) $reward['amount'] > $safeAmount) {
                        $epicBetter[] = $reward;
                    }
                }
                $jackpot = [
                    'rarity' => 'epica',
                    'reward' => $epicBetter !== []
                        ? $epicBetter[(int) floor($rng() * count($epicBetter))]
                        : self::REWARDS['epica'][count(self::REWARDS['epica']) - 1],
                ];
            }
        }

        return $rng() < 0.5 ? [$safe, $jackpot] : [$jackpot, $safe];
    }

    /**
     * @param callable(): float $rng
     * @return array{rarity:string,reward:array{kind:string,amount:int}}
     */
    private static function makeOptionOfRarity(string $rarity, callable $rng): array
    {
        $pool = self::REWARDS[$rarity] ?? self::REWARDS['normal'];
        $reward = $pool[(int) floor($rng() * count($pool))];
        return ['rarity' => $rarity, 'reward' => $reward];
    }

    /** @param callable(): float $rng */
    private static function pickRarity(callable $rng): string
    {
        $total = array_sum(self::RARITY_WEIGHTS);
        $ticket = $rng() * $total;
        foreach (self::RARITY_WEIGHTS as $rarity => $weight) {
            $ticket -= $weight;
            if ($ticket <= 0) {
                return $rarity;
            }
        }
        return 'normal';
    }

    private static function lockCrate(PDO $pdo, int $playerId, string $completionId): array
    {
        $completionId = trim($completionId);
        if ($completionId === '' || strlen($completionId) > 64) {
            Http::error(400, 'invalid_completion_id', 'completionId inválido.');
        }
        $crateTable = Database::table('crates');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$crateTable}
             WHERE player_id = :p AND completion_id = :c LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([':p' => $playerId, ':c' => $completionId]);
        $row = $stmt->fetch();
        if (!is_array($row) || (string) ($row['status'] ?? '') === 'no_drop') {
            Http::error(404, 'crate_not_found', 'No hay caja pendiente para esta partida.');
        }
        return $row;
    }
}
