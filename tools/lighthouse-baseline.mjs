import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { startStaticPreview } from './lib/static-preview.mjs';

const config = JSON.parse(await readFile(resolve('lighthouse.config.json'), 'utf8'));
const outputDirectory = resolve('qa-artifacts', 'lighthouse');
const chromeProfileDirectory = resolve(outputDirectory, `.chrome-profile-${process.pid}`);
const host = '127.0.0.1';
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

await mkdir(outputDirectory, { recursive: true });
await mkdir(chromeProfileDirectory, { recursive: true });

const preview = await startStaticPreview({ root: resolve('dist'), host, port: config.port });
const origin = preview.origin;

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

let chrome;
try {
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
    userDataDir: chromeProfileDirectory,
  });

  const summary = { generatedAt: new Date().toISOString(), runs: config.runs, routes: {} };
  for (const route of config.routes) {
    const scores = Object.fromEntries(categories.map((category) => [category, []]));
    for (let run = 1; run <= config.runs; run += 1) {
      const result = await lighthouse(`${origin}${route.path}`, {
        port: chrome.port,
        logLevel: 'error',
        output: 'json',
        onlyCategories: categories,
      });
      if (!result) throw new Error(`Lighthouse returned no result for ${route.path}.`);

      await writeFile(
        resolve(outputDirectory, `${route.name}-${run}.report.json`),
        result.report,
        'utf8',
      );
      for (const category of categories) {
        scores[category].push(result.lhr.categories[category].score ?? 0);
      }
    }

    summary.routes[route.name] = {
      path: route.path,
      median: Object.fromEntries(categories.map((category) => [category, median(scores[category])])),
      runs: scores,
    };
  }

  await writeFile(resolve(outputDirectory, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  const failures = [];
  for (const [routeName, routeResult] of Object.entries(summary.routes)) {
    for (const [category, minimum] of Object.entries(config.minimumScores)) {
      const actual = routeResult.median[category];
      if (actual < minimum) failures.push(`${routeName} ${category}: ${actual} < ${minimum}`);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  if (failures.length > 0) {
    console.error(`Lighthouse minimum scores failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
    process.exitCode = 1;
  }
} finally {
  if (chrome) chrome.kill();
  await preview.close();
}

process.exit(process.exitCode ?? 0);
