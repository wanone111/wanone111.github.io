import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { defaultPaths, normalizeLineEndings, sha256, validateWorkspacePaths } from '../tools/lib/files.mjs';
import { convertMarkdown, createAssetManager, createWikiResolver, hasGeneratedMarker, listStaleOutputs, parseMarkdown, serializeMarkdown } from '../tools/lib/markdown.mjs';

test('keeps private source, generated outputs, and the website in their own roots', () => {
  const site = resolve('site');
  const paths = defaultPaths(site, resolve('knowledge_base'));
  assert.doesNotThrow(() => validateWorkspacePaths(paths, site));
  assert.throws(() => validateWorkspacePaths(paths, resolve('another-site')), /current website/);
  assert.throws(() => validateWorkspacePaths({ ...paths, knowledgeRoot: site }, site), /separate directory trees/);
  assert.throws(() => validateWorkspacePaths({ ...paths, generatedPagesRoot: site }, site), /escapes its allowed root/);
});

test('converts linked notes, engineering callouts, code fences, and referenced images', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'wanone-content-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const paths = defaultPaths(resolve(root, 'site'), resolve(root, 'private'));
  await mkdir(paths.assetsRoot, { recursive: true });
  await writeFile(resolve(paths.assetsRoot, 'plot.png'), 'image bytes');

  const note = {
    data: { title: 'Linked', slug: 'embedded/note' }, folder: '笔记', relativePath: '笔记/source.md',
    file: resolve(paths.publishRoot, '笔记/source.md'), route: '/notes/embedded/note/',
    body: '> [!problem] 串口丢帧\n> Data\n> [!validation]\n\n[[blog/source|details]]\n![[plot.png]]\n![[plot.png]]\n``` C++\nmain()\n```',
  };
  const assets = await createAssetManager(paths);
  const options = { resolveWiki: createWikiResolver([note]), resolveAsset: assets.resolveAsset };
  const body = await convertMarkdown(note, options);
  assert.match(body, /故障现象：串口丢帧/);
  assert.match(body, /验证结果/);
  assert.match(body, /\[details\]\(\/notes\/embedded\/note\/\)/);
  assert.match(body, /\/images\/generated\/plot-[a-f0-9]{12}\.png/);
  assert.match(body, /```cpp\nmain/);
  assert.equal(assets.outputs.size, 1);
  assert.equal(options.resolveWiki(note, 'blog/embedded/note'), note.route);
  await assert.rejects(convertMarkdown({ ...note, body: '![[Linked]]' }, options), /embedded notes are unsupported/);
});

test('preserves YAML and recognizes the generated marker only after the header', () => {
  const text = serializeMarkdown({ title: 'Test', tags: ['Astro'] }, 'Body');
  const parsed = parseMarkdown(text);
  assert.deepEqual(parsed.data, { title: 'Test', tags: ['Astro'] });
  assert.ok(hasGeneratedMarker(text));
  assert.ok(!hasGeneratedMarker(text.replace('<!--', 'Quoted marker: <!--')));
  assert.throws(() => parseMarkdown('# Missing header'), /missing YAML front matter/);
  assert.equal(normalizeLineEndings('first\r\nsecond\rthird\n'), 'first\nsecond\nthird\n');
});

test('cleanup recognizes marked pages and unused, hash-matching images referenced by them', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'wanone-clean-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const paths = defaultPaths(resolve(root, 'site'), resolve(root, 'private'));
  await mkdir(paths.generatedDocsRoot, { recursive: true });
  await mkdir(paths.generatedAssetsRoot, { recursive: true });

  const image = (stem) => `${stem}-${sha256(stem).slice(0, 12)}.png`;
  const link = (stem) => `![](/images/generated/${image(stem)})`;
  for (const stem of ['old', 'manual', 'next', 'changed', 'orphan']) {
    await writeFile(resolve(paths.generatedAssetsRoot, image(stem)), stem === 'changed' ? 'edited locally' : stem);
  }
  const oldPage = resolve(paths.generatedDocsRoot, 'old.md');
  const manualPage = resolve(paths.generatedDocsRoot, 'manual.md');
  const nextPage = resolve(paths.generatedDocsRoot, 'new.md');
  await writeFile(oldPage, serializeMarkdown({ title: 'Old' }, ['old', 'manual', 'next', 'changed'].map(link).join('\n')));
  await writeFile(manualPage, link('manual'));
  const next = new Map([[nextPage, `cover: /images/generated/${image('next')}`]]);

  assert.deepEqual(await listStaleOutputs(paths, next), new Set([oldPage, resolve(paths.generatedAssetsRoot, image('old'))]));
});
