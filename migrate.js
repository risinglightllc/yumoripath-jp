/**
 * Database Migration Runner
 *
 * Runs on every deploy via `npm run build`.
 *
 * Handles both .js and .sql migration files in migrations/:
 *   - .js: module.exports = { name, up: async (client) => {} }
 *   - .sql: raw SQL executed as-is (DDL / data ops)
 *
 * All migrations tracked in _migrations table.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Running migrations...');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await runCoreMigrations(client);
    await runFolderMigrations(client);
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

async function runCoreMigrations(client) {
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
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email))
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users (stripe_subscription_id)
  `);
}

async function runFolderMigrations(client) {
  const dir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') || f.endsWith('.sql'))
    .sort();

  if (files.length === 0) return;

  const applied = await client.query('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.rows.map(r => r.name));

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const name = file.replace(/\/(js|sql)$/, '');

    if (appliedNames.has(name)) continue;

    console.log(`Running migration: ${name}`);
    await client.query('BEGIN');
    try {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(fullPath, 'utf8');
        await client.query(sql);
      } else {
        const migration = require(fullPath);
        await (migration.up || migration)(client);
      }
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Migration complete: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration failed (${name}): ${err.message}`);
    }
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});