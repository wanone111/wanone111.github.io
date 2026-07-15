import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMarkdown, createWikiResolver } from '../tools/lib/convert.mjs';

const linked = {
  relativePath: 'docs/linked.md',
  file: 'linked.md',
  route: '/knowledge/linked/',
  data: { title: 'Linked Note', slug: 'linked' },
};
const current = {
  relativePath: 'docs/current.md',
  file: 'current.md',
  route: '/knowledge/current/',
  data: { title: 'Current', slug: 'current' },
  body: '> [!warning] Byte order\n> Check it.\n\nSee [[Linked Note|details]].\n\n![[diagram.png]]\n\n``` C++\nint main() {}\n```\n',
};

test('converts callouts, Wikilinks, and Obsidian image embeds', async () => {
  const output = await convertMarkdown(current, {
    resolveWiki: createWikiResolver([current, linked]),
    resolveAsset: async () => '/images/generated/diagram-123.png',
  });
  assert.match(output, /data-tech-callout="warning"/);
  assert.match(output, /\*\*警告：Byte order\*\*/);
  assert.match(output, /\[details\]\(\/knowledge\/linked\/\)/);
  assert.match(output, /!\[diagram\]\(\/images\/generated\/diagram-123\.png\)/);
  assert.match(output, /```cpp\nint main\(\) \{\}\n```/);
});

test('preserves reusable engineering callout semantics', async () => {
  const output = await convertMarkdown({
    ...current,
    body: '> [!problem] 串口丢帧\n> 接收长度偶发为零。\n\n> [!validation]\n> 连续运行 24 小时无错误。',
  }, {
    resolveWiki: createWikiResolver([current, linked]),
    resolveAsset: async () => '',
  });
  assert.match(output, /data-tech-callout="problem"[^\n]+\*\*故障现象：串口丢帧\*\*/);
  assert.match(output, /data-tech-callout="validation"[^\n]+\*\*验证结果\*\*/);
});

test('rejects embedded notes', async () => {
  await assert.rejects(
    () => convertMarkdown({ ...current, body: '![[Linked Note]]' }, {
      resolveWiki: createWikiResolver([current, linked]),
      resolveAsset: async () => '',
    }),
    /embedded notes are unsupported/,
  );
});
