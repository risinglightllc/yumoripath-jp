/**
 * Outreach router — log outreach activities, track responses.
 * Does NOT own: cases, leads, clergy, vendors, tasks, payments.
 */
const express = require('express');
const router  = express.Router();
const outreachDB = require('../db/outreach-log');

function renderAdminError(res, message) {
  return res.status(500).render('admin/error', { message });
}

router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.recipient_type)   filters.recipient_type = req.query.recipient_type;
    if (req.query.response_status)  filters.response_status = req.query.response_status;
    if (req.query.overdue)          filters.overdue = true;
    const entries = await outreachDB.list(filters);
    res.render('admin/outreach/index', { entries, filters, RESPONSE_STATUSES: outreachDB.RESPONSE_STATUSES });
  } catch (err) {
    console.error('[Outreach] Index error:', err.message);
    renderAdminError(res, 'Outreach log failed to load. Please try again.');
  }
});

router.post('/', async (req, res) => {
  try {
    const { recipient_type } = req.body;
    // Prevent first outreach to clergy without human approval
    if (recipient_type === 'clergy' && !req.body.human_approved) {
      return res.status(400).json({
        error: 'Human approval required before first clergy outreach. Set human_approved=true to confirm.'
      });
    }
    await outreachDB.create(req.body);
    res.redirect('/admin/outreach');
  } catch (err) {
    res.status(400).render('admin/outreach/new', { error: err.message });
  }
});

router.get('/new', (req, res) => {
  res.render('admin/outreach/new');
});

router.post('/:id/respond', async (req, res) => {
  try {
    await outreachDB.updateResponse(req.params.id, req.body.response_status, req.body.notes);
    res.redirect('/admin/outreach');
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
