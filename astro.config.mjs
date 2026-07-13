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
      favicon: '/favicon.svg',
      customCss: ['./src/styles/starlight.css'],
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
