const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const storageRoot = path.resolve(process.cwd(), 'storage', 'project-files');

async function save(file) {
  await fs.mkdir(storageRoot, { recursive: true });
  const storageKey = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  await fs.writeFile(path.join(storageRoot, storageKey), file.buffer);
  return storageKey;
}

function resolve(storageKey) {
  const resolved = path.resolve(storageRoot, storageKey);
  if (!resolved.startsWith(`${storageRoot}${path.sep}`)) throw new Error('Invalid storage key.');
  return resolved;
}

module.exports = { save, resolve };
