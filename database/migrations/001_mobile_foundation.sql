BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_releases (
  id BIGSERIAL PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'retired')),
  notes TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_releases_one_published_idx
  ON content_releases ((status)) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS course_modules (
  id BIGSERIAL PRIMARY KEY,
  module_number INTEGER NOT NULL UNIQUE CHECK (module_number BETWEEN 1 AND 99),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::JSONB,
  description JSONB NOT NULL DEFAULT '{}'::JSONB,
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id INTEGER PRIMARY KEY CHECK (id > 0),
  module_id BIGINT NOT NULL REFERENCES course_modules(id),
  release_id BIGINT NOT NULL REFERENCES content_releases(id),
  slug TEXT NOT NULL,
  title JSONB NOT NULL DEFAULT '{}'::JSONB,
  summary JSONB NOT NULL DEFAULT '{}'::JSONB,
  content_blocks JSONB NOT NULL DEFAULT '[]'::JSONB,
  media JSONB NOT NULL DEFAULT '[]'::JSONB,
  estimated_minutes SMALLINT CHECK (estimated_minutes BETWEEN 1 AND 180),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (release_id, slug),
  UNIQUE (release_id, module_id, sort_order)
);

CREATE INDEX IF NOT EXISTS course_lessons_release_order_idx
  ON course_lessons (release_id, module_id, sort_order)
  WHERE published = TRUE;

CREATE TABLE IF NOT EXISTS exam_questions_v1 (
  id BIGSERIAL PRIMARY KEY,
  release_id BIGINT NOT NULL REFERENCES content_releases(id),
  external_key TEXT NOT NULL,
  prompt JSONB NOT NULL DEFAULT '{}'::JSONB,
  options JSONB NOT NULL DEFAULT '[]'::JSONB,
  explanation JSONB NOT NULL DEFAULT '{}'::JSONB,
  correct_option SMALLINT NOT NULL CHECK (correct_option BETWEEN 0 AND 9),
  category TEXT NOT NULL,
  media JSONB NOT NULL DEFAULT '[]'::JSONB,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (release_id, external_key)
);

CREATE INDEX IF NOT EXISTS exam_questions_v1_release_idx
  ON exam_questions_v1 (release_id, category)
  WHERE published = TRUE;

CREATE TABLE IF NOT EXISTS entitlements (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('web', 'apple', 'google', 'admin', 'beta')),
  external_reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'grace', 'expired', 'revoked')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_reference)
);

CREATE INDEX IF NOT EXISTS entitlements_user_status_idx
  ON entitlements (clerk_user_id, status, ends_at DESC);

CREATE TABLE IF NOT EXISTS purchase_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'apple', 'google', 'admin')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS user_devices (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  push_token TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clerk_user_id, device_id)
);

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS progress_percent SMALLINT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS mutation_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_percent_check'
  ) THEN
    ALTER TABLE lesson_progress
      ADD CONSTRAINT lesson_progress_percent_check
      CHECK (progress_percent BETWEEN 0 AND 100);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_mutation_idx
  ON lesson_progress (clerk_user_id, mutation_id)
  WHERE mutation_id IS NOT NULL;

INSERT INTO schema_migrations (version, name)
VALUES (1, 'mobile_foundation')
ON CONFLICT (version) DO NOTHING;

COMMIT;
