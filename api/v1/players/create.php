<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$accountId = AuthService::requireAdult();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$displayName = isset($body['displayName']) && is_string($body['displayName']) ? $body['displayName'] : '';
$courseId = isset($body['courseId']) && is_string($body['courseId']) ? $body['courseId'] : 'primary-3';

$result = FamilyRegisterService::addChild($accountId, $displayName, $courseId);
Http::ok(array_merge($result, ['csrf' => Csrf::token()]));
