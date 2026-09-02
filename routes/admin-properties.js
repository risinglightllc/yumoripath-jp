/**
 * Admin properties router — CRUD for the stigmatized-property database
 * (address + lat/lng) that powers the public lookup widget and the paid /map.
 * Does NOT own: cases (B2B inquiry pipeline — a different table/flow).
 */
const express = require('express');
const router  = express.Router();
const propertiesDB = require('../db/properties');

function renderAdminError(res, message) {
  return res.status(500).render('admin/error', { message });
}

router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.verified === 'true')  filters.verified = true;
    if (req.query.verified === 'false') filters.verified = false;
    if (req.query.prefecture) filters.prefecture = req.query.prefecture;
    const properties = await propertiesDB.list(filters);
    res.render('admin/properties/index', { properties, filters });
  } catch (err) {
    console.error('[Properties] Index error:', err.message);
    renderAdminError(res, 'Property list failed to load. Please try again.');
  }
});

router.get('/new', (req, res) => {
  res.render('admin/properties/new', { INCIDENT_TYPES: propertiesDB.INCIDENT_TYPES });
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, verified: req.body.verified === 'on' };
    await propertiesDB.create(data);
    res.redirect('/admin/properties');
  } catch (err) {
    res.status(400).render('admin/properties/new', { error: err.message, INCIDENT_TYPES: propertiesDB.INCIDENT_TYPES });
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const p = await propertiesDB.getById(req.params.id);
    if (!p) return res.status(404).render('admin/error', { message: 'Property not found' });
    res.render('admin/properties/edit', { p, INCIDENT_TYPES: propertiesDB.INCIDENT_TYPES });
  } catch (err) {
    console.error('[Properties] Edit error:', err.message);
    renderAdminError(res, 'Property edit page failed to load. Please try again.');
  }
});

router.post('/:id', async (req, res) => {
  try {
    const data = { ...req.body, verified: req.body.verified === 'on' };
    await propertiesDB.update(req.params.id, data);
    res.redirect('/admin/properties');
  } catch (err) {
    const p = await propertiesDB.getById(req.params.id).catch(() => null);
    res.status(400).render('admin/properties/edit', { p, error: err.message, INCIDENT_TYPES: propertiesDB.INCIDENT_TYPES });
  }
});

module.exports = router;
