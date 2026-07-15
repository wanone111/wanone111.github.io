import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const expected = [
  'index.html',
  'projects/index.html',
  'blog/index.html',
  'knowledge/index.html',
  'resume/index.html',
  'about/index.html',
  'links/index.html',
  'tags/index.html',
  'archive/index.html',
  'uses/index.html',
  '404.html',
  'rss.xml',
];

const missing = [];
for (const route of expected) {
  try {
    await access(resolve('dist', route));
  } catch {
    missing.push(route);
  }
}

if (missing.length > 0) {
  console.error(`Missing built routes:\n${missing.map((route) => `- ${route}`).join('\n')}`);
  process.exit(1);
}

console.log(`Verified ${expected.length} required routes.`);
