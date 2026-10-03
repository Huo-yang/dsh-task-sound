# 设计说明

## 目标

主 DSH 会话的一个回合成功完成且持续时间达到阈值时，发送普通 Windows 通知。子代理完成不得单独提醒。

## 事件模型

插件订阅 `session/event`：

1. `turn/start` 记录 `session.id + turn` 的单调观察起点。
2. `turn/end` 清理起点；仅 `reason.kind === completed` 继续。
3. 会话头 `origin === subagent` 或 `delegationDepth > 0` 时直接忽略。
4. 不用 `parentSession` 过滤，因为普通用户分叉也具有父会话。
5. 达到 `minimumDurationMs` 后按 `session.id + turn` 去重并触发通知。

插件只观察实时事件，不扫描历史，因此恢复旧会话不会补响。

## 通知模型

Windows 上启动隐藏的非交互 PowerShell 子进程，通过 WinRT Toast 发送普通通知。标题读取 DSH 的 `title` 会话投影，即完成会话当前显示的会话名；尚无标题时退回短会话标识。插件不加入 `<audio>` 配置，也不调用 `SystemSounds`：是否播放声音以及使用哪个声音完全由 Windows 通知设置、系统音量和专注助手策略决定。发送失败仅写日志，不影响 DSH 回合。

## 配置模型

Host 使用 Schemastery 暴露可即时修改的插件 Config；浏览器客户端注册到 DSH 的 `plugins.bundle.config` 插槽。用户从“设置 → 插件 → 已安装 → dsh-task-sound”管理启用状态和时长阈值，设置服务负责持久化。会话名不是配置项，由 DSH 会话投影提供。

## 本地化

插件通过导出的 `locale/en.json` 和 `locale/zh.json` 提供中英文名称与简介。DSH 插件管理器使用当前语言解析插件列表元数据；配置页入口简介订阅同一语言服务，因此切换 DSH 语言配置后会立即重新渲染。

## 非目标

- 不提醒子代理、失败、取消、阻塞或达到 token 上限的回合。
- 不修改 DSH 本体或正式 Profile。
- 不提供浏览器音效或语音播报。
