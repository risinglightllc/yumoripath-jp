const express = require('express');
const session  = require('express-session');
const path     = require('path');
const { buildLandingContext } = require('./lib/landing-context');
const { requireAuth } = require('./middleware/auth');

const app  = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const { pool } = require('./db/index');
pool.on('error', (err) => {
  console.error('[pg pool] idle client error (non-fatal):', err && err.message);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'REDACTED',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 86400000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/health', (_req, res) => res.json({ status: 'healthy' }));

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.get('/', (_req, res) => res.render('layout', buildLandingContext()));

// Public forms
app.use(require('./routes/forms'));

// Admin auth (public — login page)
app.use('/admin', require('./routes/admin-auth'));

// Admin protected routes
app.use('/admin',         requireAuth, require('./routes/dashboard'));
app.use('/admin/cases',   requireAuth, require('./routes/cases'));
app.use('/admin/leads',   requireAuth, require('./routes/real-estate-leads'));
app.use('/admin/clergy',  requireAuth, require('./routes/clergy'));
app.use('/admin/outreach',requireAuth, require('./routes/outreach'));
app.use('/admin/finance',   requireAuth, require('./routes/finance'));
app.use('/admin/portfolio', requireAuth, require('./routes/portfolio'));

// Global error handler — prevents crashes
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  if (req.path.startsWith('/admin')) {
    return res.status(500).render('admin/error', { message: 'Something went wrong. Please try again.' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection (non-fatal):', reason && reason.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message);
});

app.listen(port, () => console.log(`[YUMORI] Server running on port ${port}`));