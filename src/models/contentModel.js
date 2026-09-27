const db = require('../database/connect');

async function findPublishedPortfolio() {
  const result = await db.query('SELECT id, title, slug, summary, description, image_key FROM portfolio_items WHERE published = TRUE ORDER BY updated_at DESC');
  return result.rows;
}

async function findPublishedPosts() {
  const result = await db.query('SELECT id, title, slug, excerpt, body, image_key, published_at FROM blog_posts WHERE published = TRUE ORDER BY published_at DESC NULLS LAST, created_at DESC');
  return result.rows;
}

async function findAllPortfolio() {
  const result = await db.query('SELECT id, title, slug, summary, published, updated_at FROM portfolio_items ORDER BY updated_at DESC');
  return result.rows;
}

async function findAllPosts() {
  const result = await db.query('SELECT id, title, slug, published, published_at, updated_at FROM blog_posts ORDER BY updated_at DESC');
  return result.rows;
}

async function findPortfolioById(id) {
  const result = await db.query('SELECT id, title, slug, summary, description, image_key, project_link, published FROM portfolio_items WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findPostById(id) {
  const result = await db.query('SELECT id, title, slug, excerpt, body, image_key, published FROM blog_posts WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createPortfolio({ title, slug, summary, description, imageKey, projectLink, published }) {
  const result = await db.query(
    `INSERT INTO portfolio_items (title, slug, summary, description, image_key, project_link, published, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
    [title, slug, summary, description || null, imageKey || null, projectLink || null, published]
  );
  return result.rows[0];
}

async function updatePortfolio(id, { title, slug, summary, description, imageKey, projectLink, published }) {
  const result = await db.query(
    `UPDATE portfolio_items SET title = $2, slug = $3, summary = $4, description = $5,
       image_key = $6, project_link = $7, published = $8, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id, title, slug, summary, description || null, imageKey || null, projectLink || null, published]
  );
  return result.rows[0] || null;
}

async function createPost({ authorId, title, slug, excerpt, body, imageKey, published }) {
  const result = await db.query(
    `INSERT INTO blog_posts (author_id, title, slug, excerpt, body, image_key, published, published_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN NOW() ELSE NULL END, NOW()) RETURNING id`,
    [authorId, title, slug, excerpt || null, body, imageKey || null, published]
  );
  return result.rows[0];
}

async function updatePost(id, { title, slug, excerpt, body, imageKey, published }) {
  const result = await db.query(
    `UPDATE blog_posts SET title = $2, slug = $3, excerpt = $4, body = $5, image_key = $6,
       published = $7, published_at = CASE WHEN $7 AND published_at IS NULL THEN NOW() WHEN NOT $7 THEN NULL ELSE published_at END, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id, title, slug, excerpt || null, body, imageKey || null, published]
  );
  return result.rows[0] || null;
}

async function deletePortfolio(id) { await db.query('DELETE FROM portfolio_items WHERE id = $1', [id]); }
async function deletePost(id) { await db.query('DELETE FROM blog_posts WHERE id = $1', [id]); }

module.exports = {
  findPublishedPortfolio, findPublishedPosts, findAllPortfolio, findAllPosts,
  findPortfolioById, findPostById, createPortfolio, updatePortfolio, createPost, updatePost, deletePortfolio, deletePost
};