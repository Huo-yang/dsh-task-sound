import { readState, saveConfig, testNotification } from './api.js'

let config = null
let draft = null
let workspaces = []
let busy = false
let testing = false
let error = null
let snapshot = { config, draft, workspaces, missingWorkspaceIds: [], dirty: false, busy, testing, error }
const listeners = new Set()

function refresh() {
  const dirty = config !== null && draft !== null && JSON.stringify(config) !== JSON.stringify(draft)
  const currentIds = new Set(workspaces.map(workspace => workspace.id))
  const missingWorkspaceIds = [...new Set([...(config?.workspaceIds ?? []), ...(draft?.workspaceIds ?? [])])].filter(id => !currentIds.has(id))
  snapshot = { config, draft, workspaces, missingWorkspaceIds, dirty, busy, testing, error }
  for (const listener of listeners) listener()
}

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function getSnapshot() { return snapshot }
export function stage(patch) { draft = { ...(draft ?? config ?? {}), ...patch }; error = null; refresh() }
export function discard() { draft = config === null ? null : { ...config }; error = null; refresh() }

export function withoutDeletedWorkspaces(value, available = workspaces) {
  const currentIds = new Set(available.map(workspace => workspace.id))
  return { ...value, workspaceIds: (value.workspaceIds ?? []).filter(id => currentIds.has(id)) }
}

export async function load() {
  busy = true; refresh()
  try {
    const state = await readState()
    config = state.config
    workspaces = Array.isArray(state.workspaces) ? state.workspaces : []
    draft = withoutDeletedWorkspaces(state.config)
    error = null
  }
  catch (reason) { error = reason instanceof Error ? reason.message : String(reason) }
  finally { busy = false; refresh() }
}

export async function save() {
  if (draft === null || busy) return
  busy = true; error = null; refresh()
  try {
    const result = await saveConfig(withoutDeletedWorkspaces(draft))
    config = result.config
    workspaces = Array.isArray(result.workspaces) ? result.workspaces : workspaces
    draft = withoutDeletedWorkspaces(result.config)
  }
  catch (reason) { error = reason instanceof Error ? reason.message : String(reason) }
  finally { busy = false; refresh() }
}

export async function test() {
  if (testing) return
  testing = true; error = null; refresh()
  try { await testNotification(draft ?? config ?? {}) }
  catch (reason) { error = reason instanceof Error ? reason.message : String(reason) }
  finally { testing = false; refresh() }
}
