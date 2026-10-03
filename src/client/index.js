import { armSettingsSection } from './settings-section.js'
import { injectStyles } from './styles.js'

export const inject = []
export function apply(ctx) {
  injectStyles()
  const dispose = armSettingsSection(ctx)
  globalThis.__dshTaskSound = { open: () => document.querySelector('button') }
  return () => { dispose(); delete globalThis.__dshTaskSound }
}
