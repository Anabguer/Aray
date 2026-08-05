-- Misión diaria: slot Palabras (Lengua repartida Ortografía 2 + Palabras 2)
ALTER TABLE arayapp_daily_mission
  ADD COLUMN words_units TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER spelling_units;

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('008_daily_mission_words');
