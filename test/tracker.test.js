import test from 'node:test'
import assert from 'node:assert/strict'
import { createTurnTracker } from '../src/tracker.js'
import { includesWorkspace, isMainSession, normalizeConfig } from '../src/policy.js'

/** @param {number} turn */
const completed = turn => ({ type: 'turn/end', data: { turn, reason: { kind: 'completed' } } })
/** @param {number} turn */
const started = turn => ({ type: 'turn/start', data: { turn } })
/** @typedef {{sessionId: string, title: string, turn: number, durationMs: number}} Notification */
const session = (overrides = {}) => ({ id: 'main', header: { delegationDepth: 0, ...overrides } })

test('notifies once for a completed main-session turn over the threshold', () => {
  let time = 1_000
  /** @type {Notification[]} */
  const calls = []
  const tracker = createTurnTracker({ minimumDurationMs: 10_000 }, { now: () => time, titleFor: () => '实现任务提醒', notify: value => calls.push(value) })
  tracker.observe(session(), started(1))
  time = 11_000
  tracker.observe(session(), completed(1))
  tracker.observe(session(), completed(1))
  assert.deepEqual(calls, [{ sessionId: 'main', title: '实现任务提醒', turn: 1, durationMs: 10_000 }])
})

test('ignores subagent sessions by origin or delegation depth', () => {
  /** @type {Notification[]} */
  const calls = []
  const tracker = createTurnTracker({ minimumDurationMs: 0 }, { now: () => 1, notify: value => calls.push(value) })
  for (const candidate of [session({ origin: 'subagent' }), session({ delegationDepth: 1 })]) {
    tracker.observe(candidate, started(1))
    tracker.observe(candidate, completed(1))
  }
  assert.deepEqual(calls, [])
})

test('does not confuse an ordinary fork with a subagent', () => {
  assert.equal(isMainSession({ parentSession: 'parent', delegationDepth: 0 }), true)
})

test('filters completed turns by stable workspace id when whitelist mode is enabled', () => {
  const calls = []
  const tracker = createTurnTracker(
    { minimumDurationMs: 0, notificationScope: 'workspaces', workspaceIds: ['workspace-a'] },
    { now: () => 1, workspaceIdFor: candidate => candidate.workspaceId, notify: value => calls.push(value) },
  )
  for (const candidate of [
    { ...session(), id: 'selected', workspaceId: 'workspace-a' },
    { ...session(), id: 'other', workspaceId: 'workspace-b' },
    { ...session(), id: 'ungrouped' },
  ]) {
    tracker.observe(candidate, started(1))
    tracker.observe(candidate, completed(1))
  }
  assert.deepEqual(calls, [{ sessionId: 'selected', title: '会话 selected', turn: 1, durationMs: 0, workspaceId: 'workspace-a' }])
})

test('workspace scope policy defaults to all and never matches deleted ids', () => {
  assert.equal(includesWorkspace({ notificationScope: 'all', workspaceIds: [] }, undefined), true)
  assert.equal(includesWorkspace({ notificationScope: 'workspaces', workspaceIds: ['deleted'] }, undefined), false)
  assert.equal(includesWorkspace({ notificationScope: 'workspaces', workspaceIds: ['deleted'] }, 'replacement'), false)
})

test('ignores short, failed, aborted, and unmatched turns', () => {
  let time = 0
  /** @type {Notification[]} */
  const calls = []
  const tracker = createTurnTracker({ minimumDurationMs: 100 }, { now: () => time, notify: value => calls.push(value) })
  tracker.observe(session(), started(1))
  time = 99
  tracker.observe(session(), completed(1))
  tracker.observe(session(), started(2))
  time = 500
  tracker.observe(session(), { type: 'turn/end', data: { turn: 2, reason: { kind: 'error' } } })
  tracker.observe(session(), completed(3))
  assert.deepEqual(calls, [])
})

test('uses a compact session fallback when no title exists', () => {
  const calls = []
  const tracker = createTurnTracker({ minimumDurationMs: 0 }, { now: () => 1, titleFor: () => '', notify: value => calls.push(value) })
  const untitled = { id: 'session-1234567890abcdef', header: { delegationDepth: 0 } }
  tracker.observe(untitled, started(1))
  tracker.observe(untitled, completed(1))
  assert.equal(calls[0].title, '会话 12345678')
})

test('normalizes invalid configuration', () => {
  assert.deepEqual(normalizeConfig({ enabled: false, minimumDurationMs: -1 }), {
    enabled: false,
    minimumDurationMs: 10_000,
    notificationScope: 'all',
    workspaceIds: [],
  })
  assert.deepEqual(normalizeConfig({ notificationScope: 'workspaces', workspaceIds: [' a ', 'a', '', 1] }), {
    enabled: true,
    minimumDurationMs: 10_000,
    notificationScope: 'workspaces',
    workspaceIds: ['a'],
  })
})
