# Wanone 个人网站

工程项目和技术笔记使用 Astro，知识库位于 Starlight 的 `/knowledge/`。[访问网站](https://wanone111.github.io/)

## 本地开发

在网站目录使用 Node.js LTS（最低 22.23.4）。Windows PowerShell 可用 `npm.cmd`。

```sh
npm install --no-package-lock
npm run dev
```

`npm update --no-package-lock` 可按 `package.json` 的版本范围更新本地依赖。`npm run build` 生成 `dist/`，`npm run preview` 预览构建结果。推送网站的 `main` 或手动触发工作流后，GitHub Actions 用公开仓库中的文件构建并部署到 GitHub Pages。[部署配置](.github/workflows/deploy.yml)

## 内容发布

源稿放在相邻知识库的 `40_Publish/` 中。将稿件设为 `visibility: public`，并将 `status` 设为 `ready` 或 `published`。在网站目录运行 `npm run content:publish` 同步并构建，仅同步时用 `npm run content:sync`。

| 源目录 | `content_type` | 公开地址 |
| --- | --- | --- |
| `笔记/` | `blog` | `/notes/<slug>/` |
| `文档/` | `docs` | `/knowledge/<slug>/` |
| `项目/` | `project` | `/projects/<slug>/` |
| `页面/` | `page` | `/about/`、`/resume/`、`/links/` |

Markdown 元数据还需填写 `title`、`description`、`content_type`、`created`、`updated` 和数组 `tags`。公开稿的 `slug` 在同类内容中唯一，可用小写 ASCII 字母、数字、连字符和斜杠。已发布稿填写 `published` 日期。精选项目填写唯一的正整数 `featured_order`，以及 `role`、`result`、`validation`。

正文支持 Obsidian 双链、Callout 和 Markdown 图片。附件取自 `knowledge_base/_assets/`，同名时使用相对路径。仅明确引用的附件会复制到网站。MDX、Dataview、Canvas 和整篇笔记嵌入需要先改为 Markdown。同步会扫描凭据，`npm run content:check` 可另外检查路径、邮箱和私有 IP。自定义路径可写在两个仓库上级目录的 `workspace.config.json`。[同步工具](tools/content.mjs)

笔记、项目和固定页生成到 `src/content/generated/`，知识库文档和手写入口共用 `src/content/docs/knowledge/`。同步工具通过文件头的生成标记识别正文，修改正文时编辑知识库源稿。`npm run content:clean` 可预览将要删除的生成稿和附件，追加 `-- --apply` 执行清理。

历史网址按文章维护迁移记录。需要检查时，`npm test` 运行内容工具的回归用例，`npm run check` 检查 Astro 类型。[网址迁移配置](astro.config.mjs)
