const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const storageRoot = path.resolve(process.cwd(), 'storage', 'project-files');
const contentImageRoot = path.resolve(process.cwd(), 'public', 'uploads', 'content');

async function save(file) {
  await fs.mkdir(storageRoot, { recursive: true });
  const storageKey = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  await fs.writeFile(path.join(storageRoot, storageKey), file.buffer);
  return storageKey;
}

async function saveContentImage(file) {
  await fs.mkdir(contentImageRoot, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
  const storageKey = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(contentImageRoot, storageKey), file.buffer);
  return `/uploads/content/${storageKey}`;
}

function resolve(storageKey) {
  const resolved = path.resolve(storageRoot, storageKey);
  if (!resolved.startsWith(`${storageRoot}${path.sep}`)) throw new Error('Invalid storage key.');
  return resolved;
}

module.exports = { save, saveContentImage, resolve };
