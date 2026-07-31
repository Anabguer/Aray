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

        $rewardState = RewardCycleService::publicRewardState($playerId);
        $reward = [
            'goalCode' => $rewardState['goalCode'],
            'rewardLabel' => $rewardState['rewardLabel'],
            'targetPoints' => $rewardState['targetPoints'],
            'dailyCap' => $rewardState['dailyCap'],
            'pointsTotal' => $rewardState['pointsTotal'],
            'dailyDate' => $rewardState['dailyDate'],
            'dailyPoints' => $rewardState['dailyPoints'],
            'goalStatus' => $rewardState['goalStatus'],
            'currentCycleNumber' => $rewardState['currentCycleNumber'],
            'pendingPrize' => $rewardState['pendingPrize'],
            'deliveredPrizes' => $rewardState['deliveredPrizes'],
            'activeCycle' => $rewardState['activeCycle'],
            'validatedAt' => null,
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
            $crates['pending'] = CrateService::publicPending($pendingCrate);
        }

        $missionTable = Database::table('mission_completions');
        $missionsToday = [];
        $mstmt = $pdo->prepare(
            "SELECT mission_code FROM {$missionTable}
             WHERE player_id = :p AND mission_date = :d
             ORDER BY completed_at ASC"
        );
        $mstmt->execute([':p' => $playerId, ':d' => MadridTime::playableDate()]);
        foreach ($mstmt->fetchAll() as $mrow) {
            $missionsToday[] = (string) $mrow['mission_code'];
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
            'syncEpoch' => SyncEpochService::current(),
            'facts' => (object) $facts,
            'tables' => (object) $tables,
            'alphabet' => AlphabetSessionService::snapshotForPlayer($playerId),
            'reward' => $reward,
            'crates' => $crates,
            'missionsToday' => $missionsToday,
            'school' => PlayerCourseService::getSchoolProfile($playerId),
            'playableDate' => MadridTime::playableDate(),
            'serverTimeUtc' => MadridTime::utcNowString(),
        ];
    }
}
