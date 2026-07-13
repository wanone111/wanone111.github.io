import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, serializeMarkdown } from '../tools/lib/frontmatter.mjs';

test('parses and serializes YAML front matter', () => {
  const parsed = parseMarkdown('---\ntitle: Test\ntags:\n  - Astro\n---\n\nBody\n', 'test.md');
  assert.equal(parsed.data.title, 'Test');
  assert.deepEqual(parsed.data.tags, ['Astro']);
  assert.equal(parsed.body.trim(), 'Body');

  const output = serializeMarkdown(parsed.data, parsed.body);
  assert.match(output, /^---\n/);
  assert.match(output, /GENERATED FROM THE PRIVATE KNOWLEDGE BASE/);
  assert.match(output, /Body/);
});

test('rejects Markdown without front matter', () => {
  assert.throws(() => parseMarkdown('# Missing', 'missing.md'), /missing YAML front matter/);
});
