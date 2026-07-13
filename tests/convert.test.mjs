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
  assert.match(output, /> \*\*警告：Byte order\*\*/);
  assert.match(output, /\[details\]\(\/knowledge\/linked\/\)/);
  assert.match(output, /!\[diagram\]\(\/images\/generated\/diagram-123\.png\)/);
  assert.match(output, /```cpp\nint main\(\) \{\}\n```/);
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
