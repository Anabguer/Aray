<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/includes/bootstrap.php';

Http::allowMethods(['POST']);
Http::requireDbConfigured();
Session::start();

$accountId = AuthService::requireAdult();
$body = Http::jsonRequest();
Csrf::requireValid(Csrf::fromRequest($body));

$out = ['csrf' => Csrf::token()];

if (isset($body['accountDisplayName']) && is_string($body['accountDisplayName'])) {
    $out['account'] = FamilyRegisterService::updateAccountDisplayName($accountId, $body['accountDisplayName']);
}

$playerId = isset($body['playerId']) ? (int) $body['playerId'] : 0;
if ($playerId > 0 && isset($body['playerDisplayName']) && is_string($body['playerDisplayName'])) {
    $out['player'] = FamilyRegisterService::updatePlayerDisplayName(
        $accountId,
        $playerId,
        $body['playerDisplayName']
    );
}

Http::ok($out);
