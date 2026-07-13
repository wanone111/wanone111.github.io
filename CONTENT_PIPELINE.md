# 内容发布系统

## 数据边界

唯一内容源是相邻目录 `../knowledge-base/80_Publish/`。发布工具不会读取知识库的其他目录，也不会反向修改源笔记。

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
| `80_Publish/pages` | `page` | `/about/` 或 `/resume/` |

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
npm.cmd run test:content
npm.cmd run check
npm.cmd run build
npm.cmd run test:links
npm.cmd run test:routes
npm.cmd run test:redirects
```

或者运行完整检查：

```powershell
npm.cmd run content:publish
```

该命令只同步和验证本地网站，不修改源笔记状态，不提交 Git，也不部署生产环境。

## 旧链接重定向

已经迁移的 Hexo 公共地址记录在 `legacy-url-map.json`。Astro 构建静态重定向页，`npm.cmd run test:redirects` 同时检查旧地址页面、目标页面和跳转目标。
