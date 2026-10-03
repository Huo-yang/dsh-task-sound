# dsh-task-sound

DSH 主会话成功完成后的 Windows 通知插件。

## 行为

- 仅主会话；`origin: subagent` 或 `delegationDepth > 0` 的子代理会话不提醒。
- 仅 `completed` 回合，默认运行至少 10 秒才提醒。
- 显示普通 Windows 弹出通知；标题是完成会话的会话名，正文包含耗时。
- 不播放自定义的会话完成声音；通知声音完全由 Windows 通知设置管理。
- 插件名称和简介提供中英文两套文本，并随 DSH 的语言设置自动切换。
- 不依赖浏览器音频权限，不修改 DSH 本体。

详见 [设计说明](docs/DESIGN.md)。

## 开发验证

```powershell
pnpm install
pnpm run check
pnpm run test:notification
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1
```

`test:notification` 会真实发送一次普通 Windows 通知；是否响铃由 Windows 通知设置决定。

## 安装

从 [GitHub Releases](https://github.com/Huo-yang/dsh-task-sound/releases) 下载 `dsh-task-sound-<版本>.tgz` 和 `SHA256SUMS.txt`，校验后将压缩包直接交给 DSH，无需解压：

```powershell
dsh plugin --profile web add "C:\Downloads\dsh-task-sound-0.1.0.tgz"
```

重启 DSH 后生效。卸载：

```powershell
dsh plugin --profile web remove dsh-task-sound
```

开发时也可以把当前源码目录交给 DSH：

```powershell
dsh plugin --profile web add D:/CodeSpace/personal/DSH_Plugin/dsh-task-sound
```

## 配置

启动 `dsh web` 后进入：

**设置 → 插件 → 已安装 → dsh-task-sound**

配置页提供启用开关、最短任务时长和“测试提醒”按钮。通知标题自动使用完成会话的会话名，不提供自定义内容。修改后点击“保存”即时生效。

插件列表卡片和配置页入口简介使用 DSH 原生语言服务。中文环境显示中文简介，英文环境显示英文简介；切换 DSH 语言后无需修改插件配置。

Bundle 默认配置位于 `cordis.patch.yml`：

```yaml
config:
  enabled: true
  minimumDurationMs: 10000
```
