import { getCollection } from 'astro:content';
import { byNewest, isPublic } from '../lib/content';

const site = 'https://wanone111.github.io';
const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export async function GET() {
  const [posts, projects] = await Promise.all([
    getCollection('blog').then((entries) => entries.filter(isPublic)),
    getCollection('projects').then((entries) => entries.filter(isPublic)),
  ]);
  const items = [...posts, ...projects].sort(byNewest).map((entry) => {
    const section = entry.collection === 'projects' ? 'projects' : 'notes';
    const url = `${site}/${section}/${entry.data.slug}/`;
    return `<item>
      <title>${escapeXml(entry.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${entry.data.updated.toUTCString()}</pubDate>
      <description>${escapeXml(entry.data.description)}</description>
      <category>${escapeXml(entry.collection === 'projects' ? '项目' : (entry.data.category ?? '工程笔记'))}</category>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Wanone 工程笔记</title>
    <link>${site}/</link>
    <description>嵌入式、机器人系统、FPGA 与边缘 AI 的公开工程档案。</description>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
