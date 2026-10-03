import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { sendWindowsNotification } from '../src/sound.js'

test('skips unsupported operating systems', async () => {
  assert.equal(await sendWindowsNotification({ title: 'DSH', message: 'Done' }, { platform: 'linux' }), 'unsupported')
})

test('uses a normal Windows toast sound without any custom completion sound', async () => {
  const child = new EventEmitter()
  let invocation
  const promise = sendWindowsNotification({ title: '标题;退出', message: '消息' }, {
    platform: 'win32',
    spawnImpl: /** @type {any} */ ((file, args, options) => {
      invocation = { file, args, options }
      queueMicrotask(() => child.emit('exit', 0))
      return child
    }),
  })
  assert.equal(await promise, 'notified')
  const command = invocation.args.join(' ')
  assert.equal(invocation.file, 'powershell.exe')
  assert.equal(invocation.options.windowsHide, true)
  assert.ok(command.includes('ToastNotificationManager'))
  assert.ok(!command.includes('SystemSounds'))
  assert.ok(!command.includes('<audio'))
  assert.equal(invocation.options.env.DSH_TASK_SOUND_TITLE, '标题;退出')
  assert.ok(!command.includes('标题;退出'))
})
