/**
 * Opt-in submissions from physical outreach (QR code form).
 */
const { pool } = require('./index');

exports.create = async (data) => {
  const cols = [];
  const vals = [];
  const ph = [];
  let i = 1;
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) {
      cols.push(k);
      vals.push(v);
      ph.push(`$${i++}`);
    }
  }
  const r = await pool.query(
    `INSERT INTO opt_in_submissions (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`,
    vals
  );
  return r.rows[0];
};

exports.list = async () => {
  return (await pool.query('SELECT * FROM opt_in_submissions ORDER BY created_at DESC')).rows;
};

exports.getById = async (id) => {
  return (await pool.query('SELECT * FROM opt_in_submissions WHERE id = $1', [id])).rows[0];
};

exports.updateStatus = async (id, status) => {
  return (await pool.query(
    'UPDATE opt_in_submissions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  )).rows[0];
};
