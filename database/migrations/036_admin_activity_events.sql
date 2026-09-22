BEGIN;

CREATE TABLE IF NOT EXISTS activity_events (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','heartbeat','lesson_open','signs_open','training_open','exam_start')),
  path TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'nl' CHECK (language IN ('nl','fa','ps')),
  view_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_events_created_idx ON activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_user_created_idx ON activity_events (clerk_user_id, created_at DESC);

INSERT INTO schema_migrations (version, name)
VALUES (36, 'admin_activity_events')
ON CONFLICT (version) DO NOTHING;

COMMIT;
