import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { defaultPaths } from '../tools/lib/files.mjs';
import { scanNotes, scanText, validateNotes } from '../tools/lib/source.mjs';

const paths = defaultPaths(resolve('website'), resolve('knowledge_base'));

function note(folder, type, slug, fields = {}) {
  const relativePath = `${folder}/${slug || 'draft'}.md`;
  return {
    file: resolve(paths.publishRoot, relativePath), relativePath, folder, body: 'Body',
    data: {
      title: 'Test', description: 'Description', content_type: type, slug,
      status: 'ready', visibility: 'public', created: '2026-07-13', updated: '2026-07-13', tags: [],
      ...fields,
    },
  };
}

test('assigns public routes and leaves private drafts unpublished', () => {
  const result = validateNotes([
    note('文档', 'docs', 'embedded/test'),
    note('笔记', 'blog', 'embedded/test-note'),
    note('页面', 'page', 'links'),
    note('笔记', 'blog', '', { status: 'draft', visibility: 'private' }),
  ], [], paths);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.publishable.map((item) => item.route), ['/knowledge/embedded/test/', '/notes/embedded/test-note/', '/links/']);
});

test('rejects invalid slugs, invalid metadata, mismatched types, and reserved routes', () => {
  for (const [entry, field] of [
    [note('笔记', 'blog', ''), 'slug'],
    [note('文档', 'blog', 'test'), 'content_type'],
    [note('笔记', 'blog', '../private'), 'slug'],
    [note('项目', 'project', 'bad-order', { featured_order: 0 }), 'featured_order'],
    [note('文档', 'docs', 'robotics'), 'slug'],
    [note('页面', 'page', 'uses'), 'slug'],
    [note('文档', 'docs', 'report', { problem: ['bad'] }), 'problem'],
    [note('文档', 'docs', 'report', { verified: 'not-a-date' }), 'verified'],
  ]) {
    const { errors } = validateNotes([entry], [], paths);
    assert.ok(errors.some((error) => error.field === field), entry.file);
  }
});

test('featured projects require evidence and a distinct positive order', () => {
  const project = (slug, fields) => note('项目', 'project', slug, { featured: true, ...fields });
  const missing = validateNotes([project('incomplete')], [], paths);
  for (const field of ['role', 'result', 'validation', 'featured_order']) {
    assert.ok(missing.errors.some((error) => error.field === field));
  }
  const fields = { role: 'Integration', result: 'Published', validation: 'Bench', featured_order: 1, stack: ['Astro'] };
  assert.deepEqual(validateNotes([project('first', fields)], [], paths).errors, []);
  const collision = validateNotes([project('first', fields), project('second', fields)], [], paths);
  assert.ok(collision.errors.some((error) => error.field === 'featured_order' && error.message.includes('collides')));
});

test('sync scans credentials and the optional review also checks private details', () => {
  const entry = { raw: 'password=example-only\nEmail: author@example.org\nDirectory: D:\\Users\\owner\\file', relativePath: 'example.md' };
  const sync = scanNotes([entry], {}, { credentialsOnly: true });
  assert.deepEqual(sync.map((item) => item.rule), ['credential-assignment']);
  assert.ok(!sync[0].preview.includes('example-only'));
  const full = scanNotes([entry]);
  assert.deepEqual(full.map((item) => item.rule), ['credential-assignment', 'windows-absolute-path', 'email-address']);
  assert.equal(full[1].preview, '[redacted absolute path]');
  assert.equal(scanText('Connect to 127.0.0.1.', 'note.md').length, 0);
  assert.equal(scanText('Connect to 10.0.0.1.', 'note.md', { allowedPrivateIps: ['10.0.0.1'] }).length, 0);
});
