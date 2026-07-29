<?php

declare(strict_types=1);

final class ProgressRepository
{
    public static function getSnapshot(int $playerId): array
    {
        $pdo = Database::pdo();

        $progressTable = Database::table('player_progress');
        $stmt = $pdo->prepare("SELECT * FROM {$progressTable} WHERE player_id = :p LIMIT 1");
        $stmt->execute([':p' => $playerId]);
        $progress = $stmt->fetch();
        if (!is_array($progress)) {
            Http::error(404, 'progress_missing', 'Progreso no encontrado.');
        }

        $facts = [];
        $factTable = Database::table('fact_stats');
        $fstmt = $pdo->prepare("SELECT * FROM {$factTable} WHERE player_id = :p");
        $fstmt->execute([':p' => $playerId]);
        foreach ($fstmt->fetchAll() as $row) {
            $facts[(string) $row['fact_key']] = [
                'attempts' => (int) $row['attempts'],
                'correct' => (int) $row['correct'],
                'wrong' => (int) $row['wrong'],
                'weight' => (float) $row['weight'],
                'lastSeenAt' => $row['last_seen_at'],
            ];
        }

        $tables = [];
        $masteryTable = Database::table('table_mastery');
        $mstmt = $pdo->prepare("SELECT * FROM {$masteryTable} WHERE player_id = :p");
        $mstmt->execute([':p' => $playerId]);
        foreach ($mstmt->fetchAll() as $row) {
            $tables[(string) (int) $row['table_n']] = [
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

        $goalTable = Database::table('reward_goals');
        $gstmt = $pdo->prepare(
            "SELECT * FROM {$goalTable} WHERE player_id = :p AND goal_code = 'robux-500' LIMIT 1"
        );
        $gstmt->execute([':p' => $playerId]);
        $goal = $gstmt->fetch();

        $dailyDate = is_array($goal) ? $goal['daily_date'] : null;
        $dailyPoints = is_array($goal) ? (int) $goal['daily_points'] : 0;
        $playableToday = MadridTime::playableDate();
        if ($dailyDate !== $playableToday) {
            // Vista: el día jugable ya cambió en Madrid; no persistimos aquí en GET.
            $dailyPoints = 0;
            $dailyDate = $playableToday;
        }

        $reward = [
            'goalCode' => is_array($goal) ? (string) $goal['goal_code'] : 'robux-500',
            'rewardLabel' => is_array($goal) ? (string) $goal['reward_label'] : '500 Robux',
            'targetPoints' => is_array($goal) ? (int) $goal['target_points'] : 300,
            'dailyCap' => is_array($goal) ? (int) $goal['daily_cap'] : 10,
            'pointsTotal' => is_array($goal) ? (int) $goal['points_total'] : 0,
            'dailyDate' => $dailyDate,
            'dailyPoints' => $dailyPoints,
            'goalStatus' => is_array($goal) ? (string) $goal['goal_status'] : 'active',
            'validatedAt' => is_array($goal) ? $goal['validated_at'] : null,
        ];

        $crateTable = Database::table('crates');
        $cstmt = $pdo->prepare(
            "SELECT * FROM {$crateTable}
             WHERE player_id = :p
               AND status IN ('pending_choice','pending_open','pending_claim')
             ORDER BY id DESC LIMIT 1"
        );
        $cstmt->execute([':p' => $playerId]);
        $pendingCrate = $cstmt->fetch();
        $crates = [
            'pending' => null,
            'pityWithout' => (int) $progress['crate_pity_without'],
        ];
        if (is_array($pendingCrate)) {
            $options = json_decode((string) $pendingCrate['options_json'], true);
            $crates['pending'] = [
                'completionId' => (string) $pendingCrate['completion_id'],
                'rarity' => (string) $pendingCrate['rarity'],
                'isChoice' => (bool) $pendingCrate['is_choice'],
                'options' => is_array($options) ? $options : [],
                'chosenIndex' => $pendingCrate['chosen_index'] === null ? null : (int) $pendingCrate['chosen_index'],
                'rewardKind' => $pendingCrate['reward_kind'],
                'rewardAmount' => $pendingCrate['reward_amount'] === null ? null : (int) $pendingCrate['reward_amount'],
                'status' => (string) $pendingCrate['status'],
            ];
        }

        return [
            'playerId' => $playerId,
            'xp' => (int) $progress['xp'],
            'coins' => (int) $progress['coins'],
            'bestStreak' => (int) $progress['best_streak'],
            'bestChallengeScore' => (int) $progress['best_challenge_score'],
            'soundMuted' => (bool) $progress['sound_muted'],
            'lastPracticeAt' => $progress['last_practice_at'],
            'localMigratedAt' => $progress['local_migrated_at'],
            'facts' => (object) $facts,
            'tables' => (object) $tables,
            'reward' => $reward,
            'crates' => $crates,
            'playableDate' => $playableToday,
            'serverTimeUtc' => MadridTime::utcNowString(),
        ];
    }
}
