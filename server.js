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

// Stripe webhook needs the raw request body for signature verification, so it
// must be mounted with express.raw() before the global express.json() below.
const { stripeWebhookHandler } = require('./routes/billing');
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

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

// Property lookup API (public single-address search + gated map bbox search)
app.use('/api/lookup', require('./routes/lookup'));

// Public forms
app.use(require('./routes/forms'));

// Customer accounts + billing (public — signup/login/subscribe pages)
app.use(require('./routes/customer-auth'));
app.use(require('./routes/billing'));

// Paid property map (gated by requireSubscription inside routes/map.js)
app.use('/map', require('./routes/map'));

// Admin auth (public — login page)
app.use('/admin', require('./routes/admin-auth'));

// Admin protected routes
app.use('/admin',            requireAuth, require('./routes/dashboard'));
app.use('/admin/cases',      requireAuth, require('./routes/cases'));
app.use('/admin/leads',      requireAuth, require('./routes/real-estate-leads'));
app.use('/admin/clergy',     requireAuth, require('./routes/clergy'));
app.use('/admin/outreach',   requireAuth, require('./routes/outreach'));
app.use('/admin/finance',    requireAuth, require('./routes/finance'));
app.use('/admin/portfolio',  requireAuth, require('./routes/portfolio'));
app.use('/admin/properties', requireAuth, require('./routes/admin-properties'));

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

// Run migrations on startup, then start server
const { Pool: MigratePool } = require('pg');
const fs = require('fs');

async function runStartupMigrations() {
  const migPool = new MigratePool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  const client = await migPool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, applied_at TIMESTAMPTZ DEFAULT NOW())`);
    // Core `users` table — normally created by migrate.js's runCoreMigrations
    // (via `npm run build`), but this service's Render build command is just
    // `npm install`, so migrate.js never runs. Create it here too so startup
    // is self-sufficient regardless of build command.
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id               SERIAL PRIMARY KEY,
        email            VARCHAR(255) NOT NULL,
        name             VARCHAR(255),
        password_hash    VARCHAR(255),
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW(),
        stripe_subscription_id VARCHAR(255),
        subscription_status    VARCHAR(50),
        subscription_plan     VARCHAR(255),
        subscription_expires_at TIMESTAMPTZ,
        subscription_updated_at TIMESTAMPTZ
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email))`);
    await client.query(`CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users (stripe_subscription_id)`);
    const dir = path.join(__dirname, 'migrations');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.sql')).sort();
      const applied = await client.query('SELECT name FROM _migrations');
      const appliedNames = new Set(applied.rows.map(r => r.name));
      for (const file of files) {
        if (appliedNames.has(file)) continue;
        console.log(`[YUMORI] Running migration: ${file}`);
        await client.query('BEGIN');
        try {
          if (file.endsWith('.sql')) {
            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            await client.query(sql);
          } else {
            const migration = require(path.join(dir, file));
            await (migration.up || migration)(client);
          }
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`[YUMORI] Migration complete: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`[YUMORI] Migration failed (${file}):`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[YUMORI] Migration startup error (non-fatal):', err.message);
  } finally {
    client.release();
    await migPool.end();
  }
}

runStartupMigrations().then(() => {
  app.listen(port, () => console.log(`[YUMORI] Server running on port ${port}`));
}).catch((err) => {
  console.error('[YUMORI] Startup migration failed, starting anyway:', err.message);
  app.listen(port, () => console.log(`[YUMORI] Server running on port ${port}`));
});