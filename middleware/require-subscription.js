/**
 * Subscription guard for the paid property-search product (/map).
 * Checks session -> user -> active subscription, in that order,
 * redirecting to the earliest unmet step.
 */
const usersDB = require('../db/users');

exports.requireSubscription = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  try {
    const user = await usersDB.findById(req.session.userId);
    if (!user) {
      req.session.userId = null;
      return res.redirect('/login');
    }
    if (!usersDB.hasActiveSubscription(user)) {
      return res.redirect('/subscribe');
    }
    req.currentUser = user;
    return next();
  } catch (err) {
    console.error('[require-subscription]', err.message);
    return res.status(500).render('admin/error', { message: 'Something went wrong. Please try again.' });
  }
};
