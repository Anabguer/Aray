-- ARAY migration 002 — PIN, ciclos de premio, actividad diaria
-- Timestamps UTC. Día jugable: Europe/Madrid en PHP.
-- Prefijo: arayapp_

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- PIN adulto (hash). El infantil ya está en player_profiles.child_pin_hash.
ALTER TABLE arayapp_accounts
  ADD COLUMN adult_pin_hash VARCHAR(255) NULL AFTER password_hash;

-- Ciclos consecutivos de premio Robux (historial completo, no se sobrescribe)
CREATE TABLE IF NOT EXISTS arayapp_reward_cycles (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id                 BIGINT UNSIGNED NOT NULL,
  cycle_number              INT UNSIGNED NOT NULL,
  target_points             INT UNSIGNED NOT NULL DEFAULT 500,
  points_toward             INT UNSIGNED NOT NULL DEFAULT 0,
  status                    VARCHAR(32) NOT NULL DEFAULT 'active',
  earned_at                 DATETIME NULL,
  delivered_at              DATETIME NULL,
  delivered_by_account_id   BIGINT UNSIGNED NULL,
  robux_amount              INT UNSIGNED NULL,
  delivery_note             VARCHAR(255) NULL,
  delivery_date_local       DATE NULL,
  voided_at                 DATETIME NULL,
  voided_by_account_id      BIGINT UNSIGNED NULL,
  void_reason               VARCHAR(255) NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cycle_player_number (player_id, cycle_number),
  KEY idx_cycle_player_status (player_id, status),
  CONSTRAINT fk_cycle_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_cycle_delivered_by FOREIGN KEY (delivered_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_cycle_voided_by FOREIGN KEY (voided_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resumen de actividad por día (Europe/Madrid)
CREATE TABLE IF NOT EXISTS arayapp_daily_activity (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id               BIGINT UNSIGNED NOT NULL,
  activity_date           DATE NOT NULL,
  play_seconds            INT UNSIGNED NOT NULL DEFAULT 0,
  sessions_count          INT UNSIGNED NOT NULL DEFAULT 0,
  activities_count        INT UNSIGNED NOT NULL DEFAULT 0,
  correct_count           INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count             INT UNSIGNED NOT NULL DEFAULT 0,
  xp_earned               INT UNSIGNED NOT NULL DEFAULT 0,
  coins_earned            INT UNSIGNED NOT NULL DEFAULT 0,
  reward_points_earned    INT UNSIGNED NOT NULL DEFAULT 0,
  tables_json             LONGTEXT NULL,
  modes_json              LONGTEXT NULL,
  achievements_json       LONGTEXT NULL,
  first_seen_at           DATETIME NULL,
  last_seen_at            DATETIME NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_daily_player_date (player_id, activity_date),
  KEY idx_daily_player_last (player_id, last_seen_at),
  CONSTRAINT fk_daily_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Presencia / heartbeats para tiempo de juego real (inactividad pausa)
CREATE TABLE IF NOT EXISTS arayapp_play_presence (
  player_id               BIGINT UNSIGNED NOT NULL,
  last_heartbeat_at       DATETIME NOT NULL,
  last_active_at          DATETIME NOT NULL,
  session_started_at      DATETIME NULL,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id),
  CONSTRAINT fk_presence_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meta de recompensa: objetivo por defecto 500; bank de puntos aún no asignados a ciclo
ALTER TABLE arayapp_reward_goals
  MODIFY COLUMN target_points INT UNSIGNED NOT NULL DEFAULT 500;

ALTER TABLE arayapp_reward_goals
  ADD COLUMN current_cycle_number INT UNSIGNED NOT NULL DEFAULT 1 AFTER goal_status;

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('002_pin_rewards_activity');
