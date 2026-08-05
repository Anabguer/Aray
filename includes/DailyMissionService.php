<?php

declare(strict_types=1);

/**
 * Misión diaria (slots por skill + reto) — fuente de verdad MySQL con merge monótono.
 */
final class DailyMissionService
{
    private const SKILLS = ['tables', 'calc', 'spelling', 'words', 'clocks', 'money'];

    /** Caps alineados con DAILY_TASKS del frontend. */
    private const CAPS = [
        'tables' => 6,
        'calc' => 5,
        'spelling' => 2,
        'words' => 2,
        'clocks' => 2,
        'money' => 1,
    ];

    /** Snapshot del día jugable (Madrid). */
    public static function snapshotForPlayer(int $playerId, ?string $playableDate = null): array
    {
        $date = $playableDate ?? MadridTime::playableDate();
        $row = self::fetchRow($playerId, $date);
        return self::rowToPublic($row, $date);
    }

    /**
     * Merge monótono: max por skill + OR en challenge_done.
     * @param array{date?:string,progress?:array,challengeDone?:bool} $incoming
     */
    public static function mergeFromClient(int $playerId, array $incoming): array
    {
        $today = MadridTime::playableDate();
        $clientDate = isset($incoming['date']) && is_string($incoming['date'])
            ? substr($incoming['date'], 0, 10)
            : $today;

        // Solo aceptamos el día jugable actual (evita reescrituras de días viejos).
        if ($clientDate !== $today) {
            return self::snapshotForPlayer($playerId, $today);
        }

        $progressIn = isset($incoming['progress']) && is_array($incoming['progress'])
            ? $incoming['progress']
            : [];
        $challengeIn = !empty($incoming['challengeDone']);

        $pdo = Database::pdo();
        $table = Database::table('daily_mission');
        $now = MadridTime::utcNowString();

        $existing = self::fetchRow($playerId, $today);
        $merged = [];
        foreach (self::SKILLS as $skill) {
            $col = self::columnForSkill($skill);
            $serverVal = is_array($existing) ? (int) ($existing[$col] ?? 0) : 0;
            $clientVal = isset($progressIn[$skill]) ? (int) $progressIn[$skill] : 0;
            $cap = self::CAPS[$skill] ?? 99;
            $merged[$skill] = max(0, min($cap, max($serverVal, $clientVal)));
        }
        $challengeDone = $challengeIn || (is_array($existing) && (int) ($existing['challenge_done'] ?? 0) === 1);

        $pdo->prepare(
            "INSERT INTO {$table}
             (player_id, mission_date, tables_units, calc_units, spelling_units, words_units, clocks_units, money_units, challenge_done, updated_at)
             VALUES
             (:p, :d, :t, :c, :s, :w, :cl, :m, :ch, :u)
             ON DUPLICATE KEY UPDATE
               tables_units = GREATEST(tables_units, VALUES(tables_units)),
               calc_units = GREATEST(calc_units, VALUES(calc_units)),
               spelling_units = GREATEST(spelling_units, VALUES(spelling_units)),
               words_units = GREATEST(words_units, VALUES(words_units)),
               clocks_units = GREATEST(clocks_units, VALUES(clocks_units)),
               money_units = GREATEST(money_units, VALUES(money_units)),
               challenge_done = GREATEST(challenge_done, VALUES(challenge_done)),
               updated_at = VALUES(updated_at)"
        )->execute([
            ':p' => $playerId,
            ':d' => $today,
            ':t' => $merged['tables'],
            ':c' => $merged['calc'],
            ':s' => $merged['spelling'],
            ':w' => $merged['words'],
            ':cl' => $merged['clocks'],
            ':m' => $merged['money'],
            ':ch' => $challengeDone ? 1 : 0,
            ':u' => $now,
        ]);

        return self::snapshotForPlayer($playerId, $today);
    }

    private static function fetchRow(int $playerId, string $date): ?array
    {
        $pdo = Database::pdo();
        $table = Database::table('daily_mission');
        $stmt = $pdo->prepare(
            "SELECT * FROM {$table} WHERE player_id = :p AND mission_date = :d LIMIT 1"
        );
        $stmt->execute([':p' => $playerId, ':d' => $date]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }

    private static function rowToPublic(?array $row, string $date): array
    {
        $progress = [];
        foreach (self::SKILLS as $skill) {
            $col = self::columnForSkill($skill);
            $progress[$skill] = is_array($row) ? max(0, (int) ($row[$col] ?? 0)) : 0;
        }
        return [
            'date' => $date,
            'progress' => $progress,
            'challengeDone' => is_array($row) && (int) ($row['challenge_done'] ?? 0) === 1,
        ];
    }

    private static function columnForSkill(string $skill): string
    {
        switch ($skill) {
            case 'calc':
                return 'calc_units';
            case 'spelling':
                return 'spelling_units';
            case 'words':
                return 'words_units';
            case 'clocks':
                return 'clocks_units';
            case 'money':
                return 'money_units';
            case 'tables':
            default:
                return 'tables_units';
        }
    }
}
