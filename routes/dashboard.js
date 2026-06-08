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
  const [statusCounts, recentCases, recentLeads, recentClergy,
         overdueTasks, financeSummary, recentOutreach, recentPayments] = await Promise.all([
    casesDB.getStatusCounts(),
    casesDB.list({ limit: 10 }),
    leadsDB.list({ jiko_relevance: 'high', limit: 5 }),
    clergyDB.list({ registration_status: 'active', limit: 5 }),
    tasksDB.list({ due_soon: true, limit: 10 }),
    paymentsDB.summary(),
    outreachDB.list({ limit: 5 }),
    paymentsDB.list({ limit: 5 })
  ]);

  const totalCases     = statusCounts.reduce((s, r) => s + parseInt(r.count), 0);
  const activeCases   = statusCounts.filter(r => !['Archived','Completed'].includes(r.status))
                                    .reduce((s, r) => s + parseInt(r.count), 0);
  const pendingOutreach = (await outreachDB.list({ response_status: 'no response', limit: 100 })).length;
  const totalLeads    = (await leadsDB.list({ limit: 1000 })).length;

  res.render('admin/dashboard', {
    statusCounts, recentCases, recentLeads, recentClergy,
    overdueTasks, financeSummary, recentOutreach, recentPayments,
    totalCases, activeCases, pendingOutreach, totalLeads,
    STATUSES: casesDB.STATUSES
  });
});

module.exports = router;