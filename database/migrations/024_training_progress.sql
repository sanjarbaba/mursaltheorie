-- Persist hazard-training progress for web and future native clients.
BEGIN;
CREATE TABLE IF NOT EXISTS training_progress (
  clerk_user_id TEXT PRIMARY KEY REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  answered INTEGER NOT NULL DEFAULT 0 CHECK (answered >= 0),
  correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0 AND correct <= answered),
  scenario_index INTEGER NOT NULL DEFAULT 0 CHECK (scenario_index >= 0),
  client_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS training_progress_updated_idx ON training_progress(updated_at);
INSERT INTO schema_migrations(version,name) VALUES(24,'training_progress') ON CONFLICT(version) DO NOTHING;
COMMIT;

