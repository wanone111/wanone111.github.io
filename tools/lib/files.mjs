import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, sep } from 'node:path';

export async function walkFiles(root, predicate = () => true) {
  const output = [];

  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile() && predicate(fullPath, entry)) output.push(fullPath);
    }
  }

  await visit(root);
  return output;
}

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readUtf8(path) {
  return readFile(path, 'utf8');
}

export async function writeUtf8IfChanged(path, content) {
  let existing;
  try {
    existing = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing === content) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  return true;
}

export async function writeBufferIfChanged(path, content) {
  let existing;
  try {
    existing = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing?.equals(content)) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return true;
}

export function relativePosix(from, to) {
  return relative(from, to).split(sep).join('/');
}

export function lineNumberAt(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

export async function fileSize(path) {
  return (await stat(path)).size;
}
