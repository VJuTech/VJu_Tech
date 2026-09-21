const db = require('../database/connect');

async function record({ actorId = null, action, entityType = null, entityId = null, metadata = {}, req = null }) {
  await db.query(
    `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata), req?.ip || null]
  );
}

async function recent(limit = 100) {
  const result = await db.query(
    `SELECT audit_log.id, audit_log.action, audit_log.entity_type, audit_log.entity_id,
            audit_log.metadata, audit_log.created_at, users.full_name AS actor_name
     FROM audit_log LEFT JOIN users ON users.id = audit_log.actor_id
     ORDER BY audit_log.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = { record, recent };
