import { readState, saveConfig, testNotification } from './api.js'

let config = null
let draft = null
let busy = false
let testing = false
let error = null
let snapshot = { config, draft, dirty: false, busy, testing, error }
const listeners = new Set()

function refresh() {
  const dirty = config !== null && draft !== null && JSON.stringify(config) !== JSON.stringify(draft)
  snapshot = { config, draft, dirty, busy, testing, error }
  for (const listener of listeners) listener()
}

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function getSnapshot() { return snapshot }
export function stage(patch) { draft = { ...(draft ?? config ?? {}), ...patch }; error = null; refresh() }
export function discard() { draft = config === null ? null : { ...config }; error = null; refresh() }

export async function load() {
  busy = true; refresh()
  try { const state = await readState(); config = state.config; draft = { ...state.config }; error = null }
  catch (reason) { error = reason instanceof Error ? reason.message : String(reason) }
  finally { busy = false; refresh() }
}

export async function save() {
  if (draft === null || busy) return
  busy = true; error = null; refresh()
  try { const result = await saveConfig(draft); config = result.config; draft = { ...result.config } }
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
