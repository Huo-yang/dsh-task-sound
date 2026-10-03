import z from '@deepseek-ai/schemastery'
import { DEFAULT_CONFIG, normalizeConfig } from './policy.js'

const NAMESPACE = 'task-sound'

export const Config = z.object({
  enabled: z.boolean().default(DEFAULT_CONFIG.enabled).volatile(),
  minimumDurationMs: z.number().step(1000).min(0).max(86_400_000).default(DEFAULT_CONFIG.minimumDurationMs).volatile(),
})

/** @param {Record<string, any>} config */
function readConfig(config) {
  return normalizeConfig(Object.fromEntries(
    Object.keys(DEFAULT_CONFIG).map(key => [key, config[key]?.get?.() ?? config[key] ?? DEFAULT_CONFIG[key]]),
  ))
}

/** @param {any} ctx @param {Record<string, any>} config */
export function createTaskSoundSettings(ctx, config) {
  /** @type {{settings: any}|undefined} */
  let active
  ctx.inject(['settings'], child => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'dsh-task-sound: settings presentation')
    active = { settings: child.settings }
    child.effect(() => () => {
      if (active?.settings === child.settings) active = undefined
    }, 'dsh-task-sound: settings')
  })
  return {
    read: () => readConfig(config),
    async update(patch) {
      const next = normalizeConfig({ ...readConfig(config), ...(patch ?? {}) })
      if (active === undefined) throw new Error('DSH 设置服务尚未就绪')
      const descriptor = active.settings.describe().find(item => item.ns === NAMESPACE)
      if (descriptor === undefined) throw new Error(`找不到插件配置项 ${NAMESPACE}`)
      await active.settings.replace(NAMESPACE, next, descriptor.revision)
      return readConfig(config)
    },
  }
}
