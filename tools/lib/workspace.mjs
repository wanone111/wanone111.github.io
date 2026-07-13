import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const libraryDir = dirname(fileURLToPath(import.meta.url));
export const websiteRoot = resolve(libraryDir, '..', '..');
export const workspaceRoot = resolve(websiteRoot, '..');

function resolveConfiguredPath(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Every workspace path must be a non-empty string.');
  }
  return isAbsolute(value) ? resolve(value) : resolve(workspaceRoot, value);
}

export async function loadWorkspace() {
  const configPath = resolve(workspaceRoot, 'workspace.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const paths = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, resolveConfiguredPath(value)]),
  );

  assertInside(paths.publishRoot, paths.knowledgeRoot, 'publishRoot');
  assertInside(paths.assetsRoot, paths.knowledgeRoot, 'assetsRoot');
  for (const key of [
    'generatedContentRoot',
    'generatedBlogRoot',
    'generatedDocsRoot',
    'generatedProjectsRoot',
    'generatedPagesRoot',
    'generatedAssetsRoot',
    'generatedManifest',
    'contentPolicy',
  ]) {
    assertInside(paths[key], paths.websiteRoot, key);
  }

  return { config, paths, configPath, workspaceRoot, websiteRoot };
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
