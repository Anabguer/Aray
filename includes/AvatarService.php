<?php

declare(strict_types=1);

/** Subida y resolución de avatares de jugador (fotos del tutor). */
final class AvatarService
{
    private const MAX_BYTES = 2_097_152; // 2 MiB
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public static function storageDir(): string
    {
        $root = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
        if (!is_dir($root)) {
            if (!mkdir($root, 0755, true) && !is_dir($root)) {
                Http::error(500, 'upload_failed', 'No se pudo preparar la carpeta de avatares.');
            }
        }
        return $root;
    }

    public static function urlFromCode(?string $avatarCode): ?string
    {
        if ($avatarCode === null || $avatarCode === '') {
            return null;
        }
        if (strncmp($avatarCode, 'upload:', 7) === 0) {
            $file = substr($avatarCode, 7);
            if ($file === '' || preg_match('/^[a-zA-Z0-9._-]+$/', $file) !== 1) {
                return null;
            }
            $base = defined('BASE_URL') ? BASE_URL : '/aray/afkacademy/';
            return rtrim($base, '/') . '/uploads/avatars/' . $file;
        }
        return null;
    }

    /**
     * @param array{name?:string,type?:string,tmp_name?:string,error?:int,size?:int} $file
     * @return array{avatarCode: string, avatarUrl: string|null}
     */
    public static function uploadForPlayer(int $accountId, int $playerId, array $file): array
    {
        AuthService::requireAdultLinkedToPlayer($playerId);
        RateLimit::assertAllowed('avatar_upload', 'account:' . $accountId);

        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            RateLimit::record('avatar_upload', 'account:' . $accountId, false);
            Http::error(400, 'upload_failed', 'No se pudo subir la imagen.');
        }
        $size = (int) ($file['size'] ?? 0);
        if ($size < 1 || $size > self::MAX_BYTES) {
            RateLimit::record('avatar_upload', 'account:' . $accountId, false);
            Http::error(400, 'upload_too_large', 'La imagen debe pesar como máximo 2 MB.');
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            RateLimit::record('avatar_upload', 'account:' . $accountId, false);
            Http::error(400, 'upload_failed', 'No se pudo subir la imagen.');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);
        if (!is_string($mime) || !isset(self::ALLOWED[$mime])) {
            RateLimit::record('avatar_upload', 'account:' . $accountId, false);
            Http::error(400, 'invalid_image', 'Usa JPG, PNG o WebP.');
        }
        $ext = self::ALLOWED[$mime];

        $pdo = Database::pdo();
        $players = Database::table('player_profiles');
        $stmt = $pdo->prepare("SELECT avatar_code FROM {$players} WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $playerId]);
        $prev = $stmt->fetchColumn();

        $filename = $playerId . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest = self::storageDir() . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($tmp, $dest)) {
            RateLimit::record('avatar_upload', 'account:' . $accountId, false);
            Http::error(500, 'upload_failed', 'No se pudo guardar la imagen.');
        }

        $code = 'upload:' . $filename;
        $pdo->prepare(
            "UPDATE {$players} SET avatar_code = :a, updated_at = :u WHERE id = :id"
        )->execute([
            ':a' => $code,
            ':u' => MadridTime::utcNowString(),
            ':id' => $playerId,
        ]);

        if (is_string($prev) && strncmp($prev, 'upload:', 7) === 0) {
            self::deleteFile(substr($prev, 7));
        }

        RateLimit::record('avatar_upload', 'account:' . $accountId, true);
        AdultAudit::log($accountId, $playerId, 'avatar_upload', null, ['file' => $filename]);

        return [
            'avatarCode' => $code,
            'avatarUrl' => self::urlFromCode($code),
        ];
    }

    private static function deleteFile(string $filename): void
    {
        if (preg_match('/^[a-zA-Z0-9._-]+$/', $filename) !== 1) {
            return;
        }
        $path = self::storageDir() . DIRECTORY_SEPARATOR . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
