<h1 align="center">dsh-task-sound</h1>

<p align="center">在 DSH 主会话成功完成后显示 Windows 通知</p>

<p align="center">自动忽略子代理、失败、取消和过短任务</p>

<p align="center">使用会话名作为标题，并融入 DSH 原生插件配置页</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-orange" alt="Version 0.1.0" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen" alt="Node.js >= 24" />
</p>

<p align="center"><strong>简体中文</strong> | <a href="README.en.md">English</a></p>

<p align="center">
  <a href="#功能">功能</a> ·
  <a href="#兼容性">兼容性</a> ·
  <a href="#安装">安装</a> ·
  <a href="#配置">配置</a> ·
  <a href="#开发">开发</a> ·
  <a href="CONTRIBUTING.md">贡献指南</a> ·
  <a href="CHANGELOG.md">更新记录</a>
</p>

## 功能

- 仅提醒主会话；`origin: subagent` 或 `delegationDepth > 0` 的子代理任务会话不会提醒。
- 仅提醒 `completed` 回合；失败、取消、阻塞和未匹配的回合会被忽略。
- 默认仅提醒运行至少 10 秒的任务，并可在设置中修改阈值。
- 显示普通 Windows 通知；标题使用完成会话的会话名，正文包含耗时。
- 不播放自定义完成声音；是否响铃及提示音类型由 Windows 通知设置管理。
- 插件名称和简介提供中英文，并随 DSH 语言设置自动切换。

## 兼容性

| 项目 | 当前范围 |
| --- | --- |
| DSH | 每个版本实际验证的 DSH 版本和范围记录在对应 [GitHub Release](https://github.com/Huo-yang/dsh-task-sound/releases) 说明中 |
| 界面 | DSH Web；配置入口位于原生插件管理页 |
| Node.js | `>=24`；开发基线为 Node.js 24 |
| 包管理器 | pnpm `11.19.0`，由 `packageManager` 固定 |
| 操作系统 | 通知功能仅支持 Windows；Windows 与 Ubuntu CI 均执行仓库检查 |

插件使用 DSH 的会话事件、会话投影、配置和设置插槽，不修改 DSH 本体。Ubuntu CI 通过只代表代码检查与构建通过，不表示 Linux 能发送 Windows 通知。实现边界见[架构说明](docs/ARCHITECTURE.md)。

## 安装

从 [GitHub Releases](https://github.com/Huo-yang/dsh-task-sound/releases) 下载 `dsh-task-sound-<版本>.tgz` 和 `SHA256SUMS.txt`。校验后将版本化压缩包直接交给 DSH，无需解压：

```powershell
dsh plugin --profile web add "C:\Downloads\dsh-task-sound-0.1.0.tgz"
```

安装后重启 DSH。

本地开发可从源码目录安装：

```powershell
pnpm install --frozen-lockfile
pnpm run check
dsh plugin --profile web add "D:\CodeSpace\personal\DSH_Plugin\dsh-task-sound"
```

## 配置

启动 `dsh web` 后进入 **设置 → 插件 → 已安装 → dsh-task-sound**。

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 启用任务完成提醒 | 开启 | 关闭后不发送通知 |
| 最短任务时长 | 10 秒 | 短于该时长不提醒；设为 `0` 表示每次成功完成都提醒 |

配置页还提供“测试提醒”按钮。修改后点击“保存”即时生效；会话名不是配置项，通知时从 DSH 会话投影读取。插件列表与配置入口简介随 DSH 语言设置切换。

通知声音由 Windows 管理。如果没有声音，请检查当前应用的 Windows 通知声音、系统音量和专注模式；插件不会额外播放第二个系统声音。

## 行为边界

- 插件只观察实时事件，不扫描历史记录；恢复旧会话不会补发通知。
- 同一 `session.id + turn` 只提醒一次。
- 普通用户分叉可以具有父会话，因此不会仅凭 `parentSession` 被误判为子代理。
- 通知发送失败只写入 DSH 日志，不改变回合结果。
- 非 Windows 系统加载插件时不会尝试发送 Windows 通知。

## 开发

```powershell
pnpm install --frozen-lockfile
pnpm peers check
pnpm run check
```

`pnpm run check` 依次执行文档链接检查、TypeScript 配置检查、隔离行为测试和构建。真实通知测试会弹出 Windows 通知，需要显式运行：

```powershell
pnpm run test:notification
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1
```

发布包可通过 `-PluginPath dist/dsh-task-sound-0.1.0.tgz` 在新的临时 profile 中验证安装与卸载。

测试细节见[测试指南](docs/TESTING.md)，发布步骤见[发布流程](docs/RELEASING.md)。

## 卸载

```powershell
dsh plugin --profile web remove dsh-task-sound
```

卸载后重启 DSH。插件不创建独立用户数据目录；设置由 DSH profile 配置管理。

## 许可证

本项目由本仓库独立维护，使用 [MIT License](LICENSE)。
