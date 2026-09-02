/**
 * Map search — the paid product. Gated by requireSubscription; the page
 * itself only renders the shell, pins come from GET /api/lookup/bbox
 * (which re-checks the subscription server-side, see routes/lookup.js).
 */
const express = require('express');
const router  = express.Router();
const { requireSubscription } = require('../middleware/require-subscription');

router.get('/', requireSubscription, (req, res) => {
  res.render('map');
});

module.exports = router;
