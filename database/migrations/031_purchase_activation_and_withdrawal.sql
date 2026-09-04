BEGIN;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('mollie', 'stripe', 'apple', 'google', 'admin')),
  provider_payment_id TEXT NOT NULL,
  clerk_user_id TEXT REFERENCES app_users(clerk_user_id) ON DELETE SET NULL,
  customer_email TEXT,
  product_key TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_value NUMERIC(10,2) NOT NULL,
  amount_currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('payment_pending', 'paid_awaiting_activation', 'active', 'withdrawn', 'cancelled', 'failed')),
  consent_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  confirmation_sent_at TIMESTAMPTZ,
  confirmation_email_id TEXT,
  activated_at TIMESTAMPTZ,
  withdrawal_requested_at TIMESTAMPTZ,
  refund_reference TEXT,
  refunded_at TIMESTAMPTZ,
  withdrawal_confirmation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS purchase_orders_user_created_idx
  ON purchase_orders (clerk_user_id, created_at DESC);

INSERT INTO schema_migrations (version, name)
VALUES (31, 'purchase_activation_and_withdrawal')
ON CONFLICT (version) DO NOTHING;

COMMIT;
