/**
 * Customer auth — signup/login/logout for the paid property-search product.
 * Separate from admin auth (middleware/auth.js, env-var credentials) and from
 * the B2B forms (routes/forms.js). Session key: req.session.userId.
 */
const express = require('express');
const router  = express.Router();
const usersDB = require('../db/users');
const { hashPassword, verifyPassword } = require('../lib/password');

router.get('/signup', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/subscribe');
  res.render('signup', { error: null, next: req.query.next || '' });
});

router.post('/signup', async (req, res) => {
  const { email, password, name, next } = req.body;
  try {
    if (!email || !password || password.length < 8) {
      return res.status(400).render('signup', { error: 'Please enter an email and a password of at least 8 characters.', next: next || '' });
    }
    const existing = await usersDB.findByEmail(email);
    if (existing) {
      return res.status(400).render('signup', { error: 'An account with that email already exists.', next: next || '' });
    }
    const password_hash = await hashPassword(password);
    const user = await usersDB.create({ email, name, password_hash });
    req.session.userId = user.id;
    res.redirect(next || '/subscribe');
  } catch (err) {
    console.error('[customer-auth] Signup error:', err.message);
    res.status(500).render('signup', { error: 'Something went wrong. Please try again.', next: next || '' });
  }
});

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) return res.redirect(req.query.next || '/map');
  res.render('login', { error: null, next: req.query.next || '' });
});

router.post('/login', async (req, res) => {
  const { email, password, next } = req.body;
  try {
    const user = await usersDB.findByEmail(email || '');
    const ok = user && user.password_hash && await verifyPassword(password || '', user.password_hash);
    if (!ok) {
      return res.status(400).render('login', { error: 'Invalid email or password.', next: next || '' });
    }
    req.session.userId = user.id;
    res.redirect(next || '/map');
  } catch (err) {
    console.error('[customer-auth] Login error:', err.message);
    res.status(500).render('login', { error: 'Something went wrong. Please try again.', next: next || '' });
  }
});

router.post('/logout', (req, res) => {
  req.session.userId = null;
  res.redirect('/');
});

module.exports = router;
