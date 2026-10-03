const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('./connect');

const requiredTables = ['session', 'users', 'inquiries', 'projects', 'messages', 'notifications', 'audit_log'];
const adminPasswordHash = '$2a$12$Ta9ZnCKKHxWyrbTVtK0va.AHr3RQBQbm0aRRd9C.4v9uW6HO5icPq';

async function ensureAdminAccount() {
  await db.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ('VJU Tech Administrator', 'admin@vjutech.com', $1, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [adminPasswordHash]
  );
}

async function ensureCheckoutSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS checkout_carts (
      id BIGSERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL UNIQUE,
      package_key VARCHAR(30) NOT NULL CHECK (package_key IN ('basic', 'standard', 'premium')),
      package_name VARCHAR(80) NOT NULL,
      package_price NUMERIC(14, 2) NOT NULL CHECK (package_price >= 0),
      add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
      total NUMERIC(14, 2) NOT NULL CHECK (total >= 0),
      customer_name VARCHAR(160),
      customer_email VARCHAR(255),
      company VARCHAR(160),
      transaction_ref VARCHAR(180) UNIQUE,
      flutterwave_transaction_id VARCHAR(180),
      payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS checkout_carts_payment_status_idx ON checkout_carts(payment_status);
  `);
}

async function ensureContentImageSchema() {
  await db.query(`
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_data BYTEA;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(80);
    ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_data BYTEA;
    ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(80);
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS problem TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS solution TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS result TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS role VARCHAR(160);
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS timeline VARCHAR(120);
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS technologies TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS client_name VARCHAR(160);
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS client_logo TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS testimonial TEXT;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS testimonial_author VARCHAR(160);
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT 'web-development';
    ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

async function initializeDatabase() {
  const result = await db.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [requiredTables]
  );
  const existingTables = new Set(result.rows.map((row) => row.table_name));

  if (existingTables.size === requiredTables.length) {
    await ensureCheckoutSchema();
    await ensureContentImageSchema();
    await ensureAdminAccount();
    return;
  }
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
      `);
      await ensureAdminAccount();
      await ensureCheckoutSchema();
      await ensureContentImageSchema();
      console.log('PostgreSQL audit schema initialized.');
      return;
    }
    throw new Error(`Database schema is incomplete. Missing tables: ${missingTables.join(', ')}. Apply src/database/rebuild.sql once, then restart the service.`);
  }

  const schema = await fs.readFile(path.join(__dirname, 'rebuild.sql'), 'utf8');
  await db.query(schema);
  await ensureCheckoutSchema();
  await ensureContentImageSchema();
  console.log('PostgreSQL schema initialized.');
}

module.exports = initializeDatabase;