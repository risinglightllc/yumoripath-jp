/**
 * routes/lookup.js
 * Public API for the property lookup feature (single-address search, used by
 * the homepage widget) and the map search feature (bounding-box pins, gated
 * behind an active subscription — see routes/map.js).
 */
const express = require('express');
const router  = express.Router();
const propertiesDB = require('../db/properties');
const usersDB = require('../db/users');
const { pool } = require('../db/index');

router.get('/stats', async (_req, res) => {
  try {
    const [properties, c] = await Promise.all([
      propertiesDB.countVerified(),
      pool.query("SELECT COUNT(*) AS count FROM clergy WHERE status = 'active'")
    ]);
    res.json({
      properties,
      clergy: parseInt(c.rows[0].count, 10)
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
    const property = await propertiesDB.searchByAddress(q);
    if (property) return res.json({ found: true, property });
    return res.json({ found: false });
  } catch (err) {
    console.error('[lookup/search]', err.message);
    return res.status(500).json({ found: false });
  }
});

// Pins for the /map view — this is the actual paid data, so it's gated here
// too (not just by the page around it): every request must carry a session
// for a user with an active subscription.
router.get('/bbox', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  const north = parseFloat(req.query.north);
  const south = parseFloat(req.query.south);
  const east  = parseFloat(req.query.east);
  const west  = parseFloat(req.query.west);
  if ([north, south, east, west].some((n) => Number.isNaN(n))) {
    return res.status(400).json({ error: 'north, south, east, west are required numbers' });
  }
  try {
    const user = await usersDB.findById(req.session.userId);
    if (!usersDB.hasActiveSubscription(user)) {
      return res.status(402).json({ error: 'Active subscription required' });
    }
    const properties = await propertiesDB.searchBBox({ north, south, east, west });
    res.json({ properties });
  } catch (err) {
    console.error('[lookup/bbox]', err.message);
    res.status(500).json({ properties: [] });
  }
});

router.post('/report', async (req, res) => {
  const { address, type, date, source } = req.body || {};
  if (!address || !type) return res.status(400).json({ error: 'address and type required' });
  const VALID = ['suicide','murder','lonely_death','accident','fire','other'];
  if (!VALID.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  try {
    await propertiesDB.createReport({ address, type, date, source });
    res.json({ ok: true });
  } catch (err) {
    console.error('[lookup/report]', err.message);
    res.status(500).json({ error: 'Could not save' });
  }
});

module.exports = router;
