# 内容发布系统

## 数据边界

唯一内容源是相邻目录 `../knowledge-base/80_Publish/`。发布工具不会读取知识库的其他目录，也不会反向修改源笔记。

`workspace.config.json` 中的网站根目录必须解析到当前网站仓库，知识库与网站目录树不得互相嵌套，博客、项目和固定页输出也必须位于统一的生成内容根目录内。路径配置不满足这些边界时，发布工具会在读取或写入内容前失败。

只有同时满足以下条件的文件会生成网站内容：

- 文件位于 `80_Publish` 的类型目录中。
- `visibility: public`。
- `status: ready` 或 `status: published`。
- Front Matter、链接、附件和敏感信息检查全部通过。

## 目录与类型

| 源目录 | `content_type` | 路由 |
|---|---|---|
| `80_Publish/blog` | `blog` | `/blog/<slug>/` |
| `80_Publish/docs` | `docs` | `/knowledge/<slug>/` |
| `80_Publish/projects` | `project` | `/projects/<slug>/` |
| `80_Publish/pages` | `page` | `/about/`、`/resume/` 或 `/links/` |

Slug 只能使用小写 ASCII 字母、数字、连字符和 `/`。例如：`embedded/stm32/crc`。

## 支持的 Obsidian 语法

- `[[页面名称]]`
- `[[页面名称|显示文字]]`
- `[[页面名称#章节]]`
- `![[image.png]]`
- `![[folder/image.png|300]]`
- 常见 Callout，例如 `> [!warning]`
- 本地标准 Markdown 图片

附件必须位于 `knowledge-base/_assets`。输出文件名由内容哈希生成，因此相同附件会去重，改名不会造成无意义副本。

暂不支持 Dataview、Canvas、动态 JavaScript 查询、MDX 和笔记正文嵌入。发现这些语法会阻止对应内容发布，不会静默删除。

## 敏感信息

默认拦截私钥、常见访问令牌、凭据赋值、用户目录、Windows 绝对路径、Linux 用户目录、私有 IP 和邮箱。检查报告只显示遮罩预览，不输出完整疑似密钥。

确需公开的安全示例值写入 `tools/content-policy.json` 的明确允许列表。更推荐使用报告给出的指纹进行最小范围豁免。

## 生成安全

`generated-content-manifest.json` 是生成文件所有权清单。同步工具只会清理上一次清单登记、且仍位于受控目录中的旧输出。Markdown 文件还必须包含生成标记，否则工具拒绝覆盖或删除。

`npm.cmd run content:clean` 仅预览可清理内容；只有 `content:clean:apply` 才执行删除。

## 日常命令

```powershell
npm.cmd run content:validate
npm.cmd run content:check-secrets
npm.cmd run content:sync
npm.cmd run test:generated
npm.cmd run test:content
npm.cmd run check
npm.cmd run build
npm.cmd run test:links
npm.cmd run test:routes
npm.cmd run test:redirects
npm.cmd run test:qa
```

或者运行完整检查：

```powershell
npm.cmd run content:publish
```

该命令只同步和验证本地网站，不修改源笔记状态，不提交 Git，也不部署生产环境。

发布前的完整工作区健康检查可运行：

```powershell
npm.cmd run health:check
```

它会先执行 `content:publish`，再报告两个仓库的分支、最近提交、远程地址、工作区状态、内容数量和恢复前提。仅查看仓库与恢复状态时运行：

```powershell
npm.cmd run health:status
```

`health:status` 不同步内容；`health:check` 会按清单更新网站的生成内容与构建输出。

## 提交与部署顺序

1. 在 Obsidian 中完成源笔记，将候选稿设置为 `visibility: public` 与 `status: ready`。
2. 运行 `npm.cmd run health:check`，处理所有阻断项。
3. 获得发布确认后，将源笔记更新为 `status: published` 并填写 `published` 日期，再次运行健康检查。
4. 分别核对和提交私有知识库源文件、公开网站生成文件；不得交叉提交。
5. 推送网站仓库 `main` 后由 GitHub Actions 检查并部署。CI 不读取私有知识库，也不在 CI 中重新生成私有源内容。

## 生成内容完整性

`npm.cmd run test:generated` 会验证清单路径边界、生成标记、页面与资源哈希、重复源文件、重复输出和重复路由。该检查既在本地发布链中运行，也在 GitHub Actions 中运行，防止公开仓库中已提交的生成内容与清单不一致。

## 旧链接重定向

已经迁移的 Hexo 公共地址记录在 `legacy-url-map.json`。Astro 构建静态重定向页，`npm.cmd run test:redirects` 同时检查旧地址页面、目标页面和跳转目标。
