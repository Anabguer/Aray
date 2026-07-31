-- Logros reclamados (fuente de verdad) + stats de progreso para desbloqueos.
CREATE TABLE IF NOT EXISTS arayapp_player_achievements (
  player_id        BIGINT UNSIGNED NOT NULL,
  achievement_id   VARCHAR(64) NOT NULL,
  energy_granted   INT UNSIGNED NOT NULL DEFAULT 0,
  claimed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, achievement_id),
  KEY idx_achievements_player_claimed (player_id, claimed_at),
  CONSTRAINT fk_achievements_player FOREIGN KEY (player_id)
    REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE arayapp_player_progress
  ADD COLUMN stats_json LONGTEXT NULL AFTER crate_pity_without;
