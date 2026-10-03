import { createTaskSoundSettings, Config } from './settings.js'
import { sendWindowsNotification } from './sound.js'
import { createTurnTracker } from './tracker.js'
import { registerRoutes } from './routes.js'
import { normalizeConfig } from './policy.js'

/** @typedef {import('@deepseek-ai/dsh-session').Session} Session */
/** @typedef {import('@deepseek-ai/dsh-session').SessionEvent} SessionEvent */

export const name = 'dsh-task-sound'
export const inject = ['sessions', 'sessionProjections']

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {Record<string, any>} rawConfig */
export function apply(ctx, rawConfig) {
  const logger = ctx.logger(name)
  const settings = createTaskSoundSettings(ctx, rawConfig)
  const notify = async (details = { sessionId: 'test', title: 'DSH 通知测试', turn: 0, durationMs: 0 }, override, force = false) => {
    const config = override === undefined ? settings.read() : normalizeConfig({ ...settings.read(), ...override })
    if (!force && !config.enabled) return 'disabled'
    const seconds = Math.max(0, Math.round(details.durationMs / 1000))
    const result = await sendWindowsNotification({
      title: details.title,
      message: details.turn === 0 ? '这是一条 DSH 任务完成提醒测试。' : `主会话已完成，耗时 ${String(seconds)} 秒。`,
    })
    if (result === 'unsupported') logger.warn('任务完成提醒目前仅支持 Windows')
    return result
  }

  const tracker = createTurnTracker(() => settings.read(), {
    titleFor: session => ctx.sessionProjections.snapshot(session, ['title']).values.title ?? '',
    notify: details => {
      void notify(details).catch(error => logger.warn(`发送任务完成提醒失败：${error instanceof Error ? error.message : String(error)}`))
    },
  })
  ctx.on('session/event', (/** @type {Session} */ session, /** @type {SessionEvent} */ event) => tracker.observe(session, event))

  ctx.inject(['webServer'], child => {
    child.effect(() => registerRoutes({
      webServer: child.webServer,
      handlers: {
        state: { method: 'GET', run: async () => ({ config: settings.read() }) },
        config: { method: 'POST', run: async payload => ({ config: await settings.update(payload?.config ?? payload) }) },
        test: { method: 'POST', run: async payload => ({ result: await notify(undefined, payload?.config, true) }) },
      },
    }), 'dsh-task-sound: routes')
  })
}

export { Config }
export { DEFAULT_CONFIG, isMainSession, normalizeConfig } from './policy.js'
export { sendWindowsNotification } from './sound.js'
export { createTurnTracker } from './tracker.js'
