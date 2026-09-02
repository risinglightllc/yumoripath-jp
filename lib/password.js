/**
 * Password hashing for customer accounts (users table).
 * Uses Node's built-in crypto.scrypt — no external hashing dependency.
 * Stored format: "<salt-hex>:<hash-hex>" in users.password_hash.
 */
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LEN = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LEN);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const derived = await scrypt(password, salt, KEY_LEN);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(storedBuf, derived);
}

module.exports = { hashPassword, verifyPassword };
