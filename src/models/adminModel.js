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

async function findClients() {
  const result = await db.query("SELECT id, full_name, email FROM users WHERE role = 'client' ORDER BY full_name ASC");
  return result.rows;
}

async function dashboardSummary() {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM inquiries WHERE status = 'new') AS new_inquiries,
      (SELECT COUNT(*)::int FROM projects WHERE status IN ('pending', 'active')) AS active_projects,
      (SELECT COUNT(*)::int FROM users WHERE role = 'client') AS clients,
      (SELECT COUNT(*)::int FROM checkout_carts WHERE payment_status = 'paid') AS paid_orders,
      (SELECT COALESCE(SUM(total), 0)::numeric(14, 2) FROM checkout_carts WHERE payment_status = 'paid') AS paid_revenue,
      (SELECT COUNT(*)::int FROM checkout_carts WHERE payment_status = 'pending') AS pending_checkouts,
      (SELECT COUNT(*)::int FROM messages WHERE created_at >= NOW() - INTERVAL '30 days') AS recent_messages
  `);
  return result.rows[0];
}

async function recentCheckouts(limit = 8) {
  const result = await db.query(`
    SELECT id, package_name, package_price, add_ons, total, customer_name, customer_email,
           payment_status, transaction_ref, created_at, updated_at
    FROM checkout_carts
    ORDER BY updated_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

async function updateInquiryStatus(id, status) {
  const result = await db.query(
    `UPDATE inquiries SET status = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, status`,
    [id, status]
  );
  return result.rows[0] || null;
}

module.exports = { findUsers, findInquiries, findProjects, findMessages, findClients, dashboardSummary, recentCheckouts, updateInquiryStatus };