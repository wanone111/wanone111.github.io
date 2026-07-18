import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathExists } from './lib/files.mjs';
import { loadWorkspace } from './lib/workspace.mjs';

const { paths } = await loadWorkspace();
const distRoot = resolve(paths.websiteRoot, 'dist');
const mapFile = resolve(paths.websiteRoot, 'legacy-url-map.json');
const legacyUrlMap = JSON.parse(await readFile(mapFile, 'utf8'));
const redirects = legacyUrlMap.redirects;

if (!Array.isArray(redirects) || redirects.length === 0) {
  console.error('legacy-url-map.json must contain at least one redirect.');
  process.exit(1);
}

function routeOutput(route) {
  const clean = decodeURIComponent(route).replace(/^\/+|\/+$/g, '');
  return clean === ''
    ? resolve(distRoot, 'index.html')
    : resolve(distRoot, ...clean.split('/'), 'index.html');
}

const errors = [];
const sources = new Set();

for (const [index, redirect] of redirects.entries()) {
  const label = `redirects[${index}]`;
  const { source, destination, legacyFile } = redirect;

  if (typeof source !== 'string' || !/^\/[^?#]*\/$/.test(source)) {
    errors.push(`${label}.source must be an absolute trailing-slash path without a query or fragment.`);
    continue;
  }
  if (typeof destination !== 'string' || !/^\/[^?#]*\/$/.test(destination)) {
    errors.push(`${label}.destination must be an absolute trailing-slash path without a query or fragment.`);
    continue;
  }
  if (source === destination) errors.push(`${label} redirects to itself.`);
  if (sources.has(source)) errors.push(`${label}.source duplicates ${source}.`);
  sources.add(source);
  if (typeof legacyFile !== 'string' || legacyFile.trim() === '') {
    errors.push(`${label}.legacyFile must identify the migrated Hexo source.`);
  }

  const sourceOutput = routeOutput(source);
  const destinationOutput = routeOutput(destination);
  if (!await pathExists(sourceOutput)) {
    errors.push(`${source} did not produce a redirect page.`);
    continue;
  }
  if (!await pathExists(destinationOutput)) {
    errors.push(`${destination} does not have a built destination page.`);
  }

  const html = await readFile(sourceOutput, 'utf8');
  if (!html.includes(destination)) {
    errors.push(`${source} redirect page does not reference ${destination}.`);
  }
}

const previousBlogRedirects = [
  { source: '/blog/', destination: '/notes/' },
  ...redirects.map(({ destination }) => ({
    source: destination.replace(/^\/notes\//, '/blog/'),
    destination,
  })),
];

for (const { source, destination } of previousBlogRedirects) {
  const sourceOutput = routeOutput(source);
  if (!await pathExists(sourceOutput)) {
    errors.push(`${source} did not produce a compatibility redirect page.`);
    continue;
  }
  const html = await readFile(sourceOutput, 'utf8');
  if (!html.includes(destination)) {
    errors.push(`${source} compatibility redirect does not reference ${destination}.`);
  }
}

if (errors.length > 0) {
  console.error(`Legacy redirect checks failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verified ${redirects.length} legacy URL redirect(s) and ${previousBlogRedirects.length} /blog/ compatibility redirect(s).`);
