const db = require('../database/connect');

async function createInquiry({ name, email, company, projectDescription, budget }) {
  const result = await db.query(
    `INSERT INTO inquiries (name, email, company, project_description, budget)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, company, project_description, budget, status, created_at`,
    [name, email, company || null, projectDescription, budget || null]
  );

  return result.rows[0];
}

module.exports = { createInquiry };