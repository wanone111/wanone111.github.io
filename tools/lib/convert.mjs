import { basename, extname } from 'node:path';
import { buildLinkIndex, isImageTarget } from './content.mjs';

const CALLOUT_LABELS = {
  note: '说明',
  abstract: '摘要',
  info: '信息',
  todo: '待办',
  tip: '提示',
  success: '成功',
  question: '问题',
  warning: '警告',
  caution: '注意',
  failure: '失败',
  danger: '危险',
  bug: '缺陷',
  problem: '故障现象',
  environment: '实验环境',
  diagnosis: '排查过程',
  conclusion: '关键结论',
  solution: '可复用方案',
  limitations: '已知限制',
  validation: '验证结果',
  example: '示例',
  quote: '引用',
};

const CODE_LANGUAGE_ALIASES = new Map([
  ['c', 'c'],
  ['c++', 'cpp'],
  ['cpp', 'cpp'],
  ['txt', 'text'],
  ['text', 'text'],
  ['shell', 'bash'],
  ['bash', 'bash'],
]);

async function replaceAsync(input, pattern, replacer) {
  const matches = [...input.matchAll(pattern)];
  if (matches.length === 0) return input;
  const replacements = await Promise.all(matches.map((match) => replacer(...match)));
  let output = '';
  let cursor = 0;
  matches.forEach((match, index) => {
    output += input.slice(cursor, match.index) + replacements[index];
    cursor = match.index + match[0].length;
  });
  return output + input.slice(cursor);
}

function headingAnchor(value) {
  return value.trim().toLocaleLowerCase('zh-CN').replace(/[\s_]+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '');
}

function convertCallouts(markdown) {
  return markdown.replace(/^>[ \t]*\[!([a-z]+)\][+-]?[ \t]*([^\r\n]*)$/gim, (_match, kind, title) => {
    const normalizedKind = kind.toLowerCase();
    const label = CALLOUT_LABELS[normalizedKind] ?? kind;
    return `> <span class="tech-callout__marker" data-tech-callout="${normalizedKind}" aria-hidden="true"></span> **${label}${title.trim() ? `：${title.trim()}` : ''}**`;
  });
}

function normalizeCodeFenceLanguages(markdown) {
  return markdown.replace(/^```[ \t]*([^`\s]+)[ \t]*$/gm, (full, language) => {
    const normalized = CODE_LANGUAGE_ALIASES.get(language.toLowerCase());
    return normalized ? `\`\`\`${normalized}` : full;
  });
}

export function createWikiResolver(notes) {
  const { index, ambiguous } = buildLinkIndex(notes);
  return function resolveWiki(note, target) {
    const [rawPage, rawHeading] = target.split('#', 2);
    let route = note.route;
    if (rawPage.trim()) {
      const key = rawPage.trim().toLocaleLowerCase('zh-CN').replace(/\\/g, '/');
      if (ambiguous.has(key)) throw new Error(`${note.relativePath}: ambiguous Wikilink target "${rawPage}".`);
      const linked = index.get(key);
      if (!linked) throw new Error(`${note.relativePath}: unresolved Wikilink target "${rawPage}".`);
      route = linked.route;
    }
    if (rawHeading) route += `#${headingAnchor(rawHeading)}`;
    return route;
  };
}

export async function convertMarkdown(note, { resolveWiki, resolveAsset }) {
  let output = normalizeCodeFenceLanguages(convertCallouts(note.body));

  output = await replaceAsync(output, /!\[\[([^\]]+)\]\]/g, async (_full, value) => {
    const [target] = value.split('|', 1);
    if (!isImageTarget(target)) throw new Error(`${note.relativePath}: embedded notes are unsupported; link to the note instead: ${target}`);
    const url = await resolveAsset(note, target);
    const alt = basename(target, extname(target)).replace(/[-_]+/g, ' ');
    return `![${alt}](${url})`;
  });

  output = output.replace(/(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_full, target, label) => {
    const route = resolveWiki(note, target);
    const display = (label || target.split('#').at(-1)).trim().replace(/[\[\]]/g, '');
    return `[${display}](${route})`;
  });

  output = await replaceAsync(output, /!\[([^\]]*)\]\(([^)]+)\)/g, async (full, alt, target) => {
    const cleanTarget = target.trim().split(/\s+["']/)[0];
    if (/^(?:https?:|data:|\/|#)/i.test(cleanTarget)) return full;
    const url = await resolveAsset(note, cleanTarget);
    return `![${alt}](${url})`;
  });

  return output;
}
