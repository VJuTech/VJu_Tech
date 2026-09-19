const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('./connect');

const requiredTables = ['session', 'users', 'inquiries', 'projects', 'messages', 'notifications'];

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
    throw new Error(`Database schema is incomplete. Missing tables: ${missingTables.join(', ')}. Apply src/database/rebuild.sql once, then restart the service.`);
  }

  const schema = await fs.readFile(path.join(__dirname, 'rebuild.sql'), 'utf8');
  await db.query(schema);
  console.log('PostgreSQL schema initialized.');
}

module.exports = initializeDatabase;