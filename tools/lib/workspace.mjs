import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const libraryDir = dirname(fileURLToPath(import.meta.url));
export const websiteRoot = resolve(libraryDir, '..', '..');
export const workspaceRoot = resolve(websiteRoot, '..');

function resolveConfiguredPath(value, baseRoot) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Every workspace path must be a non-empty string.');
  }
  return isAbsolute(value) ? resolve(value) : resolve(baseRoot, value);
}

export async function loadWorkspace() {
  const localConfigPath = resolve(workspaceRoot, 'workspace.config.json');
  let configPath = localConfigPath;
  let configBaseRoot = workspaceRoot;
  let config;

  try {
    config = JSON.parse(await readFile(localConfigPath, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    // GitHub Actions checks out only the public website repository. It must be
    // able to build and verify already-generated public content without the
    // private sibling knowledge-base or the local workspace configuration.
    configPath = null;
    configBaseRoot = websiteRoot;
    config = {
      knowledgeRoot: './.private-source-unavailable',
      publishRoot: './.private-source-unavailable/80_Publish',
      assetsRoot: './.private-source-unavailable/_assets',
      websiteRoot: '.',
      generatedContentRoot: './src/content/generated',
      generatedBlogRoot: './src/content/generated/blog',
      generatedDocsRoot: './src/content/docs/knowledge',
      generatedProjectsRoot: './src/content/generated/projects',
      generatedPagesRoot: './src/content/generated/pages',
      generatedAssetsRoot: './public/images/generated',
      generatedManifest: './generated-content-manifest.json',
      contentPolicy: './tools/content-policy.json',
    };
  }

  const paths = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, resolveConfiguredPath(value, configBaseRoot)]),
  );

  validateWorkspacePaths(paths, websiteRoot);

  return { config, paths, configPath, workspaceRoot: configBaseRoot, websiteRoot };
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
    'generatedManifest',
    'contentPolicy',
  ]) {
    assertInside(paths[key], paths.websiteRoot, key);
  }

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
