# Wanone Website

个人网站，使用 Astro 构建主页、博客、项目、关于、简历和友链页面；Starlight 仅提供 `/knowledge/` 技术知识库。公开内容由相邻私有知识库的白名单生成，网站仓库不保存私有笔记或附件原件。

## 技术栈

- Astro 7 与 TypeScript
- Starlight（`/knowledge/`）
- Node.js 22（GitHub Actions）
- GitHub Pages（`.github/workflows/deploy.yml`）

## 当前状态

截至 2026-08-11，网站已与整理后的知识库重新同步。当前生成集合为 23 个页面：13 篇经过事实复核和隐私清理的技术笔记、四篇知识路径文档、三个工程项目，以及 About/Resume/Links 三个固定页面。历史 Hexo、`/notes/` 与 `/blog/` 地址会优先重定向到已恢复的等价文章；没有可安全恢复内容的旧主题继续回退到最接近的知识路径。

本次同步校验覆盖 23 个公开源、23 个生成页面、零个生成资源、27 项内容与边界测试、70 个 Astro 检查文件、35 个内容页面、84 个含重定向的 HTML 输出、1186 个站内链接与资源、12 个必要路由、18 个历史 URL 和 31 个退役或兼容路由。41 项浏览器路由与交互测试、16 个 axe WCAG A/AA 场景及九项视觉证据测试均已通过；三条代表路由的 Lighthouse 性能中位数为 98–99，其余三项均为 100。依赖强制修复后 Astro 7.2.0、Starlight 0.41.7、Astro Check 0.9.10、Playwright 1.62.1 和 Lighthouse 13.4.1 已进入锁文件，生产与完整依赖审计均为零个已知漏洞。TypeScript 暂留在 Astro Check 支持的最新 6.x，避免 7.x 的 peer 依赖冲突破坏 `npm ci`。

视觉层继续使用暖白纸面、编辑网格、珊瑚红强调色和四类知识颜色。Astro 页面与 Starlight 共享设计 Token；移动导航、主题切换、命令搜索、条件式文章分类筛选和发布流程说明使用原生 JavaScript，不依赖额外前端框架或动画库。

## 项目结构

| 路径 | 作用 |
| --- | --- |
| `src/pages/` | Astro 页面和路由 |
| `src/components/`、`src/layouts/`、`src/styles/` | 站点界面组件、布局与样式 |
| `src/content/docs/knowledge/` | 手写 Starlight 入口与未来经清单登记的生成知识内容；仅清单登记文件禁止手动编辑 |
| `src/content/generated/` | 从私有知识库同步的博客、项目和固定页面；禁止手动编辑 |
| `public/images/generated/` | 从私有附件源同步的公开图片；禁止手动编辑 |
| `tools/` | 内容校验、同步、生成内容完整性、链接、路由、重定向、浏览器 QA、Lighthouse 与健康检查工具 |
| `generated-content-manifest.json` | 生成内容与资源的所有权和哈希清单 |
| `legacy-url-map.json` | 旧 Hexo URL 到当前页面的重定向映射 |

## 本地开发

在 Windows PowerShell 中使用 `npm.cmd`，避免执行策略拦截 `npm.ps1`：

```powershell
cd wanone111.github.io
npm.cmd ci
npm.cmd run dev
```

若当前环境禁止 Astro 写入用户配置目录，可在命令前设置：

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
```

常用命令：

```powershell
npm.cmd run content:validate       # 校验私有公开源的元数据、链接和附件
npm.cmd run content:check-secrets  # 扫描公开源中的敏感信息
npm.cmd run content:sync           # 同步白名单内容和附件到本仓库
npm.cmd run test:generated         # 校验生成清单、标记和哈希
npm.cmd run test:content           # 运行内容工具测试
npm.cmd run check                  # Astro 类型与内容检查
npm.cmd run build                  # 构建 dist/
npm.cmd run test:links             # 校验站内链接与资源
npm.cmd run test:routes            # 校验公开路由
npm.cmd run test:redirects         # 校验旧链接重定向
npm.cmd run test:browser           # 主要路由与关键交互 smoke test
npm.cmd run test:a11y              # axe WCAG A/AA 自动检查
npm.cmd run test:lighthouse        # 三条代表路由的 Lighthouse 基线与预算
npm.cmd run test:visual            # 生成本地响应式与互动状态截图
npm.cmd run test:qa                # 浏览器、无障碍与 Lighthouse 发布门禁
npm.cmd run preview                # 本地预览构建结果
```

`npm.cmd run content:publish` 会按上述顺序完成发布前内容检查，并运行 `test:qa`（不推送、不部署）。截图和详细 QA 报告写入已忽略的 `qa-artifacts/`；CI 会保留 14 天工件。

`npm.cmd run health:check` 在此基础上补充两个仓库的边界、远程、分支和恢复前提检查；`npm.cmd run health:status` 只做后者的只读检查。

工作区路径在任何内容读取或同步前也会验证：配置的网站根必须是当前仓库，私有知识库与公开网站不得互相嵌套，博客、项目和固定页输出不得逃逸统一的生成内容根目录。相关回归测试由 `test:content` 一并运行。

## 内容流程与边界

1. 在 `../knowledge_base/40_Publish/` 的 `笔记/`、`文档/`、`项目/` 或 `页面/` 中写作；只有 `visibility: public` 且 `status: ready` 或 `published` 的文件可发布。
2. 在本仓库运行 `npm.cmd run health:check`，处理全部失败项。
3. 经人工确认后，分别提交私有知识库源文件和本仓库生成文件；两个仓库不得交叉提交。
4. 推送本仓库 `main` 后，GitHub Actions 仅在公开仓库中执行测试、构建与 GitHub Pages 部署。CI 不读取私有知识库，也不重新同步私有源内容。

生成目录由 `generated-content-manifest.json` 管理。同步工具只会改动带有生成标记且记录在清单中的输出；如需预览或删除全部生成输出，可使用 `npm.cmd run content:clean` 或经确认后使用 `npm.cmd run content:clean:apply`。

详细格式、支持的 Obsidian 语法、安全规则和发布顺序见 [`CONTENT_PIPELINE.md`](CONTENT_PIPELINE.md)。

## 部署

网站部署地址为 [wanone111.github.io](https://wanone111.github.io/)。`.github/workflows/deploy.yml` 在 `main` 分支推送或手动触发时使用 Node.js 22 执行公开仓库检查、构建 `dist/`，然后发布到 GitHub Pages。不使用 Jekyll 或分支目录发布。

## 已知不足与优化顺序

当前代码与三个项目均已通过本地发布门禁。后续工作优先级如下：

1. **项目证据**：异构视频链路和室内无人机项目已公开结构化工程档案；后续补充经过筛选的真实照片、日志或运行截图，不添加未经验证的指标。
2. **浏览器级质量保证**：CI 已覆盖主要路由、关键交互、自动无障碍和 Lighthouse 预算；当前截图用于人工证据复核，尚未启用像素差异型视觉回归。
3. **知识结构**：四篇学习路径和 13 篇复核后的技术笔记已经公开生成；其余旧博客内容仍保留在私有整理区，只在完成事实复核并重新进入白名单后发布。
4. **分享视觉**：Open Graph、Twitter Card 和 JSON-LD 已存在，但默认分享图仍使用工作台资产；应在真实项目素材批准后再替换。
5. **图片性能**：工作台 WebP 只保留在 `/uses/` 和默认分享图；真实项目素材加入后需要重新评估 `srcset`、AVIF 和移动端裁切。
6. **维护与监控**：依赖更新、外链健康和生产路由巡检仍依赖人工；站点未接入统计或错误上报，以保持隐私和低维护成本。

更完整的视觉检查和取舍见 [`design-qa.md`](design-qa.md)。私有源、恢复流程和跨仓库状态以知识库中的 `30_笔记/运维/Website-and-Knowledge-Base-Status.md` 为准。
