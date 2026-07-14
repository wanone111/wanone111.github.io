import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { pathExists } from './lib/files.mjs';
import { loadValidatedContent } from './lib/content.mjs';
import { loadWorkspace } from './lib/workspace.mjs';

const execFileAsync = promisify(execFile);
const { configPath, paths, websiteRoot, workspaceRoot } = await loadWorkspace();
const errors = [];

async function requirePath(path, label) {
  if (!await pathExists(path)) errors.push(`${label} is missing: ${path}`);
}

async function gitSummary(label, root) {
  await requirePath(resolve(root, '.git'), `${label} Git metadata`);
  if (!await pathExists(resolve(root, '.git'))) return;
  try {
    const [{ stdout: branch }, { stdout: head }, { stdout: remote }, { stdout: status }] = await Promise.all([
      execFileAsync('git', ['-C', root, 'branch', '--show-current']),
      execFileAsync('git', ['-C', root, 'log', '-1', '--format=%h %s']),
      execFileAsync('git', ['-C', root, 'remote', 'get-url', 'origin']),
      execFileAsync('git', ['-C', root, 'status', '--short', '--branch']),
    ]);
    console.log(`${label}:`);
    console.log(`  branch: ${branch.trim()}`);
    console.log(`  head: ${head.trim()}`);
    console.log(`  origin: ${remote.trim()}`);
    console.log(`  status: ${status.trim().replace(/\r?\n/g, ' | ')}`);
  } catch (error) {
    errors.push(`${label} Git inspection failed: ${error.message}`);
  }
}

async function isGitRepository(root) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree']);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

if (!configPath) errors.push('workspace.config.json is unavailable; run this command from the local sibling-repository workspace.');
if (await isGitRepository(workspaceRoot)) {
  errors.push('The workspace root must not be a Git repository containing both private and public content.');
}

await Promise.all([
  requirePath(resolve(workspaceRoot, 'AGENTS.md'), 'workspace AGENTS.md'),
  requirePath(resolve(websiteRoot, 'AGENTS.md'), 'website AGENTS.md'),
  requirePath(paths.publishRoot, 'publish allowlist root'),
  requirePath(paths.assetsRoot, 'private source asset root'),
  requirePath(paths.generatedManifest, 'generated content manifest'),
  requirePath(paths.contentPolicy, 'content policy'),
  requirePath(resolve(websiteRoot, 'legacy-url-map.json'), 'legacy URL map'),
  requirePath(resolve(websiteRoot, '.github', 'workflows', 'deploy.yml'), 'GitHub Pages workflow'),
]);

if (configPath) {
  try {
    const content = await loadValidatedContent(paths);
    if (content.errors.length > 0) errors.push(`Source validation has ${content.errors.length} error(s).`);
    console.log(`Content: ${content.notes.length} source note(s), ${content.publishable.length} publishable note(s).`);
  } catch (error) {
    errors.push(`Source validation could not run: ${error.message}`);
  }
}

await gitSummary('knowledge-base', paths.knowledgeRoot);
await gitSummary('website', websiteRoot);

if (errors.length > 0) {
  console.error(`Health status failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Repository boundary and recovery prerequisites are present.');
