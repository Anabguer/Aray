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

$accountId = AuthService::requireAdultLinkedToPlayer($playerId);
$overview = AdultDashboardService::overview($accountId, $playerId);

$subject = isset($_GET['subjectId']) && is_string($_GET['subjectId']) ? $_GET['subjectId'] : null;
$block = isset($_GET['blockId']) && is_string($_GET['blockId']) ? $_GET['blockId'] : null;
$skill = isset($_GET['skillId']) && is_string($_GET['skillId']) ? $_GET['skillId'] : null;
$course = isset($_GET['courseId']) && is_string($_GET['courseId']) ? $_GET['courseId'] : null;

$overview['educationReport'] = AdultDashboardService::educationReport(
    $playerId,
    $course,
    $subject,
    $block,
    $skill
);

Http::ok([
    'dashboard' => $overview,
    'csrf' => Csrf::token(),
]);
