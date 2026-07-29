<?php

declare(strict_types=1);

/**
 * Curso escolar del jugador + asignaciones adultas.
 * Cambiar de curso NO reinicia XP, monedas, Robux, premios, logros ni dominio.
 */
final class PlayerCourseService
{
    private const VALID_COURSES = ['primary-3', 'primary-4', 'primary-5'];
    private const VALID_MODES = ['standard', 'review'];
    private const VALID_ROLES = ['recommended', 'mandatory', 'free', 'review', 'hidden'];

    public static function getSchoolProfile(int $playerId): array
    {
        $pdo = Database::pdo();
        $players = Database::table('player_profiles');
        $stmt = $pdo->prepare(
            "SELECT id, current_course_id, course_mode, course_started_at FROM {$players} WHERE id = :p LIMIT 1"
        );
        $stmt->execute([':p' => $playerId]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            Http::error(404, 'player_missing', 'Perfil no encontrado.');
        }

        $courseId = (string) ($row['current_course_id'] ?? '');
        if ($courseId === '' || !in_array($courseId, self::VALID_COURSES, true)) {
            self::ensureDefaultCourse($playerId);
            $courseId = 'primary-3';
            $mode = 'review';
            $startedAt = MadridTime::utcNowString();
        } else {
            $mode = (string) ($row['course_mode'] ?? 'review');
            if (!in_array($mode, self::VALID_MODES, true)) {
                $mode = $courseId === 'primary-3' ? 'review' : 'standard';
            }
            $startedAt = $row['course_started_at'] ?: MadridTime::utcNowString();
        }

        return [
            'currentCourseId' => $courseId,
            'courseMode' => $mode,
            'courseStartedAt' => $startedAt,
            'history' => self::listHistory($playerId),
            'activityAssignments' => self::listAssignments($playerId),
        ];
    }

    public static function ensureDefaultCourse(int $playerId): void
    {
        $pdo = Database::pdo();
        $players = Database::table('player_profiles');
        $now = MadridTime::utcNowString();
        $pdo->prepare(
            "UPDATE {$players}
             SET current_course_id = COALESCE(NULLIF(current_course_id, ''), 'primary-3'),
                 course_mode = COALESCE(NULLIF(course_mode, ''), 'review'),
                 course_started_at = COALESCE(course_started_at, :n)
             WHERE id = :p"
        )->execute([':n' => $now, ':p' => $playerId]);
    }

    /**
     * Cambia el curso activo. Conserva todo el progreso del jugador.
     *
     * @return array{school: array<string,mixed>}
     */
    public static function setCourse(int $accountId, int $playerId, string $courseId, string $mode): array
    {
        AuthService::requireAdultLinkedToPlayer($playerId);
        if (!in_array($courseId, self::VALID_COURSES, true)) {
            Http::error(400, 'invalid_course', 'Curso no válido.');
        }
        if (!in_array($mode, self::VALID_MODES, true)) {
            Http::error(400, 'invalid_mode', 'Modo de curso no válido.');
        }

        $before = self::getSchoolProfile($playerId);
        if (
            $before['currentCourseId'] === $courseId
            && $before['courseMode'] === $mode
        ) {
            return ['school' => $before];
        }

        $pdo = Database::pdo();
        $players = Database::table('player_profiles');
        $history = Database::table('player_course_history');
        $now = MadridTime::utcNowString();

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                "INSERT INTO {$history} (player_id, course_id, course_mode, started_at, ended_at, created_at)
                 VALUES (:p, :c, :m, :s, :e, :cr)"
            )->execute([
                ':p' => $playerId,
                ':c' => $before['currentCourseId'],
                ':m' => $before['courseMode'],
                ':s' => $before['courseStartedAt'],
                ':e' => $now,
                ':cr' => $now,
            ]);

            $pdo->prepare(
                "UPDATE {$players}
                 SET current_course_id = :c, course_mode = :m, course_started_at = :s
                 WHERE id = :p"
            )->execute([
                ':c' => $courseId,
                ':m' => $mode,
                ':s' => $now,
                ':p' => $playerId,
            ]);

            AdultAudit::log($accountId, $playerId, 'course_change', $before, [
                'currentCourseId' => $courseId,
                'courseMode' => $mode,
                'courseStartedAt' => $now,
            ], [
                'note' => 'Cambio de curso sin reiniciar progreso',
            ]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return ['school' => self::getSchoolProfile($playerId)];
    }

    /**
     * @param array<string, string|null> $assignments activityId => role|null (null = borrar override)
     * @return array{activityAssignments: array<string,string>}
     */
    public static function setAssignments(int $accountId, int $playerId, array $assignments): array
    {
        AuthService::requireAdultLinkedToPlayer($playerId);
        $pdo = Database::pdo();
        $table = Database::table('player_activity_assignments');
        $activities = Database::table('activities');

        $before = self::listAssignments($playerId);
        $pdo->beginTransaction();
        try {
            foreach ($assignments as $activityId => $role) {
                $activityId = (string) $activityId;
                if ($activityId === '') {
                    continue;
                }
                $check = $pdo->prepare("SELECT id FROM {$activities} WHERE id = :id LIMIT 1");
                $check->execute([':id' => $activityId]);
                if (!$check->fetch()) {
                    Http::error(400, 'invalid_activity', 'Actividad no encontrada: ' . $activityId);
                }

                if ($role === null || $role === '') {
                    $pdo->prepare(
                        "DELETE FROM {$table} WHERE player_id = :p AND activity_id = :a"
                    )->execute([':p' => $playerId, ':a' => $activityId]);
                    continue;
                }
                $role = (string) $role;
                if (!in_array($role, self::VALID_ROLES, true)) {
                    Http::error(400, 'invalid_role', 'Rol no válido.');
                }
                $pdo->prepare(
                    "INSERT INTO {$table} (player_id, activity_id, role_code, updated_by_account_id)
                     VALUES (:p, :a, :r, :acc)
                     ON DUPLICATE KEY UPDATE role_code = VALUES(role_code),
                       updated_by_account_id = VALUES(updated_by_account_id)"
                )->execute([
                    ':p' => $playerId,
                    ':a' => $activityId,
                    ':r' => $role,
                    ':acc' => $accountId,
                ]);
            }

            AdultAudit::log($accountId, $playerId, 'activity_assignments', $before, self::listAssignments($playerId));
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return ['activityAssignments' => self::listAssignments($playerId)];
    }

    /** @return list<array<string,mixed>> */
    public static function listHistory(int $playerId): array
    {
        $pdo = Database::pdo();
        $t = Database::table('player_course_history');
        $stmt = $pdo->prepare(
            "SELECT course_id, course_mode, started_at, ended_at
             FROM {$t} WHERE player_id = :p ORDER BY started_at ASC"
        );
        $stmt->execute([':p' => $playerId]);
        $out = [];
        foreach ($stmt->fetchAll() ?: [] as $row) {
            $out[] = [
                'courseId' => (string) $row['course_id'],
                'mode' => (string) $row['course_mode'],
                'startedAt' => (string) $row['started_at'],
                'endedAt' => $row['ended_at'],
            ];
        }
        return $out;
    }

    /** @return array<string,string> */
    public static function listAssignments(int $playerId): array
    {
        $pdo = Database::pdo();
        $t = Database::table('player_activity_assignments');
        $stmt = $pdo->prepare(
            "SELECT activity_id, role_code FROM {$t} WHERE player_id = :p"
        );
        $stmt->execute([':p' => $playerId]);
        $out = [];
        foreach ($stmt->fetchAll() ?: [] as $row) {
            $out[(string) $row['activity_id']] = (string) $row['role_code'];
        }
        return $out;
    }

    /**
     * Actividades visibles para el niño según curso + overrides.
     *
     * @return list<array<string,mixed>>
     */
    public static function visibleActivitiesForPlayer(int $playerId): array
    {
        $school = self::getSchoolProfile($playerId);
        $courseId = $school['currentCourseId'];
        $overrides = $school['activityAssignments'];
        $pdo = Database::pdo();

        $map = Database::table('course_activity_map');
        $act = Database::table('activities');
        $stmt = $pdo->prepare(
            "SELECT a.*, m.role_code AS default_role, m.sort_order AS map_sort
             FROM {$map} m
             INNER JOIN {$act} a ON a.id = m.activity_id
             WHERE m.course_id = :c AND a.status = 'active'
             ORDER BY m.sort_order ASC"
        );
        $stmt->execute([':c' => $courseId]);
        $out = [];
        foreach ($stmt->fetchAll() ?: [] as $row) {
            $id = (string) $row['id'];
            $role = $overrides[$id] ?? (string) $row['default_role'];
            if ($role === 'hidden') {
                continue;
            }
            $config = json_decode((string) ($row['config_json'] ?? '{}'), true);
            $out[] = [
                'id' => $id,
                'title' => (string) $row['title'],
                'description' => (string) $row['description'],
                'skillId' => (string) $row['skill_id'],
                'exerciseType' => (string) $row['exercise_type'],
                'difficulty' => (string) $row['difficulty'],
                'role' => $role,
                'sortOrder' => (int) $row['map_sort'],
                'config' => is_array($config) ? $config : new stdClass(),
            ];
        }
        return $out;
    }
}
