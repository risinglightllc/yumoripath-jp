/**
 * Clergy partners.
 * Does NOT own: cases, real estate leads, restoration vendors, payments.
 */
const { pool } = require('./index');

const REGISTRATION_STATUSES = ['pending', 'approved', 'active'];
const OUTREACH_STATUSES     = ['not contacted', 'contacted', 'interested', 'not interested', 'converted'];

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM clergy_partners WHERE 1=1';
  const params = [];
  if (filters.prefecture) { params.push(filters.prefecture); sql += ` AND prefecture = $${params.length}`; }
  if (filters.registration_status) { params.push(filters.registration_status); sql += ` AND registration_status = $${params.length}`; }
  if (filters.accepts_real_estate_cases !== undefined) { params.push(filters.accepts_real_estate_cases); sql += ` AND accepts_real_estate_cases = $${params.length}`; }
  sql += ' ORDER BY confidence_score DESC, created_at DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM clergy_partners WHERE id = $1', [id])).rows[0];

exports.create = async (data) => (await pool.query(`INSERT INTO clergy_partners (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i+1}`).join(',')}) RETURNING *`, Object.values(data))).rows[0];

exports.update = async (id, data) => {
  const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
  return (await pool.query(`UPDATE clergy_partners SET ${sets.join(',')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.values(data), id])).rows[0];
};

// Named export for public form route
exports.createClergyPartner = exports.create;

exports.findMatches = async (prefecture, municipality, service) => {
  // Priority 1: same municipality + relevant service
  let rows = (await pool.query(`
    SELECT *, 'same municipality' as match_reason,
           90 as confidence_score
    FROM clergy_partners
    WHERE municipality = $1 AND services_offered ILIKE $2 AND registration_status = 'active'
    UNION ALL
    SELECT *, 'same prefecture' as match_reason,
           70 as confidence_score
    FROM clergy_partners
    WHERE prefecture = $1 AND services_offered ILIKE $2 AND registration_status = 'active'
    ORDER BY confidence_score DESC, created_at DESC
    LIMIT 10
  `, [municipality || prefecture, `%${service || ''}%`])).rows;
  return rows;
};

exports.REGISTRATION_STATUSES = REGISTRATION_STATUSES;
exports.OUTREACH_STATUSES     = OUTREACH_STATUSES;