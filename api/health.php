<?php
/**
 * Healthcheck legado — redirige mentalmente a v1.
 * Mantiene compatibilidad con comprobaciones antiguas.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

echo json_encode([
    'ok' => true,
    'app' => 'ARAY',
    'phase' => 1,
    'message' => 'Usa /api/v1/health.php para detalles.',
    'v1' => 'api/v1/health.php',
    'tablePrefix' => 'arayapp_',
], JSON_UNESCAPED_UNICODE);
