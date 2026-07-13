# Website

此目录是 Astro + Starlight 单一网站工程。

Astro 负责主页、博客、项目、简历和关于页面；Starlight 仅负责 `/knowledge/`。当前只有基础结构和占位内容，尚未迁移旧 Hexo 文章。

生成内容必须来自相邻的 `../knowledge-base/80_Publish`，且不得反向覆盖源文件。

## 本地命令

Windows PowerShell 中使用 `npm.cmd`，避免系统执行策略拦截 `npm.ps1`：

```powershell
npm.cmd run dev
npm.cmd run content:validate
npm.cmd run content:check-secrets
npm.cmd run content:sync
npm.cmd run test:content
npm.cmd run check
npm.cmd run build
npm.cmd run test:links
npm.cmd run test:routes
npm.cmd run preview
```

当前运行环境若禁止 Astro 写入用户配置目录，可在命令前临时设置：

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
```

完整内容发布检查可运行：

```powershell
npm.cmd run content:publish
```

该命令不会更改 Obsidian 源文件的状态，也不会推送或部署网站。
