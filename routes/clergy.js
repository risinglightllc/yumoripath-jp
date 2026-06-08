/**
 * Clergy partners router.
 * Does NOT own: cases, real estate leads, vendors, outreach, tasks, payments.
 */
const express = require('express');
const router  = express.Router();
const clergyDB = require('../db/clergy-partners');

router.get('/', async (req, res) => {
  const filters = {};
  if (req.query.prefecture)          filters.prefecture          = req.query.prefecture;
  if (req.query.registration_status) filters.registration_status = req.query.registration_status;
  if (req.query.accepts_real_estate)  filters.accepts_real_estate_cases = true;
  const clergy = await clergyDB.list(filters);
  res.render('admin/clergy/index', { clergy, filters, REGISTRATION_STATUSES: clergyDB.REGISTRATION_STATUSES, OUTREACH_STATUSES: clergyDB.OUTREACH_STATUSES });
});

router.get('/new', (req, res) => {
  res.render('admin/clergy/new');
});

router.post('/', async (req, res) => {
  try {
    await clergyDB.create(req.body);
    res.redirect('/admin/clergy');
  } catch (err) {
    res.status(400).render('admin/clergy/new', { error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const c = await clergyDB.getById(req.params.id);
  if (!c) return res.status(404).render('admin/error', { message: 'Clergy partner not found' });
  res.render('admin/clergy/show', { c });
});

router.get('/:id/edit', async (req, res) => {
  const c = await clergyDB.getById(req.params.id);
  if (!c) return res.status(404).render('admin/error', { message: 'Clergy partner not found' });
  res.render('admin/clergy/edit', { c });
});

router.post('/:id', async (req, res) => {
  try {
    await clergyDB.update(req.params.id, req.body);
    res.redirect(`/admin/clergy/${req.params.id}`);
  } catch (err) {
    const c = await clergyDB.getById(req.params.id);
    res.status(400).render('admin/clergy/edit', { c, error: err.message });
  }
});

module.exports = router;