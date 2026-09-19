const db = require('../database/connect');

async function findUsers() {
  const result = await db.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

async function findInquiries() {
  const result = await db.query('SELECT id, name, email, company, project_description, budget, status, created_at FROM inquiries ORDER BY created_at DESC');
  return result.rows;
}

async function findProjects() {
  const result = await db.query(`SELECT projects.id, projects.name, projects.status, projects.progress, projects.due_date, users.full_name AS client_name FROM projects JOIN users ON users.id = projects.client_id ORDER BY projects.created_at DESC`);
  return result.rows;
}

async function findMessages() {
  const result = await db.query(`SELECT messages.id, messages.body, messages.created_at, messages.project_id, users.full_name AS sender_name FROM messages JOIN users ON users.id = messages.sender_id ORDER BY messages.created_at DESC`);
  return result.rows;
}

module.exports = { findUsers, findInquiries, findProjects, findMessages };