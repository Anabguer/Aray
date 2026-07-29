<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['GET']);
Http::requireDbConfigured();
Session::start();

Http::ok([
    'catalog' => CurriculumCatalogService::snapshot(),
    'csrf' => Csrf::token(),
]);
