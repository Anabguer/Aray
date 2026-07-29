# Diseño técnico MySQL + PHP (aprobado)

Documento vivo tras la aprobación y ajustes obligatorios. La fuente oficial es MySQL; `localStorage` es caché/offline.

## Decisiones clave

### Acceso
- Cuenta adulta inicial: **Neni**.
- Perfil infantil: **Aray** (relación cuenta → N perfiles vía `arayapp_account_players`).
- Flujo preferido: adulto inicia sesión → autoriza dispositivo → siguientes visitas “JUGAR COMO ARAY”.
- Autorización: token aleatorio largo, **solo hash en servidor**, cookie `ARAYDEVICE` HttpOnly/Secure/SameSite.
- Tablas: `arayapp_authorized_devices`, `arayapp_device_temp_codes`, `arayapp_auth_attempts`.
- Adulto puede listar/revocar dispositivos.
- Dispositivo nuevo sin sesión adulta: código temporal de un solo uso y caducidad corta.
- PIN infantil (columna opcional) es **alternativa local**, no única barrera pública.
- Rate limiting + errores genéricos + bloqueo temporal en login adulto / PIN / código.
- No mostrar ≈€ en zona infantil.

### Zona horaria
- Timestamps en **UTC**.
- Día jugable, tope diario de energía y misión del día: **Europe/Madrid** (incluye DST).

### Validación de partidas (Fase 2+)
- El servidor recalcula siempre factKey, correct, score, XP, monedas, energía, dominio y caja.
- No confiar en campos de recompensa enviados por React.
- Idempotencia por `sessionId` en transacción.

### Migración local (Fase 4)
- Una sola vez: XP, monedas, rachas, energía/objetivo, facts, dominio, pity, first mastery.
- No convertir cajas pendientes locales en cobrables sin sesión oficial.
- Informar al adulto si se descartan; no re-sortear; no borrar blob en fase 1.

### Cola offline
- Solo `localStorage` (`aray.pendingSessions`). **Sin** tabla `arayapp_pending_sync`.

### Fases
1. Schema + config + seed + auth adulto/dispositivo + GET progress
2. Partidas + recalculo + idempotencia + stats/dominio
3. Cajas + energía/drop + adult actions + misiones
4. Migración localStorage + cola offline + multi-dispositivo

## Hostalia / compatibilidad

Antes de aplicar en producción:
1. Confirmar versión MySQL **o** MariaDB (`SELECT VERSION();`).
2. Confirmar versión PHP (`phpinfo` o endpoint `/api/v1/health` ampliado).
3. Schema v1 evita `CHECK` (validación en PHP) y usa `LONGTEXT` para JSON (compatible MariaDB antiguo y MySQL 5.7+).
4. Requisito mínimo orientativo: **MySQL 5.7+ / MariaDB 10.3+**, **PHP 7.4+** (ideal 8.x). Local de desarrollo: PHP 8.2 + MySQL 8.0.

## Configuración Hostalia (sin secretos en Git)

Crear en el servidor (fuera del repo o ignorado):

`includes/database.local.php` — ver `includes/database.example.php`.

Referencia Anabel (adaptada, sin copiar secretos):
- Local: BD propia `aray_db` + `ARAY_CREATE_DATABASE=true` + `CREATE TABLE IF NOT EXISTS` vía `SchemaInstaller`.
- Hostalia: BD compartida del hosting + prefijo `arayapp_` (como Anabel usa `anabel_` en la BD compartida). No hace falta crear una BD nueva en el panel.
- **No** hardcodear contraseñas de producción en PHP versionado (Anabel lo hace en `database.php`; ARAY no debe repetirlo).

Valores a rellenar:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CHARSET`
- `ARAY_ENV=production`
- `ARAY_COOKIE_SECURE=true`
- `ARAY_CREATE_DATABASE=false` en Hostalia (la BD ya existe)
- `ARAY_AUTO_ENSURE_SCHEMA=true` (tablas IF NOT EXISTS al conectar)
- Semilla Neni: solo vía `install_once.php` + token, nunca en el frontend.

## Endpoints Fase 1

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health.php` | Salud + versiones (sin secretos) |
| GET | `/api/v1/csrf.php` | Token CSRF |
| POST | `/api/v1/auth/adult-login.php` | Login Neni |
| POST | `/api/v1/auth/adult-logout.php` | Logout adulto |
| GET | `/api/v1/auth/me.php` | Sesión actual |
| POST | `/api/v1/auth/device-authorize.php` | Autorizar este dispositivo para Aray |
| GET | `/api/v1/auth/devices.php` | Listar dispositivos |
| POST | `/api/v1/auth/device-revoke.php` | Revocar dispositivo |
| POST | `/api/v1/auth/temp-code-create.php` | Código temporal |
| POST | `/api/v1/auth/temp-code-redeem.php` | Canjear código → cookie dispositivo |
| POST | `/api/v1/auth/child-enter.php` | Entrar con cookie de dispositivo |
| GET | `/api/v1/players/progress.php?playerId=` | Snapshot oficial |

## Cookies

| Nombre | Uso |
|--------|-----|
| `ARAYSESSID` | Sesión PHP (adulto / niño tras enter) |
| `ARAYDEVICE` | Token de dispositivo autorizado (raw; hash en BD) |
