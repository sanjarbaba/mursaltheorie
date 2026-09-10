BEGIN;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS shipping_details JSONB;

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_status_check CHECK (
    status IN (
      'payment_pending',
      'paid_awaiting_activation',
      'paid_awaiting_fulfillment',
      'active',
      'fulfilled',
      'withdrawn',
      'cancelled',
      'failed'
    )
  );

INSERT INTO schema_migrations (version, name)
VALUES (43, 'physical_book_orders')
ON CONFLICT (version) DO NOTHING;

COMMIT;
