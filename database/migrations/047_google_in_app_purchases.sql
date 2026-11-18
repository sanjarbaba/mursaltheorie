BEGIN;
CREATE TABLE IF NOT EXISTS google_account_tokens (
  clerk_user_id TEXT PRIMARY KEY REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE CHECK (account_id ~ '^[a-f0-9]{64}$')
);
-- Keep a non-identifying token tombstone after account deletion to prevent replay.
CREATE TABLE IF NOT EXISTS google_iap_transactions (
  token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  clerk_user_id TEXT REFERENCES app_users(clerk_user_id) ON DELETE SET NULL,
  product_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS google_iap_user_idx ON google_iap_transactions (clerk_user_id, product_key, purchase_at);
CREATE OR REPLACE FUNCTION record_google_iap_transaction(
  p_token_hash TEXT, p_user_id TEXT, p_product_key TEXT, p_product_id TEXT,
  p_purchase_at TIMESTAMPTZ, p_revoked BOOLEAN
) RETURNS TABLE (entitlement_status TEXT, access_until TIMESTAMPTZ)
LANGUAGE plpgsql AS $$
DECLARE
  v_existing google_iap_transactions%ROWTYPE;
  v_item google_iap_transactions%ROWTYPE;
  v_previous_end TIMESTAMPTZ;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' OR p_purchase_at IS NULL
    OR p_revoked IS NULL OR NOT (
      (p_product_id = 'nl.mursaltheorie.course.nl.30d' AND p_product_key = 'theory_b_nl_30d') OR
      (p_product_id = 'nl.mursaltheorie.course.nl.fa.30d' AND p_product_key = 'theory_b_nl_fa_30d') OR
      (p_product_id = 'nl.mursaltheorie.course.nl.ps.30d' AND p_product_key = 'theory_b_nl_ps_30d')
    ) OR p_product_id IS NULL OR p_product_key IS NULL THEN
    RAISE EXCEPTION 'Invalid Google purchase';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_token_hash, 0));
  PERFORM 1 FROM app_users WHERE clerk_user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown account'; END IF;
  SELECT * INTO v_existing FROM google_iap_transactions WHERE token_hash = p_token_hash FOR UPDATE;
  IF FOUND AND (v_existing.clerk_user_id IS DISTINCT FROM p_user_id OR v_existing.product_key <> p_product_key
    OR v_existing.product_id <> p_product_id OR v_existing.purchase_at <> p_purchase_at) THEN
    RAISE EXCEPTION 'Google purchase belongs to another account or product';
  END IF;
  INSERT INTO google_iap_transactions (token_hash, clerk_user_id, product_key, product_id, purchase_at, revoked)
  VALUES (p_token_hash, p_user_id, p_product_key, p_product_id, p_purchase_at, p_revoked)
  ON CONFLICT (token_hash) DO UPDATE SET revoked = google_iap_transactions.revoked OR EXCLUDED.revoked, updated_at = NOW();
  -- Recompute in purchase order: retries never extend access and refunds remove their own time.
  v_previous_end := NULL;
  FOR v_item IN SELECT * FROM google_iap_transactions
    WHERE clerk_user_id = p_user_id AND product_key = p_product_key ORDER BY purchase_at, token_hash
  LOOP
    v_start := GREATEST(v_item.purchase_at, COALESCE(v_previous_end, v_item.purchase_at));
    v_end := v_start + INTERVAL '30 days';
    v_status := CASE WHEN v_item.revoked THEN 'revoked' ELSE 'active' END;
    IF NOT v_item.revoked THEN v_previous_end := v_end; END IF;
    INSERT INTO entitlements (clerk_user_id, product_key, source, external_reference, status, starts_at, ends_at)
    VALUES (p_user_id, p_product_key, 'google', v_item.token_hash, v_status, v_start, v_end)
    ON CONFLICT (source, external_reference) DO UPDATE SET status = EXCLUDED.status,
      starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, updated_at = NOW();
    IF v_item.token_hash = p_token_hash THEN entitlement_status := v_status; access_until := v_end; END IF;
  END LOOP;
  RETURN NEXT;
END;
$$;
INSERT INTO schema_migrations (version, name) VALUES (47, 'google_in_app_purchases') ON CONFLICT (version) DO NOTHING;
COMMIT;
