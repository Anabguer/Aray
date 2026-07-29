-- ARAY migration 001 — schema inicial (Hostalia-safe)
-- Compatible: MySQL 5.7+ / MariaDB 10.3+
-- Timestamps: UTC (DATETIME). Día jugable: Europe/Madrid en PHP.
-- Sin CHECK (validar en PHP). JSON como LONGTEXT (validar en PHP).
-- Prefijo: arayapp_

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS arayapp_schema_migrations (
  version       VARCHAR(64) NOT NULL,
  applied_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_accounts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login           VARCHAR(64) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(80) NOT NULL DEFAULT 'Adulto',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at   DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_player_profiles (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(32) NOT NULL,
  display_name    VARCHAR(80) NOT NULL,
  child_pin_hash  VARCHAR(255) NULL,
  avatar_code     VARCHAR(64) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_player_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_account_players (
  account_id      BIGINT UNSIGNED NOT NULL,
  player_id       BIGINT UNSIGNED NOT NULL,
  relation_role   VARCHAR(16) NOT NULL DEFAULT 'owner',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, player_id),
  KEY idx_account_players_player (player_id),
  CONSTRAINT fk_ap_account FOREIGN KEY (account_id) REFERENCES arayapp_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ap_player  FOREIGN KEY (player_id)  REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_player_progress (
  player_id              BIGINT UNSIGNED NOT NULL,
  xp                     INT UNSIGNED NOT NULL DEFAULT 0,
  coins                  INT UNSIGNED NOT NULL DEFAULT 0,
  best_streak            INT UNSIGNED NOT NULL DEFAULT 0,
  best_challenge_score   INT UNSIGNED NOT NULL DEFAULT 0,
  sound_muted            TINYINT(1) NOT NULL DEFAULT 0,
  last_practice_at       DATETIME NULL,
  crate_pity_without     INT UNSIGNED NOT NULL DEFAULT 0,
  local_migrated_at      DATETIME NULL,
  local_migration_hash   CHAR(64) NULL,
  local_migration_result LONGTEXT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id),
  CONSTRAINT fk_progress_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_fact_stats (
  player_id       BIGINT UNSIGNED NOT NULL,
  fact_key        VARCHAR(16) NOT NULL,
  attempts        INT UNSIGNED NOT NULL DEFAULT 0,
  correct         INT UNSIGNED NOT NULL DEFAULT 0,
  wrong           INT UNSIGNED NOT NULL DEFAULT 0,
  weight          DECIMAL(8,3) NOT NULL DEFAULT 1.000,
  last_seen_at    DATETIME NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, fact_key),
  KEY idx_fact_player_wrong (player_id, wrong),
  KEY idx_fact_player_updated (player_id, updated_at),
  CONSTRAINT fk_fact_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_table_mastery (
  player_id                 BIGINT UNSIGNED NOT NULL,
  table_n                   TINYINT UNSIGNED NOT NULL,
  practiced                 TINYINT(1) NOT NULL DEFAULT 0,
  attempts                  INT UNSIGNED NOT NULL DEFAULT 0,
  correct                   INT UNSIGNED NOT NULL DEFAULT 0,
  mastery_score             TINYINT UNSIGNED NOT NULL DEFAULT 0,
  best_round_score          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_round_score          TINYINT UNSIGNED NULL,
  consecutive_low_rounds    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ever_mastered             TINYINT(1) NOT NULL DEFAULT 0,
  last_practiced_at         DATETIME NULL,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, table_n),
  KEY idx_mastery_player_updated (player_id, updated_at),
  CONSTRAINT fk_mastery_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_reward_goals (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id               BIGINT UNSIGNED NOT NULL,
  goal_code               VARCHAR(64) NOT NULL DEFAULT 'robux-500',
  reward_label            VARCHAR(80) NOT NULL DEFAULT '500 Robux',
  target_points           INT UNSIGNED NOT NULL DEFAULT 300,
  daily_cap               INT UNSIGNED NOT NULL DEFAULT 10,
  points_total            INT UNSIGNED NOT NULL DEFAULT 0,
  daily_date              DATE NULL,
  daily_points            INT UNSIGNED NOT NULL DEFAULT 0,
  goal_status             VARCHAR(16) NOT NULL DEFAULT 'active',
  validated_at            DATETIME NULL,
  validated_by_account_id BIGINT UNSIGNED NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goal_player_code (player_id, goal_code),
  KEY idx_goal_status (player_id, goal_status),
  CONSTRAINT fk_goal_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_goal_validator FOREIGN KEY (validated_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_sessions (
  id                    VARCHAR(64) NOT NULL,
  player_id             BIGINT UNSIGNED NOT NULL,
  mode                  VARCHAR(16) NOT NULL,
  tables_json           LONGTEXT NOT NULL,
  score                 INT NOT NULL DEFAULT 0,
  best_streak           INT UNSIGNED NOT NULL DEFAULT 0,
  xp_earned             INT UNSIGNED NOT NULL DEFAULT 0,
  coins_earned          INT UNSIGNED NOT NULL DEFAULT 0,
  energy_requested      INT UNSIGNED NOT NULL DEFAULT 0,
  energy_granted        INT UNSIGNED NOT NULL DEFAULT 0,
  personal_best         TINYINT(1) NOT NULL DEFAULT 0,
  is_mission_of_day     TINYINT(1) NOT NULL DEFAULT 0,
  client_started_at     DATETIME NULL,
  processed_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rewards_applied       TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_sessions_player_time (player_id, processed_at),
  KEY idx_sessions_player_mode (player_id, mode, processed_at),
  CONSTRAINT fk_session_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_session_answers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id      VARCHAR(64) NOT NULL,
  attempt_id      VARCHAR(64) NOT NULL,
  fact_key        VARCHAR(16) NOT NULL,
  a               TINYINT UNSIGNED NOT NULL,
  b               TINYINT UNSIGNED NOT NULL,
  selected        INT NOT NULL,
  correct         TINYINT(1) NOT NULL,
  first_try       TINYINT(1) NOT NULL DEFAULT 1,
  attempt_n       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  elapsed_ms      INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt (attempt_id),
  KEY idx_answers_session (session_id),
  KEY idx_answers_fact (session_id, fact_key),
  KEY idx_answers_fact_global (fact_key, created_at),
  CONSTRAINT fk_answers_session FOREIGN KEY (session_id) REFERENCES arayapp_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_crates (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id             BIGINT UNSIGNED NOT NULL,
  completion_id         VARCHAR(64) NOT NULL,
  rarity                VARCHAR(16) NOT NULL,
  is_choice             TINYINT(1) NOT NULL DEFAULT 0,
  options_json          LONGTEXT NOT NULL,
  chosen_index          TINYINT UNSIGNED NULL,
  reward_kind           VARCHAR(16) NULL,
  reward_amount         INT UNSIGNED NULL,
  status                VARCHAR(24) NOT NULL,
  rolled_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at             DATETIME NULL,
  claimed_at            DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crate_completion (player_id, completion_id),
  KEY idx_crates_pending (player_id, status),
  CONSTRAINT fk_crate_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_crate_session FOREIGN KEY (completion_id) REFERENCES arayapp_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_mission_completions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id       BIGINT UNSIGNED NOT NULL,
  mission_date    DATE NOT NULL,
  mission_code    VARCHAR(64) NOT NULL,
  session_id      VARCHAR(64) NULL,
  completed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mission_day (player_id, mission_date, mission_code),
  KEY idx_mission_player_date (player_id, mission_date),
  CONSTRAINT fk_mission_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_mission_session FOREIGN KEY (session_id) REFERENCES arayapp_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_adult_actions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id          BIGINT UNSIGNED NOT NULL,
  player_id           BIGINT UNSIGNED NOT NULL,
  action              VARCHAR(64) NOT NULL,
  before_json         LONGTEXT NULL,
  after_json          LONGTEXT NULL,
  meta_json           LONGTEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_adult_actions_player (player_id, created_at),
  KEY idx_adult_actions_account (account_id, created_at),
  CONSTRAINT fk_aa_account FOREIGN KEY (account_id) REFERENCES arayapp_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_aa_player  FOREIGN KEY (player_id)  REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_inventory_items (
  player_id       BIGINT UNSIGNED NOT NULL,
  item_code       VARCHAR(64) NOT NULL,
  qty             INT UNSIGNED NOT NULL DEFAULT 1,
  source_crate_id BIGINT UNSIGNED NULL,
  unlocked_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, item_code),
  CONSTRAINT fk_inv_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_crate  FOREIGN KEY (source_crate_id) REFERENCES arayapp_crates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispositivos autorizados (token raw solo en cookie; aquí hash)
CREATE TABLE IF NOT EXISTS arayapp_authorized_devices (
  id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id                   BIGINT UNSIGNED NOT NULL,
  authorized_by_account_id    BIGINT UNSIGNED NOT NULL,
  device_label                VARCHAR(120) NOT NULL DEFAULT 'Dispositivo',
  token_hash                  CHAR(64) NOT NULL,
  token_prefix                CHAR(8) NOT NULL,
  user_agent                  VARCHAR(255) NULL,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at                DATETIME NULL,
  expires_at                  DATETIME NULL,
  revoked_at                  DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_token_hash (token_hash),
  KEY idx_devices_player (player_id, revoked_at),
  KEY idx_devices_account (authorized_by_account_id, created_at),
  CONSTRAINT fk_device_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_device_account FOREIGN KEY (authorized_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Códigos temporales de un solo uso (hash en servidor)
CREATE TABLE IF NOT EXISTS arayapp_device_temp_codes (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id                 BIGINT UNSIGNED NOT NULL,
  created_by_account_id     BIGINT UNSIGNED NOT NULL,
  code_hash                 CHAR(64) NOT NULL,
  code_prefix               CHAR(4) NOT NULL,
  expires_at                DATETIME NOT NULL,
  used_at                   DATETIME NULL,
  used_device_id            BIGINT UNSIGNED NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_temp_codes_player (player_id, expires_at),
  KEY idx_temp_codes_hash (code_hash),
  CONSTRAINT fk_temp_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_temp_account FOREIGN KEY (created_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_temp_device FOREIGN KEY (used_device_id) REFERENCES arayapp_authorized_devices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos de auth (rate limit / bloqueo temporal)
CREATE TABLE IF NOT EXISTS arayapp_auth_attempts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_type    VARCHAR(32) NOT NULL,
  identity_key    VARCHAR(128) NOT NULL,
  ip_hash         CHAR(64) NOT NULL,
  succeeded       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auth_attempts_lookup (attempt_type, identity_key, created_at),
  KEY idx_auth_attempts_ip (attempt_type, ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('001_initial_schema');
