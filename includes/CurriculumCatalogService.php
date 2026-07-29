<?php

declare(strict_types=1);

/** Catálogo educativo central (cursos, asignaturas, bloques, habilidades, actividades). */
final class CurriculumCatalogService
{
    public static function snapshot(): array
    {
        $pdo = Database::pdo();
        return [
            'courses' => self::fetchAll($pdo, 'courses', 'sort_order ASC'),
            'subjects' => self::fetchAll($pdo, 'subjects', 'sort_order ASC'),
            'blocks' => self::fetchAll($pdo, 'edu_blocks', 'sort_order ASC'),
            'skills' => self::fetchSkills($pdo),
            'activities' => self::fetchActivities($pdo),
            'courseActivityAssignments' => self::fetchCourseMap($pdo),
            'defaultCourseId' => 'primary-3',
        ];
    }

    /** @return list<array<string,mixed>> */
    private static function fetchAll(PDO $pdo, string $table, string $order): array
    {
        $t = Database::table($table);
        $rows = $pdo->query("SELECT * FROM {$t} ORDER BY {$order}")->fetchAll() ?: [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = self::mapRow($table, $row);
        }
        return $out;
    }

    /** @return list<array<string,mixed>> */
    private static function fetchSkills(PDO $pdo): array
    {
        $t = Database::table('skills');
        $rows = $pdo->query("SELECT * FROM {$t} ORDER BY sort_order ASC")->fetchAll() ?: [];
        $out = [];
        foreach ($rows as $row) {
            $courses = json_decode((string) ($row['recommended_courses'] ?? '[]'), true);
            $out[] = [
                'id' => (string) $row['id'],
                'blockId' => (string) $row['block_id'],
                'title' => (string) $row['title'],
                'description' => (string) $row['description'],
                'progressKey' => (string) $row['progress_key'],
                'progressKind' => (string) $row['progress_kind'],
                'recommendedCourses' => is_array($courses) ? $courses : [],
                'status' => (string) $row['status'],
                'sortOrder' => (int) $row['sort_order'],
            ];
        }
        return $out;
    }

    /** @return list<array<string,mixed>> */
    private static function fetchActivities(PDO $pdo): array
    {
        $t = Database::table('activities');
        $rows = $pdo->query("SELECT * FROM {$t} ORDER BY sort_order ASC")->fetchAll() ?: [];
        $out = [];
        foreach ($rows as $row) {
            $rewards = json_decode((string) ($row['rewards_json'] ?? '{}'), true);
            $config = json_decode((string) ($row['config_json'] ?? '{}'), true);
            $out[] = [
                'id' => (string) $row['id'],
                'title' => (string) $row['title'],
                'description' => (string) $row['description'],
                'skillId' => (string) $row['skill_id'],
                'exerciseType' => (string) $row['exercise_type'],
                'difficulty' => (string) $row['difficulty'],
                'status' => (string) $row['status'],
                'sortOrder' => (int) $row['sort_order'],
                'rewards' => is_array($rewards) ? $rewards : new stdClass(),
                'config' => is_array($config) ? $config : new stdClass(),
            ];
        }
        return $out;
    }

    /** @return list<array<string,mixed>> */
    private static function fetchCourseMap(PDO $pdo): array
    {
        $t = Database::table('course_activity_map');
        $rows = $pdo->query(
            "SELECT course_id, activity_id, role_code, sort_order FROM {$t} ORDER BY course_id, sort_order"
        )->fetchAll() ?: [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'courseId' => (string) $row['course_id'],
                'activityId' => (string) $row['activity_id'],
                'role' => (string) $row['role_code'],
                'sortOrder' => (int) $row['sort_order'],
            ];
        }
        return $out;
    }

    /** @param array<string,mixed> $row */
    private static function mapRow(string $table, array $row): array
    {
        if ($table === 'courses') {
            return [
                'id' => (string) $row['id'],
                'title' => (string) $row['title'],
                'shortTitle' => (string) $row['short_title'],
                'stage' => (string) $row['stage'],
                'grade' => (int) $row['grade_n'],
                'status' => (string) $row['status'],
                'sortOrder' => (int) $row['sort_order'],
            ];
        }
        if ($table === 'subjects') {
            return [
                'id' => (string) $row['id'],
                'title' => (string) $row['title'],
                'shortTitle' => (string) $row['short_title'],
                'description' => (string) $row['description'],
                'legacyHubId' => $row['legacy_hub_id'],
                'worldPath' => (string) $row['world_path'],
                'status' => (string) $row['status'],
                'sortOrder' => (int) $row['sort_order'],
            ];
        }
        return [
            'id' => (string) $row['id'],
            'subjectId' => (string) $row['subject_id'],
            'title' => (string) $row['title'],
            'description' => (string) $row['description'],
            'status' => (string) $row['status'],
            'sortOrder' => (int) $row['sort_order'],
        ];
    }
}
