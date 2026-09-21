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

async function findByIdForUser(id, userId) {
  const result = await db.query(
    'SELECT id, name, description, status, progress, due_date FROM projects WHERE id = $1 AND client_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
}

async function createProject({ clientId, name, description, status = 'pending', progress = 0, dueDate }) {
  const result = await db.query(
    `INSERT INTO projects (client_id, name, description, status, progress, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, client_id, name, description, status, progress, due_date`,
    [clientId, name, description || null, status, progress, dueDate || null]
  );
  return result.rows[0];
}

async function createMessage(projectId, senderId, body) {
  const result = await db.query('INSERT INTO messages (project_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at', [projectId, senderId, body]);
  return result.rows[0];
}

async function findMessages(projectId) {
  const result = await db.query(`SELECT messages.id, messages.body, messages.created_at, users.full_name AS sender_name FROM messages JOIN users ON users.id = messages.sender_id WHERE project_id = $1 ORDER BY messages.created_at ASC`, [projectId]);
  return result.rows;
}

async function findFiles(projectId) {
  const result = await db.query(
    `SELECT id, file_name, file_type, file_size, created_at
     FROM project_files WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows;
}

async function createFile({ projectId, uploadedBy, fileName, storageKey, fileType, fileSize }) {
  const result = await db.query(
    `INSERT INTO project_files (project_id, uploaded_by, file_name, storage_key, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, file_name, file_type, file_size, created_at`,
    [projectId, uploadedBy, fileName, storageKey, fileType || null, fileSize || null]
  );
  return result.rows[0];
}

async function findFileForUser(fileId, projectId, userId) {
  const result = await db.query(
    `SELECT project_files.* FROM project_files
     JOIN projects ON projects.id = project_files.project_id
     WHERE project_files.id = $1 AND projects.id = $2 AND projects.client_id = $3`,
    [fileId, projectId, userId]
  );
  return result.rows[0] || null;
}

module.exports = { findByClientId, findById, findByIdForUser, createProject, createMessage, findMessages, findFiles, createFile, findFileForUser };