# dsh-task-sound

[中文](README.md)

A Windows notification plugin for successfully completed DSH main sessions.

## Behavior

- Notifies only for main sessions; subagent sessions with `origin: subagent` or `delegationDepth > 0` are ignored.
- Notifies only for `completed` turns that run for at least 10 seconds by default.
- Shows a normal Windows notification whose title is the completed session name and whose body includes elapsed time.
- Does not play a custom completion sound. Windows notification settings control whether and how the notification sounds.
- Provides English and Chinese plugin metadata that follows the DSH language setting.
- Does not require browser audio permission or modify DSH itself.

See the [design notes](docs/DESIGN.md) for implementation details.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:notification
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-isolated.ps1
```

`test:notification` sends a real Windows notification. Whether it makes a sound depends on Windows notification settings.

## Install into the Web profile

```powershell
dsh plugin --profile web add D:/CodeSpace/personal/DSH_Plugin/dsh-task-sound
```

Restart DSH after installation. To uninstall:

```powershell
dsh plugin --profile web remove dsh-task-sound
```

## Configuration

Open **Settings → Plugins → Installed → dsh-task-sound** after starting `dsh web`.

The settings page provides an enable switch, a minimum task duration, and a test-notification button. The notification title automatically uses the completed session name and no custom message field is exposed. Save changes to apply them immediately.

The default bundle configuration in `cordis.patch.yml` is:

```yaml
config:
  enabled: true
  minimumDurationMs: 10000
```
