<h1 align="center">dsh-task-sound</h1>

<p align="center">Show a Windows notification when a DSH main session completes</p>

<p align="center">Automatically ignore subagents, unsuccessful turns, and short tasks</p>

<p align="center">Use the session name as the title and integrate with native DSH plugin settings</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-orange" alt="Version 0.1.0" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen" alt="Node.js >= 24" />
</p>

<p align="center"><a href="README.md">简体中文</a> | <strong>English</strong></p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#compatibility">Compatibility</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#development">Development</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

## Features

- Notify only for main sessions; subagent task sessions with `origin: subagent` or `delegationDepth > 0` are ignored.
- Notify only for `completed` turns; failed, cancelled, blocked, and unmatched turns are ignored.
- Require a task duration of at least 10 seconds by default, with a configurable threshold.
- Show a normal Windows notification whose title is the completed session name and whose body includes elapsed time.
- Do not play a custom completion sound; Windows notification settings control whether and how it sounds.
- Provide English and Chinese plugin metadata that follows the DSH language setting.

## Compatibility

| Item | Current scope |
| --- | --- |
| DSH | Each [GitHub Release](https://github.com/Huo-yang/dsh-task-sound/releases) records the DSH version and behavior actually verified for that plugin version |
| Interface | DSH Web, with configuration in the native plugin management page |
| Node.js | `>=24`; development baseline is Node.js 24 |
| Package manager | pnpm `11.19.0`, pinned by `packageManager` |
| Operating system | Notification delivery supports Windows only; repository checks run on Windows and Ubuntu CI |

The plugin uses DSH session events, session projections, configuration, and settings slots without modifying DSH itself. Passing Ubuntu CI establishes checks and build portability, not Windows notification support on Linux. See the [architecture notes](docs/ARCHITECTURE.md).

## Installation

Download `dsh-task-sound-<version>.tgz` and `SHA256SUMS.txt` from [GitHub Releases](https://github.com/Huo-yang/dsh-task-sound/releases). Verify the checksum, then give the versioned archive directly to DSH without extracting it:

```powershell
dsh plugin --profile web add "C:\Downloads\dsh-task-sound-0.1.0.tgz"
```

Restart DSH after installation.

For local development, install directly from the source directory:

```powershell
pnpm install --frozen-lockfile
pnpm run check
dsh plugin --profile web add "D:\CodeSpace\personal\DSH_Plugin\dsh-task-sound"
```

## Configuration

After starting `dsh web`, open **Settings → Plugins → Installed → dsh-task-sound**.

| Setting | Default | Behavior |
| --- | --- | --- |
| Enable completion notifications | On | Disabling it stops notifications |
| Minimum task duration | 10 seconds | Shorter tasks are ignored; `0` notifies for every successful completion |

The page also provides a test-notification button. Save changes to apply them immediately. The session name is not configurable; it comes from the DSH session projection when the notification is sent. Plugin-list and configuration-entry descriptions follow the DSH language setting.

Windows controls the notification sound. If no sound plays, check Windows notification sound settings for the app, system volume, and Focus mode. The plugin does not play a second system sound.

## Behavioral boundaries

- The plugin observes live events only and does not scan history; resuming an old session does not emit a catch-up notification.
- Each `session.id + turn` is notified at most once.
- Ordinary user forks may have a parent session, so `parentSession` alone is not treated as evidence of a subagent.
- Notification delivery failures are logged and do not alter the turn result.
- On non-Windows systems, the plugin does not attempt to send a Windows notification.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm peers check
pnpm run check
```

`pnpm run check` runs documentation-link checks, the configured TypeScript check, isolated behavior tests, and the build. The real notification test must be invoked explicitly because it displays a Windows notification:

```powershell
pnpm run test:notification
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1
```

Pass `-PluginPath dist/dsh-task-sound-0.1.0.tgz` to verify archive installation and removal in a fresh temporary profile.

See the [testing guide](docs/TESTING.md) and [release process](docs/RELEASING.md).

## Uninstall

```powershell
dsh plugin --profile web remove dsh-task-sound
```

Restart DSH after removal. The plugin creates no separate user-data directory; its settings are managed through the DSH profile configuration.

## License

This repository independently maintains the plugin under the [MIT License](LICENSE).
