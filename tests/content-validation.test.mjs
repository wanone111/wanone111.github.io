import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLinkIndex, validateNotes } from '../tools/lib/content.mjs';

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

test('accepts notes directory as blog content without changing its public route', async () => {
  const note = validNote({ content_type: 'blog', slug: 'embedded/test-note' });
  note.file = 'C:/kb/80_Publish/notes/test-note.md';
  note.relativePath = 'notes/test-note.md';
  note.folder = 'notes';
  const result = await validateNotes([note], [], paths, policy);
  assert.deepEqual(result.errors, []);
  assert.equal(result.publishable[0].route, '/blog/embedded/test-note/');
});

test('indexes migrated notes under their legacy blog wikilink path', () => {
  const note = validNote({ content_type: 'blog', slug: 'embedded/test-note' });
  note.file = 'C:/kb/80_Publish/notes/test-note.md';
  note.relativePath = 'notes/test-note.md';
  note.folder = 'notes';
  note.route = '/blog/embedded/test-note/';
  const { index } = buildLinkIndex([note]);
  assert.equal(index.get('blog/test-note'), note);
  assert.equal(index.get('blog/embedded/test-note'), note);
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

test('requires complete evidence metadata for publishable featured projects', async () => {
  const note = validNote({
    content_type: 'project',
    slug: 'featured-system',
    featured: true,
  });
  note.file = 'C:/kb/80_Publish/projects/featured-system.md';
  note.relativePath = 'projects/featured-system.md';
  note.folder = 'projects';

  const result = await validateNotes([note], [], paths, policy);
  for (const field of ['featured_order', 'role', 'result', 'validation']) {
    assert.ok(result.errors.some((error) => error.field === field));
  }
});

test('accepts complete featured project metadata and rejects order collisions', async () => {
  const featuredProject = (slug, order) => {
    const note = validNote({
      content_type: 'project',
      slug,
      featured: true,
      featured_order: order,
      role: 'System integration',
      result: 'Verified result.',
      validation: 'Repeatable test.',
    });
    note.file = `C:/kb/80_Publish/projects/${slug}.md`;
    note.relativePath = `projects/${slug}.md`;
    note.folder = 'projects';
    return note;
  };

  const accepted = await validateNotes([featuredProject('first-system', 1)], [], paths, policy);
  assert.deepEqual(accepted.errors, []);

  const collided = await validateNotes([
    featuredProject('first-system', 1),
    featuredProject('second-system', 1),
  ], [], paths, policy);
  assert.ok(collided.errors.some((error) => error.field === 'featured_order' && error.message.includes('collides')));
});

test('rejects malformed featured project order metadata', async () => {
  const note = validNote({ content_type: 'project', slug: 'bad-order', featured_order: 0 });
  note.file = 'C:/kb/80_Publish/projects/bad-order.md';
  note.relativePath = 'projects/bad-order.md';
  note.folder = 'projects';
  const result = await validateNotes([note], [], paths, policy);
  assert.ok(result.errors.some((error) => error.field === 'featured_order'));
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
