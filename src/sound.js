import { spawn } from 'node:child_process'

/**
 * Show a normal Windows notification. No custom completion sound is played:
 * Windows owns the notification sound through the current user's settings.
 * @param {{title: string, message: string}} notification
 * @param {{platform?: NodeJS.Platform, spawnImpl?: typeof spawn}} [options]
 * @returns {Promise<'notified'|'unsupported'>}
 */
export function sendWindowsNotification(notification, options = {}) {
  const platform = options.platform ?? process.platform
  if (platform !== 'win32') return Promise.resolve('unsupported')

  const command = [
    '$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]',
    '$null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime]',
    '$title = [System.Security.SecurityElement]::Escape($env:DSH_TASK_SOUND_TITLE)',
    '$message = [System.Security.SecurityElement]::Escape($env:DSH_TASK_SOUND_MESSAGE)',
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    // With no <audio> element, Windows uses the ordinary notification sound.
    '$xml.LoadXml((\'<toast><visual><binding template="ToastGeneric"><text>{0}</text><text>{1}</text></binding></visual></toast>\' -f $title, $message))',
    '$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)',
    '$appId = \'{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe\'',
    '[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)',
    'Start-Sleep -Milliseconds 200',
  ].join('; ')

  const spawnImpl = options.spawnImpl ?? spawn
  return new Promise((resolve, reject) => {
    const child = spawnImpl('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command,
    ], {
      windowsHide: true,
      stdio: 'ignore',
      env: { ...process.env, DSH_TASK_SOUND_TITLE: notification.title, DSH_TASK_SOUND_MESSAGE: notification.message },
    })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve('notified') : reject(new Error(`PowerShell exited with code ${String(code)}`)))
  })
}
