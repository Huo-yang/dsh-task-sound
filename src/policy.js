/**
 * @typedef TaskSoundConfig
 * @property {boolean} enabled
 * @property {number} minimumDurationMs
 * @property {'all'|'workspaces'} notificationScope
 * @property {string[]} workspaceIds
 */

/** @type {Readonly<TaskSoundConfig>} */
export const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  minimumDurationMs: 10_000,
  notificationScope: 'all',
  workspaceIds: [],
})

/**
 * Normalize untrusted Cordis configuration.
 * @param {Partial<TaskSoundConfig>|undefined} input
 * @returns {TaskSoundConfig}
 */
export function normalizeConfig(input) {
  const duration = Number(input?.minimumDurationMs)
  const workspaceIds = Array.isArray(input?.workspaceIds)
    ? [...new Set(input.workspaceIds.filter(id => typeof id === 'string' && id.trim() !== '').map(id => id.trim()))]
    : []
  return {
    enabled: input?.enabled !== false,
    minimumDurationMs: Number.isFinite(duration) && duration >= 0 ? Math.floor(duration) : DEFAULT_CONFIG.minimumDurationMs,
    notificationScope: input?.notificationScope === 'workspaces' ? 'workspaces' : 'all',
    workspaceIds,
  }
}

/** @param {TaskSoundConfig} config @param {string|undefined} workspaceId */
export function includesWorkspace(config, workspaceId) {
  return config.notificationScope === 'all' || (workspaceId !== undefined && config.workspaceIds.includes(workspaceId))
}

/**
 * Only top-level interactive sessions are eligible. `parentSession` is not
 * considered: an ordinary user-created fork can have a parent without being a
 * delegated subagent.
 * @param {{origin?: string, delegationDepth?: number, parentSession?: string}} header
 */
export function isMainSession(header) {
  return header.origin !== 'subagent' && (header.delegationDepth ?? 0) === 0
}
