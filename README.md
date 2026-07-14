# Wanone Website

个人网站，使用 Astro 构建主页、博客、项目、关于、简历和友链页面；Starlight 仅提供 `/knowledge/` 技术知识库。公开内容由相邻私有知识库的白名单生成，网站仓库不保存私有笔记或附件原件。

## 技术栈

- Astro 7 与 TypeScript
- Starlight（`/knowledge/`）
- Node.js 22（GitHub Actions）
- GitHub Pages（`.github/workflows/deploy.yml`）

## 项目结构

| 路径 | 作用 |
| --- | --- |
| `src/pages/` | Astro 页面和路由 |
| `src/components/`、`src/layouts/`、`src/styles/` | 站点界面组件、布局与样式 |
| `src/content/docs/knowledge/` | 手写 Starlight 知识库内容 |
| `src/content/generated/` | 从私有知识库同步的博客、项目和固定页面；禁止手动编辑 |
| `public/images/generated/` | 从私有附件源同步的公开图片；禁止手动编辑 |
| `tools/` | 内容校验、同步、生成内容完整性、链接、路由、重定向与健康检查工具 |
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
npm.cmd run preview                # 本地预览构建结果
```

`npm.cmd run content:publish` 会按上述顺序完成发布前内容检查（不推送、不部署）。

`npm.cmd run health:check` 在此基础上补充两个仓库的边界、远程、分支和恢复前提检查；`npm.cmd run health:status` 只做后者的只读检查。

## 内容流程与边界

1. 在 `../knowledge-base/80_Publish/` 写作；只有 `visibility: public` 且 `status: ready` 或 `published` 的文件可发布。
2. 在本仓库运行 `npm.cmd run health:check`，处理全部失败项。
3. 经人工确认后，分别提交私有知识库源文件和本仓库生成文件；两个仓库不得交叉提交。
4. 推送本仓库 `main` 后，GitHub Actions 仅在公开仓库中执行测试、构建与 GitHub Pages 部署。CI 不读取私有知识库，也不重新同步私有源内容。

生成目录由 `generated-content-manifest.json` 管理。同步工具只会改动带有生成标记且记录在清单中的输出；如需预览或删除全部生成输出，可使用 `npm.cmd run content:clean` 或经确认后使用 `npm.cmd run content:clean:apply`。

详细格式、支持的 Obsidian 语法、安全规则和发布顺序见 [`CONTENT_PIPELINE.md`](CONTENT_PIPELINE.md)。

## 部署

网站部署地址为 [wanone111.github.io](https://wanone111.github.io/)。`.github/workflows/deploy.yml` 在 `main` 分支推送或手动触发时使用 Node.js 22 执行公开仓库检查、构建 `dist/`，然后发布到 GitHub Pages。不使用 Jekyll 或分支目录发布。
