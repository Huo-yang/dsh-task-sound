import test from 'node:test'
import assert from 'node:assert/strict'
import { listWorkspaceOptions, workspaceIdForSession } from '../src/workspaces.js'

const registry = {
  list: () => [
    { id: 'workspace-a', title: 'A', path: 'D:\\A', sessionIds: ['main', 'scheduled'] },
    { id: 'workspace-b', title: 'B', path: 'D:\\B', sessionIds: ['other'] },
  ],
}

test('resolves ordinary and scheduled task sessions from registry membership', () => {
  assert.equal(workspaceIdForSession(registry, 'main'), 'workspace-a')
  assert.equal(workspaceIdForSession(registry, 'scheduled'), 'workspace-a')
  assert.equal(workspaceIdForSession(registry, 'ungrouped'), undefined)
})

test('publishes stable workspace choices for the settings page', () => {
  assert.deepEqual(listWorkspaceOptions(registry), [
    { id: 'workspace-a', title: 'A', path: 'D:\\A' },
    { id: 'workspace-b', title: 'B', path: 'D:\\B' },
  ])
})
