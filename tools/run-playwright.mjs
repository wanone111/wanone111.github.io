import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { startStaticPreview } from './lib/static-preview.mjs';

const host = '127.0.0.1';
const port = 4325;
const playwrightCli = resolve('node_modules', '@playwright', 'test', 'cli.js');
const testArguments = process.argv.slice(2);

if (testArguments.length === 0) {
  console.error('Provide at least one Playwright test file.');
  process.exit(1);
}

const preview = await startStaticPreview({ root: resolve('dist'), host, port });

let exitCode = 1;
try {
  const tests = spawn(process.execPath, [playwrightCli, 'test', ...testArguments], {
    env: process.env,
    stdio: 'inherit',
  });
  exitCode = await new Promise((resolveExit, reject) => {
    tests.once('error', reject);
    tests.once('exit', (code) => resolveExit(code ?? 1));
  });
} finally {
  await preview.close();
}

process.exitCode = exitCode;
