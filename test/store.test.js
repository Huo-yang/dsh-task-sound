import test from 'node:test'
import assert from 'node:assert/strict'
import { withoutDeletedWorkspaces } from '../src/client/store.js'

test('removes deleted workspace ids without changing other settings', () => {
  const config = {
    enabled: true,
    minimumDurationMs: 10_000,
    notificationScope: 'workspaces',
    workspaceIds: ['kept', 'deleted'],
  }
  assert.deepEqual(withoutDeletedWorkspaces(config, [{ id: 'kept' }, { id: 'other' }]), {
    enabled: true,
    minimumDurationMs: 10_000,
    notificationScope: 'workspaces',
    workspaceIds: ['kept'],
  })
  assert.deepEqual(config.workspaceIds, ['kept', 'deleted'])
})
