const db = require('../database/connect');

async function summary() {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM inquiries WHERE status = 'new') AS new_inquiries,
      (SELECT COUNT(*)::int FROM projects WHERE status IN ('pending', 'active')) AS open_projects,
      (SELECT COUNT(*)::int FROM messages WHERE created_at >= NOW() - INTERVAL '30 days') AS recent_messages,
      (SELECT COUNT(*)::int FROM project_files WHERE created_at >= NOW() - INTERVAL '30 days') AS recent_files
  `);
  return result.rows[0];
}

async function activity(limit = 50) {
  const result = await db.query(`
    SELECT audit_log.action, audit_log.entity_type, audit_log.entity_id,
           audit_log.metadata, audit_log.created_at, users.full_name AS actor_name
    FROM audit_log LEFT JOIN users ON users.id = audit_log.actor_id
    ORDER BY audit_log.created_at DESC LIMIT $1
  `, [limit]);
  return result.rows;
}

module.exports = { summary, activity };
