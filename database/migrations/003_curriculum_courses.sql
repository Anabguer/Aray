-- ARAY migration 003 — cursos escolares + catálogo educativo
-- Compatible: MySQL 5.7+ / MariaDB 10.3+
-- Prefijo: arayapp_
-- No borra progreso existente (XP, monedas, dominio, hechos, recompensas).

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS arayapp_courses (
  id              VARCHAR(32) NOT NULL,
  title           VARCHAR(80) NOT NULL,
  short_title     VARCHAR(32) NOT NULL,
  stage           VARCHAR(16) NOT NULL DEFAULT 'primary',
  grade_n         TINYINT UNSIGNED NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'active',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_courses_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_subjects (
  id              VARCHAR(32) NOT NULL,
  title           VARCHAR(80) NOT NULL,
  short_title     VARCHAR(32) NOT NULL,
  description     VARCHAR(255) NOT NULL DEFAULT '',
  legacy_hub_id   VARCHAR(32) NULL,
  world_path      VARCHAR(120) NOT NULL DEFAULT '/',
  status          VARCHAR(16) NOT NULL DEFAULT 'active',
  sort_order      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_subjects_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_edu_blocks (
  id              VARCHAR(48) NOT NULL,
  subject_id      VARCHAR(32) NOT NULL,
  title           VARCHAR(80) NOT NULL,
  description     VARCHAR(255) NOT NULL DEFAULT '',
  status          VARCHAR(16) NOT NULL DEFAULT 'future',
  sort_order      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_blocks_subject (subject_id, sort_order),
  CONSTRAINT fk_block_subject FOREIGN KEY (subject_id) REFERENCES arayapp_subjects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_skills (
  id                    VARCHAR(64) NOT NULL,
  block_id              VARCHAR(48) NOT NULL,
  title                 VARCHAR(80) NOT NULL,
  description           VARCHAR(255) NOT NULL DEFAULT '',
  progress_key          VARCHAR(64) NOT NULL,
  progress_kind         VARCHAR(32) NOT NULL DEFAULT 'generic',
  recommended_courses   LONGTEXT NULL,
  status                VARCHAR(16) NOT NULL DEFAULT 'active',
  sort_order            INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_skills_block (block_id, sort_order),
  KEY idx_skills_progress (progress_kind, progress_key),
  CONSTRAINT fk_skill_block FOREIGN KEY (block_id) REFERENCES arayapp_edu_blocks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_activities (
  id              VARCHAR(80) NOT NULL,
  title           VARCHAR(120) NOT NULL,
  description     VARCHAR(255) NOT NULL DEFAULT '',
  skill_id        VARCHAR(64) NOT NULL,
  exercise_type   VARCHAR(32) NOT NULL,
  difficulty      VARCHAR(16) NOT NULL DEFAULT 'basic',
  status          VARCHAR(16) NOT NULL DEFAULT 'active',
  sort_order      INT NOT NULL DEFAULT 0,
  rewards_json    LONGTEXT NULL,
  config_json     LONGTEXT NULL,
  PRIMARY KEY (id),
  KEY idx_activities_skill (skill_id, sort_order),
  KEY idx_activities_status (status, sort_order),
  CONSTRAINT fk_activity_skill FOREIGN KEY (skill_id) REFERENCES arayapp_skills(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_course_activity_map (
  course_id       VARCHAR(32) NOT NULL,
  activity_id     VARCHAR(80) NOT NULL,
  role_code       VARCHAR(16) NOT NULL DEFAULT 'recommended',
  sort_order      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, activity_id),
  KEY idx_cam_activity (activity_id),
  KEY idx_cam_course_role (course_id, role_code, sort_order),
  CONSTRAINT fk_cam_course FOREIGN KEY (course_id) REFERENCES arayapp_courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_cam_activity FOREIGN KEY (activity_id) REFERENCES arayapp_activities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Perfil escolar del jugador (curso actual + modo). No reinicia progreso.
ALTER TABLE arayapp_player_profiles
  ADD COLUMN current_course_id VARCHAR(32) NULL AFTER avatar_code;

ALTER TABLE arayapp_player_profiles
  ADD COLUMN course_mode VARCHAR(16) NOT NULL DEFAULT 'review' AFTER current_course_id;

ALTER TABLE arayapp_player_profiles
  ADD COLUMN course_started_at DATETIME NULL AFTER course_mode;

CREATE TABLE IF NOT EXISTS arayapp_player_course_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id       BIGINT UNSIGNED NOT NULL,
  course_id       VARCHAR(32) NOT NULL,
  course_mode     VARCHAR(16) NOT NULL DEFAULT 'standard',
  started_at      DATETIME NOT NULL,
  ended_at        DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pch_player (player_id, started_at),
  CONSTRAINT fk_pch_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_pch_course FOREIGN KEY (course_id) REFERENCES arayapp_courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arayapp_player_activity_assignments (
  player_id       BIGINT UNSIGNED NOT NULL,
  activity_id     VARCHAR(80) NOT NULL,
  role_code       VARCHAR(16) NOT NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by_account_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (player_id, activity_id),
  KEY idx_paa_role (player_id, role_code),
  CONSTRAINT fk_paa_player FOREIGN KEY (player_id) REFERENCES arayapp_player_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_paa_activity FOREIGN KEY (activity_id) REFERENCES arayapp_activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_paa_account FOREIGN KEY (updated_by_account_id) REFERENCES arayapp_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semilla de cursos
INSERT IGNORE INTO arayapp_courses (id, title, short_title, stage, grade_n, status, sort_order) VALUES
  ('primary-3', '3.º de Primaria', '3.º', 'primary', 3, 'active', 30),
  ('primary-4', '4.º de Primaria', '4.º', 'primary', 4, 'active', 40),
  ('primary-5', '5.º de Primaria', '5.º', 'primary', 5, 'future', 50);

INSERT IGNORE INTO arayapp_subjects (id, title, short_title, description, legacy_hub_id, world_path, status, sort_order) VALUES
  ('maths', 'Matemáticas', 'Mates', 'Números, tablas y retos', 'mates', '/missions/mates', 'active', 10),
  ('languages', 'Lenguas', 'Lenguas', 'Leer, escribir y expresar', 'catala', '/missions/languages', 'active', 20),
  ('english', 'Inglés', 'English', 'Vocabulario y frases útiles', 'angles', '/missions/english', 'active', 30);

INSERT IGNORE INTO arayapp_edu_blocks (id, subject_id, title, description, status, sort_order) VALUES
  ('multiplication-tables', 'maths', 'Tablas de multiplicar', 'Dominar las tablas del 2 al 9', 'active', 10),
  ('calculation', 'maths', 'Cálculo', 'Operaciones y agilidad numérica', 'future', 20),
  ('problems', 'maths', 'Problemas', 'Resolver situaciones con números', 'future', 30),
  ('clocks-hours', 'maths', 'Relojes y horas', 'Leer la hora y calcular tiempos', 'future', 40),
  ('alphabet', 'languages', 'Abecedario', 'Letras y sonidos', 'future', 10),
  ('writing', 'languages', 'Escritura', 'Escribir con claridad', 'future', 20),
  ('comprehension', 'languages', 'Comprensión', 'Entender textos', 'future', 30),
  ('spelling', 'languages', 'Ortografía', 'Escribir correctamente', 'future', 40),
  ('vocabulary', 'english', 'Vocabulario', 'Palabras nuevas', 'future', 10),
  ('word-image', 'english', 'Relacionar palabra e imagen', 'Emparejar palabras e imágenes', 'future', 20),
  ('simple-phrases', 'english', 'Frases sencillas', 'Construir frases cortas', 'future', 30);

INSERT IGNORE INTO arayapp_skills (id, block_id, title, description, progress_key, progress_kind, recommended_courses, status, sort_order) VALUES
  ('mult-table-2', 'multiplication-tables', 'Tabla del 2', 'Multiplicar por 2', '2', 'multiplication-table', '["primary-3","primary-4"]', 'active', 10),
  ('mult-table-3', 'multiplication-tables', 'Tabla del 3', 'Multiplicar por 3', '3', 'multiplication-table', '["primary-3","primary-4"]', 'active', 20),
  ('mult-table-4', 'multiplication-tables', 'Tabla del 4', 'Multiplicar por 4', '4', 'multiplication-table', '["primary-3","primary-4"]', 'active', 30),
  ('mult-table-5', 'multiplication-tables', 'Tabla del 5', 'Multiplicar por 5', '5', 'multiplication-table', '["primary-3","primary-4"]', 'active', 40),
  ('mult-table-6', 'multiplication-tables', 'Tabla del 6', 'Multiplicar por 6', '6', 'multiplication-table', '["primary-3","primary-4"]', 'active', 50),
  ('mult-table-7', 'multiplication-tables', 'Tabla del 7', 'Multiplicar por 7', '7', 'multiplication-table', '["primary-3","primary-4"]', 'active', 60),
  ('mult-table-8', 'multiplication-tables', 'Tabla del 8', 'Multiplicar por 8', '8', 'multiplication-table', '["primary-3","primary-4"]', 'active', 70),
  ('mult-table-9', 'multiplication-tables', 'Tabla del 9', 'Multiplicar por 9', '9', 'multiplication-table', '["primary-3","primary-4"]', 'active', 80),
  ('mult-mix-2-9', 'multiplication-tables', 'Mezcla 2–9', 'Practicar varias tablas a la vez', 'mix-2-9', 'multiplication-table', '["primary-3","primary-4"]', 'active', 100);

-- Actividades (IDs sin nombre de curso; reutilizables en 3.º y 4.º)
INSERT IGNORE INTO arayapp_activities (id, title, description, skill_id, exercise_type, difficulty, status, sort_order, rewards_json, config_json) VALUES
  ('mult-table-2-learn', 'Aprende la tabla del 2', 'Repasa la tabla sin prisa', 'mult-table-2', 'learn', 'basic', 'active', 21, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":2,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-2-train', 'Entrena la tabla del 2', 'Completa la ronda a tu ritmo', 'mult-table-2', 'complete', 'basic', 'active', 22, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":2,"path":"/missions/mates/tables/train"}'),
  ('mult-table-2-challenge', 'Reto de la tabla del 2', 'Contrarreloj: responde rápido', 'mult-table-2', 'timed', 'medium', 'active', 23, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":2,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-2-match', 'Empareja la tabla del 2', 'Relaciona operaciones y resultados', 'mult-table-2', 'match', 'basic', 'active', 24, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":2,"path":"/missions/mates/tables/match"}'),
  ('mult-table-3-learn', 'Aprende la tabla del 3', 'Repasa la tabla sin prisa', 'mult-table-3', 'learn', 'basic', 'active', 31, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":3,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-3-train', 'Entrena la tabla del 3', 'Completa la ronda a tu ritmo', 'mult-table-3', 'complete', 'basic', 'active', 32, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":3,"path":"/missions/mates/tables/train"}'),
  ('mult-table-3-challenge', 'Reto de la tabla del 3', 'Contrarreloj: responde rápido', 'mult-table-3', 'timed', 'medium', 'active', 33, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":3,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-3-match', 'Empareja la tabla del 3', 'Relaciona operaciones y resultados', 'mult-table-3', 'match', 'basic', 'active', 34, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":3,"path":"/missions/mates/tables/match"}'),
  ('mult-table-4-learn', 'Aprende la tabla del 4', 'Repasa la tabla sin prisa', 'mult-table-4', 'learn', 'basic', 'active', 41, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":4,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-4-train', 'Entrena la tabla del 4', 'Completa la ronda a tu ritmo', 'mult-table-4', 'complete', 'basic', 'active', 42, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":4,"path":"/missions/mates/tables/train"}'),
  ('mult-table-4-challenge', 'Reto de la tabla del 4', 'Contrarreloj: responde rápido', 'mult-table-4', 'timed', 'medium', 'active', 43, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":4,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-4-match', 'Empareja la tabla del 4', 'Relaciona operaciones y resultados', 'mult-table-4', 'match', 'basic', 'active', 44, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":4,"path":"/missions/mates/tables/match"}'),
  ('mult-table-5-learn', 'Aprende la tabla del 5', 'Repasa la tabla sin prisa', 'mult-table-5', 'learn', 'basic', 'active', 51, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":5,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-5-train', 'Entrena la tabla del 5', 'Completa la ronda a tu ritmo', 'mult-table-5', 'complete', 'basic', 'active', 52, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":5,"path":"/missions/mates/tables/train"}'),
  ('mult-table-5-challenge', 'Reto de la tabla del 5', 'Contrarreloj: responde rápido', 'mult-table-5', 'timed', 'medium', 'active', 53, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":5,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-5-match', 'Empareja la tabla del 5', 'Relaciona operaciones y resultados', 'mult-table-5', 'match', 'basic', 'active', 54, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":5,"path":"/missions/mates/tables/match"}'),
  ('mult-table-6-learn', 'Aprende la tabla del 6', 'Repasa la tabla sin prisa', 'mult-table-6', 'learn', 'basic', 'active', 61, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":6,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-6-train', 'Entrena la tabla del 6', 'Completa la ronda a tu ritmo', 'mult-table-6', 'complete', 'basic', 'active', 62, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":6,"path":"/missions/mates/tables/train"}'),
  ('mult-table-6-challenge', 'Reto de la tabla del 6', 'Contrarreloj: responde rápido', 'mult-table-6', 'timed', 'medium', 'active', 63, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":6,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-6-match', 'Empareja la tabla del 6', 'Relaciona operaciones y resultados', 'mult-table-6', 'match', 'basic', 'active', 64, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":6,"path":"/missions/mates/tables/match"}'),
  ('mult-table-7-learn', 'Aprende la tabla del 7', 'Repasa la tabla sin prisa', 'mult-table-7', 'learn', 'basic', 'active', 71, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":7,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-7-train', 'Entrena la tabla del 7', 'Completa la ronda a tu ritmo', 'mult-table-7', 'complete', 'basic', 'active', 72, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":7,"path":"/missions/mates/tables/train"}'),
  ('mult-table-7-challenge', 'Reto de la tabla del 7', 'Contrarreloj: responde rápido', 'mult-table-7', 'timed', 'medium', 'active', 73, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":7,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-7-match', 'Empareja la tabla del 7', 'Relaciona operaciones y resultados', 'mult-table-7', 'match', 'basic', 'active', 74, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":7,"path":"/missions/mates/tables/match"}'),
  ('mult-table-8-learn', 'Aprende la tabla del 8', 'Repasa la tabla sin prisa', 'mult-table-8', 'learn', 'basic', 'active', 81, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":8,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-8-train', 'Entrena la tabla del 8', 'Completa la ronda a tu ritmo', 'mult-table-8', 'complete', 'basic', 'active', 82, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":8,"path":"/missions/mates/tables/train"}'),
  ('mult-table-8-challenge', 'Reto de la tabla del 8', 'Contrarreloj: responde rápido', 'mult-table-8', 'timed', 'medium', 'active', 83, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":8,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-8-match', 'Empareja la tabla del 8', 'Relaciona operaciones y resultados', 'mult-table-8', 'match', 'basic', 'active', 84, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":8,"path":"/missions/mates/tables/match"}'),
  ('mult-table-9-learn', 'Aprende la tabla del 9', 'Repasa la tabla sin prisa', 'mult-table-9', 'learn', 'basic', 'active', 91, '{"xpWeight":1,"coinWeight":1,"energyWeight":0}', '{"playMode":"learn","table":9,"path":"/missions/mates/tables/learn"}'),
  ('mult-table-9-train', 'Entrena la tabla del 9', 'Completa la ronda a tu ritmo', 'mult-table-9', 'complete', 'basic', 'active', 92, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"train","table":9,"path":"/missions/mates/tables/train"}'),
  ('mult-table-9-challenge', 'Reto de la tabla del 9', 'Contrarreloj: responde rápido', 'mult-table-9', 'timed', 'medium', 'active', 93, '{"xpWeight":1.2,"coinWeight":1.2,"energyWeight":1.2}', '{"playMode":"challenge","table":9,"path":"/missions/mates/tables/challenge"}'),
  ('mult-table-9-match', 'Empareja la tabla del 9', 'Relaciona operaciones y resultados', 'mult-table-9', 'match', 'basic', 'active', 94, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"match","table":9,"path":"/missions/mates/tables/match"}'),
  ('mult-misses-practice', 'Mis fallos', 'Repasa las operaciones que más cuestan', 'mult-mix-2-9', 'spot-error', 'medium', 'active', 900, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"misses","path":"/missions/mates/tables/train"}'),
  ('mult-random-mission', 'Misión random', 'Una misión sorpresa con tablas', 'mult-mix-2-9', 'mixed', 'medium', 'active', 910, '{"xpWeight":1,"coinWeight":1,"energyWeight":1}', '{"playMode":"random","path":"/missions/mates/tables/modes"}');

-- 3.º: recomendadas; 4.º: mismas actividades como repaso (sin duplicar progreso)
INSERT IGNORE INTO arayapp_course_activity_map (course_id, activity_id, role_code, sort_order)
SELECT 'primary-3', id, 'recommended', sort_order FROM arayapp_activities WHERE status = 'active';

INSERT IGNORE INTO arayapp_course_activity_map (course_id, activity_id, role_code, sort_order)
SELECT 'primary-4', id, 'review', sort_order FROM arayapp_activities WHERE status = 'active';

-- Aray / perfiles existentes → 3.º en modo repaso (sin tocar XP ni dominio)
UPDATE arayapp_player_profiles
SET current_course_id = 'primary-3',
    course_mode = 'review',
    course_started_at = COALESCE(course_started_at, UTC_TIMESTAMP())
WHERE current_course_id IS NULL OR current_course_id = '';
