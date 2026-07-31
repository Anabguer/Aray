-- ABC / lenguas: dominio por modo y letras difíciles
CREATE TABLE IF NOT EXISTS arayapp_skill_mode_mastery (
  player_id                 BIGINT UNSIGNED NOT NULL,
  skill_id                  VARCHAR(64) NOT NULL,
  mode_key                  VARCHAR(32) NOT NULL,
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
  PRIMARY KEY (player_id, skill_id, mode_key),
  KEY idx_skill_mode_player_updated (player_id, updated_at),
  CONSTRAINT fk_skill_mode_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_letter_stats (
  player_id       BIGINT UNSIGNED NOT NULL,
  letter          VARCHAR(8) NOT NULL,
  attempts        INT UNSIGNED NOT NULL DEFAULT 0,
  correct         INT UNSIGNED NOT NULL DEFAULT 0,
  wrong           INT UNSIGNED NOT NULL DEFAULT 0,
  last_seen_at    DATETIME NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, letter),
  KEY idx_letter_player_wrong (player_id, wrong),
  CONSTRAINT fk_letter_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_alphabet_progress (
  player_id        BIGINT UNSIGNED NOT NULL,
  rounds_played    INT UNSIGNED NOT NULL DEFAULT 0,
  perfect_rounds   INT UNSIGNED NOT NULL DEFAULT 0,
  best_streak      INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id),
  CONSTRAINT fk_alphabet_progress_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('005_alphabet_progress');
