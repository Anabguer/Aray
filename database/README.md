# Base de datos ARAY

Prefijo de tablas: **`arayapp_`** (no usar `aray_`).

## Compatibilidad Hostalia

El schema `migrations/001_initial_schema.sql` está pensado para:

| Requisito | Mínimo orientativo |
|-----------|-------------------|
| MySQL | 5.7+ |
| MariaDB | 10.3+ |
| PHP | 7.4+ (ideal 8.x) |
| Extensiones | `pdo_mysql`, `json`, `session` |

Decisiones de compatibilidad:
- Sin `CHECK` (validación en PHP).
- JSON como `LONGTEXT` + `json_encode`/`json_decode` en PHP.
- Timestamps `DATETIME` en UTC (`SET time_zone = '+00:00'` en PDO).
- Día jugable / energía diaria: `Europe/Madrid` en PHP (`MadridTime`).

**Antes de aplicar en Hostalia**, ejecuta en el panel o vía PHP:

```sql
SELECT VERSION();
```

y revisa `GET /aray/api/v1/health.php` (devuelve `phpVersion` y, si hay BD, `dbVersion`).

## Configuración local (como Anabel, adaptado)

Anabel crea tablas con `CREATE TABLE IF NOT EXISTS` en PHP (`*_ensure_schema`) y siembra auth solo si la tabla está vacía. ARAY hace lo mismo vía `SchemaInstaller`:

1. `php scripts/setup_local_config.php --db-password=... --seed-password=...`
2. `php scripts/install_once.php --token=...` (idempotente)
3. `php scripts/phase1_smoke.php`
4. `php scripts/phase1_integration.php`

Flags útiles en `database.local.php`:
- `ARAY_CREATE_DATABASE` — crea `aray_db` si no existe (local)
- `ARAY_AUTO_ENSURE_SCHEMA` — aplica migraciones IF NOT EXISTS al conectar

`database.local.php` **no** debe ir a Git (`.gitignore`: `includes/*.local.php`).

## Migraciones

```bash
php scripts/migrate.php
```

## Hostalia (checklist)

1. Crear BD + usuario con privilegios solo sobre esa BD
2. Subir código (sin `database.local.php` con secretos en Git; súbelo por FTP/SFTP aparte)
3. Crear `includes/database.local.php` en el servidor
4. `ARAY_ENV=production`, `ARAY_COOKIE_SECURE=true`
5. CLI Hostalia o script temporal protegido: `install_once.php`
6. Verificar health + login Neni
7. Invalidar `ARAY_INSTALL_TOKEN`

No hay tabla `arayapp_pending_sync`: la cola offline vive en `localStorage`.
