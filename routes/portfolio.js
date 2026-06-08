/**
 * Portfolio tracker — three-pillar overview for RisingOS.
 * Owns: pillar list, entry CRUD. Does NOT own: cases, leads, finance.
 */
const express = require('express');
const router  = express.Router();
const portfolioDB = require('../db/portfolio');

router.get('/', async (req, res) => {
  const pillars = await portfolioDB.listPillars();
  const entries = await portfolioDB.listEntries();

  const byPillar = {};
  for (const p of pillars) byPillar[p.pillar_key] = { ...p, entries: [] };
  for (const e of entries) {
    if (byPillar[e.pillar_key]) byPillar[e.pillar_key].entries.push(e);
  }

  res.render('admin/portfolio', { pillars, byPillar, path: req.path });
});

router.post('/entries', async (req, res) => {
  try {
    const { pillar_key, name, description, value, notes } = req.body;
    if (!pillar_key || !name) return res.status(400).json({ error: 'pillar_key and name required' });
    await portfolioDB.create({ pillar_key, name, description, value, notes });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/entries/:id', async (req, res) => {
  try {
    const updated = await portfolioDB.update(parseInt(req.params.id), req.body);
    res.json(updated || { error: 'not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    await portfolioDB.remove(parseInt(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;