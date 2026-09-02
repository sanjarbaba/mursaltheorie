BEGIN;

INSERT INTO entitlements (
  clerk_user_id,
  product_key,
  source,
  external_reference,
  status,
  starts_at,
  ends_at
)
SELECT
  clerk_user_id,
  'course.full',
  CASE
    WHEN access_status = 'admin' THEN 'admin'
    WHEN access_status = 'beta' THEN 'beta'
    ELSE 'web'
  END,
  'legacy:' || clerk_user_id,
  'active',
  COALESCE(access_starts_at, created_at),
  CASE WHEN access_status = 'active' THEN access_ends_at ELSE NULL END
FROM app_users
WHERE access_status IN ('beta', 'admin')
   OR (access_status = 'active' AND access_ends_at > NOW())
ON CONFLICT (source, external_reference) DO UPDATE SET
  product_key = EXCLUDED.product_key,
  status = EXCLUDED.status,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  updated_at = NOW();

INSERT INTO schema_migrations (version, name)
VALUES (2, 'legacy_entitlements')
ON CONFLICT (version) DO NOTHING;

COMMIT;
