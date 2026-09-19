const db = require('../database/connect');

async function findByClientId(clientId) {
  const result = await db.query(
    `SELECT id, name, description, status, progress, due_date
     FROM projects
     WHERE client_id = $1
     ORDER BY created_at DESC`,
    [clientId]
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.query('SELECT id, name, description, status, progress, due_date FROM projects WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createMessage(projectId, senderId, body) {
  const result = await db.query('INSERT INTO messages (project_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at', [projectId, senderId, body]);
  return result.rows[0];
}

async function findMessages(projectId) {
  const result = await db.query(`SELECT messages.id, messages.body, messages.created_at, users.full_name AS sender_name FROM messages JOIN users ON users.id = messages.sender_id WHERE project_id = $1 ORDER BY messages.created_at ASC`, [projectId]);
  return result.rows;
}

module.exports = { findByClientId, findById, createMessage, findMessages };