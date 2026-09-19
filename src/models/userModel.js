const db = require('../database/connect');

async function findByEmail(email) {
  const result = await db.query('SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
}

async function recordActivity(userId, action, req) {
  await db.query('INSERT INTO user_activity (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)', [userId, action, req.ip, req.get('user-agent') || null]);
}

async function updateLogin(userId) { await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]); }
async function updateLogout(userId) { await db.query('UPDATE users SET last_logout_at = NOW() WHERE id = $1', [userId]); }

async function createUser({ fullName, email, passwordHash }) {
  const result = await db.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email, role`,
    [fullName, email.toLowerCase(), passwordHash]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await db.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createResetToken(userId, tokenHash, expiresAt) {
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}

async function consumeResetToken(tokenHash) {
  const result = await db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}

module.exports = { findByEmail, createUser, findById, createResetToken, consumeResetToken, updatePassword, recordActivity, updateLogin, updateLogout };