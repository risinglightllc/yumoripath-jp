/**
 * Database pool (shared connection).
 * Only this file may construct `new Pool()`.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[pg pool] idle client error:', err && err.message);
});

module.exports = { pool };