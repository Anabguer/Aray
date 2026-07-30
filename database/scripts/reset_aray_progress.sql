-- =============================================================================
-- ARAY · Limpieza SEGURA de datos de prueba del perfil Aray
-- =============================================================================
-- NO EJECUTAR en Hostalia hasta confirmación explícita.
-- NO borra tablas ni estructura.
-- NO elimina cuenta Neni, perfil Aray, PIN, curso ni catálogos.
--
-- Tras COMMIT:
-- 1) sync_epoch se incrementa (corte servidor).
-- 2) Redesplegar front si hace falta; las PWA antiguas reciben 409 sync_epoch_stale.
-- 3) Abrir app → snapshot a cero; primera partida real → arayapp_sessions.
--
-- Ajusta EXPECTED_* al entorno real antes de COMMIT.
-- =============================================================================

-- Identidad esperada (abortar si no coincide exactamente)
SET @EXPECTED_SLUG := 'aray';
SET @EXPECTED_DISPLAY := 'Aray';
-- ID real actual en este entorno (comprobado 2026-07-30): 1
SET @EXPECTED_PLAYER_ID := 1;

START TRANSACTION;

SET @aray_player_id := (
  SELECT id FROM arayapp_player_profiles
  WHERE slug = @EXPECTED_SLUG
  LIMIT 1
);

SET @aray_display := (
  SELECT display_name FROM arayapp_player_profiles
  WHERE id = @aray_player_id
  LIMIT 1
);

-- Abortar si no existe / slug o display no coinciden / id distinto del esperado
SELECT
  CASE
    WHEN @aray_player_id IS NULL THEN 1/0
    WHEN @aray_player_id <> @EXPECTED_PLAYER_ID THEN 1/0
    WHEN @aray_display <> @EXPECTED_DISPLAY THEN 1/0
    ELSE @aray_player_id
  END AS verified_aray_player_id,
  @aray_display AS verified_display_name,
  @EXPECTED_SLUG AS expected_slug;

-- ---------------------------------------------------------------------------
-- Recuentos PREVIOS (revisar antes de continuar / COMMIT)
-- ---------------------------------------------------------------------------
SELECT 'PRE session_answers' AS what, COUNT(*) AS n
FROM arayapp_session_answers sa
INNER JOIN arayapp_sessions s ON s.id = sa.session_id
WHERE s.player_id = @aray_player_id;

SELECT 'PRE sessions' AS what, COUNT(*) AS n
FROM arayapp_sessions WHERE player_id = @aray_player_id;

SELECT 'PRE fact_stats' AS what, COUNT(*) AS n
FROM arayapp_fact_stats WHERE player_id = @aray_player_id;

SELECT 'PRE table_mastery' AS what, COUNT(*) AS n
FROM arayapp_table_mastery WHERE player_id = @aray_player_id;

SELECT 'PRE crates' AS what, COUNT(*) AS n
FROM arayapp_crates WHERE player_id = @aray_player_id;

SELECT 'PRE inventory_items' AS what, COUNT(*) AS n
FROM arayapp_inventory_items WHERE player_id = @aray_player_id;

SELECT 'PRE mission_completions' AS what, COUNT(*) AS n
FROM arayapp_mission_completions WHERE player_id = @aray_player_id;

SELECT 'PRE daily_activity' AS what, COUNT(*) AS n
FROM arayapp_daily_activity WHERE player_id = @aray_player_id;

SELECT 'PRE play_presence' AS what, COUNT(*) AS n
FROM arayapp_play_presence WHERE player_id = @aray_player_id;

SELECT 'PRE reward_cycles' AS what, COUNT(*) AS n
FROM arayapp_reward_cycles WHERE player_id = @aray_player_id;

SELECT 'PRE reward_goals' AS what, COUNT(*) AS n
FROM arayapp_reward_goals WHERE player_id = @aray_player_id;

SELECT 'PRE adult_actions' AS what, COUNT(*) AS n
FROM arayapp_adult_actions WHERE player_id = @aray_player_id;

SELECT 'PRE authorized_devices' AS what, COUNT(*) AS n
FROM arayapp_authorized_devices WHERE player_id = @aray_player_id;

SELECT 'PRE device_temp_codes' AS what, COUNT(*) AS n
FROM arayapp_device_temp_codes WHERE player_id = @aray_player_id;

SELECT 'PRE progress' AS what, xp, coins, best_streak, best_challenge_score
FROM arayapp_player_progress WHERE player_id = @aray_player_id;

SELECT 'PRE sync_epoch' AS what, setting_value AS sync_epoch
FROM arayapp_app_settings WHERE setting_key = 'sync_epoch';

-- ---------------------------------------------------------------------------
-- Borrado / reset (solo player_id verificado)
-- ---------------------------------------------------------------------------
DELETE sa
FROM arayapp_session_answers sa
INNER JOIN arayapp_sessions s ON s.id = sa.session_id
WHERE s.player_id = @aray_player_id;

DELETE FROM arayapp_sessions WHERE player_id = @aray_player_id;
DELETE FROM arayapp_fact_stats WHERE player_id = @aray_player_id;
DELETE FROM arayapp_table_mastery WHERE player_id = @aray_player_id;
DELETE FROM arayapp_crates WHERE player_id = @aray_player_id;
DELETE FROM arayapp_inventory_items WHERE player_id = @aray_player_id;
DELETE FROM arayapp_mission_completions WHERE player_id = @aray_player_id;
DELETE FROM arayapp_daily_activity WHERE player_id = @aray_player_id;
DELETE FROM arayapp_play_presence WHERE player_id = @aray_player_id;
DELETE FROM arayapp_reward_cycles WHERE player_id = @aray_player_id;
DELETE FROM arayapp_reward_goals WHERE player_id = @aray_player_id;
DELETE FROM arayapp_adult_actions WHERE player_id = @aray_player_id;
DELETE FROM arayapp_device_temp_codes WHERE player_id = @aray_player_id;
DELETE FROM arayapp_authorized_devices WHERE player_id = @aray_player_id;

UPDATE arayapp_player_progress
SET
  xp = 0,
  coins = 0,
  best_streak = 0,
  best_challenge_score = 0,
  last_practice_at = NULL,
  crate_pity_without = 0,
  local_migrated_at = NULL,
  local_migration_hash = NULL,
  local_migration_result = NULL,
  updated_at = UTC_TIMESTAMP()
WHERE player_id = @aray_player_id;

INSERT INTO arayapp_reward_goals (
  player_id, goal_code, reward_label, target_points, daily_cap,
  points_total, daily_date, daily_points, goal_status, current_cycle_number,
  created_at, updated_at
) VALUES (
  @aray_player_id, 'robux-500', '500 Robux', 500, 10,
  0, NULL, 0, 'active', 1,
  UTC_TIMESTAMP(), UTC_TIMESTAMP()
);

INSERT INTO arayapp_reward_cycles (
  player_id, cycle_number, target_points, points_toward, status, created_at, updated_at
) VALUES (
  @aray_player_id, 1, 500, 0, 'active', UTC_TIMESTAMP(), UTC_TIMESTAMP()
);

-- Corte servidor: invalida colas offline de PWA / 2º dispositivo
CREATE TABLE IF NOT EXISTS arayapp_app_settings (
  setting_key   VARCHAR(64) NOT NULL,
  setting_value LONGTEXT NOT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO arayapp_app_settings (setting_key, setting_value, updated_at)
VALUES ('sync_epoch', '1', UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  setting_value = CAST(CAST(setting_value AS UNSIGNED) + 1 AS CHAR),
  updated_at = UTC_TIMESTAMP();

-- ---------------------------------------------------------------------------
-- Comprobaciones POST
-- ---------------------------------------------------------------------------
SELECT 'POST progress' AS what, xp, coins, best_streak
FROM arayapp_player_progress WHERE player_id = @aray_player_id;

SELECT 'POST sessions' AS what, COUNT(*) AS n FROM arayapp_sessions WHERE player_id = @aray_player_id;
SELECT 'POST facts' AS what, COUNT(*) AS n FROM arayapp_fact_stats WHERE player_id = @aray_player_id;
SELECT 'POST mastery' AS what, COUNT(*) AS n FROM arayapp_table_mastery WHERE player_id = @aray_player_id;
SELECT 'POST cycles' AS what, COUNT(*) AS n FROM arayapp_reward_cycles WHERE player_id = @aray_player_id;
SELECT 'POST sync_epoch' AS what, setting_value AS sync_epoch
FROM arayapp_app_settings WHERE setting_key = 'sync_epoch';

-- Conservado: player_profiles, accounts, account_players, cursos, catálogos, assignments

-- Si los POST muestran cuenta limpia y sync_epoch incrementado:
--   COMMIT;
-- Si no:
ROLLBACK;
