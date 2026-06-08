/**
 * Tasks.
 * Does NOT own: cases, payments.
 */
const { pool } = require('./index');

const STATUSES  = ['todo', 'in_progress', 'completed', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (filters.status) { params.push(filters.status); sql += ` AND status = $${params.length}`; }
  if (filters.owner) { params.push(filters.owner); sql += ` AND owner = $${params.length}`; }
  if (filters.due_soon) { sql += ` AND due_date <= CURRENT_DATE + INTERVAL '3 days' AND status != 'completed' AND status != 'archived'`; }
  sql += ' ORDER BY due_date ASC, priority DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM tasks WHERE id = $1', [id])).rows[0];

exports.create = async (data) => (await pool.query(`INSERT INTO tasks (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  return (await pool.query(`UPDATE tasks SET ${sets.join(',')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.values(data), id])).rows[0];
};

exports.STATUSES  = STATUSES;
exports.PRIORITIES = PRIORITIES;