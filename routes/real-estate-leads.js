/**
 * Real estate leads router.
 * Does NOT own: cases, clergy, vendors, outreach, tasks, payments.
 */
const express = require('express');
const router  = express.Router();
const leadsDB = require('../db/real-estate-leads');

function renderAdminError(res, message) {
  return res.status(500).render('admin/error', { message });
}

router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.outreach_status) filters.outreach_status = req.query.outreach_status;
    if (req.query.prefecture)      filters.prefecture      = req.query.prefecture;
    if (req.query.jiko_relevance)  filters.jiko_relevance  = req.query.jiko_relevance;
    const leads = await leadsDB.list(filters);
    res.render('admin/leads/index', { leads, filters, OUTREACH_STATUSES: leadsDB.OUTREACH_STATUSES, JIKO_RELEVANCES: leadsDB.JIKO_RELEVANCES });
  } catch (err) {
    console.error('[Leads] Index error:', err.message);
    renderAdminError(res, 'Real estate leads failed to load. Please try again.');
  }
});

router.get('/new', (req, res) => {
  res.render('admin/leads/new', { OUTREACH_STATUSES: leadsDB.OUTREACH_STATUSES, JIKO_RELEVANCES: leadsDB.JIKO_RELEVANCES });
});

router.post('/', async (req, res) => {
  try {
    await leadsDB.create(req.body);
    res.redirect('/admin/leads');
  } catch (err) {
    res.status(400).render('admin/leads/new', { error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const l = await leadsDB.getById(req.params.id);
    if (!l) return res.status(404).render('admin/error', { message: 'Lead not found' });
    res.render('admin/leads/show', { l });
  } catch (err) {
    console.error('[Leads] Show error:', err.message);
    renderAdminError(res, 'Lead details failed to load. Please try again.');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const l = await leadsDB.getById(req.params.id);
    if (!l) return res.status(404).render('admin/error', { message: 'Lead not found' });
    res.render('admin/leads/edit', { l });
  } catch (err) {
    console.error('[Leads] Edit error:', err.message);
    renderAdminError(res, 'Lead edit page failed to load. Please try again.');
  }
});

router.post('/:id', async (req, res) => {
  try {
    await leadsDB.update(req.params.id, req.body);
    res.redirect(`/admin/leads/${req.params.id}`);
  } catch (err) {
    const l = await leadsDB.getById(req.params.id).catch(() => null);
    res.status(400).render('admin/leads/edit', { l, error: err.message });
  }
});

module.exports = router;
