/**
 * routes/lookup.js
 * Public API for the property lookup feature.
 */
const express = require('express');
const router  = express.Router();
const { pool } = require('../db/index');

router.get('/stats', async (_req, res) => {
  try {
    const [p, c] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM properties WHERE verified = true'),
      pool.query("SELECT COUNT(*) AS count FROM clergy WHERE status = 'active'")
    ]);
    res.json({
      properties: parseInt(p.rows[0].count, 10),
      clergy:     parseInt(c.rows[0].count, 10)
    });
  } catch (err) {
    console.error('[lookup/stats]', err.message);
    res.json({ properties: null, clergy: null });
  }
});

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 3) return res.json({ found: false });
  try {
    const result = await pool.query(
      `SELECT id, address, prefecture,
              incident_type, incident_type_en,
              TO_CHAR(incident_date, 'YYYY年MM月') AS incident_date,
              severity
       FROM properties
       WHERE verified = true
         AND regexp_replace(address, '[\\s\u3000]+', '', 'g')
             ILIKE '%' || regexp_replace($1, '[\\s\u3000]+', '', 'g') || '%'
       ORDER BY incident_date DESC NULLS LAST
       LIMIT 1`,
      [q]
    );
    if (result.rows.length > 0) return res.json({ found: true, property: result.rows[0] });
    return res.json({ found: false });
  } catch (err) {
    console.error('[lookup/search]', err.message);
    return res.status(500).json({ found: false });
  }
});

router.post('/report', async (req, res) => {
  const { address, type, date, source } = req.body || {};
  if (!address || !type) return res.status(400).json({ error: 'address and type required' });
  const VALID = ['suicide','murder','lonely_death','accident','fire','other'];
  if (!VALID.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  try {
    await pool.query(
      `INSERT INTO property_reports (address, incident_type, incident_date, source, submitted_at, status)
       VALUES ($1, $2, $3::date, $4, NOW(), 'pending')`,
      [address.slice(0,500), type, date||null, (source||'').slice(0,1000)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[lookup/report]', err.message);
    res.status(500).json({ error: 'Could not save' });
  }
});

module.exports = router;