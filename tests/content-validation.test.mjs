import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNotes } from '../tools/lib/content.mjs';

const policy = {
  allowedPageSlugs: ['about', 'resume', 'links'],
  reservedRoutes: ['/knowledge/'],
};
const paths = {
  generatedBlogRoot: 'C:/site/blog',
  generatedDocsRoot: 'C:/site/docs',
  generatedProjectsRoot: 'C:/site/projects',
  generatedPagesRoot: 'C:/site/pages',
};

function validNote(overrides = {}) {
  return {
    file: 'C:/kb/80_Publish/docs/test.md',
    relativePath: 'docs/test.md',
    folder: 'docs',
    body: 'Body',
    data: {
      title: 'Test',
      description: 'Description',
      content_type: 'docs',
      status: 'ready',
      visibility: 'public',
      slug: 'embedded/test',
      created: '2026-07-13',
      updated: '2026-07-13',
      tags: [],
      ...overrides,
    },
  };
}

test('accepts a valid publishable note', async () => {
  const result = await validateNotes([validNote()], [], paths, policy);
  assert.deepEqual(result.errors, []);
  assert.equal(result.publishable.length, 1);
  assert.equal(result.publishable[0].route, '/knowledge/embedded/test/');
});

test('rejects invalid slugs and directory/type mismatches', async () => {
  const result = await validateNotes([validNote({ slug: '../Private', content_type: 'blog' })], [], paths, policy);
  assert.ok(result.errors.some((error) => error.field === 'slug'));
  assert.ok(result.errors.some((error) => error.field === 'content_type'));
});

test('accepts the allowlisted fixed links page', async () => {
  const note = validNote({ content_type: 'page', slug: 'links' });
  note.file = 'C:/kb/80_Publish/pages/links.md';
  note.relativePath = 'pages/links.md';
  note.folder = 'pages';
  const result = await validateNotes([note], [], paths, policy);
  assert.deepEqual(result.errors, []);
  assert.equal(result.publishable[0].route, '/links/');
});

test('accepts optional engineering report metadata', async () => {
  const note = validNote({
    content_type: 'project',
    slug: 'test-system',
    problem: 'Verify a real system boundary.',
    environment: 'Hardware and software bench.',
    conclusion: 'The current stage is reproducible.',
    applicable_version: 'v1',
    verified: '2026-07-14',
    time_range: '2026-07',
    role: 'System integration',
    hardware: 'Development board',
    software: 'Linux',
    stack: ['Astro'],
    result: 'Public record generated.',
    limitations: 'One public project.',
    next_step: 'Add measured evidence.',
    validation: 'Automated QA',
  });
  note.file = 'C:/kb/80_Publish/projects/test-system.md';
  note.relativePath = 'projects/test-system.md';
  note.folder = 'projects';
  const result = await validateNotes([note], [], paths, policy);
  assert.deepEqual(result.errors, []);
});

test('rejects malformed optional engineering metadata', async () => {
  const result = await validateNotes([validNote({ problem: ['not', 'text'], verified: 'not-a-date' })], [], paths, policy);
  assert.ok(result.errors.some((error) => error.field === 'problem'));
  assert.ok(result.errors.some((error) => error.field === 'verified'));
});

test('allows a private draft to defer its public slug', async () => {
  const result = await validateNotes([validNote({ status: 'draft', visibility: 'private', slug: '' })], [], paths, policy);
  assert.deepEqual(result.errors, []);
  assert.equal(result.publishable.length, 0);
});

test('still requires a valid slug before content can publish', async () => {
  const missing = await validateNotes([validNote({ slug: '' })], [], paths, policy);
  assert.ok(missing.errors.some((error) => error.field === 'slug'));

  const malformed = await validateNotes([validNote({ slug: '中文路径' })], [], paths, policy);
  assert.ok(malformed.errors.some((error) => error.field === 'slug'));
});
