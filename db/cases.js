/**
 * Cases — property/case management.
 * Does NOT own: real estate leads, clergy, vendors, payments.
 */
const { pool } = require('./index');

const STATUSES = [
  'New submission', 'Needs review', 'Awaiting additional info',
  'Priest/clergy matching', 'Ceremony scheduled', 'Ceremony completed',
  'Restoration coordination', 'Completed', 'Archived'
];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM cases WHERE 1=1';
  const params = [];
  if (filters.status) { params.push(filters.status); sql += ` AND status = $${params.length}`; }
  if (filters.prefecture) { params.push(filters.prefecture); sql += ` AND prefecture = $${params.length}`; }
  sql += ' ORDER BY submission_date DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM cases WHERE case_id = $1', [id])).rows[0];

exports.create = async (data) => {
  const cols = [];
  const vals = [];
  const ph = [];
  let i = 1;
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { cols.push(k); vals.push(v); ph.push(`$${i++}`); }
  }
  const r = await pool.query(`INSERT INTO cases (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals);
  return r.rows[0];
};

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  const vals = Object.values(data);
  return (await pool.query(`UPDATE cases SET ${sets.join(',')}, updated_at = NOW() WHERE case_id = $${sets.length + 1} RETURNING *`, [...vals, id])).rows[0];
};

exports.updateStatus = async (id, status) => exports.update(id, { status });

// Named export for public form route
exports.createCase = exports.create;

exports.getStatusCounts = async () => {
  const r = await pool.query('SELECT status, COUNT(*) as count FROM cases GROUP BY status ORDER BY COUNT(*) DESC');
  return r.rows;
};

exports.STATUSES = STATUSES;