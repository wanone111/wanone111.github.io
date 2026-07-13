import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createAssetManager } from './lib/assets.mjs';
import { createWikiResolver, convertMarkdown } from './lib/convert.mjs';
import { loadValidatedContent, printValidationErrors } from './lib/content.mjs';
import { relativePosix, pathExists, writeBufferIfChanged, writeUtf8IfChanged } from './lib/files.mjs';
import { serializeMarkdown } from './lib/frontmatter.mjs';
import { printSecurityFindings, scanNotes } from './lib/security.mjs';
import { assertInside, isInside, loadWorkspace } from './lib/workspace.mjs';

const GENERATED_MARKER = 'GENERATED FROM THE PRIVATE KNOWLEDGE BASE';
const { paths, workspaceRoot, websiteRoot } = await loadWorkspace();
const result = await loadValidatedContent(paths);

if (result.errors.length > 0) {
  printValidationErrors(result.errors);
  process.exit(1);
}

const findings = scanNotes(result.publishable, result.policy);
if (findings.length > 0) {
  printSecurityFindings(findings);
  process.exit(1);
}

let previous = { version: 1, content: [], assets: [] };
try {
  previous = JSON.parse(await readFile(paths.generatedManifest, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const assetManager = await createAssetManager(paths);
const resolveWiki = createWikiResolver(result.publishable);
const generated = [];
const conflicts = [];

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function compact(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function generatedFrontmatter(note) {
  if (note.data.content_type === 'docs') {
    return {
      title: note.data.title,
      description: note.data.description,
      lastUpdated: isoDate(note.data.updated),
    };
  }
  return compact({
    title: note.data.title,
    description: note.data.description,
    content_type: note.data.content_type,
    status: note.data.status,
    visibility: note.data.visibility,
    slug: note.data.slug,
    created: isoDate(note.data.created),
    updated: isoDate(note.data.updated),
    published: note.data.published ? isoDate(note.data.published) : undefined,
    category: note.data.category,
    tags: note.data.tags ?? [],
    cover: note.data.cover,
    featured: note.data.featured ?? false,
  });
}

for (const note of result.publishable) {
  const markdown = await convertMarkdown(note, { resolveWiki, resolveAsset: assetManager.resolveAsset });
  const output = serializeMarkdown(generatedFrontmatter(note), markdown);
  const outputRelative = relativePosix(websiteRoot, note.outputPath);
  const sourceRelative = relativePosix(workspaceRoot, note.file);

  const allowedRoot = note.data.content_type === 'docs'
    ? paths.generatedDocsRoot
    : note.data.content_type === 'blog'
      ? paths.generatedBlogRoot
      : note.data.content_type === 'project'
        ? paths.generatedProjectsRoot
        : paths.generatedPagesRoot;
  assertInside(note.outputPath, allowedRoot, 'generated output');

  if (await pathExists(note.outputPath)) {
    const existing = await readFile(note.outputPath, 'utf8');
    if (!existing.includes(GENERATED_MARKER)) {
      conflicts.push(`${note.relativePath}: refuses to overwrite hand-authored file ${outputRelative}`);
      continue;
    }
  }

  generated.push({
    source: sourceRelative,
    output: outputRelative,
    outputPath: note.outputPath,
    route: note.route,
    sha256: createHash('sha256').update(output).digest('hex'),
    text: output,
  });
}

if (conflicts.length > 0) {
  console.error(`Generated-output conflicts (${conflicts.length}):`);
  for (const conflict of conflicts) console.error(`- ${conflict}`);
  process.exit(1);
}

let writtenContent = 0;
for (const item of generated) {
  if (await writeUtf8IfChanged(item.outputPath, item.text)) writtenContent += 1;
}

let writtenAssets = 0;
const assets = [];
for (const asset of [...assetManager.outputs.values()].sort((a, b) => a.outputPath.localeCompare(b.outputPath))) {
  assertInside(asset.outputPath, paths.generatedAssetsRoot, 'generated asset');
  if (await writeBufferIfChanged(asset.outputPath, asset.bytes)) writtenAssets += 1;
  assets.push({
    source: relativePosix(workspaceRoot, asset.source),
    output: relativePosix(websiteRoot, asset.outputPath),
    url: asset.url,
    sha256: asset.hash,
  });
}

const nextContent = new Set(generated.map((item) => item.output));
const nextAssets = new Set(assets.map((item) => item.output));
let removed = 0;

for (const stale of previous.content ?? []) {
  if (nextContent.has(stale.output)) continue;
  const path = resolve(websiteRoot, stale.output);
  if (!isInside(path, paths.generatedContentRoot) && !isInside(path, paths.generatedDocsRoot)) {
    throw new Error(`Manifest content path escapes managed roots: ${stale.output}`);
  }
  if (await pathExists(path)) {
    const existing = await readFile(path, 'utf8');
    if (!existing.includes(GENERATED_MARKER)) throw new Error(`Refuses to delete unmarked content: ${stale.output}`);
    await unlink(path);
    removed += 1;
  }
}

for (const stale of previous.assets ?? []) {
  if (nextAssets.has(stale.output)) continue;
  const path = resolve(websiteRoot, stale.output);
  assertInside(path, paths.generatedAssetsRoot, 'stale generated asset');
  if (await pathExists(path)) {
    await unlink(path);
    removed += 1;
  }
}

const manifest = {
  version: 1,
  content: generated.map(({ source, output, route, sha256 }) => ({ source, output, route, sha256 })).sort((a, b) => a.output.localeCompare(b.output)),
  assets,
};
await writeUtf8IfChanged(paths.generatedManifest, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Synchronized ${generated.length} page(s) and ${assets.length} asset(s).`);
console.log(`Changed ${writtenContent} page(s), changed ${writtenAssets} asset(s), removed ${removed} stale output(s).`);
