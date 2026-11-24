import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const redirects = { '/blog/': '/notes/' };
// Each article had a dated URL and a /blog/ slug. A third value moves its /notes/ URL as well.
for (const [datedUrl, slug, movedTo] of [
  ['/2025/09/16/ROS2学习笔记/', 'robotics/ros2-notes'],
  ['/2025/09/18/FPGA-RTL学习笔记/', 'fpga/rtl-notes'],
  ['/2025/09/18/linux学习笔记/', 'tools/linux-notes', '/knowledge/linux-tools/linux-and-networking/'],
  ['/2025/09/18/PID/', 'algorithms/pid', '/notes/algorithms/pid-control-basics/'],
  ['/2025/09/18/STM32学习笔记/', 'embedded/stm32-notes', '/notes/embedded/communication-protocols/'],
  ['/2025/09/18/嵌入式通信/', 'embedded/communication-protocols'],
  ['/2025/09/23/FPGA/', 'fpga/fpga-overview'],
  ['/2025/09/23/STM32-通信/', 'embedded/stm32-communication', '/notes/embedded/communication-protocols/'],
  ['/2025/10/16/FPGA-HLS学习笔记/', 'fpga/vitis-hls-notes'],
  ['/2025/10/16/电赛/', 'embedded/electronic-design-contest', '/knowledge/embedded/communication-path/'],
  ['/2025/10/17/Linux-socket/', 'networking/linux-socket', '/notes/networking/linux-tcp-socket-basics/'],
  ['/2026/03/07/Gazebo仿真/', 'robotics/gazebo-simulation', '/notes/robotics/gazebo-notes/'],
  ['/2026/04/07/C++学习笔记/', 'programming/cpp-notes', '/notes/programming/cpp-class-access-control/'],
  ['/2026/04/07/SLAM学习笔记/', 'robotics/slam-notes', '/knowledge/robotics/'],
  ['/2026/04/07/verilog学习笔记/', 'fpga/verilog-notes'],
  ['/2026/04/08/matlab学习笔记/', 'vision/matlab-notes', '/knowledge/'],
  ['/2026/04/08/opencv学习笔记/', 'vision/opencv-notes', '/knowledge/'],
  ['/2026/04/08/各种滤波算法/', 'algorithms/filtering', '/knowledge/'],
]) {
  const notesUrl = `/notes/${slug}/`;
  const destination = movedTo ?? notesUrl;
  redirects[datedUrl] = destination;
  redirects[`/blog/${slug}/`] = destination;
  if (movedTo) redirects[notesUrl] = movedTo;
}

export default defineConfig({
  site: 'https://wanone111.github.io',
  scopedStyleStrategy: 'where',
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
        { label: '笔记', link: '/notes/' },
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
