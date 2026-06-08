/**
 * Outreach log.
 * Does NOT own: cases, leads, clergy, vendors, payments.
 */
const { pool } = require('./index');

const RESPONSE_STATUSES = ['no response', 'interested', 'not interested', 'converted', 'bounced'];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM outreach_log WHERE 1=1';
  const params = [];
  if (filters.recipient_type) { params.push(filters.recipient_type); sql += ` AND recipient_type = $${params.length}`; }
  if (filters.response_status) { params.push(filters.response_status); sql += ` AND response_status = $${params.length}`; }
  if (filters.overdue) { sql += ` AND next_follow_up_date <= CURRENT_DATE AND response_status = 'no response'`; }
  sql += ' ORDER BY date_sent DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.create = async (data) => (await pool.query(`INSERT INTO outreach_log (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.updateResponse = async (id, response_status, notes) =>
  (await pool.query('UPDATE outreach_log SET response_status = $1, notes = COALESCE(notes, $2) WHERE id = $3 RETURNING *', [response_status, notes, id])).rows[0];

exports.RESPONSE_STATUSES = RESPONSE_STATUSES;