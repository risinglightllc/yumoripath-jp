/**
 * Users — paying subscribers of the property-search product.
 * Does NOT own: admin session auth (env-var based, see middleware/auth.js),
 * B2B entities (cases, clergy_partners, real_estate_leads).
 */
const { pool } = require('./index');

exports.findByEmail = async (email) =>
  (await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])).rows[0];

exports.findById = async (id) =>
  (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];

exports.findByStripeCustomerId = async (stripeCustomerId) =>
  (await pool.query('SELECT * FROM users WHERE stripe_customer_id = $1', [stripeCustomerId])).rows[0];

exports.create = async ({ email, name, password_hash }) =>
  (await pool.query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [email, name || null, password_hash]
  )).rows[0];

exports.updateStripeCustomerId = async (id, stripeCustomerId) =>
  (await pool.query(
    'UPDATE users SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [stripeCustomerId, id]
  )).rows[0];

exports.updateSubscription = async (id, { stripe_subscription_id, subscription_status, subscription_plan, subscription_expires_at }) =>
  (await pool.query(
    `UPDATE users SET
       stripe_subscription_id  = $1,
       subscription_status     = $2,
       subscription_plan       = $3,
       subscription_expires_at = $4,
       subscription_updated_at = NOW(),
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [stripe_subscription_id, subscription_status, subscription_plan, subscription_expires_at, id]
  )).rows[0];

exports.hasActiveSubscription = (user) =>
  !!user && user.subscription_status === 'active' &&
  (!user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date());
