BEGIN;

-- New accounts must purchase access. Existing beta users keep their status.
ALTER TABLE app_users
  ALTER COLUMN access_status SET DEFAULT 'expired';

INSERT INTO schema_migrations (version, name)
VALUES (30, 'default_new_users_to_expired')
ON CONFLICT (version) DO NOTHING;

COMMIT;

