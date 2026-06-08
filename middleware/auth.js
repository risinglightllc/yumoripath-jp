/**
 * Auth guard for admin routes.
 * Checks session cookie; redirects to /admin/login if not authenticated.
 */
const ADMIN_SESSION_KEY = 'yumori_admin_session';

exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.adminUser) {
    return next();
  }
  return res.redirect('/admin/login');
};

exports.clearSession = (req, res, next) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};