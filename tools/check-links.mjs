import { extname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathExists, relativePosix, walkFiles } from './lib/files.mjs';
import { loadWorkspace } from './lib/workspace.mjs';

const { paths } = await loadWorkspace();
const distRoot = resolve(paths.websiteRoot, 'dist');
if (!await pathExists(distRoot)) {
  console.error('dist/ does not exist. Run the production build before checking links.');
  process.exit(1);
}

const htmlFiles = await walkFiles(distRoot, (path) => path.toLowerCase().endsWith('.html'));
const missing = [];
let checked = 0;

function pageUrl(file) {
  const relative = `/${relativePosix(distRoot, file)}`;
  return relative.endsWith('/index.html') ? relative.slice(0, -'index.html'.length) : relative;
}

async function targetExists(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
  const clean = decoded.replace(/^\/+/, '');
  if (clean === '') return pathExists(resolve(distRoot, 'index.html'));
  if (extname(clean)) return pathExists(resolve(distRoot, clean));
  return await pathExists(resolve(distRoot, clean, 'index.html')) || await pathExists(resolve(distRoot, `${clean}.html`));
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const base = new URL(pageUrl(file), 'https://local.invalid');
  const pattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const reference = match[1].replace(/&amp;/g, '&');
    if (/^(?:#|data:|mailto:|tel:|javascript:)/i.test(reference)) continue;
    let url;
    try { url = new URL(reference, base); } catch { continue; }
    if (url.origin !== base.origin) continue;
    checked += 1;
    if (!await targetExists(url.pathname)) {
      missing.push({ file: relativePosix(distRoot, file), reference });
    }
  }
}

if (missing.length > 0) {
  console.error(`Broken internal links/assets (${missing.length}):`);
  for (const item of missing) console.error(`- ${item.file}: ${item.reference}`);
  process.exit(1);
}

console.log(`Checked ${checked} internal links/assets across ${htmlFiles.length} HTML page(s).`);
