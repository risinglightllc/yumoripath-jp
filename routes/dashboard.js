/**
 * Admin dashboard — overview of all Yumori Path operations.
 * Does NOT own individual resources; aggregates them.
 */
const express = require('express');
const router  = express.Router();
const casesDB = require('../db/cases');
const leadsDB = require('../db/real-estate-leads');
const clergyDB = require('../db/clergy-partners');
const vendorsDB = require('../db/restoration-vendors');
const tasksDB = require('../db/tasks');
const paymentsDB = require('../db/payments');
const outreachDB = require('../db/outreach-log');

router.get('/', async (req, res) => {
  try {
    const [statusCounts, recentCases, recentLeads, recentClergy,
           overdueTasks, financeSummary, recentOutreach, recentPayments] = await Promise.all([
      casesDB.getStatusCounts().catch(() => []),
      casesDB.list({ limit: 10 }).catch(() => []),
      leadsDB.list({ jiko_relevance: 'high', limit: 5 }).catch(() => []),
      clergyDB.list({ registration_status: 'active', limit: 5 }).catch(() => []),
      tasksDB.list({ due_soon: true, limit: 10 }).catch(() => []),
      paymentsDB.summary().catch(() => []),
      outreachDB.list({ limit: 5 }).catch(() => []),
      paymentsDB.list({ limit: 5 }).catch(() => [])
    ]);

    const totalCases     = statusCounts.reduce((s, r) => s + parseInt(r.count || 0), 0);
    const activeCases   = statusCounts.filter(r => !['Archived','Completed'].includes(r.status))
                                      .reduce((s, r) => s + parseInt(r.count || 0), 0);
    const pendingOutreach = (await outreachDB.list({ response_status: 'no response', limit: 100 }).catch(() => [])).length;
    const totalLeads    = (await leadsDB.list({ limit: 1000 }).catch(() => [])).length;

    res.render('admin/dashboard', {
      statusCounts, recentCases, recentLeads, recentClergy,
      overdueTasks, financeSummary, recentOutreach, recentPayments,
      totalCases, activeCases, pendingOutreach, totalLeads,
      STATUSES: casesDB.STATUSES
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err.message);
    res.status(500).render('admin/error', { message: 'Dashboard failed to load. Please try again.' });
  }
});

module.exports = router;