import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { validateWorkspacePaths } from '../tools/lib/workspace.mjs';

function validPaths() {
  const workspaceRoot = resolve('tests', 'fixtures', 'workspace-boundaries');
  const knowledgeRoot = resolve(workspaceRoot, 'knowledge-base');
  const websiteRoot = resolve(workspaceRoot, 'website');
  const generatedContentRoot = resolve(websiteRoot, 'src', 'content', 'generated');

  return {
    knowledgeRoot,
    publishRoot: resolve(knowledgeRoot, '80_Publish'),
    assetsRoot: resolve(knowledgeRoot, '_assets'),
    websiteRoot,
    generatedContentRoot,
    generatedBlogRoot: resolve(generatedContentRoot, 'blog'),
    generatedDocsRoot: resolve(websiteRoot, 'src', 'content', 'docs', 'knowledge'),
    generatedProjectsRoot: resolve(generatedContentRoot, 'projects'),
    generatedPagesRoot: resolve(generatedContentRoot, 'pages'),
    generatedAssetsRoot: resolve(websiteRoot, 'public', 'images', 'generated'),
    generatedManifest: resolve(websiteRoot, 'generated-content-manifest.json'),
    contentPolicy: resolve(websiteRoot, 'tools', 'content-policy.json'),
  };
}

test('accepts separate private and public roots with nested generated outputs', () => {
  const paths = validPaths();
  assert.doesNotThrow(() => validateWorkspacePaths(paths, paths.websiteRoot));
});

test('rejects a configured website root that is not the current repository', () => {
  const paths = validPaths();
  assert.throws(
    () => validateWorkspacePaths(paths, resolve(paths.websiteRoot, 'other-site')),
    /websiteRoot must resolve to the current website repository/,
  );
});

test('rejects overlapping private and public directory trees', () => {
  const paths = validPaths();
  paths.knowledgeRoot = resolve(paths.websiteRoot, 'private-notes');
  paths.publishRoot = resolve(paths.knowledgeRoot, '80_Publish');
  paths.assetsRoot = resolve(paths.knowledgeRoot, '_assets');

  assert.throws(
    () => validateWorkspacePaths(paths, paths.websiteRoot),
    /knowledgeRoot and websiteRoot must be separate directory trees/,
  );
});

test('rejects generated content directories that escape their managed root', () => {
  const paths = validPaths();
  paths.generatedPagesRoot = resolve(paths.websiteRoot, 'src', 'pages');

  assert.throws(
    () => validateWorkspacePaths(paths, paths.websiteRoot),
    /generatedPagesRoot escapes its allowed root/,
  );
});
