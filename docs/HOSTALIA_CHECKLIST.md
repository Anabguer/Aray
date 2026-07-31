# Checklist Hostalia — ARAY (pre-despliegue)

No desplegar hasta revisión del commit de sync React↔MySQL y confirmación de la limpieza SQL.

## 1. Archivos a subir

Subir el contenido construido + PHP (mismo árbol que el repo, sin secretos):

- `dist/` → raíz pública `/aray/afkacademy/` (o copiar `index.html` + `assets/` a `/aray/afkacademy/`)
- `api/`
- `includes/` (**sin** `database.local.php` desde Git; crear en servidor)
- `database/migrations/`
- `scripts/` (solo si se usará `install_once` / migrate por SSH; proteger después)
- `.htaccess` (raíz `/aray/afkacademy/`)
- `public/.htaccess` si aplica al build

**No subir:** `node_modules/`, `.env`, `includes/database.local.php` del PC, `deploy/*.local.json`, capturas locales innecesarias.

Build local previo:

```bash
npm ci
npm run build
```

## 2. Ubicación de la API

- App: `https://intocables13.com/aray/afkacademy/`
- API: `https://intocables13.com/aray/afkacademy/api/v1/`
- El cliente usa `import.meta.env.BASE_URL + 'api/v1'` → `/aray/afkacademy/api/v1`
- Cookies: path `/aray/afkacademy` (`ARAYSESSID`, `ARAYDEVICE`)

## 3. `database.local.php`

1. Copiar `includes/database.example.php` → `includes/database.local.php` **en el servidor**.
2. Rellenar host, nombre BD compartida, usuario, contraseña.
3. Flags recomendados Hostalia:

```php
define('ARAY_ENV', 'production');
define('ARAY_COOKIE_SECURE', true);
define('ARAY_CREATE_DATABASE', false);
define('ARAY_AUTO_ENSURE_SCHEMA', true);
```

Permisos: legible por PHP, no listable públicamente si el hosting lo permite.

## 4. Credenciales / variables

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CHARSET`
- Semilla Neni solo vía `install_once.php` + token (invalidar tras uso)
- Prefijo tablas: `arayapp_`

## 5. Permisos

- Directorios: típico 755; PHP legible
- No dejar `scripts/install_once.php` accesible sin token tras instalar
- `tmp/` / logs fuera de web si existen

## 6. `.htaccess` y React

- `RewriteBase /aray/afkacademy/`
- No reescribir `api/`, assets ni ficheros reales
- SPA → `index.html`
- Comprobar que `/aray/afkacademy/adult` no 404

## 7. Pruebas post-subida

| # | Prueba | Cómo |
|---|--------|------|
| 1 | Conexión BD | `GET /aray/afkacademy/api/v1/health.php` → `dbOk`, versiones |
| 2 | Acceso familia | `/aray/afkacademy/access` login o `/aray/afkacademy/register` alta |
| 3 | Dispositivo | Login/registro deja cookie; opcional «Reautorizar» en panel |
| 4 | Snapshot | `GET /aray/afkacademy/api/v1/players/progress.php?playerId=` → XP oficial |
| 5 | Partida | Jugar → `POST .../session-submit.php` → fila en `arayapp_sessions` |
| 6 | Idempotencia | Reenviar mismo `sessionId` → `idempotent: true`, sin doble XP |
| 7 | Offline | Modo avión → cola `aray.pendingSessions` → al volver sync |
| 8 | Panel / premios / curso / familia | Nombres, avatar, varios niños OK |
| 9 | SQL | SELECT xp/coins; sessions; fact_stats; table_mastery; reward_* |
| 10 | Uploads | Carpeta `uploads/avatars/` escribible; `.htaccess` sin PHP |

## 8. Limpieza de prueba (antes de uso real)

1. Revisar `database/scripts/reset_aray_progress.sql` (`EXPECTED_PLAYER_ID`, slug `aray`).
2. Ejecutar en transacción; el script deja `ROLLBACK` al final — cambiar a `COMMIT` solo tras revisar SELECTs PRE/POST.
3. El script incrementa `arayapp_app_settings.sync_epoch` (corte servidor).
4. Abrir la app: hidrata epoch nuevo, vacía cola/caché antigua; PWA viejas reciben `409 sync_epoch_stale`.
5. Confirmar lobby a cero y primera partida real en MySQL.

## 9. Rollback

1. Restaurar backup de BD (si se hizo dump previo).
2. Restaurar árbol `/aray/afkacademy/` anterior por FTP.
3. Si solo falló el front: volver a `dist/` del commit previo; la API PHP puede quedarse si es compatible.
4. Invalidar cookies de sesión en el navegador de prueba.

## 10. Orden sugerido

1. Dump BD → 2. Subir código → 3. `database.local.php` → 4. health → 5. permisos `uploads/` → 6. (opcional) reset SQL confirmado → 7. epoch client → 8. login familia → 9. partida real → 10. checklist OK.

## Uploads (avatares)

- Crear/subir carpeta `uploads/avatars/` con el `.htaccess` del repo (no ejecutar PHP).
- Permisos de escritura para el usuario del servidor web (p. ej. 755 carpeta, 644 archivos).
- Comprobar tras el alta: aparece archivo y URL `/aray/afkacademy/uploads/avatars/...` en header/lobby.
