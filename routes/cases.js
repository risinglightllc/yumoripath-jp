/**
 * Cases router — CRUD for property/case management.
 * Does NOT own: real estate leads, clergy, vendors, outreach, tasks, payments.
 */
const express = require('express');
const router  = express.Router();
const casesDB = require('../db/cases');
const matchingService = require('../services/matching');

router.get('/', async (req, res) => {
  const filters = {};
  if (req.query.status)     filters.status     = req.query.status;
  if (req.query.prefecture) filters.prefecture  = req.query.prefecture;
  if (req.query.limit)      filters.limit       = parseInt(req.query.limit);
  const cases     = await casesDB.list(filters);
  const statusCounts = await casesDB.getStatusCounts();
  res.render('admin/cases/index', { cases, statusCounts, filters, STATUSES: casesDB.STATUSES });
});

router.get('/new', (req, res) => {
  res.render('admin/cases/new', { STATUSES: casesDB.STATUSES });
});

router.post('/', async (req, res) => {
  try {
    await casesDB.create(req.body);
    res.redirect('/admin/cases');
  } catch (err) {
    res.status(400).render('admin/cases/new', { error: err.message, STATUSES: casesDB.STATUSES });
  }
});

router.get('/:id', async (req, res) => {
  const c = await casesDB.getById(req.params.id);
  if (!c) return res.status(404).render('admin/error', { message: 'Case not found' });
  const matches = await matchingService.matchCase(c);
  res.render('admin/cases/show', { c, matches });
});

router.get('/:id/edit', async (req, res) => {
  const c = await casesDB.getById(req.params.id);
  if (!c) return res.status(404).render('admin/error', { message: 'Case not found' });
  res.render('admin/cases/edit', { c, STATUSES: casesDB.STATUSES });
});

router.post('/:id', async (req, res) => {
  try {
    await casesDB.update(req.params.id, req.body);
    res.redirect(`/admin/cases/${req.params.id}`);
  } catch (err) {
    const c = await casesDB.getById(req.params.id);
    res.status(400).render('admin/cases/edit', { c, error: err.message, STATUSES: casesDB.STATUSES });
  }
});

router.post('/:id/status', async (req, res) => {
  try {
    await casesDB.updateStatus(req.params.id, req.body.status);
    res.redirect(`/admin/cases/${req.params.id}`);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;