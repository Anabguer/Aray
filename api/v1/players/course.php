<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

$playerId = isset($_GET['playerId']) ? (int) $_GET['playerId'] : 0;
if ($playerId < 1) {
    Http::error(400, 'invalid_player', 'Perfil no válido.');
}

AuthService::assertCanReadProgress($playerId);
PlayerCourseService::ensureDefaultCourse($playerId);

Http::ok([
    'school' => PlayerCourseService::getSchoolProfile($playerId),
    'visibleActivities' => PlayerCourseService::visibleActivitiesForPlayer($playerId),
    'csrf' => Csrf::token(),
]);
