import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createAssetManager } from '../tools/lib/assets.mjs';

test('creates stable content-hashed asset URLs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wanone-assets-'));
  try {
    const assetsRoot = join(root, '_assets');
    const publishRoot = join(root, '80_Publish');
    const generatedAssetsRoot = join(root, 'site', 'images');
    await mkdir(assetsRoot, { recursive: true });
    await mkdir(join(publishRoot, 'docs'), { recursive: true });
    const image = join(assetsRoot, 'diagram.png');
    await writeFile(image, Buffer.from('stable-image'));

    const manager = await createAssetManager({ assetsRoot, generatedAssetsRoot });
    const note = { file: join(publishRoot, 'docs', 'test.md'), relativePath: 'docs/test.md' };
    const first = await manager.resolveAsset(note, 'diagram.png');
    const second = await manager.resolveAsset(note, 'diagram.png');

    assert.equal(first, second);
    assert.match(first, /^\/images\/generated\/diagram-[a-f0-9]{12}\.png$/);
    assert.equal(manager.outputs.size, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
