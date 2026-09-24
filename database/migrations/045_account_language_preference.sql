BEGIN;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT
  CHECK (preferred_locale IN ('nl', 'fa', 'ps'));

INSERT INTO schema_migrations (version, name)
VALUES (45, 'account_language_preference')
ON CONFLICT (version) DO NOTHING;

COMMIT;
