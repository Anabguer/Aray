-- Misión diaria (slots por skill + reto del día) — sync entre dispositivos
CREATE TABLE IF NOT EXISTS arayapp_daily_mission (
  player_id        BIGINT UNSIGNED NOT NULL,
  mission_date     DATE NOT NULL,
  tables_units     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  calc_units       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  spelling_units   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  clocks_units     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  money_units      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  challenge_done   TINYINT(1) NOT NULL DEFAULT 0,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, mission_date),
  KEY idx_daily_mission_date (mission_date),
  CONSTRAINT fk_daily_mission_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('007_daily_mission');
