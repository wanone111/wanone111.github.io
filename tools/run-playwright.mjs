import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const host = '127.0.0.1';
const port = 4325;
const origin = `http://${host}:${port}`;
const astroCli = resolve('node_modules', 'astro', 'bin', 'astro.mjs');
const playwrightCli = resolve('node_modules', '@playwright', 'test', 'cli.js');
const testArguments = process.argv.slice(2);

if (testArguments.length === 0) {
  console.error('Provide at least one Playwright test file.');
  process.exit(1);
}

const server = spawn(
  process.execPath,
  [astroCli, 'preview', '--host', host, '--port', String(port)],
  { env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
);

let serverError = '';
server.stderr.on('data', (chunk) => { serverError += chunk.toString(); });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Astro preview exited early with code ${server.exitCode}.\n${serverError}`);
    }
    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for Astro preview at ${origin}.\n${serverError}`);
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    new Promise((resolveExit) => server.once('exit', resolveExit)),
    delay(5_000),
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

let exitCode = 1;
try {
  await waitForServer();
  const tests = spawn(process.execPath, [playwrightCli, 'test', ...testArguments], {
    env: process.env,
    stdio: 'inherit',
  });
  exitCode = await new Promise((resolveExit, reject) => {
    tests.once('error', reject);
    tests.once('exit', (code) => resolveExit(code ?? 1));
  });
} finally {
  await stopServer();
}

process.exitCode = exitCode;
