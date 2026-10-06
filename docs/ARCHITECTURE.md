# 架构说明 / Architecture

[中文 README](../README.md) · [English README](../README.en.md)

## 目标 / Goal

主 DSH 会话的一个回合成功完成且持续时间达到阈值时，发送普通 Windows 通知。子代理任务会话不得单独提醒。

Send a normal Windows notification after an eligible main-session turn completes. Subagent task sessions must not emit their own notifications.

## Host 端 / Host side

`src/index.js` 组合 Host 功能：注册设置、订阅 `session/event`、从 `sessionProjections` 读取会话标题，并在 Web Server 可用时注册配置端点。

`src/tracker.js` 维护每个 `session.id + turn` 的单调开始时间和去重集合：

1. `turn/start` 记录起点。
2. `turn/end` 清理起点；仅 `reason.kind === completed` 继续。
3. `origin === subagent` 或 `delegationDepth > 0` 的会话直接忽略。
4. 不用 `parentSession` 过滤，因为普通用户分叉也可能具有父会话。
5. 达到 `minimumDurationMs` 后读取会话标题并触发通知。

The tracker keys timing and deduplication by session and turn. It relies on explicit subagent metadata rather than `parentSession`, which may also be present on ordinary user forks. It observes live events only and does not scan history.

## Windows 通知 / Windows notification

`src/sound.js` 启动隐藏的非交互 PowerShell 子进程，通过 WinRT Toast 发送通知。标题和正文通过环境变量传递并进行 XML 转义，不拼接到 PowerShell 源码中。

通知 XML 不包含 `<audio>`，插件也不调用 `SystemSounds`。Windows 根据当前用户的通知声音、音量和专注模式决定是否响铃。非 Windows 平台返回 `unsupported`，不会尝试模拟通知。

The notification runs through a hidden non-interactive PowerShell process and WinRT Toast APIs. Title and body travel through environment variables and are XML-escaped. Windows owns notification audio; the plugin does not play a second sound.

## 配置与 Web 客户端 / Configuration and Web client

`src/settings.js` 使用 Schemastery 声明 volatile `Config`，并通过 DSH settings 服务执行带 revision 的替换。`src/routes.js` 提供仅供插件客户端使用的状态、保存和测试端点，并限制请求体大小。

浏览器端注册到 `plugins.bundle.config` 插槽，提供启用开关、最短任务时长和测试按钮。插件名称与简介通过 `locale/en.json`、`locale/zh.json` 提供；配置入口简介订阅 DSH locale 服务并随语言变化重新渲染。

The browser client registers with the native plugin configuration slot. Settings are persisted through the DSH settings service, while localized package metadata comes from the exported locale files.

## 数据与安全边界 / Data and safety boundaries

- 插件不创建独立数据目录，不读取历史会话日志，也不修改 DSH 本体。
- 配置由当前 DSH profile 管理。
- 通知失败只写日志，不改变会话或回合状态。
- Web 端点使用 DSH Web Server 的现有访问边界，不另开监听端口。
- `lib/` 和 `dist/` 均由脚本生成，不纳入 Git；发布包在构建后包含所需 `lib/`。

The plugin creates no separate data store, does not read historical session logs, and does not mutate DSH. Generated output stays out of Git and is built before packaging.
