BEGIN;

ALTER TABLE purchase_events
  DROP CONSTRAINT IF EXISTS purchase_events_provider_check;

ALTER TABLE purchase_events
  ADD CONSTRAINT purchase_events_provider_check
  CHECK (provider IN ('mollie', 'stripe', 'apple', 'google', 'admin'));

INSERT INTO schema_migrations (version, name)
VALUES (29, 'add_mollie_provider')
ON CONFLICT (version) DO NOTHING;

COMMIT;

