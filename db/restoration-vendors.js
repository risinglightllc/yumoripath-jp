/**
 * Restoration vendors.
 * Does NOT own: cases, clergy, real estate leads, payments.
 */
const { pool } = require('./index');

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM restoration_vendors WHERE 1=1';
  const params = [];
  if (filters.prefecture) { params.push(filters.prefecture); sql += ` AND prefecture = $${params.length}`; }
  if (filters.category) { params.push(filters.category); sql += ` AND category = $${params.length}`; }
  sql += ' ORDER BY relevance DESC, created_at DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM restoration_vendors WHERE id = $1', [id])).rows[0];

exports.create = async (data) => (await pool.query(`INSERT INTO restoration_vendors (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  return (await pool.query(`UPDATE restoration_vendors SET ${sets.join(',')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.values(data), id])).rows[0];
};