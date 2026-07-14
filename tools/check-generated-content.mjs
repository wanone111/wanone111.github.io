import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathExists, relativePosix, walkFiles } from './lib/files.mjs';
import { isInside, loadWorkspace } from './lib/workspace.mjs';

const GENERATED_MARKER = 'GENERATED FROM THE PRIVATE KNOWLEDGE BASE';
const { configPath, paths, websiteRoot, workspaceRoot } = await loadWorkspace();
const errors = [];

function normalizeRelative(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${label} must be a non-empty relative path.`);
    return null;
  }
  const normalized = value.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.split('/').includes('..')) {
    errors.push(`${label} must not be absolute or escape its root: ${value}`);
    return null;
  }
  return normalized;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

let manifest;
try {
  manifest = JSON.parse(await readFile(paths.generatedManifest, 'utf8'));
} catch (error) {
  console.error(`Cannot read generated content manifest: ${error.message}`);
  process.exit(1);
}

if (manifest.version !== 1) errors.push('generated-content-manifest.json must use version 1.');
if (!Array.isArray(manifest.content)) errors.push('Manifest content must be an array.');
if (!Array.isArray(manifest.assets)) errors.push('Manifest assets must be an array.');

const content = Array.isArray(manifest.content) ? manifest.content : [];
const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
const managedContentRoots = [
  paths.generatedBlogRoot,
  paths.generatedProjectsRoot,
  paths.generatedPagesRoot,
  paths.generatedDocsRoot,
];
const localContentPrefix = configPath
  ? `${relativePosix(workspaceRoot, paths.publishRoot).replace(/\/$/, '')}/`
  : 'knowledge-base/80_Publish/';
const localAssetPrefix = configPath
  ? `${relativePosix(workspaceRoot, paths.assetsRoot).replace(/\/$/, '')}/`
  : 'knowledge-base/_assets/';
const outputs = new Set();
const sources = new Set();
const routes = new Set();
const manifestAssets = new Set();

for (const [index, item] of content.entries()) {
  const label = `content[${index}]`;
  const source = normalizeRelative(item.source, `${label}.source`);
  const output = normalizeRelative(item.output, `${label}.output`);
  if (source && !source.startsWith(localContentPrefix)) {
    errors.push(`${label}.source is outside the configured publish allowlist: ${source}`);
  }
  if (source && sources.has(source)) errors.push(`${label}.source duplicates ${source}.`);
  if (source) sources.add(source);
  if (output && outputs.has(output)) errors.push(`${label}.output duplicates ${output}.`);
  if (output) outputs.add(output);
  if (typeof item.route !== 'string' || !/^\/[^?#]*\/$/.test(item.route)) {
    errors.push(`${label}.route must be an absolute trailing-slash path.`);
  } else if (routes.has(item.route)) {
    errors.push(`${label}.route duplicates ${item.route}.`);
  } else {
    routes.add(item.route);
  }
  if (!/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) errors.push(`${label}.sha256 must be a SHA-256 hash.`);
  if (!output) continue;

  const outputPath = resolve(websiteRoot, output);
  if (!managedContentRoots.some((root) => isInside(outputPath, root))) {
    errors.push(`${label}.output is outside the managed content roots: ${output}`);
    continue;
  }
  if (!await pathExists(outputPath)) {
    errors.push(`${label}.output is missing: ${output}`);
    continue;
  }
  const text = await readFile(outputPath, 'utf8');
  if (!text.includes(GENERATED_MARKER)) errors.push(`${label}.output lacks the generated marker: ${output}`);
  if (sha256(text) !== item.sha256) errors.push(`${label}.output hash does not match the manifest: ${output}`);
}

for (const [index, item] of assets.entries()) {
  const label = `assets[${index}]`;
  const source = normalizeRelative(item.source, `${label}.source`);
  const output = normalizeRelative(item.output, `${label}.output`);
  if (source && !source.startsWith(localAssetPrefix)) {
    errors.push(`${label}.source is outside the configured asset root: ${source}`);
  }
  if (!/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) errors.push(`${label}.sha256 must be a SHA-256 hash.`);
  if (typeof item.url !== 'string' || !item.url.startsWith('/images/generated/')) {
    errors.push(`${label}.url must be below /images/generated/.`);
  }
  if (!output) continue;
  manifestAssets.add(output);
  if (outputs.has(output)) errors.push(`${label}.output duplicates ${output}.`);
  outputs.add(output);
  const expectedUrl = `/${output.replace(/^public\//, '')}`;
  if (item.url !== expectedUrl) errors.push(`${label}.url must match its public output path: ${expectedUrl}`);
  const outputPath = resolve(websiteRoot, output);
  if (!isInside(outputPath, paths.generatedAssetsRoot)) {
    errors.push(`${label}.output is outside the managed asset root: ${output}`);
    continue;
  }
  if (!await pathExists(outputPath)) {
    errors.push(`${label}.output is missing: ${output}`);
    continue;
  }
  const bytes = await readFile(outputPath);
  if (sha256(bytes) !== item.sha256) errors.push(`${label}.output hash does not match the manifest: ${output}`);
}

const manifestContent = new Set(content.map((item) => item.output?.replace(/\\/g, '/')).filter(Boolean));
for (const root of [paths.generatedContentRoot, paths.generatedDocsRoot]) {
  if (!await pathExists(root)) continue;
  for (const file of await walkFiles(root, (path) => /\.mdx?$/i.test(path))) {
    const text = await readFile(file, 'utf8');
    if (!text.includes(GENERATED_MARKER)) continue;
    const output = relativePosix(websiteRoot, file);
    if (!manifestContent.has(output)) errors.push(`Generated file is not recorded in the manifest: ${output}`);
  }
}

if (await pathExists(paths.generatedAssetsRoot)) {
  for (const file of await walkFiles(paths.generatedAssetsRoot)) {
    const output = relativePosix(websiteRoot, file);
    if (output.endsWith('/.gitkeep')) continue;
    if (!manifestAssets.has(output)) errors.push(`Generated asset is not recorded in the manifest: ${output}`);
  }
}

if (errors.length > 0) {
  console.error(`Generated-content integrity checks failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verified ${content.length} generated page(s), ${assets.length} asset(s), and their manifest hashes.`);
