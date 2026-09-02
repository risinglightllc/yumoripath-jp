-- migrations/004_add_stripe_customer_id.sql
-- The core `users` table (created in migrate.js's runCoreMigrations) already has
-- stripe_subscription_id / subscription_status / subscription_plan / subscription_expires_at,
-- but no stripe_customer_id — needed to match incoming Stripe webhook events
-- (customer.subscription.updated/deleted only carry the Stripe customer id) back to a user.
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users (stripe_customer_id);
