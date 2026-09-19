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

module.exports = { findPublishedPortfolio, findPublishedPosts, findAllPortfolio, findAllPosts };