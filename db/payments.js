/**
 * Payments / invoicing.
 * Does NOT own: cases (references only), Stripe integration (placeholder only).
 */
const { pool } = require('./index');

const PAYMENT_STATUSES = ['quoted', 'pending', 'deposit_paid', 'final_paid', 'unpaid'];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM payments WHERE 1=1';
  const params = [];
  if (filters.case_id) { params.push(filters.case_id); sql += ` AND case_id = $${params.length}`; }
  if (filters.payment_status) { params.push(filters.payment_status); sql += ` AND payment_status = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM payments WHERE id = $1', [id])).rows[0];

exports.create = async (data) => (await pool.query(`INSERT INTO payments (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  return (await pool.query(`UPDATE payments SET ${sets.join(',')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.values(data), id])).rows[0];
};

exports.summary = async () => {
  const r = await pool.query(`
    SELECT
      payment_status,
      COUNT(*) as count,
      COALESCE(SUM(quoted_amount), 0) as total_amount
    FROM payments
    GROUP BY payment_status
    ORDER BY count DESC
  `);
  return r.rows;
};

exports.PAYMENT_STATUSES = PAYMENT_STATUSES;