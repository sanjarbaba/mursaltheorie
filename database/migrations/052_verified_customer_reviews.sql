-- Prepared only. Do not apply to production before approval.
BEGIN;
CREATE TABLE IF NOT EXISTS customer_reviews (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 clerk_user_id TEXT NOT NULL UNIQUE REFERENCES app_users(clerk_user_id),
 purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id),
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
 body TEXT NOT NULL CHECK(char_length(body) BETWEEN 20 AND 1500),
 display_name TEXT NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 60),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected')),
 publication_consented_at TIMESTAMPTZ NOT NULL,
 published_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(status<>'published' OR published_at IS NOT NULL)
);
INSERT INTO schema_migrations(version,name) VALUES(52,'verified_customer_reviews') ON CONFLICT(version) DO NOTHING;
COMMIT;
