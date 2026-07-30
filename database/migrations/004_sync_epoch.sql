-- Época de sincronización global (corte de datos de prueba / PWA antiguas).
-- El cliente debe enviar syncEpoch >= valor actual en session-submit.

CREATE TABLE IF NOT EXISTS arayapp_app_settings (
  setting_key   VARCHAR(64) NOT NULL,
  setting_value LONGTEXT NOT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO arayapp_app_settings (setting_key, setting_value, updated_at)
VALUES ('sync_epoch', '1', UTC_TIMESTAMP());

INSERT IGNORE INTO arayapp_schema_migrations (version) VALUES ('004_sync_epoch');
