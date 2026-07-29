<?php
/**
 * Healthcheck mínimo del futuro API ARAY.
 * No conecta a base de datos ni expone secretos.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

echo json_encode([
    'ok' => true,
    'app' => 'ARAY',
    'phase' => 'shell',
    'message' => 'API preparatoria. Backend y tablas aún no implementados.',
    'tablePrefix' => 'arayapp_',
], JSON_UNESCAPED_UNICODE);
