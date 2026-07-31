# Diseño técnico MySQL + PHP (aprobado)

Documento vivo tras la aprobación y ajustes obligatorios. La fuente oficial es MySQL; `localStorage` es caché/offline.

## Decisiones clave

### Acceso
- Registro abierto de familias: tutor (usuario + contraseña + PIN + nombre) y 1..N niños (nombre, curso, avatar).
- Cuenta seed inicial: **Neni** / perfil **Aray** (no se borra al registrar otras familias).
- Flujo preferido: entrar con usuario/contraseña (o crear familia) → cookie de dispositivo a nivel **cuenta** → selector de perfil si hay varios niños → jugar.
- PIN del panel: solo de la familia recordada en este dispositivo (sesión adulta o cookie `ARAYDEVICE`); ya no es global al primer adulto.
- Autorización: token aleatorio largo, **solo hash en servidor**, cookie `ARAYDEVICE` HttpOnly/Secure/SameSite; un PC sirve a todos los hermanos de la misma cuenta.
- Tablas: `arayapp_authorized_devices`, `arayapp_device_temp_codes`, `arayapp_auth_attempts`.
- Adulto puede listar/revocar dispositivos, editar nombres/avatar y añadir niños.
- Avatares: subida a `uploads/avatars/` (JPG/PNG/WebP, máx 2 MB); `avatar_code` = `upload:archivo`.
- Rate limiting + errores genéricos + bloqueo temporal en login / registro / PIN / upload.
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
| POST | `/api/v1/auth/register.php` | Crear familia (tutor + niños) |
| POST | `/api/v1/auth/adult-login.php` | Login tutor (auto-autoriza dispositivo) |
| POST | `/api/v1/auth/adult-logout.php` | Logout adulto |
| GET | `/api/v1/auth/me.php` | Sesión actual |
| POST | `/api/v1/auth/device-authorize.php` | Reautorizar este dispositivo |
| GET | `/api/v1/auth/devices.php` | Listar dispositivos |
| POST | `/api/v1/auth/device-revoke.php` | Revocar dispositivo |
| POST | `/api/v1/auth/temp-code-create.php` | Código temporal |
| POST | `/api/v1/auth/temp-code-redeem.php` | Canjear código → cookie dispositivo |
| POST | `/api/v1/auth/child-enter.php` | Entrar como niño (cualquier hermano de la cuenta) |
| POST | `/api/v1/players/create.php` | Añadir niño a la familia |
| POST | `/api/v1/players/avatar.php` | Subir foto del niño |
| POST | `/api/v1/adult/profile-update.php` | Renombrar tutor/niño |
| GET | `/api/v1/players/progress.php?playerId=` | Snapshot oficial |

## Endpoints Fase 2

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/players/session-submit.php` | Enviar partida: recálculo servidor (XP/monedas/dominio/stats) + idempotencia por `sessionId` |

### Reglas de recálculo (servidor)

- `factKey` canónico: `min(a,b)×max(a,b)` (p.ej. `3x7`). Se ignora el `factKey` del cliente.
- `correct` solo vía `selected === a * b`. Se ignora el booleano `correct` del cliente.
- Operandos permitidos: `a,b ∈ [1,10]` (catálogo). `0×n` / `0×0` se descartan.
- XP base: 10 por respuesta correcta (recalculada).
- Bonus de racha: +5 XP cada 5 correctas seguidas.
- Monedas: `floor(xpEarned / 10)`.
- Score de sesión: `round(100 * correct / total)`.
- `fact_stats`: attempts/correct/wrong + peso adaptativo (clave canónica).
- `table_mastery` por tabla (`a === tableN`): last/best_round_score, ever_mastered (≥80) y consecutive_low_rounds (<50) usan el **score de esa tabla**, no el global.
- No se confía en XP/monedas/score/`correct`/`factKey` enviados por React.
- Idempotencia: mismo `sessionId` del mismo `playerId` → resultado original. Si el `sessionId` es de otro jugador → `403 session_forbidden`.

### Hard-abort de `install_once.php`

Si `SchemaInstaller::isInstalled()` es true (tablas + Neni/Aray), el script sale inmediatamente con código 0 **sin validar el token** ni ejecutar semilla/migración.

## Cookies

| Nombre | Uso |
|--------|-----|
| `ARAYSESSID` | Sesión PHP (adulto / niño tras enter) |
| `ARAYDEVICE` | Token de dispositivo autorizado (raw; hash en BD) |
