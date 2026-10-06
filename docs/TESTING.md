# 测试指南 / Testing

[中文 README](../README.md) · [English README](../README.en.md)

## 默认验证 / Default validation

```powershell
pnpm install --frozen-lockfile
pnpm peers check
pnpm run check
```

`check` 依次执行本地 Markdown 链接检查、项目 TypeScript 配置检查、Node 行为测试和构建。测试使用合成事件及替身进程，不访问真实 DSH 会话或发送真实通知。

The default check validates local Markdown links, runs the configured TypeScript check, executes Node behavior tests with synthetic events and process stubs, and builds Host and client bundles. It does not access live DSH sessions or send a real notification.

| 命令 / Command | 覆盖 / Coverage |
| --- | --- |
| `pnpm run docs:check` | 本地 Markdown 文件、链接与标题锚点 / local Markdown files, links, and heading anchors |
| `pnpm run typecheck` | 项目 TypeScript 配置；当前不宣称完整 JavaScript 类型检查 / configured TypeScript project, not full JavaScript type checking |
| `pnpm test` | 主会话过滤、完成原因、时长阈值、去重、标题退回与 Windows 通知调用 / filtering, completion, thresholds, deduplication, title fallback, notification invocation |
| `pnpm run build` | Host 与 Web 客户端生成到 `lib/` / Host and Web client output in `lib/` |

GitHub CI 使用 Node.js 24，在 Windows 与 Ubuntu 上运行同一个 `pnpm run check`。Ubuntu 成功不表示 Linux 支持 Windows 通知。

CI runs the same check with Node.js 24 on Windows and Ubuntu. Ubuntu success does not imply that Windows notifications are available on Linux.

## 隔离 DSH profile 验证 / Isolated DSH profile verification

以下脚本创建临时 `DSH_HOME`，从当前源码目录安装插件；它会确认 bundle 出现在组合配置中，验证卸载后条目消失，然后删除临时目录。它不会操作正式 profile：

The following script creates a temporary `DSH_HOME`, installs the current source directory, verifies the composed bundle configuration, and removes the temporary directory. It does not touch the normal profile:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1
```

这项验证确认安装与 Host 配置组合，不启动浏览器，也不证明通知已显示。

也可以验证刚生成的发布包：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1 -PluginPath dist/dsh-task-sound-0.1.0.tgz
```

发布前需要完整 Web profile 时增加 `-WithWebProfile`。脚本会安装与当前 DSH CLI 同版本的 Web bundle，并允许其已知的 `koffi` 构建步骤；这一步需要 npm registry 可用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1 -PluginPath dist/dsh-task-sound-0.1.0.tgz -WithWebProfile
```

This verifies installation, Host configuration composition, and removal from either the source tree or a generated archive. `-WithWebProfile` adds the matching DSH Web bundle and requires registry access. The script does not start a browser or claim that a notification was displayed.

## 真实通知测试 / Real notification test

```powershell
pnpm run test:notification
```

该命令会在当前 Windows 桌面真实发送一条普通通知。是否响铃由 Windows 设置决定。不要在无人值守 CI 或非交互会话中运行。

This command sends a real notification to the current Windows desktop. Windows decides whether it sounds. Do not run it in unattended CI or a non-interactive session.

## 记录兼容性 / Recording compatibility

真实 DSH 验证应记录 DSH、Node.js、pnpm 和 Windows 版本，以及已覆盖的插件加载、设置读取/保存、测试通知、真实完成通知和卸载行为。访问令牌、真实会话日志与个人路径不得进入仓库或 Release 说明。

Record DSH, Node.js, pnpm, and Windows versions together with the behaviors actually exercised. Never publish access tokens, real session logs, or personal paths.
