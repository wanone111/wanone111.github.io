import { basename, extname, relative, resolve, sep } from 'node:path';
import { readFile } from 'node:fs/promises';
import { parseMarkdown } from './frontmatter.mjs';
import { relativePosix, walkFiles } from './files.mjs';

const TYPE_BY_DIRECTORY = {
  blog: 'blog',
  docs: 'docs',
  projects: 'project',
  pages: 'page',
};
const STATUSES = new Set(['draft', 'review', 'ready', 'published']);
const VISIBILITIES = new Set(['private', 'public']);
const CONTENT_TYPES = new Set(Object.values(TYPE_BY_DIRECTORY));
const SLUG_PATTERN = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

function addError(errors, note, message, field) {
  errors.push({ file: note.relativePath, field, message });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return (typeof value === 'string' || typeof value === 'number') && !Number.isNaN(new Date(value).getTime());
}

export function isPublishable(note) {
  return note.data.visibility === 'public' && ['ready', 'published'].includes(note.data.status);
}

export function routeFor(data) {
  switch (data.content_type) {
    case 'blog': return `/blog/${data.slug}/`;
    case 'docs': return `/knowledge/${data.slug}/`;
    case 'project': return `/projects/${data.slug}/`;
    case 'page': return `/${data.slug}/`;
    default: throw new Error(`Unsupported content type: ${data.content_type}`);
  }
}

export function outputPathFor(note, paths) {
  const relativeFile = `${note.data.slug}.md`;
  switch (note.data.content_type) {
    case 'blog': return resolve(paths.generatedBlogRoot, relativeFile);
    case 'docs': return resolve(paths.generatedDocsRoot, relativeFile);
    case 'project': return resolve(paths.generatedProjectsRoot, relativeFile);
    case 'page': return resolve(paths.generatedPagesRoot, relativeFile);
    default: throw new Error(`Unsupported content type: ${note.data.content_type}`);
  }
}

export async function loadPolicy(paths) {
  return JSON.parse(await readFile(paths.contentPolicy, 'utf8'));
}

export async function discoverNotes(paths) {
  const files = await walkFiles(paths.publishRoot, (path) => ['.md', '.mdx'].includes(extname(path).toLowerCase()));
  const notes = [];
  const errors = [];

  for (const file of files) {
    const relativePath = relativePosix(paths.publishRoot, file);
    const folder = relative(paths.publishRoot, file).split(sep)[0];
    if (extname(file).toLowerCase() === '.mdx') {
      errors.push({ file: relativePath, field: 'file', message: 'MDX is not supported by the publishing converter; use Markdown.' });
      continue;
    }
    try {
      const parsed = parseMarkdown(await readFile(file, 'utf8'), relativePath);
      notes.push({ file, relativePath, folder, ...parsed });
    } catch (error) {
      errors.push({ file: relativePath, field: 'frontmatter', message: error.message });
    }
  }
  return { notes, errors };
}

export async function validateNotes(notes, initialErrors, paths, policy) {
  const errors = [...initialErrors];
  const routes = new Map();

  for (const note of notes) {
    const { data } = note;
    const expectedType = TYPE_BY_DIRECTORY[note.folder];
    if (!expectedType) addError(errors, note, `Unsupported top-level publish directory: ${note.folder}`, 'content_type');

    for (const field of ['title', 'description', 'content_type', 'status', 'visibility', 'created', 'updated']) {
      if (data[field] === undefined || data[field] === null || data[field] === '') addError(errors, note, 'Required field is missing.', field);
    }
    if (!isNonEmptyString(data.title)) addError(errors, note, 'Must be a non-empty string.', 'title');
    if (!isNonEmptyString(data.description)) addError(errors, note, 'Must be a non-empty string.', 'description');
    if (!CONTENT_TYPES.has(data.content_type)) addError(errors, note, `Must be one of: ${[...CONTENT_TYPES].join(', ')}.`, 'content_type');
    if (expectedType && data.content_type !== expectedType) addError(errors, note, `Directory ${note.folder} requires content_type: ${expectedType}.`, 'content_type');
    if (!STATUSES.has(data.status)) addError(errors, note, `Must be one of: ${[...STATUSES].join(', ')}.`, 'status');
    if (!VISIBILITIES.has(data.visibility)) addError(errors, note, 'Must be private or public.', 'visibility');
    const hasSlug = isNonEmptyString(data.slug);
    if (isPublishable(note) && !hasSlug) addError(errors, note, 'Publishable content requires a slug.', 'slug');
    if (hasSlug && !SLUG_PATTERN.test(data.slug)) addError(errors, note, 'Use lowercase ASCII path segments separated by / or -.', 'slug');
    if (!isValidDate(data.created)) addError(errors, note, 'Must be a valid date.', 'created');
    if (!isValidDate(data.updated)) addError(errors, note, 'Must be a valid date.', 'updated');
    if (data.status === 'published' && !isValidDate(data.published)) addError(errors, note, 'Published content requires a valid published date.', 'published');
    if (!Array.isArray(data.tags) || data.tags.some((tag) => !isNonEmptyString(tag))) addError(errors, note, 'Must be an array of non-empty strings.', 'tags');
    for (const field of ['problem', 'environment', 'conclusion', 'applicable_version']) {
      if (data[field] !== undefined && !isNonEmptyString(data[field])) addError(errors, note, 'Must be a non-empty string when provided.', field);
    }
    if (data.verified !== undefined && !isValidDate(data.verified)) addError(errors, note, 'Must be a valid date when provided.', 'verified');
    if (data.content_type === 'project') {
      for (const field of ['time_range', 'role', 'hardware', 'software', 'result', 'limitations', 'next_step', 'validation']) {
        if (data[field] !== undefined && !isNonEmptyString(data[field])) addError(errors, note, 'Must be a non-empty string when provided.', field);
      }
      if (data.stack !== undefined && (!Array.isArray(data.stack) || data.stack.some((item) => !isNonEmptyString(item)))) {
        addError(errors, note, 'Must be an array of non-empty strings when provided.', 'stack');
      }
    }
    if (['ready', 'published'].includes(data.status) && data.visibility !== 'public') addError(errors, note, `${data.status} content must use visibility: public.`, 'visibility');
    if (data.content_type === 'page' && hasSlug && !policy.allowedPageSlugs.includes(data.slug)) addError(errors, note, `Page slug must be one of: ${policy.allowedPageSlugs.join(', ')}.`, 'slug');

    const unsupported = [
      { pattern: /```dataview(?:js)?\b/i, message: 'Dataview blocks cannot be published.' },
      { pattern: /`=\s*[^`]+`/, message: 'Inline Dataview queries cannot be published.' },
      { pattern: /!\[\[([^\]]+)\.canvas(?:\|[^\]]+)?\]\]/i, message: 'Canvas embeds cannot be published.' },
    ];
    for (const rule of unsupported) {
      if (rule.pattern.test(note.body)) addError(errors, note, rule.message, 'body');
    }

    if (isPublishable(note) && isNonEmptyString(data.slug) && CONTENT_TYPES.has(data.content_type)) {
      const route = routeFor(data);
      const existing = routes.get(route);
      if (existing) addError(errors, note, `Route collides with ${existing}.`, 'slug');
      else routes.set(route, note.relativePath);
      if (policy.reservedRoutes.includes(route) && data.content_type !== 'page') addError(errors, note, `Route is reserved by a hand-authored site page: ${route}`, 'slug');

      const outputPath = outputPathFor(note, paths);
      note.route = route;
      note.outputPath = outputPath;
    }
  }

  return { notes, errors, publishable: notes.filter(isPublishable) };
}

export async function loadValidatedContent(paths) {
  const policy = await loadPolicy(paths);
  const discovered = await discoverNotes(paths);
  const validated = await validateNotes(discovered.notes, discovered.errors, paths, policy);
  return { ...validated, policy };
}

export function buildLinkIndex(notes) {
  const index = new Map();
  const ambiguous = new Set();
  for (const note of notes) {
    const keys = [note.data.title, note.data.slug, basename(note.file, extname(note.file)), note.relativePath.replace(/\.[^.]+$/, '')];
    for (const raw of keys) {
      const key = String(raw).trim().toLocaleLowerCase('zh-CN').replace(/\\/g, '/');
      if (!key) continue;
      if (index.has(key) && index.get(key).route !== note.route) ambiguous.add(key);
      else index.set(key, note);
    }
  }
  return { index, ambiguous };
}

export function isImageTarget(target) {
  return IMAGE_EXTENSIONS.has(extname(target.split('|')[0]).toLowerCase());
}

export function printValidationErrors(errors, heading = 'Content validation failed') {
  console.error(`${heading} (${errors.length}):`);
  for (const error of errors) console.error(`- ${error.file}${error.field ? ` [${error.field}]` : ''}: ${error.message}`);
}
