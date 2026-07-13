import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { isInside } from './workspace.mjs';
import { pathExists, relativePosix, walkFiles } from './files.mjs';

const ALLOWED_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

function normalizeTarget(value) {
  return decodeURIComponent(value.trim().replace(/^<|>$/g, '')).replace(/\\/g, '/').replace(/^\.\//, '');
}

function stableStem(value) {
  const stem = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return stem || 'asset';
}

export async function createAssetManager(paths) {
  const sourceFiles = await walkFiles(paths.assetsRoot, (path) => ALLOWED_EXTENSIONS.has(extname(path).toLowerCase()));
  const byRelative = new Map();
  const byBasename = new Map();

  for (const file of sourceFiles) {
    const relative = relativePosix(paths.assetsRoot, file).toLowerCase();
    byRelative.set(relative, file);
    const name = basename(file).toLowerCase();
    const list = byBasename.get(name) ?? [];
    list.push(file);
    byBasename.set(name, list);
  }

  const outputs = new Map();

  async function findSource(note, rawTarget) {
    const target = normalizeTarget(rawTarget);
    const extension = extname(target).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error(`${note.relativePath}: unsupported or non-image embed: ${rawTarget}`);

    const noteRelativeCandidate = resolve(dirname(note.file), target);
    if (isInside(noteRelativeCandidate, paths.assetsRoot) && await pathExists(noteRelativeCandidate)) return noteRelativeCandidate;

    const rootCandidate = resolve(paths.assetsRoot, target);
    if (isInside(rootCandidate, paths.assetsRoot) && await pathExists(rootCandidate)) return rootCandidate;

    const exact = byRelative.get(target.toLowerCase());
    if (exact) return exact;

    const matches = byBasename.get(basename(target).toLowerCase()) ?? [];
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) throw new Error(`${note.relativePath}: ambiguous attachment name "${rawTarget}"; use a path relative to _assets.`);
    throw new Error(`${note.relativePath}: attachment not found in _assets: ${rawTarget}`);
  }

  async function resolveAsset(note, rawTarget) {
    const source = await findSource(note, rawTarget);
    const bytes = await readFile(source);
    const hash = createHash('sha256').update(bytes).digest('hex');
    const extension = extname(source).toLowerCase();
    const filename = `${stableStem(basename(source, extension))}-${hash.slice(0, 12)}${extension}`;
    const outputPath = resolve(paths.generatedAssetsRoot, filename);
    const url = `/images/generated/${filename}`;
    if (!outputs.has(outputPath)) outputs.set(outputPath, { source, outputPath, url, hash, bytes });
    return url;
  }

  return { resolveAsset, outputs, sourceFiles };
}
