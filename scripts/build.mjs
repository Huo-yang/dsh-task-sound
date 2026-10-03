import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'lib')
await rm(outDir, { recursive: true, force: true }); await mkdir(outDir, { recursive: true })
await build({ entryPoints: [join(root, 'src/index.js')], outfile: join(outDir, 'index.js'), bundle: true, format: 'esm', platform: 'node', target: 'node22', external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-session', '@deepseek-ai/schemastery'], logLevel: 'info' })
await build({
  entryPoints: [join(root, 'src/client/index.js')], outfile: join(outDir, 'client.js'), bundle: true, format: 'cjs', platform: 'browser', target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
  banner: { js: `window.__ModuleLoader__.load({ id: "dsh-task-sound", factory: (require, module, exports) => {\nvar module = { exports: {} }; var exports = module.exports;\nglobalThis.__dshTaskSoundRequire = require;` },
  footer: { js: 'return { apply: apply, inject: inject }; } });' }, logLevel: 'info',
})
