<?php

declare(strict_types=1);

final class AdultAudit
{
    public static function log(
        int $accountId,
        int $playerId,
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?array $meta = null
    ): void {
        $pdo = Database::pdo();
        $table = Database::table('adult_actions');
        $stmt = $pdo->prepare(
            "INSERT INTO {$table} (account_id, player_id, action, before_json, after_json, meta_json, created_at)
             VALUES (:a, :p, :act, :b, :af, :m, :at)"
        );
        $stmt->execute([
            ':a' => $accountId,
            ':p' => $playerId,
            ':act' => $action,
            ':b' => $before === null ? null : json_encode($before, JSON_UNESCAPED_UNICODE),
            ':af' => $after === null ? null : json_encode($after, JSON_UNESCAPED_UNICODE),
            ':m' => $meta === null ? null : json_encode($meta, JSON_UNESCAPED_UNICODE),
            ':at' => MadridTime::utcNowString(),
        ]);
    }
}
