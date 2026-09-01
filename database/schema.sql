CREATE TABLE IF NOT EXISTS app_users (
  clerk_user_id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  access_status TEXT NOT NULL DEFAULT 'beta'
    CHECK (access_status IN ('beta', 'active', 'expired', 'blocked', 'admin')),
  access_starts_at TIMESTAMPTZ,
  access_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL CHECK (lesson_id BETWEEN 1 AND 150),
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  exam_number INTEGER NOT NULL CHECK (exam_number BETWEEN 1 AND 30),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 50),
  total_questions INTEGER NOT NULL DEFAULT 50 CHECK (total_questions = 50),
  answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  wrong_questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exam_results_user_completed_idx
  ON exam_results (clerk_user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS protected_lessons (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 150),
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 15),
  title_nl TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  rule_nl TEXT NOT NULL,
  rule_fa TEXT NOT NULL,
  tip_nl TEXT NOT NULL,
  tip_fa TEXT NOT NULL,
  image_path TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected_questions (
  id BIGSERIAL PRIMARY KEY,
  question_nl TEXT NOT NULL,
  question_fa TEXT NOT NULL,
  answers_nl JSONB NOT NULL,
  answers_fa JSONB NOT NULL,
  correct_answer SMALLINT NOT NULL CHECK (correct_answer BETWEEN 0 AND 2),
  scene TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
