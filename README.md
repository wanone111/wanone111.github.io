# Wanone Website

个人网站，使用 Astro 构建主页、博客、项目、关于、简历和友链页面；Starlight 仅提供 `/knowledge/` 技术知识库。公开内容由相邻私有知识库的白名单生成，网站仓库不保存私有笔记或附件原件。

## 技术栈

- Astro 7 与 TypeScript
- Starlight（`/knowledge/`）
- Node.js 22（GitHub Actions）
- GitHub Pages（`.github/workflows/deploy.yml`）

## 当前状态

截至 2026-07-14，公开网站已完成“工程实验编辑部”视觉重设计并部署到生产环境。当前公开内容包括 18 篇博客、一个项目、About/Resume/Links 三个固定页面，以及知识库首页和四个技术分类入口。

当前生产基线为 `62c49a6 feat(home): refine intro and hide hotspots`，对应的 [GitHub Pages 工作流](https://github.com/wanone111/wanone111.github.io/actions/runs/29405379137) 已成功完成。本地待审候选另包含四篇状态为 `ready` 的知识导读；当前校验覆盖 26 个可发布源文件、26 个生成页面、九个生成资源、15 项内容与边界测试、64 个 Astro 检查文件、38 个静态页面、1123 个站内链接与资源、11 个必要路由和 18 个旧 URL 重定向。

视觉层使用暖白纸面、编辑网格、珊瑚红强调色和四类知识颜色。Astro 页面与 Starlight 共享设计 Token；移动导航、主题切换、博客分类筛选和发布流程说明使用原生 JavaScript，不依赖额外前端框架或动画库。

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
cd website
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

1. 在 `../knowledge-base/80_Publish/` 写作；只有 `visibility: public` 且 `status: ready` 或 `published` 的文件可发布。
2. 在本仓库运行 `npm.cmd run health:check`，处理全部失败项。
3. 经人工确认后，分别提交私有知识库源文件和本仓库生成文件；两个仓库不得交叉提交。
4. 推送本仓库 `main` 后，GitHub Actions 仅在公开仓库中执行测试、构建与 GitHub Pages 部署。CI 不读取私有知识库，也不重新同步私有源内容。

生成目录由 `generated-content-manifest.json` 管理。同步工具只会改动带有生成标记且记录在清单中的输出；如需预览或删除全部生成输出，可使用 `npm.cmd run content:clean` 或经确认后使用 `npm.cmd run content:clean:apply`。

详细格式、支持的 Obsidian 语法、安全规则和发布顺序见 [`CONTENT_PIPELINE.md`](CONTENT_PIPELINE.md)。

## 部署

网站部署地址为 [wanone111.github.io](https://wanone111.github.io/)。`.github/workflows/deploy.yml` 在 `main` 分支推送或手动触发时使用 Node.js 22 执行公开仓库检查、构建 `dist/`，然后发布到 GitHub Pages。不使用 Jekyll 或分支目录发布。

## 已知不足与优化顺序

当前没有已知发布阻塞。后续工作优先级如下：

1. **知识内容**：五个 Starlight 页面目前主要承担分类入口作用，详细内容应从私有知识库的公开白名单逐步发布，不能直接在生成目录补写。
2. **浏览器级质量保证**：CI 已覆盖主要路由、关键交互、自动无障碍和 Lighthouse 预算；当前截图用于人工证据复核，尚未启用像素差异型视觉回归。
3. **内容发现**：标签页仅提供标签索引，尚未展示标签对应文章，也没有 RSS/Atom。任何信息架构变化需先获得用户确认。
4. **分享元数据**：当前有描述、Canonical、Sitemap 和 Pagefind，但没有 Open Graph、Twitter Card、JSON-LD 或稳定的社交分享图。
5. **图片性能**：首页与 Uses 页面使用约 194 KB 的单一 WebP 工作台图；尚无 `srcset`、AVIF 和移动端独立裁切。应基于现有 Lighthouse 基线，再决定是否增加图片变体。
6. **维护自动化**：依赖更新仍为人工处理，没有 Dependabot/Renovate，也没有定时外链与生产路由巡检。
7. **监控取舍**：当前未接入统计、错误上报或在线监控，以保持隐私和低维护成本；如需增加，必须先明确数据边界。

更完整的视觉检查和取舍见 [`design-qa.md`](design-qa.md)。私有源、恢复流程和跨仓库状态以知识库中的 `50_Procedures/Website-and-Knowledge-Base-Status.md` 为准。
