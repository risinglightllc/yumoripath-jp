/**
 * Finance router — payments and invoicing (Stripe placeholder).
 * Does NOT own: case management (references only), Stripe activation (not connected).
 */
const express = require('express');
const router  = express.Router();
const paymentsDB = require('../db/payments');

router.get('/', async (req, res) => {
  const filters = {};
  if (req.query.payment_status) filters.payment_status = req.query.payment_status;
  if (req.query.case_id)       filters.case_id        = parseInt(req.query.case_id);
  const payments   = await paymentsDB.list(filters);
  const summary    = await paymentsDB.summary();
  res.render('admin/finance/index', { payments, summary, filters, PAYMENT_STATUSES: paymentsDB.PAYMENT_STATUSES });
});

router.get('/new', (req, res) => {
  res.render('admin/finance/new', { PAYMENT_STATUSES: paymentsDB.PAYMENT_STATUSES });
});

router.post('/', async (req, res) => {
  try {
    await paymentsDB.create(req.body);
    res.redirect('/admin/finance');
  } catch (err) {
    res.status(400).render('admin/finance/new', { error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const p = await paymentsDB.getById(req.params.id);
  if (!p) return res.status(404).render('admin/error', { message: 'Payment not found' });
  res.render('admin/finance/show', { p });
});

router.get('/:id/edit', async (req, res) => {
  const p = await paymentsDB.getById(req.params.id);
  if (!p) return res.status(404).render('admin/error', { message: 'Payment not found' });
  res.render('admin/finance/edit', { p });
});

router.post('/:id', async (req, res) => {
  try {
    await paymentsDB.update(req.params.id, req.body);
    res.redirect(`/admin/finance/${req.params.id}`);
  } catch (err) {
    const p = await paymentsDB.getById(req.params.id);
    res.status(400).render('admin/finance/edit', { p, error: err.message });
  }
});

module.exports = router;