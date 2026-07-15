import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';

const legacyUrlMap = JSON.parse(
  readFileSync(new URL('./legacy-url-map.json', import.meta.url), 'utf8'),
);
const redirects = Object.fromEntries(
  legacyUrlMap.redirects.map(({ source, destination }) => [source, destination]),
);

export default defineConfig({
  site: 'https://wanone111.github.io',
  redirects,
  integrations: [
    starlight({
      title: 'Wanone Knowledge',
      description: '嵌入式、机器人、FPGA 与边缘 AI 的公开技术知识库。',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/starlight.css'],
      head: [
        { tag: 'meta', attrs: { property: 'og:locale', content: 'zh_CN' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'Wanone' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://wanone111.github.io/images/brand/engineering-workbench-v2.webp' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://wanone111.github.io/images/brand/engineering-workbench-v2.webp' } },
        { tag: 'meta', attrs: { 'data-pagefind-meta': 'type', content: '知识库' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: 'Wanone 工程笔记', href: '/rss.xml' } },
      ],
      components: {
        PageTitle: './src/components/starlight/KnowledgePageTitle.astro',
      },
      disable404Route: true,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/wanone111' },
      ],
      sidebar: [
        { label: '返回主页', link: '/' },
        { label: '项目', link: '/projects/' },
        { label: '博客', link: '/blog/' },
        { label: '知识库首页', slug: 'knowledge' },
        {
          label: '技术方向',
          items: [{ autogenerate: { directory: 'knowledge' } }],
        },
      ],
      lastUpdated: true,
      pagination: true,
      credits: false,
    }),
  ],
});
