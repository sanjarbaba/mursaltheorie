BEGIN;

CREATE TABLE IF NOT EXISTS apple_account_tokens (
  clerk_user_id TEXT PRIMARY KEY REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  app_account_token UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apple_iap_transactions (
  environment TEXT NOT NULL CHECK (environment IN ('Production', 'Sandbox')),
  transaction_id TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (environment, transaction_id)
);

CREATE INDEX IF NOT EXISTS apple_iap_transactions_user_product_idx
  ON apple_iap_transactions (clerk_user_id, product_key, environment, purchase_at);

CREATE OR REPLACE FUNCTION record_apple_iap_transaction(
  p_environment TEXT,
  p_transaction_id TEXT,
  p_user_id TEXT,
  p_product_key TEXT,
  p_product_id TEXT,
  p_purchase_at TIMESTAMPTZ,
  p_revoked_at TIMESTAMPTZ,
  p_allow_sandbox BOOLEAN
) RETURNS TABLE (entitlement_status TEXT, access_until TIMESTAMPTZ)
LANGUAGE plpgsql AS $$
DECLARE
  v_existing apple_iap_transactions%ROWTYPE;
  v_item apple_iap_transactions%ROWTYPE;
  v_previous_end TIMESTAMPTZ;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF p_environment NOT IN ('Production', 'Sandbox') OR p_transaction_id !~ '^[0-9]{1,30}$'
    OR p_product_key IS NULL OR p_product_id IS NULL OR p_purchase_at IS NULL THEN
    RAISE EXCEPTION 'Invalid Apple transaction';
  END IF;

  -- Serialize all transactions for one account, including concurrent callbacks.
  PERFORM 1 FROM app_users WHERE clerk_user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown account'; END IF;

  SELECT * INTO v_existing FROM apple_iap_transactions
  WHERE environment = p_environment AND transaction_id = p_transaction_id FOR UPDATE;
  IF FOUND AND (v_existing.clerk_user_id <> p_user_id
    OR v_existing.product_key <> p_product_key OR v_existing.product_id <> p_product_id
    OR v_existing.purchase_at <> p_purchase_at) THEN
    RAISE EXCEPTION 'Apple transaction belongs to another account or product';
  END IF;

  INSERT INTO apple_iap_transactions (
    environment, transaction_id, clerk_user_id, product_key, product_id, purchase_at, revoked_at
  ) VALUES (
    p_environment, p_transaction_id, p_user_id, p_product_key, p_product_id, p_purchase_at, p_revoked_at
  ) ON CONFLICT (environment, transaction_id) DO UPDATE SET
    revoked_at = EXCLUDED.revoked_at, updated_at = NOW();

  v_previous_end := NULL;
  FOR v_item IN
    SELECT * FROM apple_iap_transactions
    WHERE clerk_user_id = p_user_id AND product_key = p_product_key AND environment = p_environment
    ORDER BY purchase_at, transaction_id
  LOOP
    v_start := GREATEST(v_item.purchase_at, COALESCE(v_previous_end, v_item.purchase_at));
    v_end := v_start + INTERVAL '30 days';
    IF v_item.revoked_at IS NOT NULL THEN
      v_status := 'revoked';
    ELSIF p_environment = 'Sandbox' AND NOT p_allow_sandbox THEN
      v_status := 'pending';
    ELSE
      v_status := 'active';
    END IF;
    IF v_item.revoked_at IS NULL THEN v_previous_end := v_end; END IF;

    INSERT INTO entitlements (
      clerk_user_id, product_key, source, external_reference, status, starts_at, ends_at
    ) VALUES (
      p_user_id, p_product_key, 'apple', LOWER(p_environment) || ':' || v_item.transaction_id,
      v_status, v_start, v_end
    ) ON CONFLICT (source, external_reference) DO UPDATE SET
      status = EXCLUDED.status, starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at, updated_at = NOW();

    IF v_item.transaction_id = p_transaction_id THEN
      entitlement_status := v_status;
      access_until := v_end;
    END IF;
  END LOOP;
  RETURN NEXT;
END;
$$;

INSERT INTO schema_migrations (version, name)
VALUES (46, 'apple_in_app_purchases')
ON CONFLICT (version) DO NOTHING;

COMMIT;
