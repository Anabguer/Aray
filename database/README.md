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

## Configuración local

1. Copia `includes/database.example.php` → `includes/database.local.php`
2. Rellena `DB_*`, `ARAY_INSTALL_TOKEN`, `ARAY_SEED_ADULT_PASSWORD`
3. Crea la base vacía en MySQL
4. `php scripts/install_once.php --token=TU_TOKEN`
5. `php scripts/phase1_smoke.php`

`database.local.php` **no** debe ir a Git.

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
