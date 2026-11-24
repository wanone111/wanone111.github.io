import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function walkFiles(root, predicate = () => true) {
  const output = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
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
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

export function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, '\n');
}

export async function writeIfChanged(path, content) {
  let existing;
  try {
    existing = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing === content) return false;
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, content, { flag: 'wx' });
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
  return true;
}

export function relativePosix(from, to) {
  return relative(from, to).split(sep).join('/');
}

const websiteRoot = fileURLToPath(new URL('../../', import.meta.url));
const workspaceRoot = resolve(websiteRoot, '..');

export function defaultPaths(site, knowledge) {
  const generated = resolve(site, 'src/content/generated');
  return {
    websiteRoot: resolve(site),
    knowledgeRoot: knowledge,
    publishRoot: resolve(knowledge, '40_Publish'),
    assetsRoot: resolve(knowledge, '_assets'),
    generatedContentRoot: generated,
    generatedBlogRoot: resolve(generated, 'blog'),
    generatedProjectsRoot: resolve(generated, 'projects'),
    generatedPagesRoot: resolve(generated, 'pages'),
    generatedDocsRoot: resolve(site, 'src/content/docs/knowledge'),
    generatedAssetsRoot: resolve(site, 'public/images/generated'),
  };
}

export async function loadWorkspace() {
  const configPath = resolve(workspaceRoot, 'workspace.config.json');
  const knowledge = resolve(workspaceRoot, 'knowledge_base');
  let paths;
  let privateSourceAvailable = true;
  if (await pathExists(configPath)) {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    paths = Object.fromEntries(Object.entries(config).map(([key, value]) => {
      if (typeof value !== 'string' || !value) throw new Error(`Expected a workspace path for ${key}.`);
      return [key, resolve(workspaceRoot, value)];
    }));
  } else {
    privateSourceAvailable = await pathExists(knowledge);
    paths = defaultPaths(websiteRoot, privateSourceAvailable ? knowledge : resolve(workspaceRoot, '.private-source-unavailable'));
  }
  validateWorkspacePaths(paths);
  return { paths, websiteRoot: paths.websiteRoot, privateSourceAvailable };
}

export function validateWorkspacePaths(paths, actualWebsiteRoot = websiteRoot) {
  if (resolve(paths.websiteRoot) !== resolve(actualWebsiteRoot)) {
    throw new Error(`websiteRoot must resolve to the current website repository: ${actualWebsiteRoot}`);
  }

  if (isInside(paths.knowledgeRoot, paths.websiteRoot) || isInside(paths.websiteRoot, paths.knowledgeRoot)) {
    throw new Error('knowledgeRoot and websiteRoot must be separate directory trees.');
  }

  assertInside(paths.publishRoot, paths.knowledgeRoot, 'publishRoot');
  assertInside(paths.assetsRoot, paths.knowledgeRoot, 'assetsRoot');
  for (const key of [
    'generatedContentRoot',
    'generatedBlogRoot',
    'generatedDocsRoot',
    'generatedProjectsRoot',
    'generatedPagesRoot',
    'generatedAssetsRoot',
  ]) {
    assertInside(paths[key], paths.websiteRoot, key);
  }
  if (paths.contentPolicy) assertInside(paths.contentPolicy, paths.websiteRoot, 'contentPolicy');

  for (const key of ['generatedBlogRoot', 'generatedProjectsRoot', 'generatedPagesRoot']) {
    assertInside(paths[key], paths.generatedContentRoot, key);
  }
}

export function isInside(candidate, parent) {
  const value = relative(resolve(parent), resolve(candidate));
  return value === '' || (!value.startsWith(`..${sep}`) && value !== '..' && !isAbsolute(value));
}

export function assertInside(candidate, parent, label = 'path') {
  if (!isInside(candidate, parent)) {
    throw new Error(`${label} escapes its allowed root: ${candidate}`);
  }
}
