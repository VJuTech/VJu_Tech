const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('./connect');

const requiredTables = ['session', 'users', 'inquiries', 'projects', 'messages', 'notifications', 'audit_log'];

async function initializeDatabase() {
  const result = await db.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [requiredTables]
  );
  const existingTables = new Set(result.rows.map((row) => row.table_name));

  if (existingTables.size === requiredTables.length) return;
  if (existingTables.size > 0) {
    const missingTables = requiredTables.filter((table) => !existingTables.has(table));
    if (missingTables.length === 1 && missingTables[0] === 'audit_log') {
      await db.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id BIGSERIAL PRIMARY KEY,
          actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(80),
          entity_id BIGINT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          ip_address INET,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx ON audit_log(actor_id);
        CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ('VJU Tech Administrator', 'admin@vjutech.com', '$2a$12$xmm0odbTQNCuRw/onRxgDuX1RivEyAsNg5MEkygMJQmiEcdfFoSzG', 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin';
      `);
      console.log('PostgreSQL audit schema initialized.');
      return;
    }
    throw new Error(`Database schema is incomplete. Missing tables: ${missingTables.join(', ')}. Apply src/database/rebuild.sql once, then restart the service.`);
  }

  const schema = await fs.readFile(path.join(__dirname, 'rebuild.sql'), 'utf8');
  await db.query(schema);
  console.log('PostgreSQL schema initialized.');
}

module.exports = initializeDatabase;