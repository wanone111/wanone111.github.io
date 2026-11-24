import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { assertInside, loadWorkspace, normalizeLineEndings, pathExists, relativePosix, writeIfChanged } from './lib/files.mjs';
import { convertMarkdown, createAssetManager, createWikiResolver, hasGeneratedMarker, listStaleOutputs, serializeMarkdown } from './lib/markdown.mjs';
import { loadValidatedContent, printSecurityFindings, printValidationErrors, scanNotes } from './lib/source.mjs';

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function publicFields(data) {
  if (data.content_type === 'docs') {
    return { title: data.title, description: data.description, lastUpdated: isoDate(data.updated) };
  }
  const fields = {
    title: data.title, description: data.description, content_type: data.content_type,
    status: data.status, visibility: data.visibility, slug: data.slug,
    created: isoDate(data.created), updated: isoDate(data.updated),
    published: data.published ? isoDate(data.published) : undefined,
    category: data.category, tags: data.tags ?? [], cover: data.cover, featured: data.featured ?? false,
  };
  for (const key of [
    'featured_order', 'problem', 'environment', 'conclusion', 'applicable_version', 'verified',
    'time_range', 'role', 'hardware', 'software', 'stack', 'result', 'limitations', 'next_step', 'validation',
  ]) fields[key] = data[key];
  fields.verified = data.verified ? isoDate(data.verified) : undefined;
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

async function sync({ paths, websiteRoot }, notes) {
  const assetManager = await createAssetManager(paths);
  const resolveWiki = createWikiResolver(notes);
  const generated = new Map();
  const conflicts = [];
  for (const note of notes) {
    const markdown = await convertMarkdown(note, { resolveWiki, resolveAsset: assetManager.resolveAsset });
    const output = normalizeLineEndings(serializeMarkdown(publicFields(note.data), markdown));
    const outputRelative = relativePosix(websiteRoot, note.outputPath);

    assertInside(note.outputPath, note.outputRoot, 'generated output');

    if (await pathExists(note.outputPath)) {
      const existing = await readFile(note.outputPath, 'utf8');
      if (!hasGeneratedMarker(existing)) {
        conflicts.push(`${note.relativePath}: refuses to overwrite hand-authored file ${outputRelative}`);
        continue;
      }
    }

    generated.set(note.outputPath, output);
  }

  if (conflicts.length) throw new Error(`Generated-output conflicts (${conflicts.length}):\n- ${conflicts.join('\n- ')}`);

  const staleOutputs = await listStaleOutputs(paths, generated);
  const missingAssets = [];
  for (const asset of assetManager.outputs.values()) {
    assertInside(asset.outputPath, paths.generatedAssetsRoot, 'generated asset');
    const output = relativePosix(websiteRoot, asset.outputPath);
    if (!await pathExists(asset.outputPath)) {
      missingAssets.push(asset);
    } else if (!(await readFile(asset.outputPath)).equals(asset.bytes)) {
      throw new Error(`Refuses to overwrite an existing asset with different contents: ${output}`);
    }
  }

  if (missingAssets.length) await mkdir(paths.generatedAssetsRoot, { recursive: true });
  for (const asset of missingAssets) await writeFile(asset.outputPath, asset.bytes, { flag: 'wx' });
  let writtenContent = 0;
  for (const [path, output] of generated) {
    if (await writeIfChanged(path, output)) writtenContent += 1;
  }
  for (const path of staleOutputs) await unlink(path);

  console.log(`Synchronized ${generated.size} page(s) and ${assetManager.outputs.size} asset(s).`);
  console.log(`Changed ${writtenContent} page(s), added ${missingAssets.length} asset(s), removed ${staleOutputs.size} stale output(s).`);
}

async function clean(workspace, apply) {
  const { paths, websiteRoot } = workspace;
  const candidates = await listStaleOutputs(paths);
  for (const path of candidates) {
    console.log(`${apply ? 'Removing' : 'Would remove'} ${relativePosix(websiteRoot, path)}`);
    if (apply) await unlink(path);
  }
  if (apply) {
    console.log(`Removed ${candidates.size} generated output(s).`);
  } else {
    console.log(`Dry run only. ${candidates.size} generated output(s) would be removed. Use npm run content:clean -- --apply to remove them.`);
  }
}

async function main([command, ...args]) {
  const apply = command === 'clean' && args.length === 1 && args[0] === '--apply';
  if (!['sync', 'check', 'clean'].includes(command) || (args.length && !apply)) {
    throw new Error('Usage: node tools/content.mjs sync|check|clean [--apply]');
  }
  const workspace = await loadWorkspace();
  if (command === 'clean') return clean(workspace, apply);
  if (!workspace.privateSourceAvailable) throw new Error('Source content commands require the private publish directory.');
  const result = await loadValidatedContent(workspace.paths);
  if (result.errors.length) {
    printValidationErrors(result.errors);
    process.exitCode = 1;
    return;
  }
  const findings = scanNotes(result.publishable, result.policy, { credentialsOnly: command === 'sync' });
  if (findings.length) {
    printSecurityFindings(findings);
    process.exitCode = 1;
    return;
  }
  if (command === 'sync') return sync(workspace, result.publishable);
  console.log(`Checked ${result.notes.length} source note(s) and scanned ${result.publishable.length} publishable note(s).`);
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
