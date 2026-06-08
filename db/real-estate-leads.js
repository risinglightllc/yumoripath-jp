/**
 * Real estate leads.
 * Does NOT own: cases, clergy, vendors, payments.
 */
const { pool } = require('./index');

const OUTREACH_STATUSES = ['not contacted', 'contacted', 'interested', 'not interested', 'converted'];
const JIKO_RELEVANCES   = ['high', 'medium', 'low'];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM real_estate_leads WHERE 1=1';
  const params = [];
  if (filters.outreach_status) { params.push(filters.outreach_status); sql += ` AND outreach_status = $${params.length}`; }
  if (filters.prefecture) { params.push(filters.prefecture); sql += ` AND prefecture = $${params.length}`; }
  if (filters.jiko_relevance) { params.push(filters.jiko_relevance); sql += ` AND jiko_relevance = $${params.length}`; }
  sql += ' ORDER BY confidence_score DESC, created_at DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM real_estate_leads WHERE id = $1', [id])).rows[0];

exports.create = async (data) => (await pool.query(`INSERT INTO real_estate_leads (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  return (await pool.query(`UPDATE real_estate_leads SET ${sets.join(',')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.values(data), id])).rows[0];
};

exports.OUTREACH_STATUSES = OUTREACH_STATUSES;
exports.JIKO_RELEVANCES   = JIKO_RELEVANCES;