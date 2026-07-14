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
