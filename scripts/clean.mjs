import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['index.html', 'archive.html', 'search-index.json', 'feed.xml', 'issue'];

for (const target of targets) {
  await rm(path.join(ROOT, target), { recursive: true, force: true });
  console.log(`removed ${target}`);
}
