import { extname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { parseMarkdown } from './markdown.mjs';
import { pathExists, relativePosix, sha256, walkFiles } from './files.mjs';

const TYPE_BY_DIRECTORY = {
  笔记: 'blog',
  文档: 'docs',
  项目: 'project',
  页面: 'page',
};
const STATUSES = new Set(['draft', 'review', 'ready', 'published']);
const VISIBILITIES = new Set(['private', 'public']);
const ROUTES = {
  blog: ['/notes/', 'generatedBlogRoot'],
  docs: ['/knowledge/', 'generatedDocsRoot'],
  project: ['/projects/', 'generatedProjectsRoot'],
  page: ['/', 'generatedPagesRoot'],
};
const CONTENT_TYPES = new Set(Object.keys(ROUTES));
const SLUG_PATTERN = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;

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

function isPublishable(note) {
  return note.data.visibility === 'public' && ['ready', 'published'].includes(note.data.status);
}

async function loadPolicy({ contentPolicy, websiteRoot }) {
  if (!contentPolicy) return {};
  // Older workspace configs point to the former bundled policy.
  if (contentPolicy === resolve(websiteRoot, 'tools/content-policy.json') && !await pathExists(contentPolicy)) return {};
  return JSON.parse(await readFile(contentPolicy, 'utf8'));
}

async function discoverNotes(paths) {
  const files = await walkFiles(paths.publishRoot, (path) => ['.md', '.mdx'].includes(extname(path).toLowerCase()));
  const notes = [];
  const errors = [];

  for (const file of files) {
    const relativePath = relativePosix(paths.publishRoot, file);
    const folder = relativePath.split('/')[0];
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

export function validateNotes(notes, initialErrors, paths, policy = {}) {
  const allowedPageSlugs = policy.allowedPageSlugs ?? ['about', 'resume', 'links'];
  const reservedRoutes = policy.reservedRoutes ?? [
    '/knowledge/embedded/', '/knowledge/robotics/', '/knowledge/fpga-edge-ai/', '/knowledge/linux-tools/',
  ];
  const errors = [...initialErrors];
  const routes = new Map();
  const featuredProjectOrders = new Map();

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
      if (data.featured_order !== undefined && (!Number.isInteger(data.featured_order) || data.featured_order <= 0)) {
        addError(errors, note, 'Must be a positive integer when provided.', 'featured_order');
      }
      if (isPublishable(note) && data.featured === true) {
        for (const field of ['featured_order', 'role', 'result', 'validation']) {
          if (data[field] === undefined || data[field] === null || data[field] === '') {
            addError(errors, note, 'Featured publishable projects require this field.', field);
          }
        }
        if (Number.isInteger(data.featured_order) && data.featured_order > 0) {
          const existing = featuredProjectOrders.get(data.featured_order);
          if (existing) addError(errors, note, `Featured order collides with ${existing}.`, 'featured_order');
          else featuredProjectOrders.set(data.featured_order, note.relativePath);
        }
      }
    }
    if (['ready', 'published'].includes(data.status) && data.visibility !== 'public') addError(errors, note, `${data.status} content must use visibility: public.`, 'visibility');
    if (data.content_type === 'page' && hasSlug && !allowedPageSlugs.includes(data.slug)) addError(errors, note, `Page slug must be one of: ${allowedPageSlugs.join(', ')}.`, 'slug');

    const unsupported = [
      { pattern: /```dataview(?:js)?\b/i, message: 'Dataview blocks cannot be published.' },
      { pattern: /`=\s*[^`]+`/, message: 'Inline Dataview queries cannot be published.' },
      { pattern: /!\[\[([^\]]+)\.canvas(?:\|[^\]]+)?\]\]/i, message: 'Canvas embeds cannot be published.' },
    ];
    for (const rule of unsupported) {
      if (rule.pattern.test(note.body)) addError(errors, note, rule.message, 'body');
    }

    if (isPublishable(note) && isNonEmptyString(data.slug) && CONTENT_TYPES.has(data.content_type)) {
      const [routePrefix, rootKey] = ROUTES[data.content_type];
      const route = `${routePrefix}${data.slug}/`;
      const existing = routes.get(route);
      if (existing) addError(errors, note, `Route collides with ${existing}.`, 'slug');
      else routes.set(route, note.relativePath);
      if (reservedRoutes.includes(route) && data.content_type !== 'page') addError(errors, note, `Route is reserved by a hand-authored site page: ${route}`, 'slug');

      note.route = route;
      note.outputRoot = paths[rootKey];
      note.outputPath = resolve(note.outputRoot, `${data.slug}.md`);
    }
  }

  return { notes, errors, publishable: notes.filter(isPublishable) };
}

export async function loadValidatedContent(paths) {
  const policy = await loadPolicy(paths);
  const discovered = await discoverNotes(paths);
  const validated = validateNotes(discovered.notes, discovered.errors, paths, policy);
  return { ...validated, policy };
}

export function printValidationErrors(errors, heading = 'Content validation failed') {
  console.error(`${heading} (${errors.length}):`);
  for (const error of errors) console.error(`- ${error.file}${error.field ? ` [${error.field}]` : ''}: ${error.message}`);
}

const CREDENTIAL_RULES = [
  { id: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { id: 'github-token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { id: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'credential-assignment', pattern: /\b(?:api[_-]?key|access[_-]?token|secret|password|passwd|pwd)\s*[:=]\s*["']?[^\s"'`]{8,}/gi },
];

const ALL_RULES = [
  ...CREDENTIAL_RULES,
  { id: 'windows-absolute-path', pattern: /\b[A-Za-z]:\\[^\r\n`"']+/g },
  { id: 'linux-home-path', pattern: /\/home\/[a-zA-Z0-9._-]+(?:\/[^\s`"']*)?/g },
  { id: 'email-address', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: 'private-ip', pattern: /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|127\.0\.0\.1)\b/g },
];

function fingerprint(rule, value) {
  return sha256(`${rule}\0${value}`).slice(0, 16);
}

function allowed(rule, value, policy, hash) {
  const { allowedFindingFingerprints = ['81f37d06c2b49cf1'], allowedPrivateIps = ['127.0.0.1'] } = policy;
  if (allowedFindingFingerprints.includes(hash)) return true;
  if (rule === 'email-address' && policy.allowedEmails?.includes(value.toLowerCase())) return true;
  if (rule === 'private-ip' && allowedPrivateIps.includes(value)) return true;
  if ((rule === 'windows-absolute-path' || rule === 'linux-home-path') && policy.allowedAbsolutePaths?.includes(value)) return true;
  return false;
}

function masked(rule, value) {
  if (rule.includes('path')) return '[redacted absolute path]';
  if (rule === 'email-address') return value.replace(/^(.).+(@.+)$/, '$1***$2');
  if (rule === 'private-ip') return value.replace(/\.\d+$/, '.***');
  if (value.length <= 8) return '[redacted]';
  return `${value.slice(0, 3)}…${value.slice(-2)}`;
}

export function scanText(text, file, policy = {}, rules = ALL_RULES) {
  const findings = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[0];
      const hash = fingerprint(rule.id, value);
      if (allowed(rule.id, value, policy, hash)) continue;
      findings.push({
        file,
        line: text.slice(0, match.index).split(/\r?\n/).length,
        rule: rule.id,
        preview: masked(rule.id, value),
        fingerprint: hash,
      });
    }
  }
  return findings;
}

export function scanNotes(notes, policy, { credentialsOnly = false } = {}) {
  const rules = credentialsOnly ? CREDENTIAL_RULES : ALL_RULES;
  return notes.flatMap((note) => scanText(note.raw, note.relativePath, policy, rules));
}

export function printSecurityFindings(findings) {
  console.error(`Sensitive-information scan found ${findings.length} issue(s):`);
  for (const item of findings) {
    console.error(`- ${item.file}:${item.line} [${item.rule}] ${item.preview} (allowlist fingerprint: ${item.fingerprint})`);
  }
}
