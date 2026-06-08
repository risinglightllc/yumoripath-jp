/**
 * Admin auth — login/logout handlers.
 * Uses session. Hardcoded admin credentials from env vars (YUMORI_ADMIN_USER, YUMORI_ADMIN_PASS).
 */
const express = require('express');
const router  = express.Router();

const ADMIN_USER = process.env.YUMORI_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.YUMORI_ADMIN_PASS || 'changeme';

router.get('/login', (req, res) => {
  if (req.session && req.session.adminUser) return res.redirect('/admin');
  res.render('admin/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.adminUser = username;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;