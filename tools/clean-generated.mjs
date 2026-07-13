import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isInside, loadWorkspace } from './lib/workspace.mjs';
import { pathExists, writeUtf8IfChanged } from './lib/files.mjs';

const apply = process.argv.includes('--apply');
const { paths, websiteRoot } = await loadWorkspace();
let manifest;
try {
  manifest = JSON.parse(await readFile(paths.generatedManifest, 'utf8'));
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No generated-content manifest exists; nothing to clean.');
    process.exit(0);
  }
  throw error;
}

const candidates = [
  ...(manifest.content ?? []).map((item) => ({ type: 'content', output: item.output })),
  ...(manifest.assets ?? []).map((item) => ({ type: 'asset', output: item.output })),
];

for (const item of candidates) {
  const path = resolve(websiteRoot, item.output);
  const allowed = item.type === 'asset'
    ? isInside(path, paths.generatedAssetsRoot)
    : isInside(path, paths.generatedContentRoot) || isInside(path, paths.generatedDocsRoot);
  if (!allowed) throw new Error(`Manifest path escapes managed roots: ${item.output}`);
  console.log(`${apply ? 'Removing' : 'Would remove'} ${item.output}`);
  if (apply && await pathExists(path)) await unlink(path);
}

if (apply) {
  await writeUtf8IfChanged(paths.generatedManifest, `${JSON.stringify({ version: 1, content: [], assets: [] }, null, 2)}\n`);
  console.log(`Removed ${candidates.length} manifest-owned output(s).`);
} else {
  console.log(`Dry run only. ${candidates.length} output(s) are owned by the manifest. Use content:clean:apply to remove them.`);
}
