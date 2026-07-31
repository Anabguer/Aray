<?php

declare(strict_types=1);

/**
 * Alta de familias (tutor + 1..N niños) y gestión posterior de perfiles.
 */
final class FamilyRegisterService
{
    private const VALID_COURSES = ['primary-3', 'primary-4', 'primary-5'];
    private const MAX_KIDS = 6;

    /**
     * @param array{
     *   login: string,
     *   password: string,
     *   displayName: string,
     *   pin: string,
     *   children: list<array{displayName: string, courseId: string}>
     * } $input
     * @return array<string, mixed>
     */
    public static function register(array $input): array
    {
        $login = mb_strtolower(trim((string) ($input['login'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        $displayName = trim((string) ($input['displayName'] ?? ''));
        $pin = preg_replace('/\D+/', '', (string) ($input['pin'] ?? '')) ?? '';
        $children = $input['children'] ?? [];

        if (!is_array($children)) {
            Http::error(400, 'invalid_children', 'Indica al menos un niño.');
        }

        self::assertLogin($login);
        self::assertPassword($password);
        self::assertDisplayName($displayName, 'Nombre del tutor');
        if (strlen($pin) !== 4) {
            Http::error(400, 'invalid_pin', 'El PIN debe tener 4 dígitos.');
        }
        if ($children === [] || count($children) > self::MAX_KIDS) {
            Http::error(400, 'invalid_children', 'Indica entre 1 y ' . self::MAX_KIDS . ' niños.');
        }

        $parsedKids = [];
        foreach ($children as $i => $child) {
            if (!is_array($child)) {
                Http::error(400, 'invalid_children', 'Datos de niño no válidos.');
            }
            $name = trim((string) ($child['displayName'] ?? ''));
            $courseId = trim((string) ($child['courseId'] ?? 'primary-3'));
            self::assertDisplayName($name, 'Nombre del niño');
            if (!in_array($courseId, self::VALID_COURSES, true)) {
                Http::error(400, 'invalid_course', 'Curso no válido.');
            }
            $parsedKids[] = ['displayName' => $name, 'courseId' => $courseId, 'index' => (int) $i];
        }

        RateLimit::assertAllowed('register', $login);

        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $exists = $pdo->prepare("SELECT id FROM {$accounts} WHERE login = :l LIMIT 1");
        $exists->execute([':l' => $login]);
        if ($exists->fetch()) {
            RateLimit::record('register', $login, false);
            Http::error(409, 'login_taken', 'Ese usuario ya está en uso. Elige otro.');
        }

        $now = MadridTime::utcNowString();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $pinHash = password_hash($pin, PASSWORD_DEFAULT);

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                "INSERT INTO {$accounts} (login, password_hash, adult_pin_hash, display_name, is_active, created_at, updated_at)
                 VALUES (:l, :h, :pin, :d, 1, :c, :u)"
            )->execute([
                ':l' => $login,
                ':h' => $passwordHash,
                ':pin' => $pinHash,
                ':d' => $displayName,
                ':c' => $now,
                ':u' => $now,
            ]);
            $accountId = (int) $pdo->lastInsertId();

            $playersOut = [];
            foreach ($parsedKids as $kid) {
                $playerId = self::insertPlayerRow(
                    $pdo,
                    $accountId,
                    $kid['displayName'],
                    $kid['courseId'],
                    $now
                );
                $playersOut[] = [
                    'id' => $playerId,
                    'slug' => self::slugOf($pdo, $playerId),
                    'displayName' => $kid['displayName'],
                    'avatarUrl' => null,
                    'courseId' => $kid['courseId'],
                ];
            }

            AdultAudit::log($accountId, (int) $playersOut[0]['id'], 'family_register', null, [
                'login' => $login,
                'children' => count($playersOut),
            ]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            RateLimit::record('register', $login, false);
            throw $e;
        }

        RateLimit::record('register', $login, true);

        Session::regenerate();
        Session::setAdult($accountId, $displayName, $login);
        Csrf::token();

        $pdo->prepare(
            "UPDATE {$accounts} SET last_login_at = :at WHERE id = :id"
        )->execute([':at' => $now, ':id' => $accountId]);

        $label = 'PC de ' . $displayName;
        AuthService::authorizeDevice($accountId, (int) $playersOut[0]['id'], $label);

        return [
            'role' => 'adult',
            'account' => [
                'id' => $accountId,
                'login' => $login,
                'displayName' => $displayName,
            ],
            'players' => AuthService::playersForAccount($accountId),
            'device' => AuthService::deviceStatus(),
            'csrf' => Csrf::token(),
        ];
    }

    /**
     * Añade un niño a la cuenta adulta actual.
     *
     * @return array{player: array<string,mixed>, players: list<array<string,mixed>>}
     */
    public static function addChild(int $accountId, string $displayName, string $courseId): array
    {
        self::assertDisplayName($displayName, 'Nombre del niño');
        if (!in_array($courseId, self::VALID_COURSES, true)) {
            Http::error(400, 'invalid_course', 'Curso no válido.');
        }

        $existing = AuthService::playersForAccount($accountId);
        if (count($existing) >= self::MAX_KIDS) {
            Http::error(400, 'too_many_children', 'Máximo ' . self::MAX_KIDS . ' niños por familia.');
        }

        $pdo = Database::pdo();
        $now = MadridTime::utcNowString();
        $pdo->beginTransaction();
        try {
            $playerId = self::insertPlayerRow($pdo, $accountId, $displayName, $courseId, $now);
            AdultAudit::log($accountId, $playerId, 'player_create', null, [
                'displayName' => $displayName,
                'courseId' => $courseId,
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        $player = AuthService::findPlayerById($playerId);
        return [
            'player' => [
                'id' => $playerId,
                'slug' => is_array($player) ? (string) $player['slug'] : '',
                'displayName' => $displayName,
                'avatarUrl' => AvatarService::urlFromCode(
                    is_array($player) ? ($player['avatar_code'] ?? null) : null
                ),
                'courseId' => $courseId,
            ],
            'players' => AuthService::playersForAccount($accountId),
        ];
    }

    public static function updateAccountDisplayName(int $accountId, string $displayName): array
    {
        self::assertDisplayName($displayName, 'Nombre del tutor');
        $pdo = Database::pdo();
        $accounts = Database::table('accounts');
        $pdo->prepare(
            "UPDATE {$accounts} SET display_name = :d, updated_at = :u WHERE id = :id"
        )->execute([
            ':d' => $displayName,
            ':u' => MadridTime::utcNowString(),
            ':id' => $accountId,
        ]);
        Session::start();
        if (Session::accountId() === $accountId) {
            $login = (string) ($_SESSION['login'] ?? '');
            Session::setAdult($accountId, $displayName, $login);
        }
        return ['displayName' => $displayName];
    }

    public static function updatePlayerDisplayName(int $accountId, int $playerId, string $displayName): array
    {
        AuthService::requireAdultLinkedToPlayer($playerId);
        self::assertDisplayName($displayName, 'Nombre del niño');
        $pdo = Database::pdo();
        $players = Database::table('player_profiles');
        $pdo->prepare(
            "UPDATE {$players} SET display_name = :d, updated_at = :u WHERE id = :id"
        )->execute([
            ':d' => $displayName,
            ':u' => MadridTime::utcNowString(),
            ':id' => $playerId,
        ]);
        AdultAudit::log($accountId, $playerId, 'player_rename', null, ['displayName' => $displayName]);
        return [
            'player' => [
                'id' => $playerId,
                'displayName' => $displayName,
            ],
        ];
    }

    private static function insertPlayerRow(
        PDO $pdo,
        int $accountId,
        string $displayName,
        string $courseId,
        string $now
    ): int {
        $players = Database::table('player_profiles');
        $ap = Database::table('account_players');
        $prog = Database::table('player_progress');
        $goals = Database::table('reward_goals');
        $cycles = Database::table('reward_cycles');

        $slug = self::uniqueSlug($pdo, $displayName);
        $mode = $courseId === 'primary-3' ? 'review' : 'standard';

        $pdo->prepare(
            "INSERT INTO {$players}
             (slug, display_name, child_pin_hash, current_course_id, course_mode, course_started_at, is_active, created_at, updated_at)
             VALUES (:s, :d, NULL, :c, :m, :cs, 1, :cr, :u)"
        )->execute([
            ':s' => $slug,
            ':d' => $displayName,
            ':c' => $courseId,
            ':m' => $mode,
            ':cs' => $now,
            ':cr' => $now,
            ':u' => $now,
        ]);
        $playerId = (int) $pdo->lastInsertId();

        $pdo->prepare(
            "INSERT INTO {$ap} (account_id, player_id, relation_role, created_at)
             VALUES (:a, :p, 'owner', :c)"
        )->execute([':a' => $accountId, ':p' => $playerId, ':c' => $now]);

        $pdo->prepare(
            "INSERT INTO {$prog} (player_id, xp, coins, created_at, updated_at)
             VALUES (:p, 0, 0, :c, :u)"
        )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

        $pdo->prepare(
            "INSERT INTO {$goals}
             (player_id, goal_code, reward_label, target_points, daily_cap, points_total,
              goal_status, current_cycle_number, created_at, updated_at)
             VALUES (:p, 'robux-500', '500 Robux', 5000, 100, 0, 'active', 1, :c, :u)"
        )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

        $pdo->prepare(
            "INSERT INTO {$cycles}
             (player_id, cycle_number, target_points, points_toward, status, created_at, updated_at)
             VALUES (:p, 1, 5000, 0, 'active', :c, :u)"
        )->execute([':p' => $playerId, ':c' => $now, ':u' => $now]);

        return $playerId;
    }

    private static function uniqueSlug(PDO $pdo, string $displayName): string
    {
        $base = self::slugify($displayName);
        $pp = Database::table('player_profiles');
        for ($i = 0; $i < 12; $i++) {
            $suffix = bin2hex(random_bytes(2));
            $slug = mb_substr($base, 0, 24) . $suffix;
            $stmt = $pdo->prepare("SELECT 1 FROM {$pp} WHERE slug = :s LIMIT 1");
            $stmt->execute([':s' => $slug]);
            if (!$stmt->fetchColumn()) {
                return $slug;
            }
        }
        return 'j' . bin2hex(random_bytes(8));
    }

    private static function slugify(string $name): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        $raw = is_string($ascii) ? $ascii : $name;
        $slug = preg_replace('/[^a-z0-9]+/', '', mb_strtolower($raw)) ?? '';
        if ($slug === '' || mb_strlen($slug) < 2) {
            return 'jugador';
        }
        return $slug;
    }

    private static function slugOf(PDO $pdo, int $playerId): string
    {
        $pp = Database::table('player_profiles');
        $stmt = $pdo->prepare("SELECT slug FROM {$pp} WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $playerId]);
        $slug = $stmt->fetchColumn();
        return is_string($slug) ? $slug : '';
    }

    private static function assertLogin(string $login): void
    {
        if (!preg_match('/^[a-z0-9_]{3,32}$/', $login)) {
            Http::error(400, 'invalid_login', 'Usuario: 3–32 caracteres (letras, números o _).');
        }
    }

    private static function assertPassword(string $password): void
    {
        if (mb_strlen($password) < 8 || mb_strlen($password) > 200) {
            Http::error(400, 'invalid_password', 'La contraseña debe tener al menos 8 caracteres.');
        }
    }

    private static function assertDisplayName(string $name, string $label): void
    {
        $len = mb_strlen($name);
        if ($len < 2 || $len > 40) {
            Http::error(400, 'invalid_name', $label . ': entre 2 y 40 caracteres.');
        }
    }
}
