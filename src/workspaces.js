/** @param {{list: () => Array<{id: unknown, title: string, path: string, sessionIds: readonly unknown[]}>}} registry */
export function listWorkspaceOptions(registry) {
  return registry.list().map(workspace => ({
    id: String(workspace.id),
    title: workspace.title,
    path: workspace.path,
  }))
}

/** @param {{list: () => Array<{id: unknown, sessionIds: readonly unknown[]}>}} registry @param {string} sessionId */
export function workspaceIdForSession(registry, sessionId) {
  const workspace = registry.list().find(candidate => candidate.sessionIds.some(id => String(id) === sessionId))
  return workspace === undefined ? undefined : String(workspace.id)
}
