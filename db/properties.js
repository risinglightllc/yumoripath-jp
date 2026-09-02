/**
 * Properties — stigmatized-property database (public lookup + map search) and
 * the incident reports submitted against it.
 * Does NOT own: cases (B2B inquiry pipeline — a different table/flow).
 */
const { pool } = require('./index');

exports.countVerified = async () =>
  parseInt((await pool.query('SELECT COUNT(*) AS count FROM properties WHERE verified = true')).rows[0].count, 10);

exports.searchByAddress = async (q) => {
  const result = await pool.query(
    `SELECT id, address, prefecture,
            incident_type, incident_type_en,
            TO_CHAR(incident_date, 'YYYY年MM月') AS incident_date,
            severity
     FROM properties
     WHERE verified = true
       AND regexp_replace(address, '[\\s　]+', '', 'g')
           ILIKE '%' || regexp_replace($1, '[\\s　]+', '', 'g') || '%'
     ORDER BY incident_date DESC NULLS LAST
     LIMIT 1`,
    [q]
  );
  return result.rows[0];
};

// Pins for the map view — bounded by the visible viewport ("Search Here").
exports.searchBBox = async ({ north, south, east, west, limit = 500 }) => {
  const result = await pool.query(
    `SELECT id, address, prefecture, city, latitude, longitude,
            incident_type, incident_type_en, severity,
            TO_CHAR(incident_date, 'YYYY-MM') AS incident_date
     FROM properties
     WHERE verified = true
       AND latitude IS NOT NULL AND longitude IS NOT NULL
       AND latitude  BETWEEN $1 AND $2
       AND longitude BETWEEN $3 AND $4
     ORDER BY incident_date DESC NULLS LAST
     LIMIT $5`,
    [south, north, west, east, limit]
  );
  return result.rows;
};

exports.createReport = async ({ address, type, date, source }) => {
  await pool.query(
    `INSERT INTO property_reports (address, incident_type, incident_date, source, submitted_at, status)
     VALUES ($1, $2, $3::date, $4, NOW(), 'pending')`,
    [address.slice(0, 500), type, date || null, (source || '').slice(0, 1000)]
  );
};

// --- Admin CRUD ---

exports.list = async (filters = {}) => {
  let sql = 'SELECT * FROM properties WHERE 1=1';
  const params = [];
  if (filters.verified !== undefined) { params.push(filters.verified); sql += ` AND verified = $${params.length}`; }
  if (filters.prefecture) { params.push(filters.prefecture); sql += ` AND prefecture = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  if (filters.limit) { params.push(filters.limit); sql += ` LIMIT $${params.length}`; }
  return (await pool.query(sql, params)).rows;
};

exports.getById = async (id) => (await pool.query('SELECT * FROM properties WHERE id = $1', [id])).rows[0];

exports.create = async (data) => {
  const cols = [];
  const vals = [];
  const ph = [];
  let i = 1;
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== '') { cols.push(k); vals.push(v); ph.push(`$${i++}`); }
  }
  const r = await pool.query(`INSERT INTO properties (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals);
  return r.rows[0];
};

exports.update = async (id, data) => {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const sets = entries.map(([k], i) => `${k} = $${i + 1}`);
  const vals = entries.map(([, v]) => v);
  return (await pool.query(
    `UPDATE properties SET ${sets.join(',')}, updated_at = NOW() WHERE id = $${sets.length + 1} RETURNING *`,
    [...vals, id]
  )).rows[0];
};

exports.INCIDENT_TYPES = [
  { value: 'suicide',      en: 'Suicide',          ja: '自殺・自死' },
  { value: 'murder',       en: 'Murder',           ja: '殺人・他殺' },
  { value: 'lonely_death', en: 'Unattended Death', ja: '孤独死' },
  { value: 'accident',     en: 'Accident',         ja: '事故死' },
  { value: 'fire',         en: 'Fire',             ja: '火災' },
  { value: 'other',        en: 'Other',            ja: 'その他' },
];
