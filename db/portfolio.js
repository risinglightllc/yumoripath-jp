/**
 * Portfolio pillars and entries — RisingOS three-pillar overview.
 * Does NOT own: cases, leads, clergy, vendors, payments.
 */
const { pool } = require('./index');

// --- Pillars ---

exports.listPillars = async () => {
  const r = await pool.query(
    'SELECT * FROM portfolio_pillars WHERE is_active = true ORDER BY sort_order ASC'
  );
  return r.rows;
};

// --- Entries ---

exports.listEntries = async (pillarKey) => {
  let sql = 'SELECT * FROM portfolio_entries WHERE is_active = true';
  const params = [];
  if (pillarKey) { params.push(pillarKey); sql += ` AND pillar_key = $${params.length}`; }
  sql += ' ORDER BY sort_order ASC';
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) =>
  (await pool.query('SELECT * FROM portfolio_entries WHERE id = $1', [id])).rows[0];

exports.create = async (data) => {
  const cols = ['pillar_key', 'name', 'description', 'value', 'notes', 'sort_order'];
  const vals = [data.pillar_key, data.name, data.description, data.value, data.notes, data.sort_order || 0];
  const r = await pool.query(
    `INSERT INTO portfolio_entries (${cols.join(',')}) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, vals
  );
  return r.rows[0];
};

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  const vals = Object.values(data);
  return (await pool.query(
    `UPDATE portfolio_entries SET ${sets.join(',')}, updated_at = NOW() WHERE id = $${sets.length + 1} RETURNING *`,
    [...vals, id]
  )).rows[0];
};

exports.remove = async (id) =>
  pool.query('UPDATE portfolio_entries SET is_active = false WHERE id = $1', [id]);